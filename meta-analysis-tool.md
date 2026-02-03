# Meta-Analysis AI Assistant - Complete Implementation Plan

**Project Type:** DESKTOP (Electron + React)  
**Platform:** Windows Only  
**AI Strategy:** Hybrid Local-First (Ollama) + Cloud Fallback (OpenRouter)

---

## Overview

Transform existing Next.js meta-analysis dashboard (`dashboard-ui/`) into a **Windows desktop application** for medical researchers conducting systematic reviews and meta-analyses. The tool will feature:

- **AI Council Screening:** Multiple local LLMs vote on article inclusion/exclusion
- **Smart Data Extraction:** AI-powered extraction of PICO, outcomes, statistics from full-text PDFs
- **Privacy-First:** Local processing by default, cloud upgrade for difficult cases
- **Offline Capable:** Works without internet after model download
- **Export Ready:** PRISMA diagrams, RevMan CSV, forest plots

**Target Users:** Solo medical researchers performing systematic reviews post-title/abstract screening phase.

---

## Success Criteria

- [ ] **Screening Efficiency:** Process 50 full-text PDFs in <30 minutes using local AI
- [ ] **Extraction Accuracy:** ≥90% accuracy vs manual gold standard on PICO extraction
- [ ] **Offline Capability:** 100% functional offline (except cloud fallback feature)
- [ ] **Windows Installer:** One-click `.exe` installer <100MB (excluding AI models)
- [ ] **Cost-Effective:** Cloud fallback costs <$5/month for typical usage (100 articles)
- [ ] **Startup Performance:** App launches in <5 seconds on modern Windows PC

---

## Tech Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Desktop Shell** | Electron 33+ | Mature, large ecosystem, easy React integration |
| **UI Framework** | React 19 (existing) | Preserve existing dashboard-ui components |
| **Styling** | Tailwind v4 + shadcn/ui | Already implemented in dashboard-ui |
| **Database** | better-sqlite3 | Fast, embedded, no server needed |
| **PDF Processing** | pdf-parse + pdf.js | Robust text extraction + rendering |
| **Local AI** | Ollama (Llama 3.3 70B, Mistral Large, Gemma 2 27B) | Open-source, council approach |
| **Cloud AI** | OpenRouter (GPT-4, Claude 3.5, Gemini Pro) | Best-in-class models, unified API |
| **Build Tool** | electron-builder | Windows NSIS installer generation |
| **State Management** | React useState + Context | Simple, no over-engineering |
| **IPC** | Electron IPC with typed bridge | Type-safe renderer ↔ main communication |

**Why Electron over Tauri?** Larger ecosystem, better PDF handling libraries, easier Windows code signing.

---

## File Structure

```
Osiris/
├── dashboard-ui/                    # React frontend (existing)
│   ├── app/
│   │   ├── page.tsx                # Main dashboard (MODIFY)
│   │   └── layout.tsx              # Root layout (MODIFY for Electron)
│   ├── components/
│   │   ├── screening-view.tsx      # AI screening UI (MODIFY)
│   │   ├── extraction-view.tsx     # Data extraction UI (MODIFY)
│   │   ├── setup-view.tsx          # PDF upload (MODIFY)
│   │   ├── analysis-view.tsx       # Export/PRISMA (MODIFY)
│   │   ├── settings-view.tsx       # NEW: AI provider config
│   │   └── ai-status-widget.tsx    # NEW: Model health indicator
│   ├── lib/
│   │   ├── ai/
│   │   │   ├── ollama-client.ts    # NEW: Ollama integration
│   │   │   ├── council.ts          # NEW: Multi-model consensus
│   │   │   ├── cloud-client.ts     # NEW: OpenRouter integration
│   │   │   └── prompts.ts          # NEW: Screening/extraction prompts
│   │   ├── db/
│   │   │   ├── client.ts           # NEW: SQLite wrapper
│   │   │   ├── schema.sql          # NEW: Database schema
│   │   │   └── migrations.ts       # NEW: Schema versioning
│   │   ├── pdf/
│   │   │   ├── extractor.ts        # NEW: PDF text extraction
│   │   │   └── section-parser.ts   # NEW: Methods/Results detection
│   │   ├── export/
│   │   │   ├── prisma-diagram.ts   # NEW: SVG generation
│   │   │   ├── csv-exporter.ts     # NEW: RevMan format
│   │   │   └── pdf-report.ts       # NEW: Summary report
│   │   └── ipc/
│   │       └── renderer.ts         # NEW: Type-safe IPC client
│   ├── preload.ts                  # NEW: IPC bridge
│   └── package.json                # MODIFY: Add Electron deps
│
├── electron/                        # NEW: Electron main process
│   ├── main.ts                     # NEW: App lifecycle, window management
│   ├── ipc-handlers.ts             # NEW: Database/AI/File handlers
│   ├── ollama-manager.ts           # NEW: Ollama process control
│   ├── window.ts                   # NEW: Window configuration
│   └── updater.ts                  # NEW: Auto-update logic
│
├── resources/                       # NEW: App assets
│   ├── icon.ico                    # NEW: Windows app icon
│   └── installer/                  # NEW: NSIS installer scripts
│
├── scripts/                         # NEW: Build scripts
│   ├── build-windows.js            # NEW: electron-builder config
│   └── post-install.js             # NEW: Setup SQLite native deps
│
├── meta-analysis-tool.md           # THIS FILE
└── package.json                    # NEW: Root package.json for Electron
```

