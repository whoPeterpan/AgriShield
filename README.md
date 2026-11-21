# AgriShield — Digital Biosecurity Management Portal

**Tagline:** Assess. Act. Prove. Stay Safe.

AgriShield is an accessible, explainable, mobile-first JavaScript web application built for **pig and poultry farmers**, **veterinarians**, and **livestock authorities**. It helps small and medium farms assess biosecurity gaps, adapt priorities to local district conditions, track daily records even offline, build Compartment Readiness evidence, and coordinate early veterinary guidance.

---

## 1. What the Project Does
- **Farm Registration & Dashboard:** Farmers register pig or poultry farms (animal count, shed size, state, district) and track overall risk score, Compartment Readiness percentage, pending actions, recent visitor/cleaning records, and alerts.
- **FarmShield Local (Biosecurity Assessment):** Species-specific checklists (8 weighted pig controls, 8 weighted poultry controls) with transparent local district risk multipliers.
- **Personalised Action Plan & Biosecurity Pathshala:** Converts failing controls into top-3 ranked actions and provides 8 visual lessons with Do's/Don'ts, English/Hindi toggle, and optional browser text-to-speech.
- **Compartment-Ready Ladder & Evidence Locker:** Internal readiness milestones (**Bronze**, **Silver**, **Gold**) backed by logs and uploaded photos/documents.
- **Farm Record Management:** Searchable, filterable logs for visitors, cleaning/disinfection, mortality, animal movements, and daily observations with offline queueing and manual Sync.
- **Alerts & Silent Signals:** Separates **Official Demo Alerts**, **Anonymised Community Pattern Alerts** (`>= 3` distinct farms rule), and **Farm Signal Alerts** (rule-based checks on farm logs).
- **Veterinarian & Authority Dashboards:** Veterinarians manage assigned farm cases (`New`, `Under Review`, `Response Sent`, `Closed`) without automated disease diagnosis; Authorities view anonymised aggregate trends and manage demo district profiles and lessons.

---

## 2. Which Problem It Solves
Small and medium pig and poultry farms face severe economic losses from preventable biosecurity breakdowns (uncontrolled visitor entry, untreated swill feeding, wild bird entry, missing footbaths, and delayed veterinary advice). Paper checklists rarely adapt to local conditions, and farmers often lack simple tools to log daily hygiene or demonstrate readiness to buyers and vets.

---

## 3. Technologies Used and Why
- **React.js + Vite (JavaScript):** Fast, modular UI components easy for a second-year CSE student to read, maintain, and demonstrate.
- **Tailwind CSS:** Clean, responsive mobile-first styling without complex custom CSS files.
- **React Router (`react-router-dom`):** Multi-page navigation across Farmer, Veterinarian, and Authority workflows.
- **Recharts:** Clear bar and donut charts for category risk scores and district analytics.
- **Lucide React:** Simple, consistent line icons.
- **Supabase (PostgreSQL + Auth + Storage + RLS):** Structured relational database ideal for interconnected tables (`farms`, `audits`, `farm_logs`, `vet_cases`), plus secure role-based access protection.
- **Browser LocalStorage + `vite-plugin-pwa` + Web Speech API:** Enables offline assessment drafts, offline log queueing with Sync, installable PWA support, and optional voice read-aloud without paid external AI services.

---

## 4. How the Frontend Works
- `src/context/AppContext.jsx` manages the active user role, language (`en` / `hi`), offline connectivity/queue, and unified reads/writes (automatically using Supabase when configured or Local Demo Mode via `localStorage` otherwise).
- `src/components/Layout.jsx` provides a desktop sidebar (`256px`), mobile drawer, mobile bottom tab bar, language toggle, `PWAInstallButton`, and offline sync button.
- Business logic lives cleanly in pure JavaScript modules inside `src/utils/` so every calculation can be explained line by line.

---

