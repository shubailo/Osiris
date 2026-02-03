# PDF Extraction Test Suite

This directory contains sample medical research PDFs for testing the extraction pipeline.

## Test Cases

### 1. RCT (Randomized Controlled Trial)
- **Purpose**: Test extraction of clinical trial structure
- **Expected Sections**: Abstract, Introduction, Methods, Results, Discussion, Conclusion
- **Metadata**: Authors, Year, DOI, Journal

### 2. Meta-Analysis
- **Purpose**: Test extraction of systematic review structure
- **Expected Sections**: Abstract, Methods, Results (with forest plots), Discussion
- **Key Features**: PRISMA flow diagram, multiple studies referenced

### 3. Observational Study
- **Purpose**: Test cohort/case-control study structure
- **Expected Sections**: Abstract, Introduction, Methods, Results, Discussion

## Testing Procedure

1. Upload PDF via IRIS Setup tab
2. Verify PDF text extraction completes
3. Check extracted metadata (title, authors, year, DOI)
4. Verify section detection (abstract, methods, results, discussion)
5. Review full text quality

## Success Criteria

- ✅ Title extracted correctly (from metadata or first line)
- ✅ DOI detected when present
- ✅ Abstract section identified
- ✅ Methods section identified
- ✅ Results section identified
- ✅ No critical extraction errors

## Known Limitations

- Multi-column layouts may have reading order issues
- Tables and figures not extracted (text-only)
- References section may merge with discussion
- Non-standard section headers may not be detected