---

## Task Breakdown (4-Phase BMAD Workflow)

### PHASE 1: ANALYSIS & SETUP

**No code in this phase - Discovery and decisions only.**

#### Task 1.1: Environment Setup
**Agent:** `project-planner` | **Skill:** `clean-code`

**Objective:** Verify Windows development environment and dependencies.

- **INPUT:** Clean Windows machine with Node.js
- **OUTPUT:** Verified installation of Node 20+, pnpm, Ollama
- **VERIFY:** 
  - `node --version` → v20+
  - `ollama --version` → v0.1.0+
  - `pnpm --version` → v9+

**Dependencies:** None

---

#### Task 1.2: Codebase Audit
**Agent:** `frontend-specialist` | **Skill:** `frontend-design`

**Objective:** Analyze existing dashboard-ui for Electron compatibility.

- **INPUT:** Existing `dashboard-ui/` Next.js codebase
- **OUTPUT:** List of incompatible Next.js features (SSR, API routes, etc.)
- **VERIFY:** Document created with migration blockers

**Dependencies:** None

---

#### Task 1.3: AI Model Selection
**Agent:** `backend-specialist` | **Skill:** `nodejs-best-practices`

**Objective:** Finalize which local models to use for AI Council.

**Decision Points:**
- Model size vs accuracy tradeoff
- Hardware requirements for target users
- Download size (models + app bundle)

- **INPUT:** Target user hardware specs (16GB RAM recommended)
- **OUTPUT:** Confirmed model list: Llama 3.3 70B, Mistral Large, Gemma 2 27B
- **VERIFY:** Models tested on Windows with sample medical article

**Dependencies:** Task 1.1 (Ollama installed)

---

### PHASE 2: PLANNING (OUTPUT: THIS FILE)

**This plan file serves as the planning deliverable.**

---

### PHASE 3: SOLUTIONING (Architecture & Design)

**No implementation yet - Design documents and architecture decisions.**

#### Task 3.1: Database Schema Design
**Agent:** `backend-specialist` | **Skill:** `database-design`

**Objective:** Design SQLite schema for projects, articles, screening, extraction.

- **INPUT:** Requirements from existing UI components
- **OUTPUT:** `lib/db/schema.sql` with full schema + indexes
- **VERIFY:** Schema supports all UI operations (CRUD for articles, decisions, extractions)

**Dependencies:** Task 1.2 (UI audit complete)

---

#### Task 3.2: IPC Contract Definition
**Agent:** `backend-specialist` | **Skill:** `api-patterns`

**Objective:** Define type-safe IPC interface between renderer and main process.

- **INPUT:** UI requirements (what operations need backend?)
- **OUTPUT:** TypeScript interfaces for all IPC channels
- **VERIFY:** Types compile, cover all UI→Main interactions

