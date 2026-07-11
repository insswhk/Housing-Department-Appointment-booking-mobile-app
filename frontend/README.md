# Frontend — Housing Appointment Booking

React 19 + Vite + TypeScript UI for the tenant booking flow and Admin documentation menu.

## Run

Prerequisites and full steps: see [../../docs/HOW_TO_SETUP.md](../../docs/HOW_TO_SETUP.md).

```bash
pnpm install
pnpm dev
```

Open http://localhost:5173 (backend must be running on port 5045).

## Admin menu

In the app header: **Admin → How to Setup** or **Admin → Software Documentation**.  
Docs are loaded from `public/docs/` (mirrors of the repo `docs/` folder).

## Scripts

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Dev server |
| `pnpm build` | Production build |
| `pnpm lint` | Oxlint |
| `pnpm preview` | Preview production build |
