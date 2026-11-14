import test from 'node:test';
import assert from 'node:assert/strict';
import { Complex } from '../complex';
import { buildNetlist } from '../netlist';
import { extractTheveninNorton, extractTwoPort, runSimulation } from '../mna';
import { CircuitState } from '../../types/circuit';

function approx(actual: number, expected: number, tol = 1e-3, msg = '') {
  assert.ok(
    Number.isFinite(actual) && Math.abs(actual - expected) <= tol,
    `${msg} expected ${expected}, got ${actual} (diff ${Math.abs(actual - expected)})`,
  );
}

// ============================================================================
// LEVEL 1: VERY BASIC & EDGE DIAGNOSTICS
// ============================================================================

test('Level 1.1: Unbalanced DC Wheatstone bridge (nodal voltages & power balance)', () => {
  // E = 10V between N1 and GND(0).
  // Left leg: R1 = 100 (N1->N2), R3 = 200 (N2->0)
  // Right leg: R2 = 300 (N1->N3), R4 = 100 (N3->0), bridge R5 = 50 between N2 and N3
  // KCL at N2: (V2-10)/100 + V2/200 + (V2-V3)/50 = 0 => 0.035*V2 - 0.02*V3 = 0.1
  // KCL at N3: (V3-10)/300 + V3/100 + (V3-V2)/50 = 0 => -0.02*V2 + (1/300+0.01+0.02)*V3 = 1/30
  // 0.035*V2 - 0.02*V3 = 0.1 => 3.5*V2 - 2*V3 = 10
  // -0.02*V2 + (1/30)*V3 = 1/30 => -0.6*V2 + V3 = 1 => V3 = 1 + 0.6*V2
  // 3.5*V2 - 2*(1 + 0.6*V2) = 10 => 2.3*V2 = 12 => V2 = 120/23 V, V3 = 1 + 72/23 = 95/23 V
  // I_R5 = (V2 - V3)/50 = (25/23)/50 = 0.5/23 A
  const state: CircuitState = {
    elements: [
      { id: 'e1', name: 'E1', type: 'V_SRC', x: 0, y: 0, rotation: 0, waveform: 'DC', dcValue: 10 },
      { id: 'r1', name: 'R1', type: 'RESISTOR', x: 100, y: 0, rotation: 90, resistance: 100 },
      { id: 'r3', name: 'R3', type: 'RESISTOR', x: 100, y: 120, rotation: 90, resistance: 200 },
      { id: 'r2', name: 'R2', type: 'RESISTOR', x: 260, y: 0, rotation: 90, resistance: 300 },
      { id: 'r4', name: 'R4', type: 'RESISTOR', x: 260, y: 120, rotation: 90, resistance: 100 },
      { id: 'r5', name: 'R5', type: 'RESISTOR', x: 180, y: 60, rotation: 0, resistance: 50 },
      { id: 'g', name: 'GND', type: 'GND', x: 0, y: 200, rotation: 0 },
    ],
    wires: [
      { id: 'w1', points: [{ x: 0, y: -40 }, { x: 100, y: -40 }, { x: 260, y: -40 }] },
      { id: 'w2', points: [{ x: 100, y: 40 }, { x: 100, y: 80 }] },
      { id: 'w3', points: [{ x: 100, y: 60 }, { x: 140, y: 60 }] },
      { id: 'w4', points: [{ x: 260, y: 40 }, { x: 260, y: 80 }] },
      { id: 'w5', points: [{ x: 220, y: 60 }, { x: 260, y: 60 }] },
      { id: 'w6', points: [{ x: 0, y: 40 }, { x: 0, y: 160 }, { x: 100, y: 160 }, { x: 260, y: 160 }] },
      { id: 'w7', points: [{ x: 0, y: 160 }, { x: 0, y: 180 }] },
    ],
  };

  const res = runSimulation(state, 'DC');
  assert.equal(res.success, true);
  const r5 = res.elements.find((e) => e.elementId === 'r5')!;
  const r3 = res.elements.find((e) => e.elementId === 'r3')!;
  const r4 = res.elements.find((e) => e.elementId === 'r4')!;

  approx(r3.voltageDc, 120 / 23, 1e-4, 'V2 (bridge left)');
  approx(r4.voltageDc, 95 / 23, 1e-4, 'V3 (bridge right)');
  approx(r5.currentDc, 0.5 / 23, 1e-5, 'I_R5 bridge');
  approx(res.powerBalance!.pGenerated, res.powerBalance!.pConsumed, 1e-5, 'Wheatstone P balance');
});

test('Level 1.2: Empty circuit, missing GND (auto-ground), and voltage-source short loop', () => {
  // 1) Empty circuit
  const empty = runSimulation({ elements: [], wires: [] }, 'DC');
  assert.equal(empty.success, false);

  // 2) Missing GND: E = 9 V, R = 3 Ohm -> auto-ground selects E negative terminal, I = 3 A
  const noGnd: CircuitState = {
    elements: [
      { id: 'e1', name: 'E1', type: 'V_SRC', x: 0, y: 0, rotation: 0, waveform: 'DC', dcValue: 9 },
      { id: 'r1', name: 'R1', type: 'RESISTOR', x: 80, y: 0, rotation: 90, resistance: 3 },
    ],
    wires: [
      { id: 'w1', points: [{ x: 0, y: -40 }, { x: 80, y: -40 }] },
      { id: 'w2', points: [{ x: 0, y: 40 }, { x: 80, y: 40 }] },
    ],
  };
  const autoRes = runSimulation(noGnd, 'DC');
  assert.equal(autoRes.success, true);
  assert.equal(autoRes.autoGroundUsed, true);
  approx(autoRes.elements.find((e) => e.elementId === 'r1')!.currentDc, 3, 1e-4, 'Auto-ground current');

  // 3) Parallel voltage-source short-circuit loop
  const shortV: CircuitState = {
    elements: [
      { id: 'e1', name: 'E1', type: 'V_SRC', x: 0, y: 0, rotation: 0, waveform: 'DC', dcValue: 10 },
      { id: 'e2', name: 'E2', type: 'V_SRC', x: 80, y: 0, rotation: 0, waveform: 'DC', dcValue: 5 },
      { id: 'g', name: 'GND', type: 'GND', x: 0, y: 60, rotation: 0 },
    ],
    wires: [
      { id: 'w1', points: [{ x: 0, y: -40 }, { x: 80, y: -40 }] },
      { id: 'w2', points: [{ x: 0, y: 40 }, { x: 80, y: 40 }] },
    ],
  };
  const shortRes = runSimulation(shortV, 'DC');
  assert.equal(shortRes.success, false);
  assert.ok(shortRes.diagnostics.some((d) => d.level === 'error'));
});

// ============================================================================
// LEVEL 2: BASIC TO INTERMEDIATE (AC Resonance, PEAK/PHASE, DC Steady-State)
// ============================================================================