**Dependencies:** Task 3.1 (Database schema finalized)

---

#### Task 3.3: AI Prompt Engineering
**Agent:** `backend-specialist` | **Skill:** `nodejs-best-practices`

**Objective:** Design prompts for screening and extraction optimized for medical articles.

**Prompts needed:**
1. **Screening Prompt:** PICO criteria → Include/Exclude decision
2. **Extraction Prompt:** Full-text → Structured data (PICO, n, outcomes, stats)
3. **Quality Assessment Prompt:** Risk of bias evaluation

- **INPUT:** Sample medical RCT PDFs + PICO criteria
- **OUTPUT:** `lib/ai/prompts.ts` with versioned prompts
- **VERIFY:** Test prompts with Llama 3.3 on 5 sample articles, validate JSON output

**Dependencies:** Task 1.3 (Models selected)

---

### PHASE 4: IMPLEMENTATION

**Execution priority:** Database → IPC → PDF → AI → UI

---

#### Task 4.1: Electron Project Setup
**Agent:** `backend-specialist` | **Skill:** `nodejs-best-practices`

**Objective:** Initialize Electron with React renderer.

**Actions:**
- Create `electron/` directory
- Setup electron-builder config for Windows
- Configure webpack for main + preload
- Create basic window with React dev server

- **INPUT:** Existing `dashboard-ui/` Next.js app
- **OUTPUT:** Electron app launches with React UI
- **VERIFY:** `pnpm electron:dev` → App window opens with dashboard

**Dependencies:** Task 2 (Plan approved)

**Parallel:** Can run with Task 4.2

---

#### Task 4.2: Database Layer Implementation
**Agent:** `backend-specialist` | **Skill:** `database-design`

**Objective:** Implement SQLite database client with migrations.

**Actions:**
- Install `better-sqlite3`
- Create `lib/db/client.ts` with type-safe queries
- Implement schema migrations
- Add seed data for development

- **INPUT:** `lib/db/schema.sql` from Task 3.1
- **OUTPUT:** Functional database client with CRUD operations
- **VERIFY:** 
  - Create project → Query returns project
  - Add article → Foreign key constraints work
  - Run migration twice → No errors

**Dependencies:** Task 3.1 (Schema designed)

**Parallel:** Can run with Task 4.1

---

#### Task 4.3: IPC Bridge Implementation
**Agent:** `backend-specialist` | **Skill:** `nodejs-best-practices`

**Objective:** Create type-safe IPC communication layer.

**Actions:**
- Create `preload.ts` with `contextBridge`
- Implement `electron/ipc-handlers.ts` for all channels
- Create `lib/ipc/renderer.ts` typed client
- Add error handling and validation

- **INPUT:** IPC contracts from Task 3.2
- **OUTPUT:** Working IPC for database operations
- **VERIFY:** 
  - Renderer calls `window.electron.getArticles()` → Returns data from SQLite
  - Invalid params → Proper error message

**Dependencies:** 
- Task 4.1 (Electron running)
- Task 4.2 (Database working)
- Task 3.2 (IPC contracts defined)

**Serial:** Must wait for 4.1 and 4.2

---

#### Task 4.4: PDF Text Extraction
**Agent:** `backend-specialist` | **Skill:** `nodejs-best-practices`

**Objective:** Extract full text and metadata from uploaded PDFs.

**Actions:**
- Install `pdf-parse` and `pdf.js`
- Create `lib/pdf/extractor.ts`
- Implement section detection (Abstract, Methods, Results, Discussion)
- Handle scanned PDFs (OCR fallback with Tesseract.js)

- **INPUT:** Sample medical PDFs (RCTs, meta-analyses)
- **OUTPUT:** Extracted text with detected sections
- **VERIFY:**
  - Upload PDF → Full text extracted
  - Abstract section correctly identified
  - Scanned PDF → OCR activates, text extracted (slower)

**Dependencies:** Task 4.1 (Electron file system access)

**Parallel:** Can run with Task 4.2, 4.3

---

