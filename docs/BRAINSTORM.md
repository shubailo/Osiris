## 🧠 Brainstorm: IRIS System Enhancements v2.0

### Context
IRIS has reached a stable foundation with multi-model local AI screening, PDF extraction, and standard exports (PRISMA/RevMan). To move from a "tool" to a "powerhouse," we need to explore enhancements that deeper integrate into the researcher's workflow.

---

### Option A: Intelligent Search & "One-Click" Import
Instead of manually uploading PDFs, users enter a search query (as defined by their PICO criteria). IRIS connects to PubMed, ArXiv, or CrossRef APIs to fetch metadata and automatically download Open Access full-texts.

✅ **Pros:**
- Massive time-saver in the "Identification" phase of PRISMA.
- Ensures metadata accuracy (DOI, Journal, Year) directly from source.
- Automated deduplication during import.

❌ **Cons:**
- Requires handling of API rate limits and authentication.
- PDF scraping can be brittle due to paywalls.

📊 **Effort:** Medium

---

### Option B: Active Learning & Predictive Screening
Currently, screening is a batch process. In this mode, as the user manually reviews the "Needs Review" or "AI Split" decisions, IRIS uses that feedback to re-rank the remaining articles, putting "highly likely inclusions" at the top of the queue.

✅ **Pros:**
- Significantly reduces the time spent on screening irrelevant abstracts.
- AI becomes a personalized assistant that "learns" the nuance of the specific review.
- Increases consensus accuracy over time.

❌ **Cons:**
- Requires a local vector database (like ChromaDB) for semantic similarity.
- More complex UI to show "relevance scores."

📊 **Effort:** High

---

### Option C: Dynamic Synthesis & RoB Heatmaps
Move beyond static PRISMA diagrams. Implement an interactive "Synthesis" view where user can generate Forest Plots, Funnel Plots, and "Risk of Bias" (RoB 2.0) summary heatmaps based on extracted outcome data.

✅ **Pros:**
- Provides publication-ready visualizations directly in-app.
- Allows researchers to explore "Subgroup Analysis" by toggling filters.
- Bridges the gap between "Data Extraction" and "Manuscript Writing."

❌ **Cons:**
- Mathematics for meta-analysis (Standardized Mean Difference, Heterogeneity) must be precise.
- Requires complex SVG/Canvas visualization logic.

📊 **Effort:** Medium

---

### Option D: Human-in-the-Loop "Extraction Editor"
A side-by-side view where the PDF is shown next to the AI-extracted fields. Clicking a data point in the field highlights the corresponding text in the PDF.

✅ **Pros:**
- Critical for medical accuracy; allows instant verification of AI claims.
- Dramatically increases trust in the automated extraction.

❌ **Cons:**
- Requires a PDF viewer that supports text coordinate mapping.

📊 **Effort:** High

---

## 💡 Recommendation

**Option C + D** as a combined **"Synthesis & Verification Suite."** 

The biggest pain point in systematic reviews isn't just getting the data, but **verifying and visualizing** it. Option D makes IRIS a reliable assistant, and Option C makes it the final destination for the results.

What direction would you like to explore? (Or do you have an "Option E" in mind?)