test('Level 2.1: Series RLC AC resonance (PEAK amplitude & non-zero initial phase)', () => {
  // f = 50 Hz (omega = 100*PI), R = 10 Ohm, L = 0.1 H, C = 1/(omega^2 * L) = 1/(10000*PI^2 * 0.1)
  // At resonance: X_L = X_C = 10*PI = 31.4159 Ohm, quality factor Q_f = X_L / R = PI
  // PEAK source Vm = 100*sqrt(2) V (=> Vrms = 100 V), phaseDeg = 30°
  // Expected: I = 10∠30° A, V_L = 100*PI∠120° V, V_C = 100*PI∠-60° V, P = 1000 W, Q_src = 0 var
  const f = 50;
  const omega = 2 * Math.PI * f;
  const L = 0.1;
  const C = 1 / (omega * omega * L);
  const state: CircuitState = {
    elements: [
      {
        id: 'e1',
        name: 'E1',
        type: 'V_SRC',
        x: 0,
        y: 0,
        rotation: 0,
        waveform: 'AC',
        acValue: 100 * Math.SQRT2,
        amplitudeType: 'PEAK',
        phaseDeg: 30,
        freqHz: f,
      },
      { id: 'r1', name: 'R1', type: 'RESISTOR', x: 80, y: -40, rotation: 0, resistance: 10 },
      { id: 'l1', name: 'L1', type: 'INDUCTOR', x: 160, y: -40, rotation: 0, inductance: L },
      { id: 'c1', name: 'C1', type: 'CAPACITOR', x: 200, y: 0, rotation: 90, capacitance: C },
      { id: 'g', name: 'GND', type: 'GND', x: 0, y: 60, rotation: 0 },
    ],
    wires: [
      { id: 'w1', points: [{ x: 0, y: -40 }, { x: 40, y: -40 }] },
      { id: 'w2', points: [{ x: 0, y: 40 }, { x: 200, y: 40 }] },
    ],
  };

  const res = runSimulation(state, 'AC');
  assert.equal(res.success, true);
  const r1 = res.elements.find((e) => e.elementId === 'r1')!;
  const l1 = res.elements.find((e) => e.elementId === 'l1')!;
  const c1 = res.elements.find((e) => e.elementId === 'c1')!;
  const e1 = res.elements.find((e) => e.elementId === 'e1')!;

  approx(r1.currentPhasorMag!, 10, 1e-3, 'Resonance I_rms');
  approx(r1.currentPhasorDeg!, 30, 1e-2, 'Resonance I_phase');
  approx(l1.voltagePhasorMag!, 10 * omega * L, 1e-2, 'U_L magnification');
  approx(c1.voltagePhasorMag!, 10 * omega * L, 1e-2, 'U_C magnification');
  approx(e1.pWatts, -1000, 1e-2, 'P_gen');
  approx(e1.qVars, 0, 1e-2, 'Zero reactive power at resonance');
  approx(res.powerBalance!.qGenerated, res.powerBalance!.qConsumed, 1e-2, 'Q balance at resonance');
});

// ============================================================================
// LEVEL 3: INTERMEDIATE (Op-Amp Active Low-Pass Filter, Controlled Sources, 1-Port/2-Port)
// ============================================================================

test('Level 3.1: First-order active Op-Amp low-pass filter at cutoff f_c (AC & DC_SS)', () => {
  // Inverting active topology: R1 = 1k, Rf = 2k, Cf // Rf for f_c = 1/(2*pi*Rf*Cf) = 100 Hz
  // At DC (DC_SS): H(0) = -Rf/R1 = -2 => E1 = 3 V => Vout = -6 V
  // At AC f = f_c = 100 Hz: H(j*w_c) = -2 / (1 + j1) = -1 + j1 = sqrt(2) ∠ 135°
  // For E1 = 5∠0° Vrms => Vout = 5*sqrt(2) ∠ 135° Vrms
  const R1 = 1000;
  const Rf = 2000;
  const fc = 100;
  const Cf = 1 / (2 * Math.PI * Rf * fc);

  const state: CircuitState = {
    elements: [
      { id: 'e1', name: 'E1', type: 'V_SRC', x: 0, y: 100, rotation: 0, waveform: 'AC', acValue: 5, amplitudeType: 'RMS', phaseDeg: 0, freqHz: fc, dcValue: 3 },
      { id: 'r1', name: 'R1', type: 'RESISTOR', x: 80, y: 60, rotation: 0, resistance: R1 },
      { id: 'rf', name: 'Rf', type: 'RESISTOR', x: 200, y: 0, rotation: 0, resistance: Rf },
      { id: 'cf', name: 'Cf', type: 'CAPACITOR', x: 200, y: -60, rotation: 0, capacitance: Cf },
      { id: 'oa', name: 'OA1', type: 'OPAMP', x: 200, y: 80, rotation: 0, opampInvertPins: true },
      { id: 'rl', name: 'RL', type: 'RESISTOR', x: 300, y: 120, rotation: 90, resistance: 1000 },
      { id: 'g', name: 'GND', type: 'GND', x: 0, y: 160, rotation: 0 },
    ],
    wires: [
      { id: 'w1', points: [{ x: 0, y: 60 }, { x: 40, y: 60 }] },
      { id: 'w2', points: [{ x: 120, y: 60 }, { x: 160, y: 60 }, { x: 160, y: 0 }, { x: 160, y: -60 }] },
      { id: 'w3', points: [{ x: 240, y: -60 }, { x: 240, y: 0 }, { x: 240, y: 80 }, { x: 300, y: 80 }] },
      { id: 'w4', points: [{ x: 160, y: 100 }, { x: 140, y: 100 }, { x: 140, y: 140 }, { x: 0, y: 140 }] },
      { id: 'w5', points: [{ x: 0, y: 140 }, { x: 300, y: 140 }, { x: 300, y: 160 }] },
      { id: 'w6', points: [{ x: 300, y: 140 }, { x: 300, y: 160 }] },
    ],
  };
  // Fix RL connection: RL is at (300, 120) rotation 90 -> pins at (300, 80) and (300, 160).
  state.wires[4] = { id: 'w5', points: [{ x: 0, y: 140 }, { x: 300, y: 140 }, { x: 300, y: 160 }] };
  state.wires.pop();

  const acRes = runSimulation(state, 'AC');
  assert.equal(acRes.success, true);
  const rlAc = acRes.elements.find((e) => e.elementId === 'rl')!;
  approx(rlAc.voltagePhasorMag!, 5 * Math.SQRT2, 1e-2, 'OpAmp LPF -3dB |Vout|');
  approx(rlAc.voltagePhasorDeg!, 135, 0.1, 'OpAmp LPF angle(Vout)');

  // DC_SS check (Cf open-circuit, E1 set to 3 V DC)
  state.elements[0].waveform = 'DC';
  const dcRes = runSimulation(state, 'DC_SS');
  assert.equal(dcRes.success, true);
  approx(dcRes.elements.find((e) => e.elementId === 'rl')!.voltageDc, -6, 1e-3, 'OpAmp DC_SS Vout');
});