#### Task 4.5: Ollama Integration
**Agent:** `backend-specialist` | **Skill:** `nodejs-best-practices`

**Objective:** Connect to local Ollama instance and manage models.

**Actions:**
- Create `lib/ai/ollama-client.ts`
- Implement health check (ping Ollama API)
- Add model download with progress tracking
- Handle model switching and concurrent inference

- **INPUT:** Ollama running on `localhost:11434`
- **OUTPUT:** Functional Ollama client
- **VERIFY:**
  - Health check → Returns true if Ollama running
  - Download Llama 3.3 → Progress bar updates
  - Send prompt → Receives streamed response

**Dependencies:** 
- Task 1.1 (Ollama installed)
- Task 4.1 (Electron IPC for progress updates)

**Parallel:** Can run with Task 4.4

---

#### Task 4.6: AI Council Implementation
**Agent:** `backend-specialist` | **Skill:** `nodejs-best-practices`

**Objective:** Orchestrate 3 models to vote on article screening.

**Actions:**
- Create `lib/ai/council.ts`
- Implement parallel model inference
- Add consensus algorithm (majority vote + confidence weighting)
- Handle timeouts and model failures

**Algorithm:**
```typescript
// All 3 models vote independently
const votes = await Promise.all([
  ollamaClient.screen(article, 'llama3.3:70b'),
  ollamaClient.screen(article, 'mistral-large'),
  ollamaClient.screen(article, 'gemma2:27b')
]);

// Majority wins
const decision = votes.filter(v => v.decision === 'include').length >= 2 
  ? 'include' : 'exclude';

// Confidence = % agreement × avg model confidence
const confidence = (votesForDecision / 3) * avgConfidence;
```

- **INPUT:** Article text + PICO criteria
- **OUTPUT:** Decision (include/exclude) + confidence + reasoning
- **VERIFY:**
  - 3 models agree → 100% confidence
  - 2 agree, 1 disagrees → 67% confidence
  - 3-way split → Decision logged asneeds-review

**Dependencies:**
- Task 4.5 (Ollama client working)
- Task 3.3 (Prompts designed)

**Serial:** Must wait for 4.5

---

#### Task 4.7: Cloud AI Fallback
**Agent:** `backend-specialist` | **Skill:** `api-patterns`

**Objective:** Integrate OpenRouter for cloud AI upgrade option.

**Actions:**
- Create `lib/ai/cloud-client.ts`
- Add API key encryption (electron-store)
- Implement same interface as Ollama client
- Add cost tracking per request

- **INPUT:** OpenRouter API key
- **OUTPUT:** Cloud screening/extraction capability
- **VERIFY:**
  - Send article to GPT-4 via OpenRouter → Receives decision
  - API key stored encrypted → Not visible in plaintext
  - Cost tracker increments → Shows "$0.15" after request

**Dependencies:** Task 4.1 (Electron secure storage)

**Parallel:** Can run with Task 4.6

---

#### Task 4.8: Setup View Migration
**Agent:** `frontend-specialist` | **Skill:** `react-best-practices`

**Objective:** Adapt Setup view for Electron file system.

**Actions:**
- Modify `components/setup-view.tsx`
- Replace Next.js file upload with Electron native dialog
- Save uploaded PDFs to app data directory
- Trigger PDF extraction on upload
- Store article metadata in SQLite

- **INPUT:** Existing `setup-view.tsx`
- **OUTPUT:** Functional PDF upload with extraction
- **VERIFY:**
  - Click "Browse Files" → Native Windows file dialog opens
  - Select PDF → File copied to `AppData/meta-analysis/pdfs/`
  - Text extraction runs → Article appears in database

**Dependencies:**
- Task 4.3 (IPC working)
- Task 4.4 (PDF extraction ready)
- Task 4.2 (Database ready)

**Serial:** Must wait for 4.2, 4.3, 4.4

---

#### Task 4.9: Screening View AI Integration
**Agent:** `frontend-specialist` | **Skill:** `react-best-practices`

**Objective:** Connect screening UI to AI Council.

**Actions:**
- Modify `components/screening-view.tsx`
- Add "Start AI Screening" button handler
- Show progress for multi-article batch
- Display individual model votes (expandable)
- Add manual override buttons

