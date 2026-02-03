/**
 * Statistical derivation engine for Meta-Analysis
 * Formulas derived from Cochrane Handbook for Systematic Reviews
 */

/**
 * Calculate Standard Error (SE) from Standard Deviation (SD) and Sample Size (n)
 */
export function calculateSEFromSD(sd: number, n: number): number {
    if (n <= 0) return 0;
    return sd / Math.sqrt(n);
}

/**
 * Calculate Standard Deviation (SD) from Standard Error (SE) and Sample Size (n)
 */
export function calculateSDFromSE(se: number, n: number): number {
    if (n <= 0) return 0;
    return se * Math.sqrt(n);
}

/**
 * Calculate Z-score from P-value (approximate)
 */
export function calculateZFromP(pValue: number): number {
    if (pValue <= 0 || pValue >= 1) return 0;

    // Inverse normal approximation (Wichura, 1988)
    const q = pValue / 2;
    const r = Math.sqrt(-Math.log(q));
    const t = r - (2.30753 + 0.27061 * r) / (1 + 0.99229 * r + 0.04481 * r * r);
    return t;
}

/**
 * Calculate SE from Mean Difference (MD) and P-value
 */
export function calculateSEFromPDP(md: number, pValue: number): number {
    const z = calculateZFromP(pValue);
    if (z === 0) return 0;
    return Math.abs(md / z);
}

/**
 * Comprehensive derivation for an OutcomeResult
 */
export function deriveMissingStats(stats: any): any {
    const derived = { ...stats };
    derived.is_derived = false;

    // 1. Calculate SE from SD and n
    if (derived.intervention_mean !== undefined &&
        derived.intervention_sd !== undefined &&
        derived.intervention_n !== undefined &&
        derived.std_error === undefined) {
        derived.std_error = calculateSEFromSD(derived.intervention_sd, derived.intervention_n);
        derived.is_derived = true;
    }

    // 2. Calculate SD from SE and n
    if (derived.intervention_n !== undefined &&
        derived.std_error !== undefined &&
        derived.intervention_sd === undefined) {
        derived.intervention_sd = calculateSDFromSE(derived.std_error, derived.intervention_n);
        derived.is_derived = true;
    }

    return derived;
}
