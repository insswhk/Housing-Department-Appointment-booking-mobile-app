# How to Set Up — Housing Department Appointment Booking

This guide walks you through installing the required software and running the project on your own computer (including Cursor Desktop).

## What you will run

| Part | Technology | Default URL |
|------|------------|-------------|
| Backend API | ASP.NET Core 8 + SQLite | http://localhost:5045 |
| Frontend web app | React 19 + Vite + TypeScript | http://localhost:5173 |

Both must be running for the booking flow to work. The frontend proxies `/api` requests to the backend.

---

## 1. Install required software

### A. Git

- **Windows:** https://git-scm.com/download/win  
- **macOS:** `xcode-select --install` or https://git-scm.com/download/mac  
- **Linux:** `sudo apt install git` (Debian/Ubuntu) or your distro equivalent  

Verify:

```bash
git --version
```

### B. .NET 8 SDK

Download and install the **.NET 8 SDK** (not only the runtime):

- https://dotnet.microsoft.com/download/dotnet/8.0

Verify:

```bash
dotnet --version
```

You should see a version starting with `8.` (for example `8.0.400`).

### C. Node.js 20 or newer

- https://nodejs.org/ (LTS recommended)

Verify:

```bash
node --version
```

### D. pnpm

This project uses **pnpm** for frontend packages:

```bash
npm install -g pnpm
pnpm --version
```

### E. Cursor (optional but recommended)

- https://cursor.com/  
Open the cloned folder as a workspace so you can edit and run terminals inside Cursor.

---

## 2. Download the project

### Option A — Clone with Git (recommended)

```bash
git clone https://github.com/insswhk/Housing-Department-Appointment-booking-mobile-app.git
cd Housing-Department-Appointment-booking-mobile-app
```

If you need the latest development branch instead of `main`:

```bash
git fetch origin
git checkout main
git pull origin main
```

### Option B — Download ZIP from GitHub

1. Open the repository on GitHub.  
2. Click **Code → Download ZIP**.  
3. Unzip the folder on your computer.  
4. In Cursor: **File → Open Folder** and select the unzipped project.

---

## 3. Run the backend (Terminal 1)

```bash
cd backend
dotnet run --project HousingAppointment.Api --urls http://0.0.0.0:5045
```

First run may take a minute while NuGet packages restore.

When ready you should see something like:

```text
Now listening on: http://0.0.0.0:5045
```

Useful checks:

- Health: http://localhost:5045/health  
- Swagger UI: http://localhost:5045/swagger  

SQLite database `housing.db` is created automatically and seeded with demo estates and time slots. No separate database install is required for local development.

---

## 4. Run the frontend (Terminal 2)

Open a **second** terminal:

```bash
cd frontend
pnpm install
pnpm dev
```

Then open:

**http://localhost:5173**

---

## 5. Try the demo booking flow

1. On the home page, the sign-in form is pre-filled with demo tenant details.  
2. Click **Sign in**.  
3. Choose an estate office (for example Choi Hung Estate).  
4. Click an available time slot.  
5. Confirm the appointment appears under **My appointments**.

Demo tenant defaults:

| Field | Value |
|-------|--------|
| Tenancy number | `PRH-1001` |
| HKID | `A1234567` |
| Name | `Chan Tai Man` |
| Phone | `51234567` |
| Date of birth | `1980-05-20` |

---

## 6. Admin menu (in the app)

In the web app header, open **Admin**. The admin menu links to:

- **How to Setup** — this guide (also available as `docs/HOW_TO_SETUP.md`)  
- **Software Documentation** — architecture, APIs, and features (`docs/SOFTWARE.md`)

---

## 7. Useful commands

| Task | Directory | Command |
|------|-----------|---------|
| Run API | `backend/` | `dotnet run --project HousingAppointment.Api --urls http://0.0.0.0:5045` |
| Run web app | `frontend/` | `pnpm dev` |
| Backend tests | `backend/` | `dotnet test` |
| Frontend lint | `frontend/` | `pnpm lint` |
| Frontend production build | `frontend/` | `pnpm build` |

---

## 8. Reset demo data

1. Stop the backend.  
2. Delete `backend/HousingAppointment.Api/housing.db` (and `housing.db-shm` / `housing.db-wal` if present).  
3. Start the backend again — estates and slots are reseeded automatically.

---

## 9. Troubleshooting

| Problem | What to try |
|---------|-------------|
| `dotnet` not found | Re-open the terminal after installing the SDK, or restart Cursor |
| `pnpm` not found | Run `npm install -g pnpm` |
| Frontend loads but booking fails | Confirm the backend is running on port **5045** |
| Port already in use | Stop the other process, or change the port in the run command / Vite config |
| Blank page / proxy errors | Start backend first, then frontend; hard-refresh the browser |
| Old data after pull | Delete `housing.db*` and restart the API |

### Windows notes

- Prefer **PowerShell** or **Git Bash** inside Cursor.  
- If script execution is blocked for npm/pnpm, run PowerShell as Administrator once:  
  `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`

### macOS / Linux notes

- If `dotnet` is installed but not on `PATH`, follow the installer instructions or add the SDK bin directory to your shell profile.

---

## 10. Project layout (quick map)

```text
.
├── README.md                 # Project overview
├── AGENTS.md                 # Architecture notes for AI/agents
├── docs/
│   ├── HOW_TO_SETUP.md       # This file
│   └── SOFTWARE.md           # Software documentation
├── backend/                  # ASP.NET Core API
└── frontend/                 # React + Vite web app
```

For deeper technical detail, see [SOFTWARE.md](./SOFTWARE.md).