## 5. How Supabase and PostgreSQL Are Used
- `src/lib/supabase.js` checks `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- Only the public **Anon Key** is used in the browser; service-role keys are never placed in frontend code.
- `supabase/schema.sql` provisions all 14 tables, foreign keys, `farm-evidence` storage bucket, Row Level Security (RLS) policies, and anonymised SQL views (`authority_district_summary`, `authority_community_patterns`).

---

## 6. How the Database Tables Are Connected
1. `profiles` extends `auth.users` with `role` (`farmer`, `veterinarian`, `authority`).
2. `farms` links to `profiles.id` via `owner_id` and `assigned_vet_id`.
3. `district_profiles` stores demonstration epidemiological pressures (`asf_risk_level`, `hpai_risk_level`, `seasonal_risk`).
4. `audit_templates` -> `audit_questions` define species-specific checklists.
5. `audits` -> `audit_answers` record farm assessments, multipliers, and scores.
6. `recommendations` stores personalised action items linked to `farms` and `audits`.
7. `lessons` & `lesson_completions` track Biosecurity Pathshala progress.
8. `farm_logs` & `evidence_items` store daily records and uploaded proof per `farm_id`.
9. `alerts`, `vet_cases`, and `community_reports` connect farms, veterinarians, and anonymised district patterns.

---

## 7. How the Risk-Score Calculation Works (With Numerical Example)
Implemented in `src/utils/riskScoring.js`:

Each applicable question has:
- `Yes` = `0%` of effective weight (0 risk points)
- `Partially` = `50%` of effective weight
- `No` = `100%` of effective weight
- `Not Applicable` = excluded from both numerator and denominator

$$\text{Risk Score} = \left(\frac{\text{Total Weighted Risk Points}}{\text{Total Applicable Weight}}\right) \times 100$$

### Numerical Example (3 Questions on a Pig Farm)
Suppose no local multipliers are active (`multiplier = 1.0`):
1. **Swill Control** (Weight `25`) -> Answer: `Yes` -> `25 × 0 = 0` pts
2. **Visitor Restrictions** (Weight `15`) -> Answer: `Partially` -> `15 × 0.5 = 7.5` pts
3. **Quarantine Pen** (Weight `20`) -> Answer: `No` -> `20 × 1.0 = 20` pts

- Total Weighted Risk Points = `0 + 7.5 + 20 = 27.5`
- Total Applicable Weight = `25 + 15 + 20 = 60`
- **Risk Score** = `(27.5 / 60) × 100 = 45.8` -> **46 / 100 (Moderate Risk)**

Prototype demonstration thresholds: `0–24 Low Risk`, `25–49 Moderate Risk`, `50–74 High Risk`, `75–100 Critical Risk`.

---

## 8. How Local Risk Adjustment Works
When a farmer switches districts in **FarmShield Audit**, `getLocalMultiplier()` in `src/utils/riskScoring.js` adjusts relevant weights:
- **High simulated ASF pressure (Pig farms):** Questions tagged `asf-sensitive` (swill feeding, quarantine, roaming pig contact, carcass disposal) increase by `+50%` (`×1.5`).
- **High simulated HPAI pressure (Poultry farms):** Questions tagged `hpai-sensitive` (wild bird mesh, visitor entry, footbaths, waste disposal) increase by `+50%` (`×1.5`).
- **High seasonal risk:** Questions tagged `seasonal-sensitive` (water hygiene, cleaning, drainage) add `+20%` (`+0.2`).

Because `effectiveWeight` changes for those specific controls, the **same farm** receives a higher risk score and higher-priority recommendations in a high-pressure demo district than in a low-pressure district.

---

## 9. How the Three Alert Categories Work
Implemented in `src/utils/alertEngine.js`:
1. **Official Alerts (Demo):** Simulated veterinary advisories showing source name and date, clearly labeled as `Demo Data`.
2. **Community Pattern Alerts (Anonymised):** Groups 14-day community observations by `district + species + pattern_type`. **Privacy rule:** an alert is ONLY displayed when `distinctFarmCount >= 3`. Clusters with 1 or 2 farms stay suppressed.
3. **Farm Signal Alerts:** Deterministic rules over a farm's own `farm_logs`:
   - Mortality spike (`>= max(3, 2% of herd)` in 7 days)
   - Missed cleaning (`> 3 days` without a cleaning log)
   - Missing visitor logs (`> 5 days` without a visitor entry)
   - Concerning observation keywords (`drop`, `lethargy`, `cough`, `refusal`, etc.)
   - Uses strictly non-diagnostic wording advising consultation with a veterinarian.

---

## 10. How to Run the Project Locally
```bash
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.

