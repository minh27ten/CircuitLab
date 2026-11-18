# CircuitLab — Electrical Circuit & Power System Simulator

**CircuitLab** is a **100% client-side** electrical circuit and three-phase power system simulator powered by a custom **Modified Nodal Analysis (MNA)** engine — running entirely on your device with no backend server, external APIs, or telemetry.

> 📖 **Detailed User Manual:** See [USER_GUIDE.md](./USER_GUIDE.md).

---

## 🚀 For End Users (No Coding Required)

Download either standalone deliverable from **GitHub Releases** and run it immediately with **zero developer tools or runtimes to install**:

| Release File | Size | Platform | How to Run |
| :--- | :---: | :--- | :--- |
| **`CircuitLab-EN.exe`** | ~1.10 MB | Windows 10 / 11 (x64) | Double-click to launch as a native Windows desktop app (powered by Windows' built-in Edge WebView2 and compiled with `+crt-static`, requiring no external DLLs). |
| **`CircuitLab-EN-Portable.html`** | ~413 KB | Windows / macOS / Linux | Single self-contained offline HTML file — double-click to open locally in any modern browser (Chrome, Edge, Firefox, Safari) over `file://`. |

*You can also host it statically on GitHub Pages at https://minh27ten.github.io/CircuitLab/.*

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
  - Snap-to-grid `20 px` orthogonal wiring (`Space` to toggle elbow), live canvas overlays, 6 built-in circuit presets (*RLC & Mutual M*, *Op-Amp & VCVS*, *3-Phase System*, *Mixed Source*, *1-Port P_max*, *Coupled Z*), and `.json` circuit import/export.

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
| `npm test` | Run all 43 solver & stress unit tests (`mna.test.ts`, `solver.test.ts`, `stress.test.ts`) |
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
│   └── src/main.rs                # Serves embedded dist-portable/index.html via custom protocol
├── src/
│   ├── engine/                    # Core MNA solver & netlist compiler
│   │   ├── complex.ts             # Complex number arithmetic
│   │   ├── pins.ts                # Rotation-aware terminal pin geometry
│   │   ├── netlist.ts             # Orthogonal wire union-find & topology validation
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
