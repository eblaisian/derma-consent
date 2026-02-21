# DermaConsent — Strategic Roadmap & Market Analysis

> Source of truth for product strategy, competitive positioning, and feature prioritization.
> Last updated: 2026-02-14

---

## Table of Contents

1. [Market Opportunity](#1-market-opportunity)
2. [Regulatory Landscape](#2-regulatory-landscape)
3. [Competitor Analysis](#3-competitor-analysis)
4. [Pain Points](#4-pain-points)
5. [Feature Roadmap](#5-feature-roadmap)
6. [Pricing Strategy](#6-pricing-strategy)
7. [Revenue Model & Unit Economics](#7-revenue-model--unit-economics)
8. [Go-to-Market Strategy](#8-go-to-market-strategy)
9. [EU Expansion Opportunities](#9-eu-expansion-opportunities)
10. [Sources](#10-sources)

---

## 1. Market Opportunity

### German Aesthetic Medicine Market

| Metric | Value | Source |
|--------|-------|--------|
| Market size (2024) | ~USD 5.05B (invasive + non-invasive) | Spherical Insights |
| Projected revenue by 2030 | USD 12.85B | Grand View Research |
| CAGR (2025-2035) | 8.0%–17.6% | Market Research Future |
| European market share | 24.7% (largest in Europe) | Market Data Forecast |
| Surgical procedures (2023) | ~463,026 | Market Data Forecast |
| Non-surgical procedures (2023) | ~781,440 | Market Data Forecast |
| Non-invasive segment (2024) | USD 2.95B | Grand View Research |
| Global ranking for fillers | 3rd (after US, Brazil) | ISAPS |

### Practice Landscape

- **6,000+ dermatologists** in Germany, treating ~21M patients/year
- **3,500–4,000 outpatient practices** (KBV data)
- Growing share offer **IGeL (self-pay)** aesthetic services alongside GKV-insured care
- Aesthetic procedures (Botox, fillers, laser) are 100% self-pay — high revenue per patient
- **Rural vs. urban gap**: eastern Germany faces growing supply gaps (KoPra 2026)

### Digitization Rate

- **58% of dermatologists** do not offer telemedicine; only **5% use video consultations regularly**
- Adoption barriers: lack of knowledge (76%), lack of time (74%), insufficient remuneration (43%)
- ePA mandate (Oct 2025) is forcing digital adoption
- **Only ~42% of dermatologists offer any digital services** — massive greenfield opportunity

### TAM Estimate

At EUR 150–300/month SaaS pricing across 3,500–4,000 outpatient practices:
- **German TAM: EUR 6M–14M ARR**
- Adjacent market (other specialties doing aesthetic procedures, multi-location chains): 2-3x multiplier
- DACH expansion (Austria + Switzerland): +30-40% addressable market

---

## 2. Regulatory Landscape

### 2.1 Patientenrechtegesetz (Section 630e BGB)

- **Aufklarungspflicht (Duty to Inform)**: physician must inform patient about all circumstances essential to consent — nature, scope, risks, alternatives, success prospects
- **Personal oral conversation required** — written form only documents that conversation occurred
- **Timeliness**: for elective/aesthetic procedures, typically 24h+ before intervention
- **Documentation (630f BGB)**: must be in immediate temporal connection with treatment
- **Burden of proof (630h BGB)**: physician bears burden of proving proper consent was obtained
- **Aesthetic procedures carry stricter standard**: Bundesgerichtshof requires "schonungslose Aufklarung" (unsparing disclosure) for cosmetic procedures

### 2.2 DSGVO/GDPR for Medical Data

- Health data = "special categories" under Article 9 GDPR
- **Explicit informed consent** required for processing health data, **separate from treatment consent**
- BDSG Section 22 adds national-level organizational/technical safeguards
- **Before/after photos** = health data AND biometric data; require separate consent, secure storage, defined retention periods
- Patientendaten-Schutz-Gesetz (PDSG, Oct 2020) mandates strong data security within Telematikinfrastruktur

### 2.3 Berufsordnung fur Arzte

- Section 7: documentation of all treatment measures including consent
- Section 8: understandable information adapted to patient comprehension
- Digital forms and e-signatures legally permissible if meeting statutory requirements
- Telemedicine clarification now permitted with quality assurance

### Compliance Burden Summary

A dermatology practice must simultaneously satisfy:
1. BGB 630e — oral + documented informed consent (enhanced for cosmetic)
2. GDPR Article 9 + BDSG 22 — explicit consent for health data processing
3. Separate photo consent — health + biometric data
4. Berufsordnung documentation requirements
5. TI/ePA integration mandates (since Oct 2025)
6. State-level Arztekammer variations per Bundesland

---

## 3. Competitor Analysis

### Competitive Landscape

| Competitor | Type | Pricing | Strengths | Gaps |
|-----------|------|---------|-----------|------|
| **Thieme E-ConsentPro** | Incumbent (DACH) | Enterprise, opaque | 2,000+ legally vetted forms, 17 languages, hospital penetration | No aesthetic workflows, no photos, no billing, clunky UX |
| **Nelly Solutions** | Berlin startup (EUR 50M Series B) | EUR 99–299/mo | Modern UX, PVS integration, digital factoring, 1,200+ practices | Generic (no specialty), no photos, no aesthetic consent |
| **Idana** | German SaaS | EUR 106–154/doctor/mo | GDPR-compliant, strong questionnaire logic | Anamnesis only — no consent, no photos, no treatment planning |
| **medudoc** | eConsent-as-a-Service (DACH) | Enterprise, undisclosed | Video patient education, 50% time savings, 85% patient understanding | Hospital-focused, no aesthetic workflows, no photo management |
| **Doctolib** | Europe's largest (450K+ HCPs) | EUR 129–189/mo | Dominant booking, expanding to full PM | Not a consent solution, no dermatology features |
| **Samedi** | Berlin SaaS (15+ years) | EUR 100–300/mo est. | 70+ modules, TUV-certified, ISO 27001, 48K+ physicians | Generalist, basic forms, no aesthetic features |
| **Consentz** | UK aesthetic clinic software | ~GBP 59/mo (~EUR 70) | Treatment mapping, before/after photos, injectable tracking | **Not localized for Germany**, no Aufklarungsbogen, no TI/ePA |
| **Pabau** | UK practice management | GBP 200–500/mo | Comprehensive: consent, photos, stock, billing, CRM | **No German localization**, no TI/ePA, no PVS integration |

### Competitive Gap Matrix

| Feature | Thieme | Nelly | Idana | medudoc | Doctolib | Samedi | Consentz | Pabau | **DermaConsent** |
|---------|--------|-------|-------|---------|----------|--------|----------|-------|:---:|
| German legal consent forms | Yes | Partial | No | Yes | No | No | No | No | **Yes** |
| Aesthetic-specific workflows | No | No | No | Partial | No | No | Yes | Yes | **Yes** |
| Before/after photo mgmt | No | No | No | No | No | No | Yes | Yes | **Planned** |
| Treatment mapping | No | No | No | No | No | No | Yes | Yes | **Planned** |
| Injectable inventory | No | No | No | No | No | No | Yes | Yes | Future |
| Video patient education | No | No | No | Yes | No | No | No | No | Future |
| German PVS integration | Yes | Yes | Yes | Yes | Yes | Yes | No | No | Future |
| TI/ePA ready | Partial | No | No | No | Partial | No | No | No | Future |
| Financial/billing | No | Yes | No | No | Partial | No | Partial | Yes | Future |
| End-to-end encryption | No | No | Yes | No | No | No | No | No | **Yes** |
| Multi-language consent | 17 langs | No | No | No | No | No | No | No | **4 langs** |

**Key finding**: No solution in the German market combines legally compliant Aufklarungsbogen + aesthetic-specific workflows (photos, treatment mapping, injectable tracking) + German infrastructure integration (PVS, TI/ePA).

---

## 4. Pain Points

### 4.1 Documentation Burden
- Germany's requirements (BGB 630f) are among the strictest in Europe
- Paper consent = filing, storage, retrieval problems; lost forms = legal exposure
- Each aesthetic procedure requires individualized documentation (Botox zone A ≠ fillers zone B)

### 4.2 Dual Revenue Model Complexity
- GKV (statutory insurance) + private/IGeL self-pay = different documentation, coding, reimbursement
- Aesthetic = 100% self-pay, needs upfront collection, invoicing, potentially factoring
- Insurance-oriented PVS systems don't handle aesthetic billing well

### 4.3 Before/After Photo Management
- Clinically essential for tracking outcomes (injectables, laser, peels)
- Legally required for aesthetic documentation
- Currently: smartphone photos saved inconsistently, desktop folders, basic PVS attachments
- GDPR: each photo requires explicit consent, secure storage, defined retention

### 4.4 Treatment Planning for Injectables
- Botox/filler require unit tracking per injection point, batch numbers (adverse event traceability), multi-session planning
- No German PVS supports injection mapping or unit-level tracking

### 4.5 Inventory Management
- Injectables are expensive with expiration dates; need vial-level tracking, waste, per-patient usage
- Most practices use Excel or paper logs

### 4.6 Patient No-Shows & Communication
- Aesthetic procedures have high no-show rates
- Pre-procedure consent and education reduces no-shows + improves legal compliance
- Most handle this manually via phone

### 4.7 Multilingual Patients
- Germany's diverse population + aesthetic medical tourism
- Section 630e BGB requires consent in a language the patient understands
- Only Thieme offers multi-language (17); most tools are German-only

---

## 5. Feature Roadmap

### Priority 1 — Before/After Photo Documentation
**Impact**: High | **Effort**: Medium | **Revenue tier**: Professional

Encrypted photo capture tied to consent records. Standardized workflow:
- Guided capture with positioning overlays (face grid, body region markers)
- Side-by-side comparison with slider view
- GDPR-compliant: separate photo consent, encrypted at rest (E2E using practice keys), retention management
- Auto-tagged by patient, treatment, date, body region
- Batch number linkage for traceability

**Why it wins**: No German competitor offers this. Consentz/Pabau have it but lack German compliance. Thieme, Nelly, Idana, medudoc — none have photo management.

### Priority 2 — Treatment Protocol Mapping
**Impact**: High | **Effort**: Medium | **Revenue tier**: Professional

Visual treatment planning for injectable and procedure-based treatments:
- Anatomical face/body diagram with clickable injection points
- Per-point: product, units/ml, batch number, depth, technique
- Template library for common treatment patterns (crow's feet, nasolabial folds, etc.)
- Treatment summary auto-generated for consent record
- Historical comparison across sessions

**Why it wins**: Bridges the gap between consent documentation and clinical planning. No German tool offers this. Eliminates hand-drawn injection maps that practices currently use.

### Priority 3 — Pre-Appointment Digital Consent
**Impact**: High | **Effort**: Low | **Revenue tier**: Starter+

Patients complete consent forms at home before arriving:
- Secure link sent via email/SMS
- Patient reads procedure information, watches education content
- Signs digitally with timestamp and IP logging
- Practice reviews completion status before appointment
- Satisfies "timeliness" requirement (24h+ before elective procedures)

**Why it wins**: Reduces check-in time, improves legal compliance timing, reduces no-shows.

### Priority 4 — AI Risk Assessment Summaries
**Impact**: Very High | **Effort**: High | **Revenue tier**: Enterprise

AI-generated individualized risk summaries based on patient profile:
- Analyze patient medical history, allergies, medications
- Generate procedure-specific risk factors
- Flag contraindications before treatment
- Auto-populate risk sections of consent forms
- Audit trail of AI recommendations + physician overrides

### Priority 5 — GOA/EBM Billing Code Integration
**Impact**: High | **Effort**: Medium | **Revenue tier**: Professional+

Automated billing code lookup and invoice generation:
- Link consent forms to GOA billing codes
- Auto-calculate fees based on procedure + modifiers
- Generate IGeL-compliant invoices
- Export to PVS/billing systems

### Priority 6 — Multi-Session Treatment Plans
**Impact**: Medium | **Effort**: Medium | **Revenue tier**: Professional

Linked treatment sessions with progress tracking:
- Plan multi-session protocols (e.g., 3-session laser, 6-month filler plan)
- Track progress across sessions with photo comparison
- Automated reminders for next session
- Cumulative cost tracking and package pricing

### Priority 7 — Video-Based Patient Education
**Impact**: Medium | **Effort**: Low | **Revenue tier**: Professional

Educational content library:
- Procedure explanation videos (can partner with medudoc or create library)
- Embedded in pre-appointment consent flow
- Tracked viewing time for compliance documentation
- Multi-language support

### Priority 8 — ePA/TI Integration
**Impact**: High | **Effort**: High | **Revenue tier**: Enterprise

Integration with Germany's Telematikinfrastruktur:
- Sync consent documentation to ePA (mandatory since Oct 2025)
- KIM (secure email) for sending documents
- TI 2.0 cloud-based connector integration
- Requires gematik certification

### Priority 9 — Multi-Location Practice Management
**Impact**: High | **Effort**: Medium | **Revenue tier**: Enterprise

Centralized management for practice chains:
- Cross-location patient records
- Unified reporting and analytics
- Location-specific settings and staff
- Centralized consent template management

### Priority 10 — Compliance Reporting Dashboard
**Impact**: Medium | **Effort**: Low | **Revenue tier**: Professional+

Audit-ready compliance reports:
- Consent completion rates by procedure type
- DSGVO audit logs
- Data retention compliance tracking
- Export for Arztekammer audits
- Missing consent alerts

---

## 6. Pricing Strategy

### Tier Structure

| Tier | Price | Target | Key Features |
|------|-------|--------|--------------|
| **Free Trial** | EUR 0 / 14 days | All practices | Full feature access, onboarding |
| **Starter** | EUR 79/mo | Small practices, 1 location, ≤3 users | Digital consent forms, e-signatures, basic templates, pre-appointment consent, multi-language (4) |
| **Professional** | EUR 179/mo | Medium practices, 1 location, unlimited users | + Before/after photos, treatment mapping, compliance reports, GOA billing templates, video education |
| **Enterprise** | EUR 399+/mo | Multi-location, chains | + AI risk assessment, multi-location, TI/ePA integration, white-labeling, API access, SLA |

### Pricing Rationale

- **Nelly**: EUR 99–299/mo (generic, no specialty features)
- **Doctolib**: EUR 139–475/mo (booking + practice management)
- **Idana**: EUR 106–154/doctor/mo (anamnesis only)
- **Consentz**: ~EUR 70/mo (aesthetic-specific but UK-only)
- **Pabau**: EUR 230–580/mo (comprehensive but UK-only)

DermaConsent at EUR 79–399/mo positions competitively: cheaper than Nelly/Doctolib for comparable value, more specialized than generalists, and the only German-compliant aesthetic solution.

### Future Revenue Streams

| Stream | Model | Timeline |
|--------|-------|----------|
| Transaction fees (IGeL payments) | 1.5–3% per transaction | Phase 3 |
| Patient financing/BNPL | 3–5% per financed procedure | Phase 3 |
| AI add-on | EUR 49–99/mo per practice | Phase 2 |
| API access | Usage-based | Phase 3 |
| Template marketplace | Revenue share | Phase 3 |

---

## 7. Revenue Model & Unit Economics

### SaaS Benchmarks (HealthTech)

- Healthcare SaaS LTV/CAC ratios are **~2x those of general SaaS** (Bessemer)
- Tech-enabled healthcare services show **140% Net Dollar Revenue Retention** (vs. 101% SaaS median)
- Median time to $100M ARR: 10–11 years for health tech
- SaaS healthtech commands **5.5x–7x revenue multiples**
- Healthcare trial-to-paid conversion: **>21%** (vs. 2–5% typical freemium)
- Companies at $15–30M ARR get **40% of growth from expansion revenue**

### Stickiness Drivers

1. **Patient data lock-in**: consent history, photos, treatment plans = massive switching cost
2. **Staff training investment**: clinical workflows deeply embedded
3. **Regulatory compliance dependency**: validated for DSGVO/medical regulations
4. **Integration depth**: PVS, billing, TI connections
5. **Patient-facing touchpoints**: booking, consent, payment through platform

### Expansion Revenue Path

Following the proven **Doctolib playbook** ("land with booking, expand into EHR"):

**DermaConsent: "Land with consent, expand into practice OS"**

1. **Land**: Free trial → Starter (digital consent forms) — solve the compliance pain
2. **Expand**: Starter → Professional (photos, treatment mapping, billing) — solve the workflow pain
3. **Deepen**: Professional → Enterprise (AI, multi-location, TI) — become indispensable

---

## 8. Go-to-Market Strategy

### Phase 1: Land (Months 1–6)
- Target: 50 early-adopter practices in metropolitan areas (Berlin, Munich, Hamburg, Dusseldorf)
- Channel: direct outreach to aesthetic-focused dermatology practices
- Hook: "Replace paper consent with DSGVO-compliant digital consent in 15 minutes"
- Offer: Extended free trial (30 days) + white-glove onboarding
- KOL: partner with 2–3 prominent aesthetic dermatologists as design partners

### Phase 2: Grow (Months 6–18)
- Target: 200+ practices
- Channel: dermatology conference presence (DDG, DGDC, IMCAS), referral program
- Hook: "The only German-compliant aesthetic consent + photo documentation platform"
- Product: ship Priority 1–3 features (photos, treatment mapping, pre-appointment)
- Partnerships: PVS integrations (CGM M1, Medistar, Turbomed)

### Phase 3: Scale (Months 18–36)
- Target: 500+ practices, DACH expansion
- Channel: self-serve sign-up, partner channel (PVS resellers), content marketing
- Product: ship Priority 4–6 (AI, billing, multi-session)
- Revenue: layer in payment processing, patient financing
- Expansion: Austria, Switzerland

---

## 9. EU Expansion Opportunities

### European Health Data Space (EHDS)

- **Regulation (EU) 2025/327** entered into force March 26, 2025
- **Jan 2026**: All EHR vendors must certify for interoperability/security
- **March 2029**: First cross-border data exchanges operational
- **March 2031**: Medical images and lab results included
- Building EHDS-ready from day one = significant competitive moat

### ePA (Elektronische Patientenakte)

- Since Jan 15, 2025: all insurers must provide ePA (opt-out model)
- Since Oct 1, 2025: all providers **obligated** to use ePA
- Consent documentation synced to ePA = seamless compliance
- **No aesthetic-focused consent tool currently integrates with ePA**

### Expansion Priority

| Market | Timing | Rationale |
|--------|--------|-----------|
| **Germany** | Now | Primary market, regulatory moat, largest EU aesthetic market |
| **Austria** | Phase 3 (18mo) | DACH alignment, similar regulations, German language |
| **Switzerland** | Phase 3 (18mo) | Premium market, high willingness to pay, DSGVO-equivalent |
| **France** | Phase 4 (24mo+) | 2nd largest EU aesthetic market, Doctolib dominance requires differentiation |
| **Nordics** | Phase 4 (24mo+) | Digitally advanced, EHDS-ready, easy adoption |
| **UK** | Phase 5 (36mo+) | Strong aesthetic market, Consentz/Pabau incumbents, post-Brexit regulatory complexity |

### European Cosmetic Financing Market

- Valued at USD 7.74B (2024), projected USD 12.21B by 2032 (5.86% CAGR)
- BNPL for aesthetic procedures growing rapidly (millennial/Gen Z demand)
- Opportunity to integrate patient financing as platform feature

---

## 10. Sources

### Market Data
- [Germany Aesthetic Medicine Market — Spherical Insights](https://www.sphericalinsights.com/reports/germany-aesthetic-medicine-market)
- [Germany Aesthetic Medicine Market — Grand View Research](https://www.grandviewresearch.com/horizon/outlook/aesthetic-medicine-market/germany)
- [Germany Medical Aesthetics Market — Market Research Future](https://www.marketresearchfuture.com/reports/germany-medical-aesthetics-market-44967)
- [Europe Medical Aesthetics Market — Market Data Forecast](https://www.marketdataforecast.com/market-reports/europe-medical-aesthetics-market)
- [Europe Cosmetic Financing Market — Markets and Data](https://www.marketsandata.com/industry-reports/europe-cosmetic-financing-market)

### Regulatory
- [Section 630e BGB — Aufklarungspflicht](https://www.gesetze-im-internet.de/bgb/__630e.html)
- [Patientenrechtegesetz](https://www.patienten-rechte-gesetz.de/bgb-sgbv/aufklaerungspflichten.html)
- [GDPR Health Data Protection in Germany — Winheller](https://www.winheller.com/en/business-law/privacy-law/health-data-protection-germany.html)
- [Patient Data Protection Act — Endpoint Protector](https://www.endpointprotector.com/blog/all-you-need-to-know-about-germanys-patient-data-protection-act/)
- [Digital Health Laws Germany 2025-2026 — ICLG](https://iclg.com/practice-areas/digital-health-laws-and-regulations/germany)
- [Berufsordnung Arztekammer Nordrhein 2025](https://www.aekno.de/fileadmin/user_upload/aekno/downloads/2025/berufsordnung-2025.pdf)
- [Arztekammer Berlin — Aufklarungspflicht](https://www.aekb.de/recht/berufsrecht-berufsordnung/aerztliche-aufklaerungspflicht)

### Competitors
- [Thieme E-ConsentPro](https://thieme-compliance.de/en/e-consentpro)
- [Nelly Solutions EUR 50M Series B — TechCrunch](https://techcrunch.com/2025/01/14/nelly-raises-51-million-to-digitalize-medical-practices-across-europe/)
- [Nelly Pricing — OMR Reviews](https://omr.com/en/reviews/product/nelly-solutions/pricing)
- [Idana Pricing & Features — GetApp](https://www.getapp.com/healthcare-pharmaceuticals-software/a/idana/)
- [medudoc Patient Education Platform](https://medudoc.com/en/)
- [Doctolib Platform](https://about.doctolib.com/)
- [Doctolib Pricing](https://info.doctolib.de/preis/)
- [Doctolib Business Model Analysis](https://alexandre.substack.com/p/doctolib-the-all-in-one-solution)
- [Samedi Healthcare Software](https://www.samedi.com/en)
- [Consentz Aesthetic Clinic Software](https://www.consentz.com)
- [Pabau Aesthetic Software Comparison](https://pabau.com/blog/best-aesthetic-clinic-software/)

### Industry Research
- [German Dermatology Digital Health Survey — JDDG 2024](https://onlinelibrary.wiley.com/doi/10.1111/ddg.15454)
- [Dermatologists' Acceptance of Digital Health — JMIR 2025](https://humanfactors.jmir.org/2025/1/e59757/PDF)
- [KoPra 2026 — DDG](https://derma.de/presse/detail/kopra-2026-hautkliniken-in-deutschland-weltweit-fuehrend-in-krankenversorgung-und-forschung)
- [IGeL Individual Health Services — gesund.bund.de](https://gesund.bund.de/en/individual-health-services-igel)
- [AI in Private Practice 2025 — Intuition Labs](https://intuitionlabs.ai/articles/ai-adoption-private-medical-practice)
- [AMA AI Scribes Study](https://www.ama-assn.org/practice-management/digital-health/ai-scribes-save-15000-hours-and-restore-human-side-medicine)
- [AI in Dermatology 2026 — AMN Healthcare](https://www.amnhealthcare.com/blog/physician/perm/ai-in-dermatology-what-physicians-can-expect-in-2026/)

### EU/Infrastructure
- [EHDS Regulation (EU) 2025/327](https://health.ec.europa.eu/ehealth-digital-health-and-care/european-health-data-space-regulation-ehds_en)
- [EHDS Implementation Overview — Skadden](https://www.skadden.com/insights/publications/2025/06/the-european-health-data-space)
- [ePA for All — gematik](https://www.gematik.de/anwendungen/epa-fuer-alle)
- [Europe HealthTech Investment 2025 — SeedBlink](https://seedblink.com/blog/2025-05-30-europes-healthtech-investment-landscape-in-2025-a-deep-dive)

### Business Benchmarks
- [Bessemer Health Tech Benchmarks](https://www.bvp.com/atlas/benchmarks-for-growing-health-tech-businesses)
- [Scaling to $100M in Health Tech — Bessemer](https://www.bvp.com/atlas/how-to-scale-a-health-tech-business-to-100-million-arr-and-beyond)
- [2025 SaaS Benchmarks — High Alpha](https://www.highalpha.com/saas-benchmarks)
- [SaaS Freemium Conversion Rates — First Page Sage](https://firstpagesage.com/seo-blog/saas-freemium-conversion-rates/)
- [2026 SaaS AI Pricing Guide — Monetizely](https://www.getmonetizely.com/blogs/the-2026-guide-to-saas-ai-and-agentic-pricing-models)

### Case Studies
- [Nelly + Adyen Partnership](https://www.adyen.com/press-and-media/adyen-and-nelly-solutions-digitize-medical-practices-with-innovative-financial-platform)
- [Nelly + Volksbank EUR 100M](https://www.startbase.com/news/nelly-solutions-sichert-sich-100-millionen-euro-ankaufsvolumen-von-der-volksbank/)
- [Formel Skin Series A — Sifted](https://sifted.eu/articles/formel-skin-dermatology-germany)
- [dermanostic Funding — Startbase](https://www.startbase.com/news/5-millionen-euro-fuer-dermanostic)
- [Dermatology Startups Germany — Tracxn](https://tracxn.com/d/explore/dermatology-startups-in-germany/___BLOkIe3EtMPkTkt1aR6nFoHygkyZVlszrJik0N9izU/companies)
