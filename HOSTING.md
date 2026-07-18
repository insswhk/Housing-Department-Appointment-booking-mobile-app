# Hosting Guide — Housing Appointment / Declaration Platform

> **Important:** This repository currently contains **proposal and business-case documents only**. There is no application source code, Docker setup, or deploy config yet. The guidance below is based on the **proposed technology stack** in the project docs, so you can plan hosting before (and after) the app is built.

## Proposed stack (from project docs)

| Layer | Proposed technology |
| --- | --- |
| Resident web portal | Next.js + TypeScript + React + Tailwind |
| Mobile app | Flutter (store distribution; API hosted in cloud) |
| Backend API | .NET 9 Web API (ASP.NET Core also noted) |
| Database | PostgreSQL (SQL Server also mentioned as an alternative) |
| Cache / jobs | Redis |
| File / document storage | Object storage (photos, PDFs) |
| Search | Elasticsearch |
| Auth | OpenID Connect / OAuth2 / JWT, SMS OTP, proposed iAM Smart |
| Notifications | Email, SMS, push |
| Orchestration (production target) | Docker + Kubernetes |
| **Hard constraint** | **All production personal data must stay in Hong Kong** |

---

## 1. Can we host on [Railway](https://railway.com/)?

### Short answer

**Technically yes for a prototype / demo. Not suitable for production government data.**

Railway can run most of the *technical* services this stack needs, but it **does not have a Hong Kong region**. Closest Asia region is **Singapore**. Your own docs require production data on Hong Kong servers under HK jurisdiction, so Railway fails that requirement for real HA / PRH data.

### Service checklist (Railway)

| Needed service | On Railway? | Notes |
| --- | --- | --- |
| Web / API hosting (.NET, Next.js) | Yes | Deploy from GitHub or Docker |
| PostgreSQL | Yes | Official template + HA option |
| Redis | Yes | Official template |
| Object / file storage | Yes | S3-compatible storage buckets (or MinIO template) |
| Elasticsearch | Yes (DIY) | Deploy via Docker image / marketplace template |
| Background workers | Yes | Separate services in the same project |
| Custom domains + HTTPS | Yes | Built-in |
| SMS / email / push | External | Twilio, SendGrid, Firebase, etc. (not Railway-native) |
| iAM Smart / gov SSO | External | Hong Kong government integration — not a hosting feature |
| **Hong Kong data residency** | **No** | Regions: US West, US East, EU West (Amsterdam), **Southeast Asia (Singapore)** only |
| Managed K8s / ISO 27001 gov posture | Limited | Fine for demos; not a government-grade HK cloud story |

### When Railway *is* a good choice

- Local demos, hackathons, investor / internal prototypes with **fake / anonymized** data
- Fast full-stack trial: API + Postgres + Redis + uploads in one project
- Learning the architecture before Azure / HK-compliant production

### When to avoid Railway

- Any real tenant HKID, tenancy, income, or document data
- Anything that must satisfy HA / PDPO data residency (“servers located in Hong Kong”)
- Long-term production with 99.95% uptime, DR site, and government security reviews

### Prototype deploy outline (after code exists)

