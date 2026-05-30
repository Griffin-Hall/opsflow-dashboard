# OpsFlow • Operations Dashboard

From ugly daily Excel to executive-grade real-time ops visibility.

## Setup

```powershell
npx create-next-app@latest opsflow-dashboard --typescript --tailwind --eslint --app
cd opsflow-dashboard
npm install
npm run dev
```

This repo is already scaffolded and implemented. The local dev URL is usually:

```text
http://localhost:3000
```

Use Node 22 for production builds. The current machine PATH exposes Node 24, which can crash the Next 15 build worker. Vercel will honor the `engines.node` setting in `package.json`.

Local build check used here:

```powershell
$env:NODE_OPTIONS="--max-old-space-size=4096"
npx -p node@22 node .\node_modules\next\dist\bin\next build
```

## Data Source

The app reads the workbook directly on the server when it exists:

```text
data\operations.xlsx
```

You can override that path with:

```powershell
$env:OPSFLOW_EXCEL_PATH="D:\path\to\your\operations.xlsx"
npm run dev
```

The workbook is intentionally not copied into this repo. Files under `data/*.xlsx`, `data/*.xls`, `data/*.csv`, and `data/*.json` are ignored so real operational data does not get committed accidentally.

If the workbook is missing, the app falls back to `lib/fakeData.ts`.

## Stack

- Next.js 15 App Router
- React 19
- TypeScript strict
- Tailwind CSS v4
- shadcn/ui with Radix primitives
- TanStack Table v8
- Recharts via shadcn chart wrapper
- Framer Motion
- lucide-react
- sonner toasts
- zustand state store
- date-fns
- read-excel-file for local workbook parsing

## Key Files

- `app/page.tsx` - cinematic portfolio landing page
- `app/dashboard/page.tsx` - server-loaded dashboard route
- `app/api/orders/route.ts` - server route that reads the local Excel workbook
- `lib/excelData.ts` - Excel parser and normalizer
- `lib/fakeData.ts` - portfolio-safe fallback data
- `lib/data-utils.ts` - derived KPIs, chart data, newest orders, activity feed
- `components/dashboard/dashboard-shell.tsx` - app shell, sidebar, topbar, refresh workflow
- `components/dashboard/orders-table.tsx` - TanStack table with sorting, filters, visibility, selection, CSV export
- `components/dashboard/dashboard-charts.tsx` - donut, bar, heat, and area charts

## Deploy to Vercel

1. Push this repo to GitHub.
2. Import it in Vercel.
3. Keep real Excel files out of the repo.
4. For a public portfolio deployment, use the fallback fake data or connect a sanitized backend source.
5. Build command: `npm run build`
6. Output: Next.js default

## Deploy to GitHub Pages

This repo includes a GitHub Actions workflow at `.github/workflows/deploy-pages.yml`.
For GitHub Pages, the app is statically exported with portfolio-safe sample data only.
The local Excel workbook is never committed or uploaded.

Expected public URL:

```text
https://griffin-hall.github.io/opsflow-dashboard/
```

## Customization

- Replace `Acme Global Supply` and `Alex Rivera` in `components/dashboard/dashboard-shell.tsx`.
- Update the GitHub/live demo links in `components/landing/landing-page.tsx`.
- Change the default workbook path in `lib/excelData.ts` or set `OPSFLOW_EXCEL_PATH`.
- Keep public portfolio data sanitized. Customer names, POs, order values, and activity notes can be sensitive.
