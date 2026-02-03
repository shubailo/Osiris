# PLAN: Advanced Extraction & Synthesis Suite (Phase 9)

## 🎯 Goal
Transform IRIS into a fully interactive meta-analysis workstation by implementing context-aware AI extraction, an editable synthesis table, and a smart split-view PDF verification system.

## 🛠️ Architecture Changes

### 1. Dynamic Extraction Engine
- **Logic**: Modify the extraction prompt to first read the "Screening Results" (PICO criteria) and adapt the extraction fields accordingly.
- **Fields**: Expand to include specific statistical metrics (SE, Variance, HR) and flow participants (Randomized vs Analyzed).

### 2. Tabular Synthesis View (Excel-style)
- **Component**: `SynthesisTable` using `tanstack/react-table` with inline editing.
- **Features**:
  - Direct cell editing (patches the JSON in the database).
  - Column filtering/sorting by study design, year, or risk of bias.
  - "Calculated" cells (derived from other values) visually marked with an info icon.

### 3. Split-View Verification Editor
- **Layout**: 50/50 split (PDF | Extraction Editor).
- **Auto-Highlight**: Implementation using PDF.js text coordinates stored during AI extraction.
- **Sync**: Clicking an extraction field scrolls the PDF to the relevant evidence block.

## 📋 Task Breakdown

### Phase 1: AI Prompt & Schema Expansion
- [ ] Update `ExtractedData` interface to support dynamic stats and PICO-linked fields.
- [ ] Refine `EXTRACTION_PROMPT` to include "derived_data_hints" and "text_coordinates" (for highlighting).
- [ ] Add `ai_provider` and `decided_at` tracking for every cell edit.

### Phase 2: Editable Synthesis Table (Option C)
- [ ] Create `SynthesisTable.tsx` with inline editing capabilities.
- [ ] Implement statistical derivation logic (e.g., SE from P-value).
- [ ] UI: Mark derived cells with a distinct border/icon and tooltip: "Derived by IRIS".

### Phase 3: "Smart" Verification View (Option D)
- [ ] Implement `PDFVerificationView` using split-pane layout.
- [ ] Integration: Hook into AI extraction to store `page_number` and `rect` for key data points.
- [ ] Clicking a field in the sidebar triggers `pdfViewer.scrollPageIntoView`.

### Phase 4: Data Integration & Export
- [ ] Implement CSV Export of the entire synthesis table.
- [ ] Multi-article batch extraction trigger in the UI.

## 🧪 Verification Plan

### Automated
- `npx tsc --noEmit` to ensure type safety of new statistical interfaces.
- Unit tests for the "Derived Statistics" math engine.

### Manual
1. Extract data from 3 sample PDFs.
2. Edit a value in the Synthesis Table -> Verify DB update.
3. Use Verification Mode -> Ensure PDF scrolls to the correct section.
4. Export to CSV -> Open in Excel/R to verify format.

## 👥 Agent Assignments
| Agent | Task |
|-------|------|
| `backend-specialist` | AI Prompt Refinement & Statistics Engine |
| `frontend-specialist` | Editable Synthesis Table & PDF Split View |
| `test-engineer` | Accuracy validation & CSV integrity checks |
