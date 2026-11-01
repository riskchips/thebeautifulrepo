# The Ugly Repo · Stellar Ops

**VIT-Stellar — Web & Tech Junior Core Recruitment, Round 1**

**Live demo:** [Open Stellar Ops on Vercel](https://the-ugly-repo.vercel.app)

The hosted version is a **read-only preview** of the intentionally buggy starter. Explore the dashboard, event catalogue, equipment, schedule and telemetry; price previews and the diagnostics workbench are available. Creating/cancelling bookings, changing equipment, saving preferences and resetting data are available in your local copy. Clone the repository and follow the setup below for the full debugging task.

A local event-operations dashboard for **Rovaris**, **Aerovate**, and **Celestial Dive**. It starts successfully, but numerous behaviours are intentionally wrong. Your job is to investigate the application, reproduce defects, and make verified repairs.

## Run locally

Requires **Node.js 22 or newer** and npm. No third-party packages, database, cloud services or API keys are required.

```sh
npm ci
npm start
```

Open **http://127.0.0.1:3000**. To use a different port on macOS/Linux: `PORT=3100 npm start`. On PowerShell: `$env:PORT=3100; npm start`.

```sh
npm test       # infrastructure smoke tests
npm run check  # JavaScript syntax checks
npm run dev    # restart the server when source changes
```

The smoke suite deliberately checks startup, API transport, request handling and persistence. **Passing it does not mean the business logic is correct.** Add regression tests for your own fixes.

## Your assignment

1. Read [SPEC.md](SPEC.md) for intended behaviour and [docs/API.md](docs/API.md) for request shapes.
2. Explore the UI, API, and domain modules. Use the workbench to run isolated operations against JSON arguments.
3. Reproduce meaningful defects and prioritise them. Fixes can involve capacity, state transitions, money, time zones, filtering, equipment, data analysis, or saved data.
4. Preserve the product's features and contracts. Do not remove features, weaken tests, or hard-code the demo inputs to hide failures.
5. Complete [BUG_REPORT.md](BUG_REPORT.md). For each claimed fix include reproduction, expected/actual results, root cause, affected files, and verification.
6. Record unresolved issues honestly. You are **not expected to fix every defect**; the quality and explanation of your repairs matter.

This is individual work. Be prepared to explain your code. Credit any third-party code, assets or libraries you use.

## Submission repository

Create a **new personal GitHub repository** and set its visibility to **Public**. Push all your source code, assets, tests, and documentation there. Confirm the public link opens while signed out. Do not push to this starter repository or open pull requests against it.

If you clone this starter, point your copy at your personal repository before pushing:

```sh
git clone https://github.com/aaditgarg01/TheUglyRepo.git
cd TheUglyRepo
```

Then run the following from inside your copy (replace the example URL with your own new, empty public repository):

```sh
git remote remove origin
git remote add origin https://github.com/YOUR-USERNAME/YOUR-NEW-REPO.git
git remote -v
git push -u origin main
```

Include your name, chosen task, setup instructions, implemented fixes, tests, known limitations, and screenshots or a short demonstration. A live deployment is optional and never replaces the public source repository.

## What is in the app?

| Area | Workflows |
| --- | --- |
| Overview | Event capacity, revenue, unique participants, preferences and audit activity |
| Event explorer | Search, tag intersections, availability and pagination |
| Booking desk | Quote, validate, confirm/waitlist, cancel and promote |
| Equipment | Stock, reservations, damaged units and bills of materials |
| Schedule | Overnight sessions, elapsed times, event windows and venue conflicts |
| Telemetry | Means, smoothing, peaks, distances and velocities |
| Workbench | Isolated access to every exported domain operation |
| Local store | Atomic queued writes, snapshots and migration utilities |

## Project map

```text
src/server.mjs      HTTP routes and static files
src/services.mjs    Composed event workflows
src/store.mjs       Serialised, atomic local persistence
src/domain/         Domain operations
public/             Browser interface (HTML/CSS/JavaScript)
data/seed.json      Fictional starting state
data/operations.json Workbench contracts and sample arguments
tests/              Public infrastructure and hosted-preview tests
api/index.mjs       Read-only Vercel function adapter
vercel.json         Hosting and API routing configuration
docs/API.md         API reference and example requests
```

## Demo conventions and reset

- The fixed demo clock is **10 January 2027, 10:00 IST**, independent of your computer clock. The example events occur later that month. Dates, venues, prices, and records are fictional and do not announce actual club events.
- Money is integer **paise**. Demo tax is **500 basis points (5%)**. `STELLAR10` is a sample coupon; eligibility is defined in the seed and specification. No payment is collected.
- All displayed dates use IST. Calculations use ISO instants with explicit offsets.
- Changes persist to ignored `data/local.json`. Use **Reset demo data** in Overview to restore the seed. Tests use temporary files and leave your local snapshot untouched.
- `.env.example` documents optional environment settings; it is not auto-loaded. Set variables through your shell. Never commit real secrets or student records.
- This intentionally defective sandbox is for local evaluation. Keep the default loopback host. It is not an authenticated production booking system, engineering calculator or hardware controller.

## Hosting

The public demo is deployed on Vercel at **https://the-ugly-repo.vercel.app**. The production preview always reads the fictional seed and rejects saved-data writes. Local `npm start` retains the full editable workflow and local persistence. The deliberate domain defects are the same in both modes.

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for the Vercel configuration. Applicants should work in their **own new public repository**, not this source repository. Only the source owner currently has write access; public visibility does not grant permission to push.

## Event context

**Rovaris:** a two-day rover-building and testing workshop.  
**Aerovate:** a two-day rocket-building, simulation and launching workshop.  
**Celestial Dive:** an overnight stargazing event.

The other recruitment task's reference project is [Celestial Dive](https://celestial-dive.vercel.app/) ([source](https://github.com/aaditgarg01/Celestial-Dive)). This task is a separate codebase created for VIT-Stellar recruitment.