test('Level 3.2: Asymmetric Pi network equivalence via [Z], [Y], [A] two-port matrices', () => {
  // Pi network: Y1 = 0.1 S (R1=10), Y2 = 0.2 S (R2=5), Y3 (series) = 0.5 S (R3=2)
  // Y11 = Y1 + Y3 = 0.6 S, Y12 = Y21 = -0.5 S, Y22 = Y2 + Y3 = 0.7 S
  // det(Y) = 0.42 - 0.25 = 0.17 => Z = Y^-1 = [[70/17, 50/17], [50/17, 60/17]]
  // A = [[1 + Y2/Y3, 1/Y3], [Y1 + Y2 + Y1*Y2/Y3, 1 + Y1/Y3]] = [[1.4, 2], [0.34, 1.2]]
  const piState: CircuitState = {
    elements: [
      { id: 'r1', name: 'R1', type: 'RESISTOR', x: 0, y: 40, rotation: 90, resistance: 10 },
      { id: 'r3', name: 'R3', type: 'RESISTOR', x: 60, y: 0, rotation: 0, resistance: 2 },
      { id: 'r2', name: 'R2', type: 'RESISTOR', x: 120, y: 40, rotation: 90, resistance: 5 },
      { id: 'g', name: 'GND', type: 'GND', x: 0, y: 100, rotation: 0 },
    ],
    wires: [
      { id: 'w1', points: [{ x: 0, y: 0 }, { x: 20, y: 0 }] },
      { id: 'w2', points: [{ x: 100, y: 0 }, { x: 120, y: 0 }] },
      { id: 'w3', points: [{ x: 0, y: 80 }, { x: 120, y: 80 }] },
    ],
  };

  const net = buildNetlist(piState.elements, piState.wires);
  const p1 = net.nodeMap['r1:1'];
  const p2 = net.nodeMap['r2:1'];
  const tp = extractTwoPort(piState, p1, '0', p2, '0', 0);
  assert.equal(tp.success, true);

  approx(tp.Y![0][0].re, 0.6, 1e-4, 'Y11');
  approx(tp.Y![0][1].re, -0.5, 1e-4, 'Y12');
  approx(tp.Y![1][1].re, 0.7, 1e-4, 'Y22');
  approx(tp.Z![0][0].re, 70 / 17, 1e-4, 'Z11');
  approx(tp.Z![0][1].re, 50 / 17, 1e-4, 'Z12');
  approx(tp.Z![1][1].re, 60 / 17, 1e-4, 'Z22');
  approx(tp.A![0][0].re, 1.4, 1e-4, 'A');
  approx(tp.A![0][1].re, 2.0, 1e-4, 'B');
  approx(tp.A![1][0].re, 0.34, 1e-4, 'C');
  approx(tp.A![1][1].re, 1.2, 1e-4, 'D');

  // Verify TWO_PORT element in Z, Y, and A modes driven by 10 V at Port 1 with RL = 4 Ohm at Port 2:
  // From ABCD: V1 = 1.4*V2 + 2*(V2/4) = 1.9*V2 => V2 = 10/1.9 = 100/19 V
  for (const kind of ['Z', 'Y', 'A'] as const) {
    const mat = tp[kind]!;
    const testNet: CircuitState = {
      elements: [
        { id: 'e1', name: 'E1', type: 'V_SRC', x: 0, y: 40, rotation: 0, waveform: 'DC', dcValue: 10 },
        {
          id: 'tp',
          name: 'P2',
          type: 'TWO_PORT',
          x: 100,
          y: 40,
          rotation: 0,
          twoPortType: kind,
          m11: mat[0][0],
          m12: mat[0][1],
          m21: mat[1][0],
          m22: mat[1][1],
        },
        { id: 'rl', name: 'RL', type: 'RESISTOR', x: 200, y: 40, rotation: 90, resistance: 4 },
        { id: 'g', name: 'GND', type: 'GND', x: 0, y: 100, rotation: 0 },
      ],
      wires: [
        { id: 'w1', points: [{ x: 0, y: 0 }, { x: 40, y: 0 }] },
        { id: 'w2', points: [{ x: 160, y: 0 }, { x: 200, y: 0 }] },
        { id: 'w3', points: [{ x: 0, y: 80 }, { x: 40, y: 80 }, { x: 160, y: 80 }, { x: 200, y: 80 }] },
      ],
    };
    const r = runSimulation(testNet, 'DC');
    assert.equal(r.success, true);
    approx(r.elements.find((e) => e.elementId === 'rl')!.voltageDc, 100 / 19, 1e-3, `TWO_PORT ${kind} V2`);
  }
});

// ============================================================================
// LEVEL 4: COMPLEX (Mutual Inductance, Multi-Frequency, 2nd-Order RLC Transient, CCCS-Cap, Norton Transient)
// ============================================================================

test('Level 4.1: Underdamped 2nd-order series RLC transient with non-zero initial state', () => {
  // E = 0 V (natural response), R = 20 Ohm, L = 0.1 H, C = 100 uF (v_C(0) = 10 V, i_L(0) = 0 A)
  // alpha = R/(2L) = 100 s^-1, omega_0 = 1/sqrt(LC) = 1/sqrt(1e-5) = 316.227766 rad/s
  // omega_d = sqrt(omega_0^2 - alpha^2) = sqrt(90000) = 300 rad/s
  // Analytical: v_C(t) = v_C(0) * exp(-alpha*t) * (cos(omega_d*t) + (alpha/omega_d)*sin(omega_d*t))
  // At t = 0.005 s: v_C(0.005) = 10 * exp(-0.5) * (cos(1.5) + (1/3)*sin(1.5)) ≈ 2.4446 V
  const R = 20;
  const L = 0.1;
  const C = 100e-6;
  const alpha = R / (2 * L);
  const wd = Math.sqrt(1 / (L * C) - alpha * alpha);
  assert.ok(Math.abs(wd - 300) < 1e-6);

  const state: CircuitState = {
    elements: [
      { id: 'r1', name: 'R1', type: 'RESISTOR', x: 40, y: 0, rotation: 0, resistance: R },
      { id: 'l1', name: 'L1', type: 'INDUCTOR', x: 120, y: 0, rotation: 0, inductance: L, initialCurrent: 0 },
      { id: 'c1', name: 'C1', type: 'CAPACITOR', x: 160, y: 40, rotation: 90, capacitance: C, initialVoltage: 10 },
      { id: 'g', name: 'GND', type: 'GND', x: 0, y: 100, rotation: 0 },
    ],
    wires: [
      { id: 'w1', points: [{ x: 0, y: 0 }, { x: 0, y: 80 }, { x: 160, y: 80 }] },
    ],
  };

  const tEnd = 0.005;
  const dt = 0.00001; // 500 fine steps to verify Backward Euler convergence
  const res = runSimulation(state, 'TRANSIENT', { dt, tEnd });
  assert.equal(res.success, true);

  const uC = res.transient!.elementVoltages['c1'];
  const iL = res.transient!.elementCurrents['l1'];
  approx(uC[0], 10, 1e-5, 'RLC u_C(0+)');
  approx(iL[0], 0, 1e-5, 'RLC i_L(0+)');

  const exactUc = 10 * Math.exp(-alpha * tEnd) * (Math.cos(wd * tEnd) + (alpha / wd) * Math.sin(wd * tEnd));
  const exactIl = -10 * C * ((alpha * alpha + wd * wd) / wd) * Math.exp(-alpha * tEnd) * Math.sin(wd * tEnd);
  // Sign convention note: L1 connects (2->3) and C1 connects (3->0), so i_L1 enters C1+ => i_L1 = C * dv_C/dt (negative during capacitor discharge).
  approx(uC[uC.length - 1], exactUc, 0.05, 'RLC underdamped u_C(t)');
  approx(iL[iL.length - 1], exactIl, 0.005, 'RLC underdamped i_L(t)');
});