- **INPUT:** Articles in "pending" state
- **OUTPUT:** AI decisions with reasoning
- **VERIFY:**
  - Click "Start AI Screening" → Progress shows "Model 1/3... 2/3... 3/3..."
  - Decision appears with confidence badge
  - Expand article → See individual model votes
  - Click "Manual Override: Include" → Overrides AI decision

**Dependencies:**
- Task 4.6 (AI Council ready)
- Task 4.3 (IPC ready)

**Serial:** Must wait for 4.6

---

#### Task 4.10: Extraction View Implementation
**Agent:** `frontend-specialist` | **Skill:** `react-best-practices`

**Objective:** AI-powered data extraction from included articles.

**Actions:**
- Modify `components/extraction-view.tsx`
- Create extraction form (PICO, sample size, outcomes, statistics)
- Add "Extract with AI" button
- Pre-fill form with AI-extracted data
- Allow manual editing before saving

- **INPUT:** Included articles with full text
- **OUTPUT:** Structured extracted data
- **VERIFY:**
  - Select article → Click "Extract with AI"
  - Form pre-fills with PICO elements
  - Edit outcome manually → Saves to database
  - View "Extracted Data Summary" tab → Shows all extractions

**Dependencies:**
- Task 4.6 (AI Council for extraction prompts)
- Task 4.4 (PDF text available)
- Task 4.3 (IPC ready)

**Serial:** Must wait for 4.6

---

#### Task 4.11: Settings View Creation
**Agent:** `frontend-specialist` | **Skill:** `frontend-design`

**Objective:** Build settings page for AI provider configuration.

**New component:** `components/settings-view.tsx`

**Sections:**
1. **AI Provider Selection**
   - Radio buttons: Local Only | Cloud Only | Hybrid
2. **Local Models Management**
   - Checkboxes for council models
   - Download button with progress
   - Model health status (🟢 Ready | 🔴 Not Downloaded)
3. **Cloud API Configuration**
   - OpenRouter API key input (password field)
   - Usage tracker ("150 articles this month: $7.50")
4. **Export Preferences**
   - Default format: RevMan XML | CSV | JSON
5. **Data Location**
   - Show database path
   - "Open Data Folder" button

- **INPUT:** None
- **OUTPUT:** Functional settings page
- **VERIFY:**
  - Navigate to Settings tab
  - Toggle "Hybrid" mode → Saved to electron-store
  - Enter API key → Stored encrypted
  - Click "Download Llama 3.3" → Progress bar appears

**Dependencies:**
- Task 4.5 (Ollama model management)
- Task 4.7 (Cloud API key storage)
- Task 4.1 (Electron store)

**Serial:** Must wait for 4.5, 4.7

---

#### Task 4.12: PRISMA Diagram Generation
**Agent:** `frontend-specialist` | **Skill:** `frontend-design`

**Objective:** Auto-generate PRISMA flow diagram from screening data.

**Actions:**
- Create `lib/export/prisma-diagram.ts`
- Query database for counts (screened, included, excluded)
- Generate SVG using D3.js or plain SVG template
- Embed in Analysis view

- **INPUT:** Screening decisions from database
- **OUTPUT:** PRISMA diagram SVG
- **VERIFY:**
  - Analysis view → PRISMA diagram shows correct counts
  - Export as PNG → Image saved to disk
  - Counts update when article decisions change

**Dependencies:**
- Task 4.2 (Database with screening data)
- Task 4.3 (IPC to query database)

**Parallel:** Can run with Task 4.9, 4.10

---

#### Task 4.13: CSV Export for RevMan
**Agent:** `backend-specialist` | **Skill:** `nodejs-best-practices`

**Objective:** Export extracted data in RevMan-compatible CSV format.

**Actions:**
- Create `lib/export/csv-exporter.ts`
- Map extracted data to RevMan columns
- Add file save dialog (Electron)
- Support batch export (all included articles)

**RevMan CSV Columns:**
```
Study ID, Year, Authors, Intervention, Control, Outcome, n (Intervention), 
n (Control), Mean (Intervention), SD (Intervention), Mean (Control), SD (Control)
```

