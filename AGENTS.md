# Housing Department Appointment Booking

A semi-digital appointment booking + income/asset declaration system for Hong Kong public
housing tenants (Well-off Tenants Policy). See the root planning docs for the full business
case and requirements.

## Architecture

| Service    | Stack                                   | Dir         | Dev port |
|------------|-----------------------------------------|-------------|----------|
| Backend API| ASP.NET Core 8 minimal API + EF Core    | `backend/`  | 5045     |
| Web front  | React 19 + Vite 8 + TypeScript          | `frontend/` | 5173     |

- Backend persists to **SQLite** in dev (`housing.db`, auto-created + seeded on startup via
  `EnsureCreated`). The proposal targets SQL Server for production; dev uses SQLite so no
  external DB is required.
- The React dev server proxies `/api` → `http://localhost:5045` (see `frontend/vite.config.ts`,
  override with `VITE_API_TARGET`). Backend CORS also allows any origin in dev.

## Documentation

- Human setup guide: `docs/HOW_TO_SETUP.md` (also Admin → How to Setup in the UI)
- Software / API docs: `docs/SOFTWARE.md` (also Admin → Software Documentation)
- Mirrored for the web app at `frontend/public/docs/` — keep both copies in sync when editing

## Running (standard commands)

- Backend: from `backend/`, `dotnet run --project HousingAppointment.Api --urls http://0.0.0.0:5045`
- Frontend: from `frontend/`, `pnpm dev` (binds `0.0.0.0:5173`)
- Backend tests: from `backend/`, `dotnet test`
- Frontend lint / build: from `frontend/`, `pnpm lint` / `pnpm build`

## Cursor Cloud specific instructions

- The .NET 8 SDK is installed under `~/.dotnet` and added to `PATH`/`DOTNET_ROOT` via
  `~/.bashrc`. New non-login shells may not have it on `PATH`; if `dotnet` is not found, run
  `export DOTNET_ROOT="$HOME/.dotnet"` and `export PATH="$HOME/.dotnet:$PATH"` (or start a
  login shell).
- The seeded SQLite file `housing.db` is created in the working directory the API is launched
  from (i.e. `backend/HousingAppointment.Api/`). It is gitignored. To reset demo data, stop the
  API and delete `housing.db*`, then restart — data reseeds automatically.
- Booking slots are seeded relative to "today", so available slots always appear in the future.
- Run the two dev servers in separate tmux sessions; both must be running for the web booking
  flow to work (frontend calls the backend through the `/api` proxy).
