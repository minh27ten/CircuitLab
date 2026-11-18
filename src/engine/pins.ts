import { CircuitElement, ComponentType, PinDef } from '../types/circuit';

export const GRID_SIZE = 20;

export interface ComponentMeta {
  type: ComponentType;
  label: string;
  shortLabel: string;
  category: 'source' | 'passive' | 'dependent' | 'network' | 'threephase';
  categoryLabel: string;
  prefix: string;
  description: string;
}

export const COMPONENT_CATALOG: ComponentMeta[] = [
  {
    type: 'GND',
    label: 'Ground Reference (GND)',
    shortLabel: 'GND',
    category: 'source',
    categoryLabel: 'Sources & Reference',
    prefix: 'GND',
    description: '0 V reference potential node (Node 0).',
  },
  {
    type: 'V_SRC',
    label: 'Independent Voltage Source',
    shortLabel: 'V Source',
    category: 'source',
    categoryLabel: 'Sources & Reference',
    prefix: 'E',
    description: 'DC, sinusoidal AC, mixed multi-harmonic, or Step voltage source.',
  },
  {
    type: 'I_SRC',
    label: 'Independent Current Source',
    shortLabel: 'I Source',
    category: 'source',
    categoryLabel: 'Sources & Reference',
    prefix: 'J',
    description: 'DC, sinusoidal AC, mixed multi-harmonic, or Step current source.',
  },
  {
    type: 'RESISTOR',
    label: 'Resistor (R)',
    shortLabel: 'Resistor',
    category: 'passive',
    categoryLabel: 'Passive & Mutual Coupling',
    prefix: 'R',
    description: 'Pure resistive element in ohms (Ω).',
  },
  {
    type: 'CAPACITOR',
    label: 'Capacitor (C)',
    shortLabel: 'Capacitor',
    category: 'passive',
    categoryLabel: 'Passive & Mutual Coupling',
    prefix: 'C',
    description: 'Capacitive element (F) with initial voltage v_C(0).',
  },
  {
    type: 'INDUCTOR',
    label: 'Inductor (L)',
    shortLabel: 'Inductor',
    category: 'passive',
    categoryLabel: 'Passive & Mutual Coupling',
    prefix: 'L',
    description: 'Inductive element (H) with initial current i_L(0) and dot polarity.',
  },
  {
    type: 'IMPEDANCE',
    label: 'Complex Impedance (Z)',
    shortLabel: 'Impedance Z',
    category: 'passive',
    categoryLabel: 'Passive & Mutual Coupling',
    prefix: 'Z',
    description: 'Complex branch impedance Z = R + jX (Ω) combining R, L, C.',
  },
  {
    type: 'MUTUAL',
    label: 'Mutual Coupling (M / Z_M)',
    shortLabel: 'Mutual M/Z',
    category: 'passive',
    categoryLabel: 'Passive & Mutual Coupling',
    prefix: 'M',
    description: 'Magnetic coupling between two inductors (L) or complex impedances (Z).',
  },
  {
    type: 'VCVS',
    label: 'Voltage-Controlled Voltage Source (VCVS)',
    shortLabel: 'VCVS (μV)',
    category: 'dependent',
    categoryLabel: 'Dependent Sources & Op-Amp',
    prefix: 'Ev',
    description: 'Voltage source controlled by a node-pair voltage (gain μ).',
  },
  {
    type: 'CCVS',
    label: 'Current-Controlled Voltage Source (CCVS)',
    shortLabel: 'CCVS (rI)',
    category: 'dependent',
    categoryLabel: 'Dependent Sources & Op-Amp',
    prefix: 'Er',
    description: 'Voltage source controlled by a branch current (transresistance r, Ω).',
  },
  {
    type: 'VCCS',
    label: 'Voltage-Controlled Current Source (VCCS)',
    shortLabel: 'VCCS (gV)',
    category: 'dependent',
    categoryLabel: 'Dependent Sources & Op-Amp',
    prefix: 'Jg',
    description: 'Current source controlled by a node-pair voltage (transconductance g, S).',
  },
  {
    type: 'CCCS',
    label: 'Current-Controlled Current Source (CCCS)',
    shortLabel: 'CCCS (βI)',
    category: 'dependent',
    categoryLabel: 'Dependent Sources & Op-Amp',
    prefix: 'Jb',
    description: 'Current source controlled by a branch current (gain β).',
  },
  {
    type: 'OPAMP',
    label: 'Ideal Op-Amp',
    shortLabel: 'Op-Amp',
    category: 'dependent',
    categoryLabel: 'Dependent Sources & Op-Amp',
    prefix: 'OA',
    description: 'Ideal operational amplifier (V+ = V-, I_in = 0).',
  },
  {
    type: 'ONE_PORT',
    label: 'One-Port Network',
    shortLabel: '1-Port',
    category: 'network',
    categoryLabel: 'One-Port & Two-Port Networks',
    prefix: 'P1',
    description: 'Thévenin (Vth, Zth) or Norton (In, Yth) equivalent.',
  },
  {
    type: 'TWO_PORT',
    label: 'Two-Port Network',
    shortLabel: '2-Port',
    category: 'network',
    categoryLabel: 'One-Port & Two-Port Networks',
    prefix: 'P2',
    description: 'Two-port network defined directly by [Z], [Y], or [A] matrix.',
  },
  {
    type: 'THREE_PHASE_SRC',
    label: 'Balanced Three-Phase Source',
    shortLabel: '3φ Source',
    category: 'threephase',
    categoryLabel: 'Three-Phase Systems',
    prefix: 'G3',
    description: '3-phase voltage source in Wye (Y) or Delta (Δ) configuration.',
  },
  {
    type: 'THREE_PHASE_LINE',
    label: 'Three-Phase Transmission Line',
    shortLabel: '3φ Line',
    category: 'threephase',
    categoryLabel: 'Three-Phase Systems',
    prefix: 'TL',
    description: '3-phase 4-wire line with phase impedance Zd and neutral Zn.',
  },
  {
    type: 'THREE_PHASE_LOAD',
    label: 'Three-Phase Load',
    shortLabel: '3φ Load',
    category: 'threephase',
    categoryLabel: 'Three-Phase Systems',
    prefix: 'LD',
    description: 'Y or Δ 3-phase load supporting balanced and unbalanced impedances.',
  },
];

