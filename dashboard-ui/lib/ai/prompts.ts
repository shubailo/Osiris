/**
 * AI Prompt Templates for Meta-Analysis Screening and Extraction
 * Optimized for medical research articles
 */

export interface PromptTemplate {
    version: string;
    model_requirements: string[];
    system_prompt: string;
    user_prompt_template: string;
    output_schema: any;
}

// =====================================================
// SCREENING PROMPT
// =====================================================

export const SCREENING_PROMPT: PromptTemplate = {
    version: '1.0',
    model_requirements: [
        'Supports JSON output',
        'Context window ≥ 8K tokens',
        'Medical domain knowledge preferred'
    ],

    system_prompt: `You are an expert systematic review screener assisting medical researchers.

Your task is to determine if a full-text article should be INCLUDED or EXCLUDED from a systematic review based on PICO criteria.

CRITICAL RULES:
1. BASE your decision ONLY on the PICO criteria provided
2. If the article meets ALL inclusion criteria → INCLUDE
3. If the article violates ANY exclusion criterion → EXCLUDE
4. When uncertain, err on the side of INCLUSION for manual review
5. Provide SPECIFIC reasoning citing article text
6. Be conservative but fair

OUTPUT FORMAT: Respond ONLY with valid JSON matching this schema:
{
  "decision": "include" | "exclude",
  "confidence": 0-100,
  "reasoning": "Specific justification with quotes from article",
  "pico_alignment": {
    "population": "yes | no | partial - explanation",
    "intervention": "yes | no | partial - explanation",
    "comparison": "yes | no | partial - explanation",
    "outcomes": "yes | no | partial - explanation"
  },
  "exclusion_criteria_violated": ["criterion1", "criterion2"] | []
}`,

    user_prompt_template: `# Systematic Review Criteria

## Research Question
{{research_question}}

## PICO Criteria
- **Population:** {{pico.population}}
- **Intervention:** {{pico.intervention}}
- **Comparison:** {{pico.comparison}}
- **Outcomes:** {{pico.outcomes}}

## Inclusion Criteria
{{#each inclusion_criteria}}
- {{this}}
{{/each}}

## Exclusion Criteria
{{#each exclusion_criteria}}
- {{this}}
{{/each}}

---

# Article to Screen

## Title
{{article.title}}

## Authors
{{article.authors}}

## Journal & Year
{{article.journal}}, {{article.year}}

## Abstract
{{article.abstract}}

## Methods Section
{{article.methods}}

## Results Section (abbreviated)
{{article.results_excerpt}}

---

**Task:** Based on the criteria above, should this article be INCLUDED or EXCLUDED? Provide your decision as JSON only.`,

    output_schema: {
        type: 'object',
        properties: {
            decision: { type: 'string', enum: ['include', 'exclude'] },
            confidence: { type: 'number', minimum: 0, maximum: 100 },
            reasoning: { type: 'string' },
            pico_alignment: {
                type: 'object',
                properties: {
                    population: { type: 'string' },
                    intervention: { type: 'string' },
                    comparison: { type: 'string' },
                    outcomes: { type: 'string' }
                }
            },
            exclusion_criteria_violated: { type: 'array', items: { type: 'string' } }
        },
        required: ['decision', 'confidence', 'reasoning', 'pico_alignment']
    }
};

// =====================================================
// DATA EXTRACTION PROMPT
// =====================================================

