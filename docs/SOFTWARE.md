# Software Documentation — Housing Department Appointment Booking

Technical overview of the current starter implementation: what is built, how it is structured, and how the pieces talk to each other.

## 1. Purpose

Semi-digital appointment booking for Hong Kong public rental housing (PRH) tenants under the **Well-off Tenants Policy** income and asset declaration cycle.

The long-term vision (see root business-case documents) includes e-forms, document upload, staff pre-check, notifications, and digital signing. **This repository currently ships a runnable booking slice**: tenant registration/sign-in, estate selection, slot booking, and appointment listing — plus an **Admin** area for setup and software docs.

## 2. High-level architecture

```text
┌─────────────────────┐         /api/* (Vite proxy)        ┌──────────────────────────┐
│  React + Vite UI    │ ─────────────────────────────────► │  ASP.NET Core 8 Minimal  │
│  frontend/ :5173    │                                    │  API  backend/ :5045     │
└─────────────────────┘                                    │         │                │
                                                           │         ▼                │
                                                           │   SQLite (housing.db)    │
                                                           └──────────────────────────┘
```

| Layer | Path | Stack |
|-------|------|--------|
| Web UI | `frontend/` | React 19, TypeScript, Vite 8 |
| API | `backend/HousingAppointment.Api/` | ASP.NET Core 8, EF Core, SQLite |
| Tests | `backend/HousingAppointment.Api.Tests/` | xUnit + WebApplicationFactory |

### Design choices (local / demo)

- **SQLite** for zero-setup local development (production proposal targets SQL Server).  
- Database is **created and seeded on API startup** (`EnsureCreated` + seeder).  
- CORS allows any origin in Development.  
- Vite proxies `/api` → `http://localhost:5045` (override with `VITE_API_TARGET`).

## 3. Features implemented

### Tenant booking flow

1. **Register / sign in** — tenancy number, HKID, name, phone, date of birth. Re-using an existing tenancy number returns the same tenant.  
2. **List estate offices** — seeded demo estates.  
3. **List available slots** — future slots for the selected estate (`onlyAvailable=true`).  
4. **Book a slot** — marks the slot booked and creates an appointment.  
5. **View my appointments** — estate, district, time, status.

### Admin menu (frontend)

Accessible from the app header (**Admin**):

| Menu item | Content |
|-----------|---------|
| How to Setup | Install software, clone/download, run backend & frontend |
| Software Documentation | This document — architecture, APIs, data model |

Markdown sources also live in the repo under `docs/` and are mirrored for the UI under `frontend/public/docs/`.

### Not yet implemented (roadmap from planning docs)

- SMS / app OTP (2FA)  
- Pre-filled e-forms and document photo/PDF upload  
- Estate staff portal and pre-check workflow  
- Push / SMS / email notifications  
- Digital signature capture  
- HA system integration and production SQL Server hosting  

## 4. Demo seed data

On first API start (empty database):

**Estates**

| Name | District |
|------|----------|
| Choi Hung Estate | Wong Tai Sin |
| Mei Foo Sun Chuen | Sham Shui Po |
| Wah Fu Estate | Southern |

**Slots** — for each estate, 3 days × 4 morning hours starting tomorrow 09:00 (local server time).

**Suggested demo tenant** (pre-filled in the UI): `PRH-1001` / `A1234567` / Chan Tai Man.

## 5. HTTP API reference

Base URL in development: `http://localhost:5045`  
From the browser via Vite: same-origin `/api/...`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Liveness check `{ "status": "ok" }` |
| `GET` | `/api/estates` | List estates |
| `POST` | `/api/tenants/register` | Register or return existing tenant |
| `GET` | `/api/estates/{estateId}/slots?onlyAvailable=true` | List slots |
| `POST` | `/api/appointments` | Book `{ tenantId, slotId }` |
| `GET` | `/api/tenants/{tenantId}/appointments` | List tenant appointments |

Interactive docs: **Swagger UI** at http://localhost:5045/swagger

### Example: register tenant

```http
POST /api/tenants/register
Content-Type: application/json

{
  "tenancyNumber": "PRH-1001",
  "hkid": "A1234567",
  "name": "Chan Tai Man",
  "phone": "51234567",
  "dateOfBirth": "1980-05-20"
}
```

### Example: book appointment

```http
POST /api/appointments
Content-Type: application/json

{
  "tenantId": 1,
  "slotId": 3
}
```

Conflict (`409`) if the slot is already booked.

## 6. Data model (EF Core)

| Entity | Key fields |
|--------|------------|
| `Estate` | Id, Name, District |
| `AppointmentSlot` | Id, EstateId, StartTime, IsBooked |
| `Tenant` | Id, TenancyNumber, Hkid, Name, Phone, DateOfBirth |
| `Appointment` | Id, TenantId, SlotId, Status, CreatedAt |

Relationships: Estate → many Slots; Tenant → many Appointments; Appointment → one Slot.

## 7. Frontend structure

```text
frontend/src/
  App.tsx          # Tenant booking + Admin shell / menu
  api.ts           # Typed fetch helpers for /api
  App.css          # Layout and component styles
  main.tsx         # React entry
public/docs/       # Docs served to the Admin menu
```

Views:

- **Booking** — default tenant flow  
- **Admin → How to Setup** — loads `/docs/HOW_TO_SETUP.md`  
- **Admin → Software Documentation** — loads `/docs/SOFTWARE.md`

## 8. Backend structure

```text
backend/
  HousingAppointment.sln
  HousingAppointment.Api/
    Program.cs              # Endpoints + seeding
    Data/AppDbContext.cs
    Models/Entities.cs
    Models/Dtos.cs
    appsettings*.json
  HousingAppointment.Api.Tests/
    BookingFlowTests.cs
```

## 9. Configuration

| Setting | Where | Notes |
|---------|-------|-------|
| Connection string | `appsettings.json` / Development | SQLite `Data Source=housing.db` |
| API URL | run `--urls` | Default demo: `http://0.0.0.0:5045` |
| Vite proxy target | `vite.config.ts` / `VITE_API_TARGET` | Defaults to `http://localhost:5045` |

## 10. Testing & quality

```bash
# Backend integration tests
cd backend && dotnet test

# Frontend lint / production build
cd frontend && pnpm lint
cd frontend && pnpm build
```

## 11. Security notes (demo only)

This starter is **not production-hardened**:

- No real authentication or 2FA  
- No role-based access control on Admin (UI-only navigation)  
- Open CORS in Development  
- HKID and tenancy checks are not validated against a live HA database  

Treat all data as sample data for local demos and development.

## 12. Related documents

| Document | Location |
|----------|----------|
| How to Setup | [HOW_TO_SETUP.md](./HOW_TO_SETUP.md) |
| Project README | [../README.md](../README.md) |
| Agent / architecture notes | [../AGENTS.md](../AGENTS.md) |
| Business case & workflow | Root `.docx` / workflow `.md` files |