export function getComponentMeta(type: ComponentType): ComponentMeta {
  return COMPONENT_CATALOG.find((c) => c.type === type)!;
}

const VALID_COMPONENT_TYPES = new Set<string>(COMPONENT_CATALOG.map((c) => c.type));

export function isValidComponentType(type: unknown): type is ComponentType {
  return typeof type === 'string' && VALID_COMPONENT_TYPES.has(type);
}

export function hasVerticalPins(el: Pick<CircuitElement, 'type' | 'rotation'>): boolean {
  const verticallyOrientedByDefault =
    el.type === 'V_SRC' ||
    el.type === 'I_SRC' ||
    el.type === 'VCVS' ||
    el.type === 'CCVS' ||
    el.type === 'VCCS' ||
    el.type === 'CCCS';
  return verticallyOrientedByDefault
    ? el.rotation === 0 || el.rotation === 180
    : el.rotation === 90 || el.rotation === 270;
}

export function getLocalPins(el: Pick<CircuitElement, 'type' | 'opampInvertPins'>): PinDef[] {
  switch (el.type) {
    case 'GND':
      return [{ id: 'gnd', label: '0', dx: 0, dy: -20 }];
    case 'V_SRC':
    case 'I_SRC':
    case 'VCVS':
    case 'CCVS':
    case 'VCCS':
    case 'CCCS':
      return [
        { id: 'p', label: '+', dx: 0, dy: -40 },
        { id: 'n', label: '-', dx: 0, dy: 40 },
      ];
    case 'RESISTOR':
    case 'CAPACITOR':
    case 'INDUCTOR':
    case 'IMPEDANCE':
    case 'ONE_PORT':
      return [
        { id: '1', label: '1', dx: -40, dy: 0 },
        { id: '2', label: '2', dx: 40, dy: 0 },
      ];
    case 'MUTUAL':
      return [];
    case 'TWO_PORT':
      return [
        { id: '1', label: '1', dx: -60, dy: -40 },
        { id: '1p', label: "1'", dx: -60, dy: 40 },
        { id: '2', label: '2', dx: 60, dy: -40 },
        { id: '2p', label: "2'", dx: 60, dy: 40 },
      ];
    case 'OPAMP':
      return [
        { id: 'vp', label: '+', dx: -40, dy: el.opampInvertPins ? 20 : -20 },
        { id: 'vn', label: '-', dx: -40, dy: el.opampInvertPins ? -20 : 20 },
        { id: 'out', label: 'Out', dx: 40, dy: 0 },
      ];
    case 'THREE_PHASE_SRC':
      return [
        { id: 'A', label: 'A', dx: 60, dy: -60 },
        { id: 'B', label: 'B', dx: 60, dy: -20 },
        { id: 'C', label: 'C', dx: 60, dy: 20 },
        { id: 'N', label: 'N', dx: 60, dy: 60 },
      ];
    case 'THREE_PHASE_LINE':
      return [
        { id: 'A1', label: 'A1', dx: -60, dy: -60 },
        { id: 'B1', label: 'B1', dx: -60, dy: -20 },
        { id: 'C1', label: 'C1', dx: -60, dy: 20 },
        { id: 'N1', label: 'N1', dx: -60, dy: 60 },
        { id: 'A2', label: 'A2', dx: 60, dy: -60 },
        { id: 'B2', label: 'B2', dx: 60, dy: -20 },
        { id: 'C2', label: 'C2', dx: 60, dy: 20 },
        { id: 'N2', label: 'N2', dx: 60, dy: 60 },
      ];
    case 'THREE_PHASE_LOAD':
      return [
        { id: 'A', label: 'A', dx: -60, dy: -60 },
        { id: 'B', label: 'B', dx: -60, dy: -20 },
        { id: 'C', label: 'C', dx: -60, dy: 20 },
        { id: 'N', label: 'N', dx: -60, dy: 60 },
      ];
  }
}

