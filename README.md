# Oka' Water Rate Calculator Pro

A professional-grade water rate planning tool built for small and tribal water utilities in Oklahoma and the broader rural US. Designed to support rate studies, financial planning, and public board presentations with transparent, auditable calculations.

> **Planning tool disclaimer:** This tool is for planning and educational purposes only. Results are estimates based on user-provided inputs and the financial modeling assumptions built into the calculator. Formal rate adoption requires a certified rate study conducted by a qualified professional engineer or rate consultant licensed in your state.

---

## Features

### Financial Engine
- **AWWA M1 Cost-of-Service methodology** — allocates costs to customer (fixed), commodity (volumetric), and capacity (higher tiers) functions
- **Monthly-compounding amortization** — consistent US-standard formula used everywhere (`PMT = P × r/12 × (1+r/12)^n / ((1+r/12)^n − 1) × 12`)
- **Sinking fund infrastructure reserve** — correct future-value formula with existing reserve balance credit
- **Separate borrowing and earning interest rates** — realistic distinction between loan rates and money-market returns on reserves
- **Water loss as % of production** — AWWA/EPA industry standard (`totalProduced = billed / (1 − lossRate)`)

### Revenue Accuracy
- **Lognormal usage distribution integration** — when a usage standard deviation is provided, revenue is calculated by integrating over the full customer distribution (200 quantiles) rather than applying average usage to a tiered schedule. This corrects the Jensen's inequality error inherent in applying a nonlinear function to an average input.

### Regulatory Analysis
- **Debt Service Coverage Ratio (DSCR)** — calculated throughout with USDA Rural Development 1.25× threshold clearly shown
- **EPA affordability benchmark** — annual bill as % of MHI at configurable reference usage (default 7,500 gal/month)
- **Low-income impact analysis** — separate affordability calculation at federal poverty level income
- **Poverty assistance trigger** — flags when bills exceed typical LIAP thresholds

### Financial Advisor
- Generates a year-by-year rate transition plan stepping toward an AWWA M1 ideal structure
- Respects a configurable annual rate increase cap (default 12%)
- Explicitly flags when DSCR and affordability constraints conflict — does not silently violate either
- Add-on fee is actively managed and disclosed, not frozen

### Multi-Year Projections
- Revenue inflated with customer growth year-over-year
- Debt service correctly matched to loan terms by year
- Reserve fund balance tracks contributions, withdrawals, and earned interest
- Grants properly matched to their funding year

---

## Technology Stack

| Layer | Library |
|---|---|
| UI Framework | React 18 + TypeScript 5 |
| Build Tool | Vite 5 |
| Styling | Tailwind CSS 3 |
| Charts | Recharts 2 |
| State Management | Zustand 4 |
| CSV Export | Papa Parse 5 |

Produces a fully static build (`dist/`) — no server required. Deployable to any static host (Netlify, GitHub Pages, Wix embed, etc.).

---

## Getting Started

```bash
# Install dependencies
npm install

# Start development server (http://localhost:5173)
npm run dev

# Build for production
npm run build
```

The `dist/` folder after build contains `index.html` + assets ready to deploy.

---

## Project Structure

```
src/
├── engine/               # Pure financial calculation modules
│   ├── amortization.ts   # Monthly-compounding loan payments
│   ├── infrastructure.ts # Sinking fund reserve contributions
│   ├── waterLoss.ts      # NRW impact (production-basis)
│   ├── revenue.ts        # Tiered billing + lognormal distribution
│   ├── affordability.ts  # EPA affordability analysis
│   ├── dscr.ts           # Debt Service Coverage Ratio
│   ├── costOfService.ts  # AWWA M1 cost allocation
│   ├── projections.ts    # Multi-year financial projections
│   └── advisor.ts        # Rate recommendation engine
├── components/
│   ├── inputs/           # Data entry forms
│   ├── results/          # Current/proposed rate analysis panels
│   ├── advisor/          # Advisor output + projection table
│   ├── charts/           # Recharts visualizations
│   ├── shared/           # MetricCard, StatusBadge, SectionCard, etc.
│   └── layout/           # Header with scenario selector + export/import
├── store/                # Zustand state store + sample scenarios
├── types/                # TypeScript interfaces
└── utils/                # Formatting helpers, JSON export/import
```

---

## Calculation Methodology

### Amortization
Standard US monthly-compounding formula, consistent across all debt calculations:
```
monthly = P × (r/12) × (1 + r/12)^(12n) / ((1 + r/12)^(12n) − 1)
annual  = monthly × 12
```

### Infrastructure Reserve (Sinking Fund)
```
PMT = (FV − PV × (1+r)^n) × r / ((1+r)^n − 1)
```
Where `PV` is the existing reserve balance and `FV` is the inflation-adjusted replacement cost target.

### Water Loss
```
totalProduced = totalBilled / (1 − lossRate)
waterLost     = totalProduced − totalBilled
costOfLoss    = (waterLost / totalProduced) × annualO&M
```

### Revenue (Lognormal Distribution)
For customer classes with a known usage standard deviation:
```
σ² = ln(1 + CV²),  μ = ln(avgUsage) − σ²/2
E[bill] = Σ bill(exp(μ + σ × Φ⁻¹((i−0.5)/N))) / N   for i = 1..200
```
Uses Peter Acklam's rational approximation of the inverse normal CDF (accurate to 1.15×10⁻⁹).

### DSCR
```
DSCR = (Revenue − Operating Cost) / Annual Debt Service
```
| DSCR | Classification |
|---|---|
| ≥ 1.50 | Excellent |
| ≥ 1.25 | Adequate (USDA Rural Development minimum) |
| ≥ 1.10 | Marginal (typical State Revolving Fund minimum) |
| < 1.10 | Insufficient |

### EPA Affordability
```
burden = (monthlyBill at referenceUsage / monthlyMHI) × 100
```
| Burden | Classification |
|---|---|
| ≤ 1.5% | Affordable |
| ≤ 2.5% | Moderate (EPA threshold) |
| ≤ 4.0% | Burdensome |
| > 4.0% | Severe |

---

## Known Limitations

This tool is suitable for planning, board presentations, and grant application support. It is **not** a replacement for a formal rate study in the following situations:

- **Legal rate adoption** — most state statutes require a certified engineer's rate study
- **Bond or loan applications** — lenders typically require a study by a licensed PE
- **Complex rate structures** — seasonal rates, drought surcharges, wholesale contracts are not modeled
- **Multi-system consolidations** — cost-of-service across merged utilities requires specialized analysis
- **Regulatory compliance filings** — state primacy agency submissions typically require certified calculations

---

## Sample Scenarios

Three built-in scenarios are included to demonstrate the tool:

| Scenario | Description |
|---|---|
| **Madill, OK** | Small rural system, 1,350 accounts, high NRW, limited reserves |
| **Tribal Water District** | Mid-size tribal utility, significant poverty rate, aging infrastructure |
| **Newcastle, OK** | Growing suburb, 4,800+ accounts, strong MHI, capital expansion needs |

---

## Related Project

The original JavaScript prototype: [kevsynapthrive/oka-water-calculator](https://github.com/kevsynapthrive/oka-water-calculator)

This Pro version resolves all 28 calculation and methodology issues identified in the original, including Issues #18–28 opened during the audit that preceded this rewrite.

---

## License

MIT — free to use, modify, and distribute with attribution.