export const EXTRACTION_PROMPT: PromptTemplate = {
    version: '1.0',
    model_requirements: [
        'Supports JSON output',
        'Context window ≥ 16K tokens (full-text processing)',
        'Strong medical/statistical knowledge'
    ],

    system_prompt: `You are an expert data extractor for systematic reviews and meta-analyses.

Your task is to extract structured data from a medical research article, focusing on:
1. PICO elements (Population, Intervention, Comparison, Outcomes)
2. Study design and methodology
3. Sample sizes and participant characteristics
4. Primary and secondary outcomes with statistical results
5. Risk of bias assessment (Cochrane RoB 2 framework)

CRITICAL RULES:
1. Extract ONLY information explicitly stated in the article
2. For numerical data, copy EXACT values (don't round)
3. If information is missing, use null (do not guess)
4. For statistics, extract: mean, SD, n, p-values, effect sizes, confidence intervals
5. Use standard medical abbreviations (RCT, OR, RR, SMD, etc.)
6. If multiple timepoints exist, extract the PRIMARY endpoint unless specified otherwise

OUTPUT FORMAT: Respond ONLY with valid JSON matching the schema provided.`,

    user_prompt_template: `# Article for Data Extraction

## Title
{{article.title}}

## Authors & Journal
{{article.authors}} | {{article.journal}} ({{article.year}})

## Full Text

### Abstract
{{article.abstract}}

### Methods
{{article.methods}}

### Results
{{article.results}}

### Discussion (if relevant for conclusions)
{{article.discussion_excerpt}}

---

**Task:** Extract all relevant data from this article and return as structured JSON following this schema:

\`\`\`json
{
  "population": {
    "description": "string",
    "sample_size": number,
    "demographics": {
      "mean_age": number | null,
      "gender_distribution": "string" | null,
      "inclusion_criteria": "string"
    }
  },
  "intervention": {
    "name": "string",
    "description": "string",
    "dosage": "string" | null,
    "duration": "string" | null,
    "delivery_method": "string" | null
  },
  "comparison": {
    "name": "string",
    "description": "string",
    "dosage": "string" | null,
    "duration": "string" | null
  },
  "study_design": "RCT" | "Crossover RCT" | "Cluster RCT" | "Cohort" | "Case-Control" | "Meta-Analysis" | "other",
  "duration_weeks": number | null,
  "primary_outcomes": [
    {
      "outcome": "string",
      "measurement_tool": "string",
      "timepoint": "string",
      "intervention_mean": number,
      "intervention_sd": number,
      "intervention_n": number,
      "control_mean": number,
      "control_sd": number,
      "control_n": number,
      "p_value": number | null,
      "effect_size": number | null,
      "effect_size_type": "SMD" | "MD" | "RR" | "OR" | null,
      "confidence_interval": [number, number] | null
    }
  ],
  "secondary_outcomes": [...],  // Same structure
  "risk_of_bias": {
    "random_sequence_generation": "low" | "high" | "unclear",
    "allocation_concealment": "low" | "high" | "unclear",
    "blinding_participants": "low" | "high" | "unclear",
    "blinding_assessors": "low" | "high" | "unclear",
    "incomplete_outcome": "low" | "high" | "unclear",
    "selective_reporting": "low" | "high" | "unclear",
    "other_bias": "low" | "high" | "unclear"
  },
  "notes": "string - any important caveats or additional context"
}
\`\`\`

Extract the data now. Return ONLY the JSON, no explanation.`,

    output_schema: {
        type: 'object',
        properties: {
            population: { type: 'object' },
            intervention: { type: 'object' },
            comparison: { type: 'object' },
            study_design: { type: 'string' },
            duration_weeks: { type: ['number', 'null'] },
            primary_outcomes: { type: 'array' },
            secondary_outcomes: { type: 'array' },
            risk_of_bias: { type: 'object' },
            notes: { type: 'string' }
        },
        required: ['population', 'intervention', 'study_design', 'primary_outcomes']
    }
};

// =====================================================
// QUICK PICO EXTRACTION (from PROSPERO file)
// =====================================================

export const PROSPERO_PICO_PROMPT: PromptTemplate = {
    version: '1.0',
    model_requirements: ['Supports JSON output', 'Context window ≥ 8K tokens'],

    system_prompt: `You are a PICO criteria extractor for systematic reviews.

Extract the Population, Intervention, Comparison, and Outcomes from a PROSPERO protocol document.

OUTPUT FORMAT: JSON only, no explanation.`,

    user_prompt_template: `Extract PICO criteria from this PROSPERO protocol:

{{prospero_text}}

Return JSON:
\`\`\`json
{
  "population": "string",
  "intervention": "string",
  "comparison": "string",
  "outcomes": "string",
 "research_question": "string"
}
\`\`\``,

    output_schema: {
        type: 'object',
        properties: {
            population: { type: 'string' },
            intervention: { type: 'string' },
            comparison: { type: 'string' },
            outcomes: { type: 'string' },
            research_question: { type: 'string' }
        },
        required: ['population', 'intervention', 'comparison', 'outcomes']
    }
};

// =====================================================
// Utility: Render template with data
// =====================================================

export function renderPrompt(template: string, data: Record<string, any>): string {
    let rendered = template;

    // Simple Handlebars-style template rendering
    // Replace {{variable}} with data values
    rendered = rendered.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
        const keys = key.trim().split('.');
        let value: any = data;

        for (const k of keys) {
            value = value?.[k];
        }

        return value !== undefined ? String(value) : '';
    });

    // Handle {{#each}} loops
    rendered = rendered.replace(
        /\{\{#each ([^}]+)\}\}([\s\S]*?)\{\{\/each\}\}/g,
        (match, arrayKey, content) => {
            const array = data[arrayKey.trim()];
            if (!Array.isArray(array)) return '';

            return array.map(item => content.replace(/\{\{this\}\}/g, String(item))).join('\n');
        }
    );

    return rendered;
}

// =====================================================
// Export all prompts
// =====================================================

export const PROMPTS = {
    SCREENING: SCREENING_PROMPT,
    EXTRACTION: EXTRACTION_PROMPT,
    PROSPERO_PICO: PROSPERO_PICO_PROMPT
} as const;