1. Create a project at [railway.com](https://railway.com/) and connect the GitHub repo.
2. Add **PostgreSQL** and **Redis** (+ **Bucket** for uploads if needed).
3. Deploy the **.NET API** and **Next.js** apps as separate services.
4. Wire env vars with Railway reference variables, e.g. `DATABASE_URL=${{Postgres.DATABASE_URL}}`.
5. Set region to **Southeast Asia (Singapore)** for lowest Asia latency — still **not** Hong Kong.
6. Keep using only synthetic test data.

---

## 2. Azure hosting (recommended for free tier + HK region)

Azure is a better fit than Railway for this project because:

1. **East Asia region is in Hong Kong** — aligns with the data-residency requirement.
2. **New Azure accounts** get a **~$200 credit (30 days)** plus **12 months of free monthly amounts** on popular services, and many always-free services — enough to host a few small websites / API demos.
3. First-class support for **.NET**, **App Service**, **SQL / PostgreSQL**, **Blob Storage**, and **Redis**.

### Azure service mapping

| App need | Azure service | Free-tier notes (typical new account) |
| --- | --- | --- |
| Next.js web + .NET API | **App Service** (Linux) or **Container Apps** | Free F1 App Service tier (limited CPU); better demos use Basic B1 or free credit |
| Database | **Azure SQL Database** *or* **Azure Database for PostgreSQL Flexible Server** | SQL has a generous free serverless offer; Postgres often uses credit / Burstable SKU |
| Document uploads | **Azure Blob Storage** | ~5 GB LRS hot blob free for 12 months (check current free page) |
| Cache | **Azure Cache for Redis** | Small Basic C0 often in 12‑month free list |
| Secrets | **Key Vault** | Small usage; prefer for connection strings |
| Auth (dev) | **Microsoft Entra ID** / App registration | Free for basic app auth; production may add iAM Smart later |
| Search | **Azure AI Search** or self-hosted Elasticsearch on a VM | Not fully free at scale — skip for early demos |
| SMS / email | Twilio / Azure Communication Services / SendGrid | Paid third-party |
| Mobile app | Flutter → stores; API on Azure | Hosting is for the API/backend, not the APK/IPA itself |

> Free amounts change. Always confirm on [Azure free account](https://azure.microsoft.com/free/) before relying on a specific SKU.

### Suggested “few websites on free Azure” layout

Use **one Resource Group** per site (or one shared group for related apps):

| Site | Hosting | Data |
| --- | --- | --- |
| Tenant web portal | App Service #1 | Shared SQL / Postgres |
| Officer / admin portal | App Service #2 (or same app, different path) | Same DB |
| Backend API | App Service #3 (or combine with portals) | Same DB + Blob |
| Static marketing / docs site | **Static Web Apps** (always-free tier available) | None |

For cost control on free tier: prefer **App Service F1** or **Static Web Apps** for frontends, **Azure SQL free serverless** (auto-pause) for the database, and **Blob Storage** for uploads. Turn off Redis / AI Search until you need them.

---

## 3. Step-by-step: host on Azure (free account)

### Step 0 — Prerequisites

- Microsoft account
- Credit card for identity verification (free tier still requires this; watch spending limits)
- Azure CLI (`az`) **or** use the Azure Portal in the browser
- Your app code ready to deploy (this repo does not have it yet)

Install CLI (optional):

```bash
# macOS/Linux example — see Microsoft docs for your OS
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
az login
```

### Step 1 — Create the free Azure account

1. Go to [https://azure.microsoft.com/free/](https://azure.microsoft.com/free/).
2. Sign up as a **new Azure customer** (12‑month free services + credit).
3. Complete phone / card verification.
4. In the portal, open **Subscriptions** → confirm you see the Free Trial / Free Account subscription.
5. Set a **budget alert** (Cost Management → Budgets) e.g. notify at $1 / $10 so nothing surprises you after the credit.

### Step 2 — Pick Hong Kong region

For anything that might hold personal data later, create resources in:

- **Region: East Asia** (Hong Kong)

Optional second region for DR experiments: Southeast Asia (Singapore) — **do not** put production personal data there if policy requires HK-only.

### Step 3 — Create a resource group

**Portal:** Home → Resource groups → Create → name e.g. `rg-housing-demo` → Region `East Asia`.

**CLI:**

```bash
az group create --name rg-housing-demo --location eastasia
```

### Step 4 — Create the database

**Option A — Azure SQL (easiest with free offer, fits .NET / EF Core)**

```bash
az sql server create \
  --name housing-demo-sql \
  --resource-group rg-housing-demo \
  --location eastasia \
  --admin-user sqladmin \
  --admin-password '<StrongPasswordHere!>'

az sql db create \
  --resource-group rg-housing-demo \
  --server housing-demo-sql \
  --name HousingDb \
  --edition GeneralPurpose \
  --compute-model Serverless \
  --family Gen5 \
  --capacity 1 \
  --auto-pause-delay 60 \
  --min-capacity 0.5
```

Allow your App Service / IP to connect (firewall rules). Prefer **private endpoint / VNet** for anything beyond a public demo.

**Option B — PostgreSQL Flexible Server** (matches the PostgreSQL stack in the architecture doc)

```bash
az postgres flexible-server create \
  --resource-group rg-housing-demo \
  --name housing-demo-pg \
  --location eastasia \
  --admin-user pgadmin \
  --admin-password '<StrongPasswordHere!>' \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --storage-size 32 \
  --version 16
```

Stop the server when idle to save credit:

```bash
az postgres flexible-server stop --resource-group rg-housing-demo --name housing-demo-pg
```

### Step 5 — Create Blob Storage for documents

```bash
az storage account create \
  --name housingdemodocs \
  --resource-group rg-housing-demo \
  --location eastasia \
  --sku Standard_LRS \
  --kind StorageV2

az storage container create \
  --account-name housingdemodocs \
  --name documents \
  --auth-mode login
```

Use private containers + short-lived SAS URLs (or managed identity) — never make tenant documents public.

### Step 6 — (Optional) Redis cache

```bash
az redis create \
  --resource-group rg-housing-demo \
  --name housing-demo-redis \
  --location eastasia \
  --sku Basic \
  --vm-size c0
```

Skip this on day one if you are protecting free credit.

### Step 7 — Create App Service plans + web apps

For two small sites + one API on the free tier:

```bash
# Free Linux plan (F1) — good for demos; limited CPU minutes
az appservice plan create \
  --name plan-housing-free \
  --resource-group rg-housing-demo \
  --location eastasia \
  --is-linux \
  --sku F1

# API
az webapp create \
  --resource-group rg-housing-demo \
  --plan plan-housing-free \
  --name housing-demo-api \
  --runtime "DOTNETCORE:9.0"

# Tenant web (Node / Next.js)
az webapp create \
  --resource-group rg-housing-demo \
  --plan plan-housing-free \
  --name housing-demo-web \
  --runtime "NODE:20-lts"
```

Notes:

- **F1** can host multiple apps but is shared/slow and may sleep. Fine for demos.
- For a more reliable demo of “a few websites”, upgrade the plan to **B1** and pay from the $200 credit, or use one **B1** plan shared by several apps.
- Next.js often needs a custom start command (`npm run start`) and Node 18/20. Alternatively host the frontend on **Azure Static Web Apps** and the API on App Service.

### Step 8 — Configure environment variables

```bash
az webapp config appsettings set \
  --resource-group rg-housing-demo \
  --name housing-demo-api \
  --settings \
    ASPNETCORE_ENVIRONMENT=Production \
    ConnectionStrings__Default="Server=tcp:housing-demo-sql.database.windows.net,1433;Database=HousingDb;User ID=sqladmin;Password=<StrongPasswordHere!>;Encrypt=True;" \
    Storage__ConnectionString="<blob-connection-string>" \
    Storage__Container=documents
```

Prefer **Key Vault references** + managed identity instead of putting passwords in app settings for anything beyond a throwaway demo.

### Step 9 — Deploy code

**From GitHub (recommended):**

1. In the App Service → **Deployment Center** → GitHub → authorize → select repo/branch.
2. Azure builds and publishes on each push.

**From CLI (zip / local):**

```bash
# .NET API example after `dotnet publish`
cd backend
dotnet publish -c Release -o ./publish
cd publish && zip -r ../api.zip . && cd ..
az webapp deploy --resource-group rg-housing-demo --name housing-demo-api --src-path api.zip --type zip
```

**Static / Next frontend:** use Deployment Center, or Azure Static Web Apps with GitHub Actions.

### Step 10 — Custom domain + HTTPS

1. App Service → Custom domains → add `demo.yourdomain.com`.
2. Create the DNS CNAME / TXT records Azure shows.
3. Enable free App Service managed certificate.

### Step 11 — Security basics (even on free tier)

- Force HTTPS only; enable HSTS when ready.
- Lock SQL / Postgres firewall to App Service outbound IPs (or use VNet integration on paid SKUs).
- Store secrets in Key Vault.
- Turn on diagnostic logs → Log Analytics (free tier has daily caps).
- Do **not** upload real HKID / tenancy documents to a free demo subscription.

### Step 12 — Cost hygiene for 12‑month free

1. Stay on free SKUs where possible (F1 App Service, SQL free serverless, small Blob).
2. **Stop** Postgres / VMs when not in use.
3. Delete unused resource groups after experiments.
4. Review **Cost Management** weekly.
5. After month 1 credit expires, free monthly amounts continue for eligible services for the rest of the 12 months — usage above those amounts is billed pay‑as‑you‑go.

---

## 4. Production vs free-tier reality check

| Requirement from project docs | Free Azure demo | Real production |
| --- | --- | --- |
| HK data residency | East Asia region | East Asia + HA policy approval |
| 99.95% uptime / DR | Not on F1 | Multi-AZ App Service / AKS + geo backup |
| ISO 27001 / gov security | Shared free infrastructure | Enterprise controls, pen tests, private networking |
| Elasticsearch + OCR/AI | Usually omitted | AI Search / custom workers / Cognitive Services |
| SMS OTP / iAM Smart | Mock or Twilio trial | Licensed gov integrations |
| Peak April/October load | Not applicable | Capacity planning + autoscale |

**Recommendation**

1. Build the app first (API + web pilot).
2. Use **Azure East Asia** free / low-cost resources for demos and UAT with synthetic data.
3. Use **Railway only** if you want the absolute fastest throwaway prototype and accept Singapore residency.
4. For real Housing Authority production: plan a compliant HK cloud / on‑prem architecture (AKS or App Service Environment, private networking, Key Vault, WAF, DR) — not hobby free tier.

---

## 5. What to build next in this repo

Before any host can run this project for real, the repo needs at least:

1. ASP.NET Core / .NET 9 API project
2. Next.js web app
3. Database migrations (SQL Server or PostgreSQL)
4. `.env.example` + Dockerfile / `docker-compose.yml`
5. GitHub Actions deploy workflow for Azure

If you want, the next step can be scaffolding that stack so Azure/Railway deploy becomes a real `git push` instead of a plan.