test('Level 4.2: Opposing-dot mutual coupling (dotPolarity = -1) & multi-harmonic AC', () => {
  // dotPolarity = -1: L1=0.2 H, L2=0.1 H, M=0.1 H, f=100/(2*PI) => X_L1=20, X_L2=10, X_M=-10
  // At E1 = 100∠0° V: |I1| stays sqrt(40) A while I2 reverses phase by 180° relative to dotPolarity=+1:
  // I2 = +4 + j2 A (angle atan2(2, 4) ≈ +26.565°)
  const freqHz = 100 / (2 * Math.PI);
  const state: CircuitState = {
    elements: [
      { id: 'e1', name: 'E1', type: 'V_SRC', x: 0, y: 0, rotation: 0, waveform: 'AC', acValue: 100, amplitudeType: 'RMS', phaseDeg: 0, freqHz },
      { id: 'r1', name: 'R1', type: 'RESISTOR', x: 80, y: -40, rotation: 0, resistance: 10 },
      { id: 'l1', name: 'L1', type: 'INDUCTOR', x: 160, y: -40, rotation: 0, inductance: 0.2 },
      { id: 'c1', name: 'C1', type: 'CAPACITOR', x: 200, y: 0, rotation: 90, capacitance: 1e-3 },
      { id: 'l2', name: 'L2', type: 'INDUCTOR', x: 320, y: -40, rotation: 0, inductance: 0.1 },
      { id: 'r2', name: 'R2', type: 'RESISTOR', x: 360, y: 0, rotation: 90, resistance: 10 },
      { id: 'm1', name: 'M1', type: 'MUTUAL', x: 240, y: -100, rotation: 0, l1Id: 'l1', l2Id: 'l2', mutualM: 0.1, dotPolarity: -1 },
      { id: 'g', name: 'GND', type: 'GND', x: 0, y: 60, rotation: 0 },
    ],
    wires: [
      { id: 'w1', points: [{ x: 0, y: -40 }, { x: 40, y: -40 }] },
      { id: 'w2', points: [{ x: 0, y: 40 }, { x: 200, y: 40 }, { x: 280, y: 40 }, { x: 360, y: 40 }] },
      { id: 'w3', points: [{ x: 280, y: 40 }, { x: 280, y: -40 }] },
    ],
  };

  const res = runSimulation(state, 'AC');
  assert.equal(res.success, true);
  const l2 = res.elements.find((e) => e.elementId === 'l2')!;
  approx(l2.currentRms, Math.sqrt(20), 1e-3, 'Inverse dot |I2|');
  approx(l2.currentPhasorDeg!, (Math.atan2(2, 4) * 180) / Math.PI, 1e-2, 'Inverse dot angle(I2)');
});

test('Level 4.3: CCCS sensing capacitor current in Transient mode + ONE_PORT Norton Transient', () => {
  // Circuit 1: E1 = 10 V -> R1 = 100 Ohm -> C1 = 100 uF (v_C(0)=0) -> GND
  // At t = 0+: i_C(0+) = 10 / 100 = 0.1 A; CCCS Jb1 (beta = 5) drives RL = 200 Ohm => V_RL(0+) = 100 V
  // Circuit 2: Isolated ONE_PORT Norton (In = 2 A DC, Yth = 0.1 S) driving RL2 = 10 Ohm => V = 10 V, I_ONE_PORT = -1 A
  const state: CircuitState = {
    elements: [
      { id: 'e1', name: 'E1', type: 'V_SRC', x: 0, y: 0, rotation: 0, waveform: 'DC', dcValue: 10 },
      { id: 'r1', name: 'R1', type: 'RESISTOR', x: 80, y: -40, rotation: 0, resistance: 100 },
      { id: 'c1', name: 'C1', type: 'CAPACITOR', x: 120, y: 0, rotation: 90, capacitance: 100e-6, initialVoltage: 0 },
      { id: 'jb1', name: 'Jb1', type: 'CCCS', x: 220, y: 0, rotation: 0, gain: 5, ctrlElementId: 'c1' },
      { id: 'rl1', name: 'RL1', type: 'RESISTOR', x: 300, y: 0, rotation: 90, resistance: 200 },
      {
        id: 'op1',
        name: 'P1',
        type: 'ONE_PORT',
        x: 420,
        y: 40,
        rotation: 0,
        onePortMode: 'NORTON',
        onePortMag: 2,
        onePortPhaseDeg: 0,
        onePortFreqHz: 0,
        onePortZ: { re: 0.1, im: 0 },
      },
      { id: 'rl2', name: 'RL2', type: 'RESISTOR', x: 420, y: -40, rotation: 0, resistance: 10 },
      { id: 'g', name: 'GND', type: 'GND', x: 0, y: 60, rotation: 0 },
    ],
    wires: [
      { id: 'w1', points: [{ x: 0, y: -40 }, { x: 40, y: -40 }] },
      { id: 'w2', points: [{ x: 0, y: 40 }, { x: 120, y: 40 }, { x: 220, y: 40 }, { x: 300, y: 40 }, { x: 380, y: 40 }] },
      { id: 'w3', points: [{ x: 220, y: -40 }, { x: 300, y: -40 }] },
      { id: 'w4', points: [{ x: 380, y: -40 }, { x: 380, y: 40 }] },
      { id: 'w5', points: [{ x: 460, y: -40 }, { x: 460, y: 40 }] },
    ],
  };

  const res = runSimulation(state, 'TRANSIENT', { dt: 0.0005, tEnd: 0.01 });
  assert.equal(res.success, true);
  const vRl1_t0 = res.transient!.elementVoltages['rl1'][0];
  approx(vRl1_t0, 100, 1e-2, 'CCCS sensing CAPACITOR in Transient at t=0+');

  const iOp1_t0 = res.transient!.elementCurrents['op1'][0];
  approx(iOp1_t0, -1, 1e-3, 'ONE_PORT Norton current in Transient');
});

