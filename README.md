# Housing-Department-Appointment-booking-mobile-app

A semi-digital appointment booking and income/asset declaration system for Hong Kong public
housing tenants (Well-off Tenants Policy). The planning/business-case documents live at the
repo root; a runnable starter implementation lives in `backend/` and `frontend/`.

## Structure

- `backend/` — ASP.NET Core 8 Web API (EF Core + SQLite in dev) exposing the appointment
  booking + tenant registration endpoints.
- `frontend/` — React 19 + Vite + TypeScript web app for the tenant booking flow.

## Quick start

Prerequisites: .NET 8 SDK, Node.js 20+, and pnpm.

```bash
# Backend (terminal 1)
cd backend
dotnet run --project HousingAppointment.Api --urls http://0.0.0.0:5045

# Frontend (terminal 2)
cd frontend
pnpm install
pnpm dev
```

Then open http://localhost:5173, sign in with the pre-filled tenant details, choose an estate
office, and book an available slot.

## Useful commands

| Task            | Command (dir)                          |
|-----------------|----------------------------------------|
| Backend tests   | `dotnet test` (`backend/`)             |
| Frontend lint   | `pnpm lint` (`frontend/`)              |
| Frontend build  | `pnpm build` (`frontend/`)             |

See `AGENTS.md` for architecture notes and Cursor Cloud specifics.