export interface WorldPin {
  elementId: string;
  pinId: string;
  label: string;
  x: number;
  y: number;
  key: string; // `${elementId}:${pinId}`
}

export function rotatePoint(dx: number, dy: number, rotation: 0 | 90 | 180 | 270): { dx: number; dy: number } {
  switch (rotation) {
    case 0:
      return { dx, dy };
    case 90:
      return { dx: -dy, dy: dx };
    case 180:
      return { dx: -dx, dy: -dy };
    case 270:
      return { dx: dy, dy: -dx };
  }
}

export function getElementWorldPins(el: CircuitElement): WorldPin[] {
  const locals = getLocalPins(el);
  return locals.map((pin) => {
    const r = rotatePoint(pin.dx, pin.dy, el.rotation);
    const x = Math.round(el.x + r.dx);
    const y = Math.round(el.y + r.dy);
    return {
      elementId: el.id,
      pinId: pin.id,
      label: pin.label,
      x,
      y,
      key: `${el.id}:${pin.id}`,
    };
  });
}

export function snapToGrid(val: number): number {
  return Math.round(val / GRID_SIZE) * GRID_SIZE;
}

export function createDefaultElement(
  type: ComponentType,
  x: number,
  y: number,
  existingElements: CircuitElement[],
  idOverride?: string,
): CircuitElement {
  const meta = getComponentMeta(type);
  const existingNames = new Set(existingElements.map((e) => e.name));
  let idx = 1;
  while (existingNames.has(`${meta.prefix}${idx}`)) {
    idx++;
  }
  const name = type === 'GND' ? 'GND' : `${meta.prefix}${idx}`;
  const id = idOverride ?? `${type.toLowerCase()}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  const base: CircuitElement = {
    id,
    name,
    type,
    x: snapToGrid(x),
    y: snapToGrid(y),
    rotation: 0,
  };

  switch (type) {
    case 'GND':
      return base;
    case 'V_SRC':
      return {
        ...base,
        waveform: 'AC',
        dcValue: 12,
        acValue: 220,
        mixedDcValue: 12,
        harmonics: [
          { id: 'h1', freqHz: 50, amplitude: 220, phaseDeg: 0 },
          { id: 'h2', freqHz: 150, amplitude: 40, phaseDeg: -30 },
        ],
        amplitudeType: 'RMS',
        phaseDeg: 0,
        freqHz: 50,
        stepInit: 0,
        stepFinal: 12,
        stepTime: 0,
      };
    case 'I_SRC':
      return {
        ...base,
        waveform: 'DC',
        dcValue: 2,
        acValue: 5,
        mixedDcValue: 2,
        harmonics: [{ id: 'h1', freqHz: 50, amplitude: 3, phaseDeg: 0 }],
        amplitudeType: 'RMS',
        phaseDeg: 0,
        freqHz: 50,
        stepInit: 0,
        stepFinal: 2,
        stepTime: 0,
      };
    case 'RESISTOR':
      return { ...base, resistance: 100 };
    case 'CAPACITOR':
      return { ...base, capacitance: 100e-6, initialVoltage: 0 };
    case 'INDUCTOR':
      return { ...base, inductance: 0.1, initialCurrent: 0 };
    case 'IMPEDANCE':
      return { ...base, impedance: { re: 40, im: 30 } };
    case 'MUTUAL': {
      const inductors = existingElements.filter((e) => e.type === 'INDUCTOR');
      const couplables = existingElements.filter((e) => isMutualCouplableType(e.type));
      const picked = inductors.length >= 2 ? inductors : couplables;
      const first = picked[0];
      const second = picked[1];
      const hasImpedance = first?.type === 'IMPEDANCE' || second?.type === 'IMPEDANCE';
      return {
        ...base,
        l1Id: first?.id ?? '',
        l2Id: second?.id ?? '',
        mutualM: 0.05,
        mutualValueMode: hasImpedance ? 'Z_OHM' : 'M_HENRY',
        mutualZ: { re: 0, im: 10 },
        dotPolarity: 1,
        l1DotPin: 1,
        l2DotPin: 1,
      };
    }
    case 'VCVS':
      return { ...base, gain: 2, ctrlNodePos: '1', ctrlNodeNeg: '0' };
    case 'CCVS':
      return { ...base, gain: 10, ctrlElementId: '' };
    case 'VCCS':
      return { ...base, gain: 0.05, ctrlNodePos: '1', ctrlNodeNeg: '0' };
    case 'CCCS':
      return { ...base, gain: 2, ctrlElementId: '' };
    case 'ONE_PORT':
      return {
        ...base,
        onePortMode: 'THEVENIN',
        onePortMag: 10,
        onePortPhaseDeg: 0,
        onePortFreqHz: 50,
        onePortZ: { re: 50, im: 0 },
      };
    case 'TWO_PORT':
      return {
        ...base,
        twoPortType: 'Z',
        m11: { re: 20, im: 0 },
        m12: { re: 10, im: 0 },
        m21: { re: 10, im: 0 },
        m22: { re: 20, im: 0 },
      };
    case 'OPAMP':
      return { ...base, opampInvertPins: false };
    case 'THREE_PHASE_SRC':
      return {
        ...base,
        tpConnection: 'Y',
        tpVoltageMode: 'PHASE',
        tpVoltageRms: 220,
        tpFreqHz: 50,
        tpPhaseADeg: 0,
        tpSequence: 'ABC',
      };
    case 'THREE_PHASE_LINE':
      return {
        ...base,
        lineZ: { re: 1.5, im: 3.0 },
        lineZn: { re: 2.0, im: 1.0 },
        hasNeutral: true,
      };
    case 'THREE_PHASE_LOAD':
      return {
        ...base,
        loadConnection: 'Y',
        loadNeutralConnected: true,
        loadSymmetric: true,
        loadZa: { re: 40, im: 30 },
        loadZb: { re: 40, im: 30 },
        loadZc: { re: 40, im: 30 },
      };
  }
}

export function isMutualCouplableType(type: ComponentType): boolean {
  return type === 'INDUCTOR' || type === 'IMPEDANCE';
}

export function getMutualDotPins(
  mEl: Pick<CircuitElement, 'l1DotPin' | 'dotPolarity' | 'l2DotPin'>,
): { pin1: 1 | 2; pin2: 1 | 2; polaritySign: 1 | -1 } {
  const pin1: 1 | 2 = mEl.l1DotPin === 2 ? 2 : 1;
  const pin2: 1 | 2 =
    mEl.l2DotPin === 1 || mEl.l2DotPin === 2 ? mEl.l2DotPin : (mEl.dotPolarity ?? 1) === 1 ? 1 : 2;
  return {
    pin1,
    pin2,
    polaritySign: pin1 === pin2 ? 1 : -1,
  };
}

export function getMutualValueMode(
  mEl: Pick<CircuitElement, 'mutualValueMode' | 'l1Id' | 'l2Id' | 'mutualZ' | 'mutualM'>,
  elements?: CircuitElement[],
): 'M_HENRY' | 'Z_OHM' {
  if (mEl.mutualValueMode === 'Z_OHM' || mEl.mutualValueMode === 'M_HENRY') {
    return mEl.mutualValueMode;
  }
  if (elements) {
    const e1 = elements.find((e) => e.id === mEl.l1Id);
    const e2 = elements.find((e) => e.id === mEl.l2Id);
    if (e1?.type === 'IMPEDANCE' || e2?.type === 'IMPEDANCE') {
      return 'Z_OHM';
    }
  }
  if (mEl.mutualZ !== undefined && mEl.mutualM === undefined) {
    return 'Z_OHM';
  }
  return 'M_HENRY';
}

export function getMutualEffectiveImpedance(
  mEl: CircuitElement,
  elements: CircuitElement[],
  freqHz: number,
  isDc: boolean,
): { re: number; im: number } {
  const { polaritySign } = getMutualDotPins(mEl);
  const mode = getMutualValueMode(mEl, elements);
  if (mode === 'Z_OHM') {
    const rm = Number.isFinite(mEl.mutualZ?.re) ? mEl.mutualZ!.re : 0;
    const xm = Number.isFinite(mEl.mutualZ?.im) ? mEl.mutualZ!.im : 10;
    return {
      re: polaritySign * rm,
      im: isDc ? 0 : polaritySign * xm,
    };
  }
  const mVal = Number.isFinite(mEl.mutualM) ? mEl.mutualM! : 0;
  return {
    re: 0,
    im: isDc ? 0 : polaritySign * 2 * Math.PI * freqHz * mVal,
  };
}

export function getCoupledElementIds(elements: CircuitElement[]): Set<string> {
  const coupled = new Set<string>();
  const validIds = new Set(elements.filter((e) => isMutualCouplableType(e.type)).map((e) => e.id));
  for (const el of elements) {
    if (
      el.type === 'MUTUAL' &&
      el.l1Id &&
      el.l2Id &&
      el.l1Id !== el.l2Id &&
      validIds.has(el.l1Id) &&
      validIds.has(el.l2Id)
    ) {
      coupled.add(el.l1Id);
      coupled.add(el.l2Id);
    }
  }
  return coupled;
}

export function formatEngValue(value: number, unit: string): string {
  if (!Number.isFinite(value)) return `— ${unit}`;
  if (value === 0) return `0 ${unit}`;
  const abs = Math.abs(value);
  if (abs >= 1e6) return `${+(value / 1e6).toPrecision(4)} M${unit}`;
  if (abs >= 1e3) return `${+(value / 1e3).toPrecision(4)} k${unit}`;
  if (abs >= 1) return `${+value.toPrecision(4)} ${unit}`;
  if (abs >= 1e-3) return `${+(value * 1e3).toPrecision(4)} m${unit}`;
  if (abs >= 1e-6) return `${+(value * 1e6).toPrecision(4)} μ${unit}`;
  if (abs >= 1e-9) return `${+(value * 1e9).toPrecision(4)} n${unit}`;
  return `${value.toExponential(2)} ${unit}`;
}
