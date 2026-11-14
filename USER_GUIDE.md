# User Guide — CircuitLab

Complete user manual covering schematic capture, component configuration, the four simulation modes, and equivalent network extraction in **CircuitLab**.

---

## Table of Contents

1. [Workspace Overview](#1-workspace-overview)
2. [Schematic Capture & Orthogonal Wiring](#2-schematic-capture--orthogonal-wiring)
3. [Keyboard Shortcuts](#3-keyboard-shortcuts)
4. [Component Reference (`16+GND`)](#4-component-reference-16gnd)
5. [Running the 4 Simulation Modes & Reading Results](#5-running-the-4-simulation-modes--reading-results)
6. [Thévenin / Norton & Two-Port Parameter Extractor](#6-thévenin--norton--two-port-parameter-extractor)
7. [Three-Phase Power System Analysis (Y / Δ & Neutral Shift)](#7-three-phase-power-system-analysis-y--δ--neutral-shift)
8. [Saving & Loading Circuits via JSON](#8-saving--loading-circuits-via-json)
9. [Troubleshooting Common Diagnostics](#9-troubleshooting-common-diagnostics)

---

## 1. Workspace Overview

**CircuitLab** organizes your engineering workbench into four regions:

- **Top Toolbar & Simulation Bar:** Quickly load built-in presets (*RLC & Mutual M*, *Op-Amp & VCVS*, *3-Phase System*, or *Empty Circuit*), switch analysis mode (*DC*, *DC Steady-State*, *AC Phasor*, *Transient*), set `Δt` / `T_end`, trigger edit actions (*Select*, *Wire*, *Rotate*, *Delete*, *Undo/Redo*, *Export/Import JSON*), and press **Run Simulation**.
- **Component Palette (Left Panel):** Houses all `16+GND` electrical components with real-time search by name, designator, or keyword (`resistor`, `op-amp`, `3-phase`, `two-port`, ...). Toggle panel visibility from the left toolbar button when working on large schematics.
- **Schematic Canvas (Center):** Snap-to-grid `20 px` interactive editor featuring live node voltage (`N...`) and branch current (`I=...`) **Overlays**, smooth cursor-centered zoom (`+`, `−`, *Fit schematic to view*), and floating quick actions above selected elements.
- **Inspector & Results Panel (Right Panel):** Organized into four tabs:
  - **Props:** Edit all electrical parameters of the selected component or wire segment.
  - **Results:** Inspect the *Power Balance* summary (`P`, `Q`, *Verified* badge), *Node Voltages* table, and *Branch Currents & Power* table.
  - **Plot:** Multi-channel interactive SVG oscilloscope for transient waveforms `v(t)` and `i(t)`.
  - **Equiv:** Extract *Thévenin / Norton* equivalents and *Two-Port `[Z]`, `[Y]`, `[A]`* matrices.

---

## 2. Schematic Capture & Orthogonal Wiring

### Placing & Arranging Components
- **Drag and drop** any component card from the palette onto the canvas, or **click once** in the palette to enter placement mode and click anywhere on the schematic grid.
- Drag existing elements on the grid to reposition them; pins snap cleanly to `20 px` grid coordinates.
- Select a component and press **`R`** (or click **Rotate 90°** in the floating pill or top toolbar) to rotate clockwise (`0° → 90° → 180° → 270°`).

### Drawing Orthogonal Wires
1. Press **`W`** or click **Wire** on the toolbar (alternatively, **click directly on any component terminal pin** while in *Select* mode to start a wire immediately).
2. Move toward the next bend or target pin; the preview automatically routes orthogonally at `90°`.
3. Press **`Space`** while drafting a wire to flip the elbow orientation (horizontal-first vs. vertical-first).
4. Click the target terminal pin or **double-click** on the canvas to commit the wire. Press **`Esc`** to cancel an active wire draft.

> **Crossing vs. T-Junction Rules:**
> - **Perpendicular crossing wires do NOT short-circuit** — they remain electrically isolated crossovers.
> - **T-junctions** (a wire endpoint landing anywhere on an existing wire segment, or overlapping terminal pins) automatically create a solid **junction dot** and merge into one electrical node.

---

## 3. Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `V` | Switch to **Select / Move** tool |
| `W` | Switch to **Wire** routing tool |
| `R` | Rotate selected component **90° clockwise** |
| `Space` | Flip orthogonal bend orientation while drafting a wire |
| `F` | Fit and center the entire schematic inside the viewport |
| `Delete` / `Backspace` | Delete selected component or wire segment |
| `Esc` | Cancel wire draft, exit placement mode, or clear selection |
| `Ctrl + Z` | Undo last edit (40-step history) |
| `Ctrl + Y` / `Ctrl + Shift + Z` | Redo undone edit |
| `Ctrl + Enter` | Execute **Run Simulation** immediately |
| Mouse wheel / Drag empty canvas | Cursor-centered zoom in/out and canvas panning |

---

## 4. Component Reference (`16+GND`)

### Sources & Reference
- **Ground (`GND`):** `0 V` reference (`Node 0`). If omitted, the solver assigns a temporary reference node automatically and reports it in the diagnostic banner.
- **Voltage Source (`V_SRC`) & Current Source (`I_SRC`):**
  - **DC:** Constant DC value.
  - **AC Sine:** Magnitude entered as **RMS** or **Peak** ($V_m = \sqrt{2} V_{\text{rms}}$), frequency (Hz), and initial phase angle (degrees). Time-domain convention: $v(t) = V_m \cos(2\pi f t + \varphi)$.
  - **Step:** Ideal step transition from *Initial* to *Final* value at `Step Time`.
  - *Current source polarity:* Positive reference arrow flows internally from `−` (`n`) to `+` (`p`).

### Passive Elements & Mutual Coupling
- **Resistor (`RESISTOR`):** Resistance `R` ($\Omega$, minimum $10^{-6}\ \Omega$).
- **Capacitor (`CAPACITOR`):** Capacitance `C` (F) and initial voltage `v_C(0)` (V) across pin 1 (`+`) to pin 2 (`−`).
- **Inductor (`INDUCTOR`):** Inductance `L` (H) and initial current `i_L(0)` (A) flowing from pin 1 into pin 2.
- **Mutual Coupling (`MUTUAL`):** Magnetic coupling `M` (H) between two inductors `L1` and `L2` on the schematic, with selectable dot polarity (`In-phase 1–1` or `Out-of-phase 1–2`). Supported in both **AC Phasor** and **Transient** modes.

### Controlled Sources & Ideal Op-Amp
- **VCVS (`μV`):** Voltage-Controlled Voltage Source — $V_{\text{out}} = \mu (V_{c+} - V_{c-})$. Pick `Control Node (+)` and `Control Node (−)` from resolved netlist node IDs.
- **VCCS (`gV`):** Voltage-Controlled Current Source — $I_{\text{out}} = g (V_{c+} - V_{c-})$.
- **CCVS (`rI`):** Current-Controlled Voltage Source — $V_{\text{out}} = r \cdot I_{\text{sense}}$. Choose the sensed element (positive reference current enters pin 1 and exits pin 2).
- **CCCS (`βI`):** Current-Controlled Current Source — $I_{\text{out}} = \beta \cdot I_{\text{sense}}$.
- **Ideal Op-Amp (`OPAMP`):** Enforces virtual short $V_+ = V_-$ with zero input bias current ($I_+ = I_- = 0$). Toggle **Swap input pins** to orient inverting or non-inverting stages cleanly.

### One-Port & Two-Port Network Blocks
- **1-Port Equivalent (`ONE_PORT`):** Behavioral **Thévenin** ($V_{\text{th}}, Z_{\text{th}} = R + jX$) or **Norton** ($I_N, Y_{\text{th}} = G + jB$) network at a specified operating frequency.
- **2-Port Network (`TWO_PORT`):** Generalized linear 4-terminal block (`1, 1', 2, 2'`) parameterized by complex `2×2` matrices:
  - **`[Z]` ($\Omega$):** Open-circuit impedance (`Z11, Z12, Z21, Z22`).
  - **`[Y]` (S):** Short-circuit admittance (`Y11, Y12, Y21, Y22`).
  - **`[A]` (ABCD):** Transmission parameters (`A, B, C, D`).

### Three-Phase Power Elements
- **3-Phase Source (`THREE_PHASE_SRC`):** Terminals `A, B, C` and neutral `N`. Supports **Wye (`Y`)** or **Delta (`Δ`)** connection, RMS phase or line-to-line voltage entry, frequency, and positive (`ABC`) or negative (`ACB`) phase sequence.
- **3-Phase Line (`THREE_PHASE_LINE`):** Per-phase complex series impedance $Z_{\text{line}} = R + jX$ with optional neutral conductor impedance $Z_n$.
- **3-Phase Load (`THREE_PHASE_LOAD`):** **Wye (`Y`)** (grounded or floating neutral) or **Delta (`Δ`)**, with **Balanced** toggle or independent complex impedances `ZA, ZB, ZC`.

---

## 5. Running the 4 Simulation Modes & Reading Results

1. **DC:** Pure DC operating point ($f = 0\ \text{Hz}$).
2. **DC Steady-State:** Long-term DC equilibrium (capacitors treated as open circuits, ideal inductors as short circuits).
3. **AC Phasor:** Complex frequency-domain solver (`RMS ∠ °`). When sources operate at multiple distinct frequencies (for example `DC + 50 Hz + 150 Hz`), the engine automatically applies harmonic superposition and reports total RMS values plus closed-form cosine expressions.
4. **Transient:** Time-domain integration via **Backward Euler** with configurable `Δt` and `T_end`.

### Interpreting Power & Sign Conventions
- **Power Balance Verification:** A green **Verified** pill indicates total delivered active power matches total absorbed active power within numerical tolerance ($|\sum P_{\text{gen}} - \sum P_{\text{abs}}| < 0.05\ \text{W}$).
- **Passive Sign Convention:** Branch current `I` enters **pin 1 (`+`)** and leaves **pin 2 (`−`)**. Consequently, **`P > 0` means absorbed power**, whereas **`P < 0` means delivered power** (source/generator).
- **Transient Plot Tab:** Filter waveforms by **All**, **Voltage (v)**, or **Current (i)**, toggle individual traces, and hover over the plot canvas to inspect exact instantaneous samples in milliseconds.

---

## 6. Thévenin / Norton & Two-Port Parameter Extractor

Open the **Equiv** tab in the right inspector:
1. Select **Thévenin / Norton** or **Two-Port [Z, Y, A]**.
2. Set the **Extraction Frequency** (`0 Hz` for DC, or any positive frequency in Hz for AC phasor extraction).
3. Choose the extraction terminal node IDs displayed on the schematic (`(a, b)` for 1-Port, or `(1, 1')` and `(2, 2')` for 2-Port).
4. Click **Extract Equivalent Parameters** — CircuitLab solves open-circuit voltages with active independent sources and injects unit test excitations with independent sources zeroed to output complex `V_th, Z_th, I_N, Y_th` or complete `[Z]`, `[Y]`, `[A]` matrices.

---

## 7. Three-Phase Power System Analysis (Y / Δ & Neutral Shift)

- Load the **3-Phase System** preset to explore an **unbalanced Y-connected load without a neutral return**.
- When the neutral conductor is opened in the line or load neutral connection is unchecked, CircuitLab resolves the floating neutral node potential $V_{N'}$ directly and prints **`Neutral Shift=... V`** alongside individual phase current phasors `IA, IB, IC, IN`.
- In **Transient** mode, complex three-phase impedances $R + jX$ are automatically synthesized into physical time-domain `R-L` ($X > 0$) or `R-C` ($X < 0$) branches at the source reference frequency, noted in the canvas diagnostic banner.

---

## 8. Saving & Loading Circuits via JSON

- Click **Export JSON** in the top toolbar to download a portable `circuit-<timestamp>.json` snapshot containing all components, parameters, and wires (plus optional transient `dt` and `tEnd` settings).
- Click **Import JSON** to restore a saved file. The importer validates component types, simulation mode, coordinates, and wire connectivity before loading so malformed files cannot corrupt your active workspace.

---

## 9. Troubleshooting Common Diagnostics

| Diagnostic | Cause & Resolution |
| :--- | :--- |
| **No Ground (GND) symbol found** | Every circuit needs a `0 V` reference node. Although auto-ground selects a fallback node automatically, placing an explicit `GND` component clarifies your reference point. |
| **Singular MNA matrix / short loop** | Parallel ideal voltage sources, zero-impedance inductor loops, or disconnected floating islands create singular equations. Insert a small series resistance or verify all nodes return to reference. |
| **Mutual coupling `|M| > √(L1·L2)` (`k > 1`)** | Physically unrealizable magnetic coupling factor (`k > 1`) can destabilize time-domain integration. Reduce `M` or increase `L1`/`L2` so $M \le \sqrt{L_1 L_2}$. |
| **Simulation steps exceeded `4000` limit** | When `tEnd / dt > 4000`, `Δt` is automatically scaled up to keep UI responsiveness smooth. Increase `Δt` or shorten `T_end` manually if needed. |