// ============================================================================
// LEVEL 5: VERY COMPLEX (3-Phase Delta ACB, Zero-Impedance Line Zd=0, Hybrid 12-Node System + AC Thévenin)
// ============================================================================

test('Level 5.1: 3-phase Delta source (ACB negative sequence, V_line=380V) -> Zd=0 line -> Unbalanced Delta load', () => {
  // Delta source 380 V line-to-line, ACB sequence => Vab = 380∠-30°, Vbc = 380∠90°, Vca = 380∠-150°
  // Zero-impedance line Zd = 0 + j0 (ideal busbar)
  // Unbalanced Delta load: Zab = 38 Ohm, Zbc = 38 + j38 Ohm, Zca = 19 - j19 Ohm
  // Verify: line current DZ matches load line current (non-zero when Zd = 0!) and P/Q balance holds
  const state: CircuitState = {
    elements: [
      {
        id: 'g3',
        name: 'G3',
        type: 'THREE_PHASE_SRC',
        x: 100,
        y: 200,
        rotation: 0,
        tpConnection: 'DELTA',
        tpVoltageMode: 'LINE',
        tpVoltageRms: 380,
        tpFreqHz: 50,
        tpPhaseADeg: 0,
        tpSequence: 'ACB',
      },
      {
        id: 'dz',
        name: 'DZ',
        type: 'THREE_PHASE_LINE',
        x: 280,
        y: 200,
        rotation: 0,
        lineZ: { re: 0, im: 0 },
        lineZn: { re: 0, im: 0 },
        hasNeutral: false,
      },
      {
        id: 't3',
        name: 'T3',
        type: 'THREE_PHASE_LOAD',
        x: 460,
        y: 200,
        rotation: 0,
        loadConnection: 'DELTA',
        loadNeutralConnected: false,
        loadSymmetric: false,
        loadZa: { re: 38, im: 0 },
        loadZb: { re: 38, im: 38 },
        loadZc: { re: 19, im: -19 },
      },
      { id: 'gnd', name: 'GND', type: 'GND', x: 160, y: 300, rotation: 0 },
    ],
    wires: [
      { id: 'wa1', points: [{ x: 160, y: 140 }, { x: 220, y: 140 }] },
      { id: 'wb1', points: [{ x: 160, y: 180 }, { x: 220, y: 180 }] },
      { id: 'wc1', points: [{ x: 160, y: 220 }, { x: 220, y: 220 }] },
      { id: 'wa2', points: [{ x: 340, y: 140 }, { x: 400, y: 140 }] },
      { id: 'wb2', points: [{ x: 340, y: 180 }, { x: 400, y: 180 }] },
      { id: 'wc2', points: [{ x: 340, y: 220 }, { x: 400, y: 220 }] },
      { id: 'wn', points: [{ x: 160, y: 260 }, { x: 160, y: 280 }] },
    ],
  };

  const res = runSimulation(state, 'AC');
  assert.equal(res.success, true);
  const src = res.elements.find((e) => e.elementId === 'g3')!;
  const line = res.elements.find((e) => e.elementId === 'dz')!;
  const load = res.elements.find((e) => e.elementId === 't3')!;

  // Analytical Delta load power:
  // P_ab = 380^2 / 38 = 3800 W, Q_ab = 0
  // Z_bc = 38 + j38 => |Z_bc|^2 = 2 * 38^2 => S_bc = 380^2 / (38 - j38) = 1900 + j1900 VA
  // Z_ca = 19 - j19 => |Z_ca|^2 = 2 * 19^2 => S_ca = 380^2 / (19 + j19) = 3800 - j3800 VA
  // Total: P = 3800 + 1900 + 3800 = 9500 W, Q = 1900 - 3800 = -1900 var
  approx(load.threePhaseDetails!.pTotal, 9500, 1, 'Delta unbalanced P_total');
  approx(load.threePhaseDetails!.qTotal, -1900, 1, 'Delta unbalanced Q_total');
  approx(src.threePhaseDetails!.pTotal, -9500, 1, 'Delta source P_gen');
  // Zero-impedance line current magnitudes match load line currents
  approx(line.threePhaseDetails!.iaMag, load.threePhaseDetails!.iaMag, 1e-2, 'Zero-impedance line Ia matches load Ia');
  approx(line.threePhaseDetails!.ibMag, load.threePhaseDetails!.ibMag, 1e-2, 'Zero-impedance line Ib matches load Ib');
});

