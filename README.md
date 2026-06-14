<div align="center">

# WareMindAI

**Intelligent Warehouse Operations Platform**

A full-stack, dual-portal warehouse intelligence dashboard built with React 19, TypeScript, and Tailwind CSS v4. Simulates real-time warehouse telemetry, AI-driven optimization recommendations, bottleneck detection, demand forecasting, and workforce analytics — all running entirely in the browser with zero backend.

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?style=flat-square&logo=vite)](https://vite.dev)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.0-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)
[![Zustand](https://img.shields.io/badge/Zustand-5.0-FF6B35?style=flat-square)](https://zustand-demo.pmnd.rs)

</div>

---

## Overview

WareMindAI is a premium warehouse operations intelligence platform with two distinct portals:

- **Company HQ Portal** — Executive-level visibility across a multi-node warehouse network. Monitor KPIs, track incidents, run forecasts, and push optimization actions across all facilities.
- **Warehouse Manager Portal** — Ground-level operational control for a single warehouse node. Real-time stage pipeline telemetry, bottleneck detection, space optimization, workforce management, and an AI Copilot assistant.

All data is simulated in-browser using five deterministic TypeScript engines, making the platform fully self-contained — no API keys, no backend, no database required.

---

## Screenshots

> **Light & Dark mode** — fully supported with a single toggle.

| Company HQ Portal | Warehouse Operations |
|---|---|
| Executive Dashboard with KPI tiles and risk scoring | Real-time stage pipeline with throughput velocity chart |
| Warehouse Network node directory | Bottleneck Intelligence with resolution workflows |
| Command Center with live incident map | Digital Twin View with zone heatmaps |
| AI Forecast Center with 7-day demand curves | Space Optimization with slotting recommendations |

---

## Feature Overview

### 🏢 Company HQ Portal

| Page | Description |
|---|---|
| **Executive Dashboard** | Network-wide KPIs, health scores, risk matrix, and top alerts across all warehouse nodes |
| **Warehouse Network** | Visual directory of all physical nodes with health, efficiency, and incident counts |
| **Command Center** | Live incident feed, an interactive warehouse network topology map, and resolution actions |
| **Forecast Center** | 7-day demand forecasting per warehouse with trend analysis and SKU-level breakdown |
| **Recommendation Feed** | Prioritized AI recommendations spanning workforce, space, and operational efficiency |
| **Network Reports** | Exportable performance summaries across all nodes with KPI benchmarking |
| **Integrations Panel** | Simulated ERP/WMS connector status (SAP, Oracle, Salesforce, custom webhooks) |

### 🏭 Warehouse Manager Portal

| Page | Description |
|---|---|
| **Operations Board** | Live stage pipeline (Receive → Pick → Pack → Dispatch), utilization bars, and event chronology |
| **Bottleneck Intelligence** | Algorithmic detection of throughput choke-points with suggested reallocation actions |
| **Digital Twin View** | Zone-level heatmap of the physical warehouse floor with live occupancy and hazard overlays |
| **Space Optimization** | Slotting engine recommendations — moves high-velocity SKUs to premium zones to cut picker travel |
| **Demand Intelligence** | Per-SKU demand spike detection, reorder recommendations, and 7-day outlook |
| **Workforce Hub** | Shift breakdown, worker utilization, and idle time analytics with reallocation suggestions |
| **Simulation Lab** | What-if scenario simulator for staffing changes, capacity expansion, and demand shocks |
| **Performance Reports** | SLA tracking, throughput velocity, and efficiency benchmarking |
| **AI Copilot** | Conversational assistant that surfaces actionable insights from the live warehouse data |

---

## Tech Stack

### Core Framework

| Technology | Version | Role |
|---|---|---|
| **React** | 19 | UI component library |
| **TypeScript** | 6.0 | Type safety across the entire codebase |
| **Vite** | 8.0 | Build tool and dev server with HMR |

### Styling

| Technology | Version | Role |
|---|---|---|
| **Tailwind CSS** | 4.0 | Utility-first CSS with `@theme` token system |
| **CSS Custom Properties** | — | Theme tokens for light/dark mode switching |
| **JetBrains Mono** | — | Monospace font for telemetry and data readouts |
| **Inter** | — | Primary sans-serif UI font |

### State & Data

| Technology | Version | Role |
|---|---|---|
| **Zustand** | 5.0 | Global state store for warehouse data, theme, and portal role |
| **In-browser Engines** | — | Five TypeScript modules simulate all warehouse intelligence |

### UI & Visualization

| Technology | Version | Role |
|---|---|---|
| **Recharts** | 3.8 | Area charts, responsive containers, and trend visualization |
| **Lucide React** | 1.18 | Icon system (700+ SVG icons) |
| **Framer Motion** | 12 | Page transitions and micro-animations |
| **React Router DOM** | 7.0 | Client-side routing |

---

## Architecture

```
src/
├── engine/                   # In-browser simulation engines
│   ├── bottleneckEngine.ts   # Detects throughput choke-points across pipeline stages
│   ├── forecastEngine.ts     # 7-day demand forecasting with trend modeling
│   ├── healthScore.ts        # Composite warehouse health scoring algorithm
│   ├── simulationEngine.ts   # What-if scenario runner for capacity & staffing
│   └── slottingEngine.ts     # SKU-to-zone optimizer (pick frequency × travel distance)
│
├── store/
│   └── useWarehouseStore.ts  # Zustand store — single source of truth for all warehouse state
│
├── components/
│   ├── layout/
│   │   ├── Header.tsx        # Live clock, warehouse selector, alerts dropdown, theme toggle
│   │   └── Sidebar.tsx       # Portal-aware navigation with role switching
│   ├── common/
│   │   └── MetricCard.tsx    # Reusable KPI card with trend indicator and status color
│   └── ui/
│       └── Card.tsx          # Glassmorphism base card component
│
├── pages/
│   ├── company/              # 7 Company HQ views
│   │   ├── ExecutiveDashboard.tsx
│   │   ├── WarehouseNetwork.tsx
│   │   ├── CommandCenter.tsx
│   │   ├── ForecastCenter.tsx
│   │   ├── RecommendationFeed.tsx
│   │   ├── Reports.tsx
│   │   └── Integrations.tsx
│   └── manager/              # 9 Warehouse Manager views
│       ├── Operations.tsx
│       ├── BottleneckIntelligence.tsx
│       ├── DigitalTwin.tsx
│       ├── SpaceOptimization.tsx
│       ├── DemandIntelligence.tsx
│       ├── Workforce.tsx
│       ├── SimulationLab.tsx
│       ├── AICopilot.tsx
│       └── (Reports shared)
│
└── App.tsx                   # Root layout — portal routing, theme sync
```

### State Architecture

All warehouse data lives in a single **Zustand store** (`useWarehouseStore.ts`). The store holds:
- Three warehouse nodes (Seattle East, Austin South, Chicago Central) with complete telemetry
- Stage pipeline data per warehouse (Receiving → Picking → Packing → Dispatch)
- Alert/incident feed with dismiss and resolve actions
- Selected warehouse, portal role (`company` | `warehouse`), and theme (`light` | `dark`)
- Engine output cache — bottleneck analysis, slotting recommendations, simulation results

### Simulation Engines

| Engine | Algorithm |
|---|---|
| `slottingEngine` | Scores SKUs by pick frequency × zone distance; recommends zone swaps to minimize picker travel |
| `bottleneckEngine` | Finds pipeline stages exceeding utilization thresholds; calculates throughput delta |
| `forecastEngine` | Applies seasonal multipliers and trend coefficients to generate a 7-day demand outlook |
| `simulationEngine` | Runs parameterized what-if scenarios (staff changes, throughput caps, demand shocks) |
| `healthScore` | Weights efficiency, space utilization, workforce utilization, and incident rate into a 0–100 score |

---

## Design System

### Theme

WareMindAI ships with a **dark mode** (default) and a polished **light mode**, toggled at runtime with no page reload. Theme tokens are defined as CSS custom properties and switched via an `html.light` class:

```css
/* Dark (default) */
:root {
  --bg-base:      #0F172A;
  --text-primary: #F8FAFC;
  --card-bg:      rgba(30, 41, 59, 0.45);
}

/* Light */
html.light {
  --bg-base:      #EFF6FF;
  --text-primary: #0F172A;
  --card-bg:      rgba(255, 255, 255, 0.85);
}
```

Tailwind's dark variant is configured with a class-based selector (`html:not(.light) &`) so it respects the in-app toggle rather than the OS preference.

### Visual Language

- **Glassmorphism cards** — `backdrop-blur`, semi-transparent backgrounds, subtle border highlights
- **Color accents** — Blue (`#3B82F6`), Cyan (`#06B6D4`), Emerald (`#10B981`), Amber (`#F59E0B`), Rose (`#EF4444`)
- **Micro-animations** — fade-in, slide-in-right, float, pulse-glow keyframe animations
- **Monospace telemetry** — all live data readouts use JetBrains Mono for the "mission control" aesthetic

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/waremindai.git
cd waremindai

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at **http://localhost:5173**.

### Build for Production

```bash
npm run build
npm run preview
```

### Login

On the login screen, choose your portal:

- **Company HQ** — Access the executive dashboard and multi-warehouse command center
- **Warehouse Manager** — Access the operational control panel for a single warehouse node

No credentials required — it's a demo/simulation platform.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite development server with HMR |
| `npm run build` | Type-check with `tsc` and produce an optimized production build |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint across the entire codebase |

---

## Project Structure Highlights

### Dual-Portal Routing

The app uses a custom tab-based router (no URL changes) — switching portals is instant:

```tsx
// App.tsx
if (portalRole === 'none') return <Login />;

return portalRole === 'company'
  ? renderCompanyPage()   // 7 company views
  : renderWarehousePage(); // 9 warehouse views
```

### Warehouse Selector

When in Warehouse Manager mode, the header dropdown lets you switch between all three warehouse nodes instantly. All page data re-derives from the selected warehouse in the Zustand store.

### Theme Sync

```tsx
// App.tsx — syncs CSS class with Zustand state
useEffect(() => {
  document.documentElement.classList.toggle('light', theme === 'light');
}, [theme]);
```

---

## Roadmap

- [ ] Real backend integration (WebSocket live telemetry feed)
- [ ] Persistent user sessions and role-based access control
- [ ] Exportable PDF/CSV reports
- [ ] Mobile-responsive layout for tablet dashboards
- [ ] Additional warehouse nodes and region configuration
- [ ] Integration with real WMS/ERP APIs (SAP, Oracle NetSuite)

---

## License

MIT — see [LICENSE](./LICENSE) for details.

---

<div align="center">
  Built with React 19 · TypeScript · Tailwind CSS v4 · Vite 8
</div>