To create a production build:
```bash
npm run build
```

---

## 11. How to Configure Supabase (Optional)
The app works immediately in Local Demo Mode without environment variables. To connect a live Supabase PostgreSQL backend:
1. Create a free project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** and run `supabase/schema.sql`, then `supabase/seed.sql`.
3. Copy `.env.example` to `.env` and set:
   ```env
   VITE_SUPABASE_URL="https://your-project-id.supabase.co"
   VITE_SUPABASE_ANON_KEY="your-public-anon-key"
   ```
4. Restart `npm run dev`.

---

## 12. How to Access Demonstration Mode
On the welcome screen, click any one-tap Demo entry button:
- **Enter as Farmer (Demo)** — Explore Pig & Poultry farms, run FarmShield Local audits, test switching districts, log offline records, upload evidence, and submit vet cases.
- **Enter as Veterinarian (Demo)** — Review assigned farms, inspect recent farm logs, change case status, and send advisory responses.
- **Enter as Authority (Demo)** — View anonymised district trends, compare pig vs poultry scores, and edit demo district profiles or Pathshala lessons.

---

## 13. Current Limitations & Future Improvements
**Current Prototype Limitations**
- Risk thresholds (`0–24`, `25–49`, `50–74`, `75–100`) and district profiles are demonstration values, not clinically validated diagnostic thresholds.
- Bronze/Silver/Gold tiers track internal readiness only and do not confer official government compartment certification.

**Planned Future Improvements**
- Verified integration with state veterinary department advisories.
- Automated WhatsApp/SMS reminders for missed cleaning schedules.
- Multi-language regional voice packs beyond English and Hindi.

---

## Project Folder Structure
```text
├── public/
│   ├── icon.svg
│   ├── pwa-192x192.png
│   ├── pwa-512x512.png
│   ├── pwa-maskable-512x512.png
│   └── apple-touch-icon.png
├── supabase/
│   ├── schema.sql
│   └── seed.sql
├── src/
│   ├── components/
│   │   ├── Layout.jsx
│   │   └── PWAInstallButton.jsx
│   ├── context/
│   │   └── AppContext.jsx
│   ├── data/
│   │   └── demoData.js
│   ├── hooks/
│   │   ├── useOnlineStatus.js
│   │   └── usePWAInstall.js
│   ├── lib/
│   │   └── supabase.js
│   ├── pages/
│   │   ├── ActionPlanAndPathshala.jsx
│   │   ├── AlertsPage.jsx
│   │   ├── AssessmentPage.jsx
│   │   ├── AuthAndWelcome.jsx
│   │   ├── AuthorityDashboard.jsx
│   │   ├── FarmRecordsPage.jsx
│   │   ├── FarmRegistration.jsx
│   │   ├── FarmerDashboard.jsx
│   │   ├── ReadinessAndEvidence.jsx
│   │   └── VetCasesPage.jsx
│   ├── utils/
│   │   ├── alertEngine.js
│   │   ├── readinessLadder.js
│   │   ├── recommendations.js
│   │   ├── riskScoring.js
│   │   └── translations.js
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── index.html
├── vite.config.ts
└── README.md
```