- **INPUT:** Extracted data from database
- **OUTPUT:** CSV file saved to user-selected location
- **VERIFY:**
  - Click "Export CSV" in Analysis view
  - File dialog opens → Select location
  - CSV file created → Open in Excel, verify data integrity
  - Import into RevMan → No errors

**Dependencies:**
- Task 4.2 (Database with extracted data)
- Task 4.3 (IPC for file dialog)

**Parallel:** Can run with Task 4.12

---

#### Task 4.14: Windows Installer Build
**Agent:** `backend-specialist` | **Skill:** `deployment-procedures`

**Objective:** Create Windows NSIS installer.

**Actions:**
- Configure `electron-builder` for Windows
- Create app icon (`resources/icon.ico`)
- Setup auto-updater (electron-updater)
- Add NSIS installer script
- Code signing (optional, requires certificate)

**Installer Features:**
- Install to `C:\Program Files\Meta-Analysis AI`
- Create desktop shortcut
- Add to Windows Start Menu
- Auto-check for updates on launch

- **INPUT:** Compiled Electron app
- **OUTPUT:** `dist/Meta-Analysis-AI-Setup.exe`
- **VERIFY:**
  - Run `pnpm build:windows`
  - Installer created (~80MB)
  - Install on clean Windows VM
  - App launches, no errors
  - Desktop shortcut works

**Dependencies:** All previous tasks (app complete)

**Serial:** Must wait for all implementation tasks

---

### PHASE X: VERIFICATION (FINAL)

**All checks must pass before project is complete.**

---

#### Verification 1: Lint & Type Check
**Agent:** `backend-specialist`

```powershell
cd dashboard-ui
pnpm lint
pnpm tsc --noEmit
```

**Expected:** Zero errors, zero warnings.

---

#### Verification 2: Security Scan
**Agent:** `security-auditor` | **Skill:** `vulnerability-scanner`

```powershell
python .agent/skills/vulnerability-scanner/scripts/security_scan.py .
```

**Checks:**
- No hardcoded secrets (API keys in plaintext)
- Dependencies have no critical CVEs
- Electron security best practices (contextIsolation, nodeIntegration: false)

**Expected:** No critical or high-severity issues.

---

#### Verification 3: Database Integrity
**Manual Test**

1. Create project → Add 10 articles
2. Run AI screening on all
3. Extract data from 5 included articles
4. Close app
5. Reopen app
6. **Verify:** All data persists, no corruption

**Expected:** All 10 articles visible, decisions and extractions intact.

---

#### Verification 4: End-to-End AI Workflow
**Agent:** `frontend-specialist`

**Test Cases:**

**Test 4a: Local AI Screening**
1. Start app with Ollama running
2. Upload 5 medical RCT PDFs
3. Settings → Verify "Local Only" mode
4. Screening → Click "Start AI Screening"
5. **Verify:**
   - Progress shows 3 models per article (15 total inferences)
   - All articles get decisions
   - Confidence scores present
   - Reasoning provided
   - Individual votes viewable

**Test 4b: Cloud Fallback**
1. Settings → Switch to "Hybrid" mode
2. Enter OpenRouter API key
3. Upload complex meta-analysis PDF
4. Screening → Start AI
5. If confidence <75%, popup appears: "Upgrade to Cloud?"
6. Click "Yes"
7. **Verify:**
   - Decision updates with cloud provider badge
   - Confidence improves
   - Cost shown ("$0.12 for this article")

**Test 4c: Data Extraction**
1. Select included article
2. Extraction → Click "Extract with AI"
3. **Verify:**
   - PICO fields pre-filled correctly
   - Sample sizes numeric
   - Outcomes parsed into structured list
   - Statistics extracted (mean, SD, p-value)

**Expected:** All tests pass without errors.

---

#### Verification 5: Export Workflow
**Manual Test**

1. Complete screening + extraction for 10 articles
2. Analysis → Generate PRISMA diagram
3. **Verify:** Counts correct (e.g., "10 screened, 6 included, 4 excluded")
4. Export CSV
5. **Verify:** CSV opens in Excel, all extracted data present
6. Import into RevMan
7. **Verify:** No import errors

