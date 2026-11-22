# CircuitLab — Electrical Circuit & Power System Simulator (`v1.6.0`)

**CircuitLab** is a **100% client-side** electrical circuit and three-phase power system simulator powered by a custom **Modified Nodal Analysis (MNA)** engine — running entirely on your device with no backend server, external APIs, or telemetry.

- 🌐 **Live Browser App:** https://minh27ten.github.io/CircuitLab/
- 📦 **Download Desktop `.exe` / Portable HTML (`v1.6.0`):** https://github.com/minh27ten/CircuitLab/releases/latest
- 📖 **Detailed User Manual:** See [USER_GUIDE.md](./USER_GUIDE.md).

---

## 🚀 For End Users (No Coding Required)

Download either standalone deliverable from **GitHub Releases** and run it immediately with **zero developer tools or runtimes to install**:

| Release File | Size | Platform | How to Run |
| :--- | :---: | :--- | :--- |
| **`CircuitLab-EN.exe`** | ~1.17 MB | Windows 10 / 11 (x64) | Double-click to launch as a native Windows desktop app (powered by Windows' built-in Edge WebView2, compiled with `+crt-static`, and supporting native Windows Save As dialogs). |
| **`CircuitLab-EN-Portable.html`** | ~487 KB | Windows / macOS / Linux | Single self-contained offline HTML file — double-click to open locally in any modern browser (Chrome, Edge, Firefox, Safari) over `file://`. |

*You can also run the hosted web app directly at https://minh27ten.github.io/CircuitLab/.*

---

## 🆕 What's New in `v1.6.0` & Release History

- **`v1.6.0` — Dedicated Diagonal Wiring, 3-Layer Overlap-Free Layout & Streamlined UI/UX:**
  - **First-Class Diagonal Wiring (`Diag Wire / D`):** Separated **`Ortho Wire (W)`** and **`Diag Wire (D)`** directly on the top floating canvas dock with a live cursor angle badge (`deg°`, highlighted on `45°` multiples), automatic diagonal routing when wiring off-90° rotated terminals from *Select* mode, and `tol = 0.75px` T-junction snapping across diagonal segments (`netlist.ts` & `SchematicCanvas.tsx`).
  - **3-Layer Overlap-Free Overlay Engine (`labelLayout.ts`):** Extended `computeOverlayLayout` so **Layer 1 (component designator/value text)** evaluates multi-candidate placements (*Left/Right/Above/Below*, split horizontal/vertical, diagonal quadrants) clear of rotated bodies, diagonal wires, junction dots, mutual polarity dots, and neighboring text before placing **Layer 2 (branch currents)** and **Layer 3 (node voltage badges)**.
  - **Minimalist & Intuitive UI/UX:** Compacted left palette categories so every family fits without footer clipping, added quick **Ortho / Diag Wire** triggers in the empty *Props* inspector, a direct **Run Simulation** CTA in empty *Results*, and a highlighted **Re-run** indicator whenever schematic edits invalidate prior results.
- **`v1.5.0` — 45° / Arbitrary Rotation Angles & Obstacle-Aware Label Layout:**
  - **45° & Arbitrary Element Rotation `[0, 360)`:** Added full rotation controls (`−45°`, custom degree input, `+45°`, and 8-angle quick presets `0° / 45° / 90° / 135° / 180° / 225° / 270° / 315°`) in *Props*, quick `+45°` / `90°` selection pill buttons, `Shift+R` (`+45°`) shortcut, rotated selection boxes, upright interior glyphs on controlled sources/`Z`/`Th`, plus **Straight/Diagonal wire routing** (hold `Shift` or toggle routing pill) with off-grid rotated pin snapping.
  - **Obstacle-Aware Schematic Overlays (`labelLayout.ts`):** Node voltage and branch current badges now score all node anchor points (pins, junctions, wire vertices/midpoints) to avoid element bodies, pins, **mutual polarity dots (`•`)**, element designators/values, wires, and other badges—adding a subtle dashed leader line whenever shifted clear of congested regions.
- **`v1.4.0` — Improved Hitboxes, JSON Save Dialog & Minimalist UI:**
  - **Expanded Component Hitboxes:** Added generous `68×36` transparent hit targets across the body and plate/coil gaps of **Capacitors (`C`)**, **Inductors (`L`)**, **Resistors (`R`)**, **Impedances (`Z`)**, **One-Port (`ONE_PORT`)**, and all `17 + GND` parts; added hover highlight outlines, snug component selection boxes, `r = 10` terminal pin targets, `14 px` wire hit strokes, and double-click wire completion.
  - **JSON Export Save File Dialog (`Export JSON` / `Ctrl + S`):** Opens a native OS Save As dialog to customize filename and destination folder (`showSaveFilePicker` in supported browsers and Win32 `GetSaveFileNameW` in the Windows `.exe`), with a clean in-app filename customization modal fallback on Firefox, Safari, or `file://`.
  - **Minimalist, Intuitive UI/UX:** Unified single top header with a **Sample Circuits dropdown**, 4-mode simulation switcher (`DC`, `DC Steady`, `AC`, `Transient`), interactive **Quick Guide & Shortcuts (`?`)** modal, and a floating canvas drawing dock with contextual `Δt`/`T_end` inputs.
- **`v1.3.0` — Mutually Coupled Complex Impedances ($Z_M$):** Couple `L–L`, `Z–Z`, or mixed `L–Z` pairs with direct $Z_M = R_M + jX_M$ or $M$ (H) entry, independent `Pin 1` / `Pin 2` polarity dot placement, and built-in Preset #6 (`Coupled Z`).
- **`v1.2.0` — 1-Port Maximum Power Transfer ($Z_{\text{opt}}$ / $P_{\max}$):** Solves optimal load impedance across 4 constraint modes (*Conjugate $Z^*$*, *Pure Resistive $R$*, *Fixed $X$*, *Fixed Angle $\varphi$*), plots $P(R_L)$ / $P(|Z_L|)$, verifies via full MNA, and applies $Z_{\text{opt}}$ to the schematic in 1 click (Preset #5 `1-Port P_max`).
- **`v1.1.0` — Complex Impedance (`IMPEDANCE` / `Z`):** Algebraic ($R + jX$) and polar ($|Z| \angle \varphi^\circ$) input with automatic $R$-$L$ / $R$-$C$ transient synthesis.
- **`v1.0.0` — Core MNA Workbench:** Four analysis modes (`DC`, `DC_SS`, multi-harmonic superposition `AC` + `MIXED` sources, Backward Euler `TRANSIENT`), `16 + GND` parts, 3-phase $Y/\Delta$ & neutral shift $U_{N'N}$, Thévenin/Norton & Two-Port `[Z], [Y], [A]` extraction, Rust/WebView2 desktop wrapper & Portable HTML.

---

## ✨ Key Features

- **Custom Modified Nodal Analysis (MNA) Solver:**
  - Complex arithmetic (`Complex`) linear solver using partial-pivoting Gaussian elimination with conductance stabilization (`G_min = 1e-12`).
  - Automatic reference node resolution (`GND` = Node `0`, with auto-grounding fallback) and diagnostic warnings for floating subcircuits, ideal voltage-source loops, or singular topologies.
  - Real-time **Power Balance Verification** ($P_{\text{generated}} = P_{\text{consumed}}$ and $Q_{\text{generated}} = Q_{\text{consumed}}$) with an automated *Verified* indicator.
- **Four Analysis Modes:**
  1. **DC Analysis (`DC`):** Linear DC operating-point nodal and branch solution.
  2. **DC Steady-State (`DC_SS`):** Models capacitors ($C$) as open circuits and inductors ($L$) as short circuits.
  3. **AC Steady-State (`AC`):** Groups independent sources by frequency, solves complex phasor MNA per frequency, and applies **multi-frequency superposition** for total RMS values, phasors, instantaneous expressions, and $P, Q, S$.
  4. **Transient Analysis (`TRANSIENT`):** Implicit **Backward Euler** time-stepping ($\Delta t, T_{\text{end}}$) supporting initial conditions $u_C(0), i_L(0)$, DC / AC / Step excitations, mutual coupling $M / Z_M$, and interactive multi-channel SVG waveform plotting.
- **Equivalent Network Extractor:**
  - **Thévenin / Norton & Max Power Transfer ($Z_{opt}$):** Select any terminal pair $(a, b)$ or an existing passive load branch to extract $V_{th}, Z_{th}, I_N, Y_N$ (dependent sources supported), solve optimal load $Z_{opt}$ for $P_{max}$ across 4 constraint modes (*Conjugate $Z^*$*, *Pure Resistive $R$*, *Fixed Reactance $X$*, *Fixed Angle $\varphi$*), plot $P(R_L)$ / $P(|Z_L|)$, and apply directly to the schematic.
  - **Two-Port Network:** Extract complex $[Z]$, $[Y]$, and transmission $[A]$ parameter matrices between any two port pairs.
- **Three-Phase Power Systems & Interactive Schematic Capture:**
  - Three-phase $Y/\Delta$ sources, 4-wire transmission lines with neutral impedance $Z_N$, balanced/unbalanced $Y/\Delta$ loads, and **neutral point shift voltage ($U_{N'N}$)**.
  - Snap-to-grid `20 px` orthogonal wiring (`Space` to toggle elbow), generous component hitboxes (`R`, `C`, `L`, `Z`, `GND`, etc.), minimalist floating canvas dock & Quick Guide (`?`), live canvas overlays, 6 built-in circuit presets (*RLC & Mutual M*, *Op-Amp & VCVS*, *3-Phase System*, *Mixed Source*, *1-Port P_max*, *Coupled Z*), and `.json` circuit import/export with Save File dialog.

---

## 🧩 Supported Components (`17 + GND`)

In addition to **Ground (`GND`)**, CircuitLab includes 17 standard electrical engineering elements:

| Category | Type / Designator | Elements |
| :--- | :--- | :--- |
| **Independent Sources** | `V_SRC` (`E`), `I_SRC` (`J`) | Independent Voltage Source, Independent Current Source (DC / AC / Mixed multi-harmonic / Step) |
| **Passive Elements** | `RESISTOR` (`R`), `CAPACITOR` (`C`), `INDUCTOR` (`L`), `IMPEDANCE` (`Z`), `MUTUAL` (`M`/`Z_M`) | Resistor, Capacitor, Inductor, Complex Impedance $Z = R + jX$, Mutual Coupling ($L/Z$) |
| **Dependent Sources** | `VCVS`, `CCVS`, `VCCS`, `CCCS` | All four linear controlled sources ($\mu, r, g, \beta$) |
| **Active Analog** | `OPAMP` (`OA`) | Ideal Operational Amplifier ($V_+ = V_-$, $I_{\text{in}} = 0$) |
| **Equivalent Networks** | `ONE_PORT` (`P1`), `TWO_PORT` (`P2`) | One-Port Network (Thévenin/Norton), Two-Port Network ($[Z], [Y], [A]$) |
| **Three-Phase Power** | `THREE_PHASE_SRC` (`G3`), `THREE_PHASE_LINE` (`DZ`), `THREE_PHASE_LOAD` (`T3`) | Three-Phase Source, 4-Wire Transmission Line, Three-Phase Load ($Y/\Delta$) |

---

## 🛠️ Developer Setup (Build from Source)

### Prerequisites
- **Web App & Tests:** [Node.js](https://nodejs.org/) v20+ (**v22 LTS** recommended, matching CI).
- **Desktop `.exe` Wrapper (optional):** [Rust Toolchain](https://rustup.rs/) (`cargo`, Windows MSVC target) and Windows 10/11 built-in WebView2 runtime.

### Clone & Run

```bash
git clone https://github.com/minh27ten/CircuitLab.git
cd CircuitLab
npm install
npm run dev
```

Open `http://localhost:3000/` in your browser.

### Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Start Vite development server on port `3000` |
| `npm run lint` | Run TypeScript static type checking (`tsc --noEmit`) |
| `npm test` | Run all 47 solver, overlay layout & stress unit tests (`mna.test.ts`, `solver.test.ts`, `stress.test.ts`) |
| `npm run build` | Build production static bundle into `dist/` |
| `npm run preview` | Preview the production bundle locally via Vite Preview |
| `npm run build:portable` | Bundle a single self-contained offline HTML file (`dist-portable/index.html`) |
| `npm run build:desktop` | Build `dist-portable/index.html` and compile the native Rust/WebView2 desktop binary in `desktop/` |
| `npm run clean` | Remove build artifacts (`dist/` and `dist-portable/`) |

---

## 📁 Repository Structure

```text
├── .github/workflows/deploy.yml   # CI/CD: lint + test + build + GitHub Pages deploy (Node 22)
├── .gitignore                     # Ignores node_modules, dist, dist-portable, desktop/target, *.exe
├── desktop/                       # Native Windows desktop wrapper (Rust + tao + wry WebView2)
│   ├── .cargo/config.toml         # Enables +crt-static for Windows MSVC builds
│   ├── Cargo.toml
│   ├── Cargo.lock
│   └── src/main.rs                # Serves embedded dist-portable/index.html & Win32 Save As dialog (GetSaveFileNameW)
├── src/
│   ├── engine/                    # Core MNA solver & netlist compiler
│   │   ├── complex.ts             # Complex number arithmetic
│   │   ├── pins.ts                # Rotation-aware terminal pin geometry (supports 45° & arbitrary angles)
│   │   ├── labelLayout.ts         # Obstacle-aware node/branch overlay layout avoiding bodies & dots
│   │   ├── netlist.ts             # Wire union-find & topology validation
│   │   ├── mna.ts                 # DC, DC_SS, multi-freq AC, Transient, Thévenin & Two-Port solvers
│   │   ├── mna.test.ts            # Core solver unit tests
│   │   └── __tests__/             # solver.test.ts & stress.test.ts
│   ├── components/                # React UI (Canvas, Palette, Inspector, TransientPlot, etc.)
│   ├── data/presets.ts            # 6 built-in reference circuits
│   ├── types/circuit.ts           # Circuit & simulation result TypeScript interfaces
│   ├── App.tsx                    # Top-level workbench state & keyboard shortcuts
│   └── main.tsx
├── USER_GUIDE.md                  # End-user operating manual
├── LICENSE                        # MIT License
├── package.json
├── tsconfig.json
├── vite.config.ts
└── vite.portable.config.ts        # vite-plugin-singlefile configuration
```

---

## 🌐 GitHub Pages Deployment

The included workflow [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml) runs `npm ci` → `npm run lint && npm test` → `npm run build` on Node.js 22 and deploys `./dist` to GitHub Pages whenever changes are pushed to `main` (enable **Settings → Pages → Source: GitHub Actions**).

## 📄 License

Released under the [MIT License](./LICENSE).