test('Level 5.2: Mixed linear network (Mutual + VCCS + Two-Port [A]) & AC Thévenin Equivalence', () => {
  // Complex linear upstream network driving RL_out = 30 + j0 Ohm at (N_out, GND):
  // - AC source E1 = 50∠0° Vrms @ 50 Hz -> R1 = 10 Ohm -> primary L1 = 0.1 H.
  // - Secondary L2 = 0.1 H coupled via M = 0.05 H (dotPolarity = 1) to R2 = 15 Ohm (node N_x).
  // - VCCS Jg1 (g = 0.04 S, sensing V(N_x)) feeds N_y with R3 = 50 Ohm // C1 = 50 uF.
  // - N_y feeds Two-Port [A] = [[0.5, 5], [0, 2]] to output N_out -> RL_out = 30 Ohm.
  // Verify exact load V, I, P match after extracting ONE_PORT Thévenin equivalent at (N_out, GND).
  const upstreamElements: CircuitState['elements'] = [
    { id: 'e1', name: 'E1', type: 'V_SRC', x: 0, y: 100, rotation: 0, waveform: 'AC', acValue: 50, amplitudeType: 'RMS', phaseDeg: 0, freqHz: 50 },
    { id: 'r1', name: 'R1', type: 'RESISTOR', x: 80, y: 60, rotation: 0, resistance: 10 },
    { id: 'l1', name: 'L1', type: 'INDUCTOR', x: 160, y: 60, rotation: 0, inductance: 0.1 },
    { id: 'l2', name: 'L2', type: 'INDUCTOR', x: 260, y: 60, rotation: 0, inductance: 0.1 },
    { id: 'r2', name: 'R2', type: 'RESISTOR', x: 340, y: 100, rotation: 90, resistance: 15 },
    { id: 'm1', name: 'M1', type: 'MUTUAL', x: 210, y: 0, rotation: 0, l1Id: 'l1', l2Id: 'l2', mutualM: 0.05, dotPolarity: 1 },
    { id: 'jg1', name: 'Jg1', type: 'VCCS', x: 440, y: 100, rotation: 0, gain: 0.04, ctrlNodePos: '0', ctrlNodeNeg: '0' },
    { id: 'r3', name: 'R3', type: 'RESISTOR', x: 520, y: 100, rotation: 90, resistance: 50 },
    { id: 'c1', name: 'C1', type: 'CAPACITOR', x: 600, y: 100, rotation: 90, capacitance: 50e-6 },
    {
      id: 'tp',
      name: 'P2',
      type: 'TWO_PORT',
      x: 700,
      y: 100,
      rotation: 0,
      twoPortType: 'A',
      m11: { re: 0.5, im: 0 },
      m12: { re: 5, im: 0 },
      m21: { re: 0, im: 0 },
      m22: { re: 2, im: 0 },
    },
    { id: 'g', name: 'GND', type: 'GND', x: 0, y: 160, rotation: 0 },
  ];
  const upstreamWires: CircuitState['wires'] = [
    { id: 'w1', points: [{ x: 0, y: 60 }, { x: 40, y: 60 }] },
    { id: 'w2', points: [{ x: 200, y: 60 }, { x: 200, y: 140 }, { x: 0, y: 140 }] },
    { id: 'w2b', points: [{ x: 200, y: 140 }, { x: 220, y: 140 }] },
    { id: 'w3', points: [{ x: 220, y: 60 }, { x: 220, y: 140 }, { x: 340, y: 140 }] },
    { id: 'w4', points: [{ x: 300, y: 60 }, { x: 340, y: 60 }] },
    { id: 'w5', points: [{ x: 440, y: 60 }, { x: 520, y: 60 }, { x: 600, y: 60 }, { x: 640, y: 60 }] },
    { id: 'w6', points: [{ x: 340, y: 140 }, { x: 440, y: 140 }, { x: 520, y: 140 }, { x: 600, y: 140 }, { x: 640, y: 140 }] },
    { id: 'w7', points: [{ x: 760, y: 140 }, { x: 640, y: 140 }] },
  ];

  // Resolve node IDs for N_x (r2:1) and N_out (tp:2)
  const preNet = buildNetlist(upstreamElements, upstreamWires);
  const nodeX = preNet.nodeMap['r2:1'];
  upstreamElements[6].ctrlNodePos = nodeX; // VCCS reads V(N_x)

  const openNet = buildNetlist(upstreamElements, upstreamWires);
  const nodeOut = openNet.nodeMap['tp:2'];

  const th = extractTheveninNorton({ elements: upstreamElements, wires: upstreamWires }, nodeOut, '0', 50);
  assert.equal(th.success, true);

  // Attach RL_out = 30 Ohm to full network
  const fullState: CircuitState = {
    elements: [
      ...upstreamElements,
      { id: 'rl_out', name: 'RL_out', type: 'RESISTOR', x: 820, y: 100, rotation: 90, resistance: 30 },
    ],
    wires: [
      ...upstreamWires,
      { id: 'w8', points: [{ x: 760, y: 60 }, { x: 820, y: 60 }] },
      { id: 'w9', points: [{ x: 760, y: 140 }, { x: 820, y: 140 }] },
    ],
  };
  const fullRes = runSimulation(fullState, 'AC');
  assert.equal(fullRes.success, true);
  const fullLoad = fullRes.elements.find((e) => e.elementId === 'rl_out')!;

  // Extracted Thévenin equivalent + RL_out = 30 Ohm
  const vthC = new Complex(th.vth.re, th.vth.im);
  const equivState: CircuitState = {
    elements: [
      {
        id: 'eq',
        name: 'Eq1',
        type: 'ONE_PORT',
        x: 40,
        y: 0,
        rotation: 180,
        onePortMode: 'THEVENIN',
        onePortMag: vthC.mag(),
        onePortPhaseDeg: vthC.deg(),
        onePortFreqHz: 50,
        onePortZ: th.zth,
      },
      { id: 'rl_out', name: 'RL_out', type: 'RESISTOR', x: 140, y: 40, rotation: 90, resistance: 30 },
      { id: 'g', name: 'GND', type: 'GND', x: 0, y: 100, rotation: 0 },
    ],
    wires: [
      { id: 'w1', points: [{ x: 0, y: 0 }, { x: 0, y: 80 }, { x: 140, y: 80 }] },
      { id: 'w2', points: [{ x: 80, y: 0 }, { x: 140, y: 0 }] },
    ],
  };
  const equivRes = runSimulation(equivState, 'AC');
  assert.equal(equivRes.success, true);
  const equivLoad = equivRes.elements.find((e) => e.elementId === 'rl_out')!;

  assert.ok(fullLoad.currentRms > 0.01, 'Loaded output current must be nontrivial');
  approx(fullLoad.voltagePhasorMag!, equivLoad.voltagePhasorMag!, 1e-4, 'Thevenin equiv |U_load|');
  approx(fullLoad.voltagePhasorDeg!, equivLoad.voltagePhasorDeg!, 1e-2, 'Thevenin equiv angle(U_load)');
  approx(fullLoad.currentRms, equivLoad.currentRms, 1e-4, 'Thevenin equiv I_load');
  approx(fullLoad.pWatts, equivLoad.pWatts, 1e-4, 'Thevenin equiv P_load');
});

test('Level 5.3: Netlist geometry (non-shorting crossing wires, T-junctions, 90/180/270 rotation)', () => {
  // Perpendicular crossing wires at (100, 100) must NOT create an electrical connection:
  // Circuit A (horizontal at y=100): E1=12 V -> R1=100 Ohm -> GND
  // Circuit B (vertical at x=100): E2=5 V -> R2=50 Ohm -> GND (isolated)
  const state: CircuitState = {
    elements: [
      // Circuit A: horizontal conductors from x=40 to x=200
      { id: 'ea', name: 'Ea', type: 'V_SRC', x: 0, y: 140, rotation: 0, waveform: 'DC', dcValue: 12 },
      { id: 'ra', name: 'Ra', type: 'RESISTOR', x: 200, y: 140, rotation: 90, resistance: 100 },
      // Circuit B: vertical conductor from y=0 to y=200 crossing Circuit A
      { id: 'eb', name: 'Eb', type: 'V_SRC', x: 100, y: -40, rotation: 0, waveform: 'DC', dcValue: 5 },
      { id: 'rb', name: 'Rb', type: 'RESISTOR', x: 100, y: 240, rotation: 90, resistance: 50 },
      { id: 'g', name: 'GND', type: 'GND', x: 0, y: 200, rotation: 0 },
    ],
    wires: [
      { id: 'wa_top', points: [{ x: 0, y: 100 }, { x: 200, y: 100 }] },
      { id: 'wa_bot', points: [{ x: 0, y: 180 }, { x: 200, y: 180 }] },
      { id: 'wb_cross', points: [{ x: 100, y: 0 }, { x: 100, y: 200 }] }, // Crosses wa_top and wa_bot
      { id: 'wb_ret', points: [{ x: 100, y: -80 }, { x: 300, y: -80 }, { x: 300, y: 280 }, { x: 100, y: 280 }] },
    ],
  };
  const net = buildNetlist(state.elements, state.wires);
  assert.notEqual(net.nodeMap['ea:p'], net.nodeMap['eb:n'], 'Crossing wires must NOT short circuit!');

  const res = runSimulation(state, 'DC');
  assert.equal(res.success, true);
  approx(res.elements.find((e) => e.elementId === 'ra')!.currentDc, 0.12, 1e-4, 'Circuit A isolated current');
  approx(res.elements.find((e) => e.elementId === 'rb')!.currentDc, -0.1, 1e-4, 'Circuit B isolated passive current');
  const crossHit = net.junctionPoints.some((p) => p.x === 100 && (p.y === 100 || p.y === 180));
  assert.equal(crossHit, false, 'Pure crossing wires must NOT produce junction dots at intersection points');
  // Confirm circuit integrity across rotations
  assert.equal(res.elements.some((e) => e.elementId === 'ea'), true);
});

