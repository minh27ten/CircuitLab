# User Guide — CircuitLab

Complete user manual covering schematic capture, component configuration, the four simulation modes, and equivalent network extraction in **CircuitLab**.

---

## Table of Contents

1. [Workspace Overview](#1-workspace-overview)
2. [Schematic Capture & Orthogonal Wiring](#2-schematic-capture--orthogonal-wiring)
3. [Keyboard Shortcuts](#3-keyboard-shortcuts)
4. [Component Reference (`17+GND`)](#4-component-reference-17gnd)
5. [Running the 4 Simulation Modes & Reading Results](#5-running-the-4-simulation-modes--reading-results)
6. [Thévenin / Norton, Max Power Transfer (Z_opt) & Two-Port Extractor](#6-thévenin--norton-max-power-transfer-z_opt--two-port-extractor)
7. [Three-Phase Power System Analysis (Y / Δ & Neutral Shift)](#7-three-phase-power-system-analysis-y--δ--neutral-shift)
8. [Saving & Loading Circuits via JSON](#8-saving--loading-circuits-via-json)
9. [Troubleshooting Common Diagnostics](#9-troubleshooting-common-diagnostics)

---

## 1. Workspace Overview

**CircuitLab** organizes your engineering workbench into four regions:

- **Unified Top Header:** Component library toggle, compact preset dropdown (*RLC & Mutual M*, *Op-Amp & VCVS*, *3-Phase System*, *Mixed Source*, *1-Port P_max*, *Coupled Z*, or *New Empty Circuit*), 4-mode simulation switcher (*DC*, *DC Steady*, *AC*, *Transient*), *Import / Export JSON*, Quick Guide **`?`**, and the **Run** button.
- **Component Palette (Left Panel):** Houses all `17+GND` electrical components with real-time search by name, designator, or keyword (`R`, `Z`, `op-amp`, `3-phase`, `two-port`, ...).
- **Schematic Canvas (Center):** Snap-to-grid `20 px` interactive editor with a floating canvas action dock (*Select*, *Wire*, *Rotate*, *Delete*, *Undo/Redo*, plus `Δt` / `T_end` in *Transient* mode), live node voltage (`N...`) and branch current (`I=...`) **Overlays**, smooth cursor-centered zoom (`+`, `−`, *Fit schematic to view*), and floating quick actions above selected elements.
- **Inspector & Results Panel (Right Panel):** Organized into four tabs:
  - **Props:** Edit all electrical parameters of the selected component or wire segment.
  - **Results:** Inspect the *Multi-Frequency Superposition* banner (when multiple frequencies or harmonics are present), *Power Balance* summary (`P`, `Q`, *Verified* badge), *Node Voltages* table, and *Branch Currents & Power* table; click any node or element row to inspect its **Harmonic Spectrum & Time-Domain** card.
  - **Plot:** Multi-channel interactive SVG oscilloscope for transient waveforms `v(t)` and `i(t)`.
  - **Equiv:** Extract *Thévenin / Norton* equivalents, solve *1-Port Max Power Transfer (`Z_opt`)*, and compute *Two-Port `[Z]`, `[Y]`, `[A]`* matrices.

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
| `Ctrl + S` | Open Save File dialog to export schematic as JSON |
| `Ctrl + Enter` | Execute **Run Simulation** immediately |
| Mouse wheel / Drag empty canvas | Cursor-centered zoom in/out and canvas panning |

---

## 4. Component Reference (`17+GND`)

### Sources & Reference
- **Ground (`GND`):** `0 V` reference (`Node 0`). If omitted, the solver assigns a temporary reference node automatically and reports it in the diagnostic banner.
- **Voltage Source (`V_SRC`) & Current Source (`I_SRC`):**
  - **DC:** Constant DC value.
  - **AC Sine:** Magnitude entered as **RMS** or **Peak** ($V_m = \sqrt{2} V_{\text{rms}}$), frequency (Hz), and initial phase angle (degrees). Time-domain convention: $v(t) = V_m \cos(2\pi f t + \varphi)$.
  - **Mixed (`MIXED`):** Combines a **DC Offset** and a dynamic **Harmonics / Frequencies** table (Frequency `Hz`, Amplitude in **RMS** or **Peak**, and Phase `°`) on a **single source**, with a live preview of total True RMS and composite time-domain waveform $v(t)$ / $i(t)$.
  - **Step:** Ideal step transition from *Initial* to *Final* value at `Step Time`.
  - *JSON Import/Export:* `.json` circuit files preserve and validate `MIXED` source parameters (`mixedDcValue` and `harmonics`).
  - *Current source polarity:* Positive reference arrow flows internally from `−` (`n`) to `+` (`p`).

### Passive Elements & Mutual Coupling
- **Resistor (`RESISTOR`):** Resistance `R` ($\Omega$, minimum $10^{-6}\ \Omega$).
- **Capacitor (`CAPACITOR`):** Capacitance `C` (F) and initial voltage `v_C(0)` (V) across pin 1 (`+`) to pin 2 (`−`).
- **Inductor (`INDUCTOR`):** Inductance `L` (H) and initial current `i_L(0)` (A) flowing from pin 1 into pin 2.
- **Complex Impedance (`IMPEDANCE` / `Z`):** Generalized branch impedance $Z = R + jX$ ($\Omega$) combining R, L, and C into a single branch block. Supports both rectangular (`R + jX`) and polar (`|Z| ∠ φ°`) input, displays equivalent admittance $Y = 1/Z$ and branch nature (inductive $X > 0$, capacitive $X < 0$, or resistive $X = 0$), and automatically synthesizes equivalent time-domain `R-L` or `R-C` branches in **Transient** mode at the circuit reference frequency.
- **Mutual Coupling (`MUTUAL`):** Magnetic coupling between any pair of **inductors (`L`)** or **complex impedances (`Z`)** (including mixed `L–Z` pairs). Supports entering either **Mutual Inductance `M` (H)** or **Mutual Impedance $Z_M = R_M + jX_M$ ($\Omega$)**, and choosing the polarity dot (`•`) independently on `Pin 1` or `Pin 2` of each coupled branch. Fully supported in **AC Phasor**, **DC** (with $R_M$), and **Transient** modes (automatically converted using $f_{\text{ref}}$).

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
- **Mixed-Source Analysis (Multi-Frequency Superposition):** When a circuit contains multiple source frequencies or a **Mixed** source, **AC Phasor** mode solves MNA independently at each harmonic frequency ($0\ \text{Hz}$ and each $f_k > 0$), shows the **Multi-Frequency Superposition** banner, computes total True RMS magnitudes and total real power, and lets you click any row in *Node Voltages* or *Branch Currents & Power* to inspect the **Harmonic Spectrum & Time-Domain** card. **DC** mode evaluates the $0\ \text{Hz}$ component only.
- **Transient Plot Tab:** Filter waveforms by **All**, **Voltage (v)**, or **Current (i)**, toggle individual traces (including node voltages `v(Node ...)`, source voltages `v(E...)`, and branch currents `i(...)`), and hover over the plot canvas to inspect exact instantaneous samples in milliseconds.

---

## 6. Thévenin / Norton, Max Power Transfer (Z_opt) & Two-Port Extractor

Open the **Equiv** tab in the right inspector:
1. Select **Thévenin / Norton**, **Max Power Z**, or **Two-Port [Z, Y, A]**.
2. Set the **Extraction Frequency** (`0 Hz` for DC, or any positive frequency in Hz for AC phasor extraction), or click one of the **Active frequencies** quick-select pills shown below the input.
3. Choose the extraction terminal node IDs displayed on the schematic (`(a, b)` for 1-Port, or `(1, 1')` and `(2, 2')` for 2-Port).
4. Click **Extract Equivalent Parameters** — CircuitLab solves open-circuit voltages with active independent sources and injects unit test excitations with independent sources zeroed to output complex `V_th, Z_th, I_N, Y_th` or complete `[Z]`, `[Y]`, `[A]` matrices.

### 1-Port Maximum Power Transfer Solver (`Max Power Z`)
- **Two ways to specify the load port:**
  - *Existing passive branch:* Pick an already-wired two-terminal passive component (`Z`, `R`, `L`, `C`) as the target load branch. CircuitLab excludes that branch when computing $V_{\text{th}}, Z_{\text{th}}$ without renumbering schematic node IDs.
  - *Open 1-port terminals `(a, b)`:* Select open terminal nodes directly (try the **1-Port P_max** built-in preset to experiment right away).
- **Four textbook load constraint modes:**
  1. **Free $Z = R + jX$ (Conjugate $Z = Z_{\text{th}}^*$):** $Z_{\text{opt}} = R_{\text{th}} - jX_{\text{th}}$, $P_{\max} = \frac{|V_{\text{th}}|^2}{4R_{\text{th}}}$.
  2. **Pure Resistive $Z = R$ ($X = 0$):** $R_{\text{opt}} = |Z_{\text{th}}| = \sqrt{R_{\text{th}}^2 + X_{\text{th}}^2}$.
  3. **Fixed Reactance $X$, Vary $R$:** Enter the constrained load reactance $X$ and solve $R_{\text{opt}} = \sqrt{R_{\text{th}}^2 + (X_{\text{th}} + X)^2}$.
  4. **Fixed Phase Angle $\varphi$ ($\cos\varphi$), Vary $|Z|$:** Enter load angle $\varphi$ (degrees) and solve $|Z_{\text{opt}}| = |Z_{\text{th}}|$ with $Z_{\text{opt}} = |Z_{\text{th}}|\angle\varphi$.
- **Full-Circuit MNA Verification, Curve Plot & 1-Click Apply:** Click **Solve Optimal Z & Verify via MNA** to view theoretical $Z_{\text{opt}}, P_{\max}$ alongside direct full-circuit MNA verification ($P_{\text{MNA}}$), reactive/apparent power $Q, S$, load phasors $I_L, V_L$, power factor $\cos\varphi$, Thévenin efficiency $\eta$, an interactive $P(R_L)$ / $P(|Z_L|)$ curve, and a 1-click button to apply/attach $Z_{\text{opt}}$ directly onto the schematic and run the simulation.

---

## 7. Three-Phase Power System Analysis (Y / Δ & Neutral Shift)

- Load the **3-Phase System** preset to explore an **unbalanced Y-connected load without a neutral return**.
- When the neutral conductor is opened in the line or load neutral connection is unchecked, CircuitLab resolves the floating neutral node potential $V_{N'}$ directly and prints **`Neutral Shift=... V`** alongside individual phase current phasors `IA, IB, IC, IN`.
- In **Transient** mode, complex three-phase impedances $R + jX$ are automatically synthesized into physical time-domain `R-L` ($X > 0$) or `R-C` ($X < 0$) branches at the source reference frequency, noted in the canvas diagnostic banner.

---

## 8. Saving & Loading Circuits via JSON

- Click **Export JSON** (or press `Ctrl + S`) to open the Save As dialog — letting you customize the file name and choose the destination folder on your computer (via Chrome/Edge File System Access API or the native Windows `.exe`; browsers without folder picking open a filename customization modal before downloading).
- Click **Import** to restore a saved file. The importer validates component types, simulation mode, coordinates, and wire connectivity before loading so malformed files cannot corrupt your active workspace.

---

## 9. Troubleshooting Common Diagnostics

| Diagnostic | Cause & Resolution |
| :--- | :--- |
| **No Ground (GND) symbol found** | Every circuit needs a `0 V` reference node. Although auto-ground selects a fallback node automatically, placing an explicit `GND` component clarifies your reference point. |
| **Singular MNA matrix / short loop** | Parallel ideal voltage sources, zero-impedance inductor loops, or disconnected floating islands create singular equations. Insert a small series resistance or verify all nodes return to reference. |
| **Mutual coupling `|M| > √(L1·L2)` (`k > 1`)** | Physically unrealizable magnetic coupling factor (`k > 1`) can destabilize time-domain integration. Reduce `M` or increase `L1`/`L2` so $M \le \sqrt{L_1 L_2}$. |
| **Simulation steps exceeded `4000` limit** | When `tEnd / dt > 4000`, `Δt` is automatically scaled up to keep UI responsiveness smooth. Increase `Δt` or shorten `T_end` manually if needed. |
