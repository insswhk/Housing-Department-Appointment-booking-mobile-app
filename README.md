# Housing Department Appointment Booking

Semi-digital appointment booking for Hong Kong public rental housing tenants (Well-off
Tenants Policy). Planning documents live at the repo root; a runnable starter app lives in
`backend/` and `frontend/`.

## Download for Cursor Desktop

1. Clone or download this repository from GitHub:
   ```bash
   git clone https://github.com/insswhk/Housing-Department-Appointment-booking-mobile-app.git
   cd Housing-Department-Appointment-booking-mobile-app
   ```
2. In Cursor: **File → Open Folder** and select the project folder.
3. Follow the full setup guide: **[docs/HOW_TO_SETUP.md](docs/HOW_TO_SETUP.md)**  
   Software / API docs: **[docs/SOFTWARE.md](docs/SOFTWARE.md)**

Inside the running web app, open **Admin → How to Setup** or **Admin → Software Documentation**.

## Structure

| Path | Description |
|------|-------------|
| `backend/` | ASP.NET Core 8 Web API (EF Core + SQLite in dev) |
| `frontend/` | React 19 + Vite + TypeScript tenant booking UI + Admin docs menu |
| `docs/` | How-to-setup and software documentation |

## Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js 20+](https://nodejs.org/)
- [pnpm](https://pnpm.io/) (`npm install -g pnpm`)

## Quick start

```bash
# Terminal 1 — Backend
cd backend
dotnet run --project HousingAppointment.Api --urls http://0.0.0.0:5045

# Terminal 2 — Frontend
cd frontend
pnpm install
pnpm dev
```

Open **http://localhost:5173**, sign in with the pre-filled demo tenant, choose an estate
office, and book a slot.

- API health: http://localhost:5045/health  
- Swagger: http://localhost:5045/swagger  

## Useful commands

| Task | Command (directory) |
|------|---------------------|
| Backend tests | `dotnet test` (`backend/`) |
| Frontend lint | `pnpm lint` (`frontend/`) |
| Frontend build | `pnpm build` (`frontend/`) |

See [AGENTS.md](AGENTS.md) for architecture notes and Cursor Cloud specifics.