test('Level 5.4: Multi-stage transient (Step Voltage -> CCVS sensing Cap -> Op-Amp -> CCCS)', () => {
  // Stage 1: Step source E1 (tStep=0.002 s: 0 V -> 10 V) -> R1=100 Ohm -> C1=10 uF -> GND (v_C(0)=0)
  // For t >= 0.002 s: i_C(t) = 0.1 * exp(-(t-0.002)/0.001) A
  // Stage 2: CCVS H1 (r = 50 Ohm sensing C1) feeds Rh = 25 Ohm & inverting Op-Amp (Rin = 10 kOhm, Rf = 20 kOhm)
  // V_out = -2 * V_H1 = -100 * i_C(t)
  // Stage 3: CCCS F1 (beta = 10 sensing Op-Amp output) drives Rf1 = 100 Ohm
  const state: CircuitState = {
    elements: [
      {
        id: 'e1',
        name: 'E_step',
        type: 'V_SRC',
        x: 0,
        y: 80,
        rotation: 0,
        waveform: 'STEP',
        stepTime: 0.002,
        stepInit: 0,
        stepFinal: 10,
      },
      { id: 'r1', name: 'R1', type: 'RESISTOR', x: 100, y: 40, rotation: 0, resistance: 100 },
      { id: 'c1', name: 'C1', type: 'CAPACITOR', x: 180, y: 80, rotation: 90, capacitance: 10e-6, initialVoltage: 0 },
      { id: 'h1', name: 'H1', type: 'CCVS', x: 300, y: 80, rotation: 0, gain: 50, ctrlElementId: 'c1' },
      { id: 'rh', name: 'Rh', type: 'RESISTOR', x: 400, y: 80, rotation: 90, resistance: 25 },
      { id: 'rin', name: 'Rin', type: 'RESISTOR', x: 480, y: 40, rotation: 0, resistance: 10000 },
      { id: 'oa', name: 'U1', type: 'OPAMP', x: 600, y: 60, rotation: 0, opampInvertPins: true },
      { id: 'rf', name: 'Rf', type: 'RESISTOR', x: 600, y: -20, rotation: 0, resistance: 20000 },
      { id: 'rl', name: 'RL', type: 'RESISTOR', x: 720, y: 80, rotation: 90, resistance: 1000 },
      { id: 'f1', name: 'F1', type: 'CCCS', x: 820, y: 80, rotation: 0, gain: 10, ctrlElementId: 'oa' },
      { id: 'rf1', name: 'Rf1', type: 'RESISTOR', x: 900, y: 80, rotation: 90, resistance: 100 },
      { id: 'g', name: 'GND', type: 'GND', x: 0, y: 140, rotation: 0 },
    ],
    wires: [
      { id: 'w1', points: [{ x: 0, y: 40 }, { x: 60, y: 40 }] },
      { id: 'w2', points: [{ x: 140, y: 40 }, { x: 180, y: 40 }] },
      { id: 'w3', points: [{ x: 0, y: 120 }, { x: 180, y: 120 }, { x: 300, y: 120 }, { x: 400, y: 120 }, { x: 560, y: 120 }, { x: 720, y: 120 }, { x: 820, y: 120 }, { x: 900, y: 120 }] },
      // Op-Amp (600,60, opampInvertPins=true): vp at (560,80), vn at (560,40), out at (640,60)
      { id: 'w4', points: [{ x: 560, y: 80 }, { x: 560, y: 120 }] },
      { id: 'w5', points: [{ x: 300, y: 40 }, { x: 400, y: 40 }, { x: 440, y: 40 }] },
      { id: 'w6', points: [{ x: 520, y: 40 }, { x: 560, y: 40 }] },
      { id: 'w7', points: [{ x: 560, y: 40 }, { x: 560, y: -20 }] },
      { id: 'w8', points: [{ x: 640, y: -20 }, { x: 640, y: 60 }, { x: 720, y: 60 }, { x: 720, y: 40 }] },
      { id: 'w9', points: [{ x: 820, y: 40 }, { x: 900, y: 40 }] },
    ],
  };

  const res = runSimulation(state, 'TRANSIENT', { dt: 5e-5, tEnd: 0.006 });
  assert.equal(res.success, true);
  const tr = res.transient!;
  const idxBefore = tr.times.findIndex((t) => Math.abs(t - 0.001) < 1e-6);
  const idxStep = tr.times.findIndex((t) => Math.abs(t - 0.002) < 1e-6);
  const idxTau = tr.times.findIndex((t) => Math.abs(t - 0.003) < 1e-6);
  assert.ok(idxBefore > 0 && idxStep > idxBefore && idxTau > idxStep);

  // Before tStep: all signals are zero
  approx(tr.elementCurrents['c1'][idxBefore], 0, 1e-9, 'i_C before step = 0');
  approx(tr.elementVoltages['rl'][idxBefore], 0, 1e-9, 'V_out before step = 0');
  approx(tr.elementVoltages['rf1'][idxBefore], 0, 1e-9, 'V_Rf1 before step = 0');

  // At t = 0.003 s (1 ms post-step): analytical i_C ≈ 0.1 * exp(-1) = 0.036788 A
  const icTau = tr.elementCurrents['c1'][idxTau];
  const vhTau = tr.elementVoltages['h1'][idxTau];
  const voutTau = tr.elementVoltages['rl'][idxTau];
  const iOpTau = tr.elementCurrents['oa'][idxTau];
  const vRf1Tau = tr.elementVoltages['rf1'][idxTau];
  assert.ok(icTau > 0.034 && icTau < 0.04, `i_C(tau) should be ~0.0368 A, got ${icTau}`);
  approx(vhTau, 50 * icTau, 1e-4, 'CCVS voltage = 50 * i_C(t)');
  approx(voutTau, -2 * vhTau, 1e-3, 'OpAmp output = -2 * V_H1(t)');
  // I_opamp(aux) = -(Vout/1000 + Vout/20000); CCCS F1 delivers 10*I_opamp at terminal p => V_rf1 = 10 * I_opamp * 100
  approx(iOpTau, -(voutTau / 1000 + voutTau / 20000), 1e-4, 'OpAmp transient sensed current');
  approx(vRf1Tau, 10 * iOpTau * 100, 1e-3, 'CCCS sensing OPAMP output current');
});