**Expected:** PRISMA diagram accurate, CSV import clean.

---

#### Verification 6: Windows Installation
**Test on Clean VM**

1. Create Windows 10/11 VM (no dev tools)
2. Run `Meta-Analysis-AI-Setup.exe`
3. **Verify:**
   - Installs without admin prompt (or prompts once)
   - Desktop shortcut created
   - App launches in <5 seconds
4. **Verify Ollama Prompt:**
   - If Ollama not installed, app shows friendly prompt:
     - "Local AI not detected. Install Ollama for privacy-first processing."
     - [Download Ollama] button → Opens browser
5. Install Ollama → Restart app
6. **Verify:** App detects Ollama, shows "🟢 Local AI Ready"

**Expected:** Smooth installation for non-technical user.

---

#### Verification 7: Performance Benchmarks
**Agent:** `backend-specialist` | **Skill:** `performance-profiling`

**Benchmarks:**
1. **PDF Upload:** 50 PDFs (1MB each) → Upload + extraction in <2 minutes
2. **Local Screening:** 50 articles → Complete in <30 minutes (3 models × 50 articles)
3. **Data Extraction:** 20 articles → <10 minutes
4. **App Startup:** Cold start → <5 seconds to usable UI
5. **Database Query:** 500 articles → <100ms to load list

**Expected:** All benchmarks met on recommended hardware (16GB RAM, SSD).

---

#### Verification 8: Project Quality Checklist

- [ ] **No purple/violet colors in UI** (Purple Ban from frontend-specialist)
- [ ] **No standard template layouts** (Custom design principle)
- [ ] **Socratic Gate respected** (User questions answered before implementation)
- [ ] **Clean Code principles** (No over-engineering, self-documenting)
- [ ] **Accessibility** (Keyboard navigation, screen reader support for main features)
- [ ] **Error handling** (Graceful failures, user-friendly messages)

---

## Success Markers

| Milestone | Deliverable | Status |
|-----------|-------------|--------|
| **Phase 1** | Environment verified | [ ] |
| **Phase 2** | Plan approved | [ ] |
| **Phase 3** | Architecture designed | [ ] |
| **Phase 4** | Full implementation | [ ] |
| **Phase X** | All verifications pass | [ ] |

---

## Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Local models too slow** | Medium | High | Offer cloud-first option; reduce to 2 smaller models (Llama 3.2 8B + Mistral 7B) |
| **Ollama installation friction** | High | Medium | Clear setup wizard in app; link to Ollama installer |
| **PDF parsing fails (scanned PDFs)** | Medium | Medium | Fallback to OCR (Tesseract.js); warn user about accuracy drop |
| **Cloud API costs exceed budget** | Low | Medium | Hard monthly limit in settings; show cost before each request |
| **SQLite corruption** | Low | High | Auto-backup before migrations; export button in settings |
| **Windows Defender blocks installer** | Medium | High | Code signing certificate (costs $200/year) |

---

## Next Steps

**After plan approval:**

1. **User Review:** Confirm architecture decisions (especially AI model sizes)
2. **Start Phase 3:** Begin database schema design (Task 3.1)
3. **Parallel Track:** Setup Electron project (Task 4.1) while Phase 3 progresses
4. **Checkpoint:** After Phase 4 Foundation (Tasks 4.1-4.3), demo to user

**Estimated Timeline:** 3-4 weeks (assumes 1 developer, full-time)
- Phase 1-2: 1 day (planning/setup)
- Phase 3: 3-4 days (architecture/design)
- Phase 4: 14-18 days (implementation)
- Phase X: 3-4 days (verification + fixes)

---

## ✅ PHASE 2 COMPLETE

- [x] Plan file created: `meta-analysis-tool.md`
- [x] All required sections present
- [x] Task breakdown with INPUT→OUTPUT→VERIFY
- [x] Agent and skill assignments
- [x] Verification checklist (Phase X)
- [x] Dynamic naming convention followed
- [x] Date: 2026-02-02