test('Level 5.5: Regression suite (AC 0Hz RMS, Norton transient, 3-phase Delta/Y transient, dangling refs)', () => {
  // 1. AC source at 0 Hz (10 V RMS, 60° phase -> peak 10*sqrt(2)*cos(60°) = 5*sqrt(2) V DC)
  const zeroHzState: CircuitState = {
    elements: [
      { id: 'v0', name: 'V0', type: 'V_SRC', x: 0, y: 40, rotation: 0, waveform: 'AC', acValue: 10, amplitudeType: 'RMS', phaseDeg: 60, freqHz: 0 },
      { id: 'r0', name: 'R0', type: 'RESISTOR', x: 100, y: 40, rotation: 90, resistance: 10 },
      { id: 'g0', name: 'G', type: 'GND', x: 0, y: 100, rotation: 0 },
    ],
    wires: [
      { id: 'w1', points: [{ x: 0, y: 0 }, { x: 100, y: 0 }] },
      { id: 'w2', points: [{ x: 0, y: 80 }, { x: 100, y: 80 }] },
    ],
  };
  const acZero = runSimulation(zeroHzState, 'AC');
  const dcssZero = runSimulation(zeroHzState, 'DC_SS');
  const trZero = runSimulation(zeroHzState, 'TRANSIENT', { dt: 0.001, tEnd: 0.01 });
  const expectedDcV = 10 * Math.SQRT2 * Math.cos(Math.PI / 3);
  approx(acZero.elements.find((e) => e.elementId === 'r0')!.voltageDc, expectedDcV, 1e-6, 'AC at 0Hz -> DC voltage');
  approx(dcssZero.elements.find((e) => e.elementId === 'r0')!.voltageDc, expectedDcV, 1e-6, 'DC_SS at 0Hz -> DC voltage');
  approx(trZero.transient!.elementVoltages['r0'][5], expectedDcV, 1e-6, 'Transient at 0Hz -> DC voltage');

  // 2. ONE_PORT Norton in TRANSIENT (In = 2 A DC, G = 0.05 S -> 20 Ohm, RL = 30 Ohm => R_eq = 12 Ohm => V = 24 V, I_norton = -0.8 A)
  const nortonState: CircuitState = {
    elements: [
      { id: 'n1', name: 'N1', type: 'ONE_PORT', x: 40, y: 0, rotation: 0, onePortMode: 'NORTON', onePortMag: 2, onePortPhaseDeg: 0, onePortFreqHz: 0, onePortZ: { re: 0.05, im: 0 } },
      { id: 'rl', name: 'RL', type: 'RESISTOR', x: 140, y: 40, rotation: 90, resistance: 30 },
      { id: 'g', name: 'G', type: 'GND', x: 0, y: 100, rotation: 0 },
    ],
    wires: [
      { id: 'w1', points: [{ x: 0, y: 0 }, { x: 0, y: 80 }, { x: 140, y: 80 }] },
      { id: 'w2', points: [{ x: 80, y: 0 }, { x: 140, y: 0 }] },
    ],
  };
  const nortonTr = runSimulation(nortonState, 'TRANSIENT', { dt: 0.001, tEnd: 0.005 });
  approx(nortonTr.transient!.elementVoltages['n1'][2], 24, 1e-4, 'Norton transient U');
  approx(nortonTr.transient!.elementCurrents['n1'][2], -0.8, 1e-4, 'Norton transient I = G*u - I_n');

  // 3. Balanced 3-phase Delta load in TRANSIENT: at t=0 with Va=220*sqrt(2) V, Vb=Vc=-110*sqrt(2) V -> Ia(0) = 3 * 220*sqrt(2) / R_delta
  const deltaTrState: CircuitState = {
    elements: [
      { id: 'src', name: 'S', type: 'THREE_PHASE_SRC', x: 100, y: 100, rotation: 0, tpConnection: 'Y', tpVoltageMode: 'PHASE', tpVoltageRms: 220, tpFreqHz: 50, tpPhaseADeg: 0 },
      { id: 'ld', name: 'LD', type: 'THREE_PHASE_LOAD', x: 300, y: 100, rotation: 0, loadConnection: 'DELTA', loadSymmetric: true, loadZa: { re: 30, im: 0 } },
      { id: 'g', name: 'G', type: 'GND', x: 160, y: 200, rotation: 0 },
    ],
    wires: [
      { id: 'wa', points: [{ x: 160, y: 40 }, { x: 240, y: 40 }] },
      { id: 'wb', points: [{ x: 160, y: 80 }, { x: 240, y: 80 }] },
      { id: 'wc', points: [{ x: 160, y: 120 }, { x: 240, y: 120 }] },
      { id: 'wn', points: [{ x: 160, y: 160 }, { x: 160, y: 180 }] },
    ],
  };
  const deltaTr = runSimulation(deltaTrState, 'TRANSIENT', { dt: 0.001, tEnd: 0.02 });
  const expectedIa0 = (3 * 220 * Math.SQRT2) / 30;
  approx(deltaTr.transient!.elementCurrents['ld'][0], expectedIa0, 1e-3, '3-phase Delta transient Ia(0)');

  // 4. Broken reference diagnostics for MUTUAL, CCCS, and VCVS
  const brokenRefState: CircuitState = {
    elements: [
      { id: 'v1', name: 'V1', type: 'V_SRC', x: 0, y: 40, rotation: 0, waveform: 'DC', dcValue: 5 },
      { id: 'r1', name: 'R1', type: 'RESISTOR', x: 100, y: 40, rotation: 90, resistance: 50 },
      { id: 'l1', name: 'L1', type: 'INDUCTOR', x: 200, y: 40, rotation: 0, inductance: 0.1 },
      { id: 'm_bad', name: 'M_bad', type: 'MUTUAL', x: 200, y: 0, rotation: 0, l1Id: 'l1', l2Id: 'l1', mutualM: 0.05 },
      { id: 'f_bad', name: 'F_bad', type: 'CCCS', x: 300, y: 40, rotation: 0, gain: 2, ctrlElementId: 'missing_el' },
      { id: 'e_bad', name: 'E_bad', type: 'VCVS', x: 400, y: 40, rotation: 0, gain: 2, ctrlNodePos: '999', ctrlNodeNeg: '0' },
      { id: 'g', name: 'G', type: 'GND', x: 0, y: 100, rotation: 0 },
    ],
    wires: [
      { id: 'w1', points: [{ x: 0, y: 0 }, { x: 100, y: 0 }] },
      { id: 'w2', points: [{ x: 0, y: 80 }, { x: 100, y: 80 }] },
    ],
  };
  const brokenRes = runSimulation(brokenRefState, 'DC');
  assert.ok(brokenRes.diagnostics.some((d) => d.level === 'warning' && d.text.includes('M_bad')));
  assert.ok(brokenRes.diagnostics.some((d) => d.level === 'warning' && d.text.includes('F_bad')));
  assert.ok(brokenRes.diagnostics.some((d) => d.level === 'warning' && d.text.includes('E_bad')));
});
