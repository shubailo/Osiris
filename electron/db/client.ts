/**
 * SQLite Database Client
 * Type-safe interface for all database operations
 */

import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';

let db: Database.Database | null = null;

/**
 * Initialize database with schema
 */
export async function initializeDatabase(dbPath: string): Promise<void> {
    // Ensure directory exists
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    // Open database
    db = new Database(dbPath);
    db.pragma('foreign_keys = ON');
    db.pragma('journal_mode = WAL'); // Write-Ahead Logging for better concurrency

    // Read schema file
    const schemaPath = path.join(__dirname, '../../../dashboard-ui/lib/db/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    // Execute schema (idempotent - uses IF NOT EXISTS)
    db.exec(schema);

    console.log('✅ Database initialized successfully');
}

/**
 * Get database instance (throws if not initialized)
 */
export function getDB(): Database.Database {
    if (!db) {
        throw new Error('Database not initialized. Call initializeDatabase() first.');
    }
    return db;
}

/**
 * Close database connection
 */
export function closeDatabase(): void {
    if (db) {
        db.close();
        db = null;
    }
}

// =====================================================
// Project Operations
// =====================================================

export function getAllProjects() {
    return getDB().prepare('SELECT * FROM projects ORDER BY created_at DESC').all();
}

export function getProjectById(id: number) {
    return getDB().prepare('SELECT * FROM projects WHERE id = ?').get(id);
}

export function createProject(data: {
    name: string;
    research_question?: string;
    pico_criteria?: string;
}) {
    const result = getDB().prepare(`
    INSERT INTO projects (name, research_question, pico_criteria)
    VALUES (@name, @research_question, @pico_criteria)
  `).run(data);

    return getProjectById(result.lastInsertRowid as number);
}

export function updateProject(id: number, data: Partial<{
    name: string;
    prospero_id: string;
    prospero_file_path: string;
    pico_criteria: string;
    research_question: string;
}>) {
    const fields = Object.keys(data).map(k => `${k} = @${k}`).join(', ');
    const result = getDB().prepare(`UPDATE projects SET ${fields} WHERE id = @id`).run({ id, ...data });
    return result.changes > 0;
}

export function deleteProject(id: number) {
    const result = getDB().prepare('DELETE FROM projects WHERE id = ?').run(id);
    return result.changes > 0;
}

export function getProjectStats(projectId: number) {
    return getDB().prepare('SELECT * FROM v_project_stats WHERE project_id = ?').get(projectId);
}

// =====================================================
// Article Operations
// =====================================================

export function getArticlesByProject(projectId: number) {
    return getDB().prepare('SELECT * FROM articles WHERE project_id = ? ORDER BY upload_date DESC').all(projectId);
}

export function getArticleById(id: number) {
    return getDB().prepare('SELECT * FROM articles WHERE id = ?').get(id);
}

export function getArticlesWithDecisions(projectId: number) {
    return getDB().prepare('SELECT * FROM v_articles_with_decisions WHERE project_id = ? ORDER BY upload_date DESC').all(projectId);
}

export function searchArticles(projectId: number, query: string) {
    return getDB().prepare(`
    SELECT a.* FROM articles a
    JOIN articles_fts fts ON a.id = fts.rowid
    WHERE a.project_id = ? AND articles_fts MATCH ?
    ORDER BY rank
  `).all(projectId, query);
}

export function insertArticle(data: {
    project_id: number;
    pdf_path: string;
    original_filename: string;
    file_size_bytes?: number;
    title?: string;
    authors?: string;
    journal?: string;
    year?: number;
    doi?: string;
}) {
    const result = getDB().prepare(`
    INSERT INTO articles (
      project_id, pdf_path, original_filename, file_size_bytes,
      title, authors, journal, year, doi, extraction_status
    ) VALUES (
      @project_id, @pdf_path, @original_filename, @file_size_bytes,
      @title, @authors, @journal, @year, @doi, 'pending'
    )
  `).run(data);

    return getArticleById(result.lastInsertRowid as number);
}

export function updateArticle(id: number, data: Partial<{
    title: string;
    authors: string;
    journal: string;
    year: number;
    doi: string;
    abstract: string;
    full_text: string;
    methods: string;
    results: string;
    discussion: string;
    extraction_status: string;
    extraction_error: string;
}>) {
    const fields = Object.keys(data).map(k => `${k} = @${k}`).join(', ');
    const result = getDB().prepare(`UPDATE articles SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = @id`).run({ id, ...data });
    return result.changes > 0;
}

// =====================================================
// Screening Operations
// =====================================================

export function saveScreeningDecision(data: {
    article_id: number;
    decision: string;
    confidence?: number;
    reasoning: string;
    ai_provider: string;
    model_votes?: string; // JSON
    consensus_type?: string;
    is_manual_override?: boolean;
}) {
    const result = getDB().prepare(`
    INSERT OR REPLACE INTO screening_decisions (
      article_id, decision, confidence, reasoning, ai_provider,
      model_votes, consensus_type, is_manual_override
    ) VALUES (
      @article_id, @decision, @confidence, @reasoning, @ai_provider,
      @model_votes, @consensus_type, @is_manual_override
    ) 
  `).run({
        ...data,
        is_manual_override: data.is_manual_override ? 1 : 0
    });

    return result.lastInsertRowid as number;
}

export function getScreeningDecision(articleId: number) {
    return getDB().prepare('SELECT * FROM screening_decisions WHERE article_id = ?').get(articleId);
}

// =====================================================
// Extraction Operations
// =====================================================

export function saveExtractedData(data: {
    article_id: number;
    population?: string;
    intervention?: string;
    comparison?: string;
    outcomes?: string;
    study_design?: string;
    sample_size?: number;
    duration_weeks?: number;
    primary_outcomes?: string;
    secondary_outcomes?: string;
    statistics?: string;
    risk_of_bias?: string;
    quality_score?: string;
    extracted_by?: string;
    ai_model?: string;
    extraction_confidence?: number;
}) {
    const result = getDB().prepare(`
    INSERT OR REPLACE INTO extracted_data (
      article_id, population, intervention, comparison, outcomes,
      study_design, sample_size, duration_weeks, primary_outcomes,
      secondary_outcomes, statistics, risk_of_bias, quality_score,
      extracted_by, ai_model, extraction_confidence
    ) VALUES (
      @article_id, @population, @intervention, @comparison, @outcomes,
      @study_design, @sample_size, @duration_weeks, @primary_outcomes,
      @secondary_outcomes, @statistics, @risk_of_bias, @quality_score,
      @extracted_by, @ai_model, @extraction_confidence
    )
  `).run(data);

    return result.lastInsertRowid as number;
}

export function getExtractedData(articleId: number) {
    return getDB().prepare('SELECT * FROM extracted_data WHERE article_id = ?').get(articleId);
}

export function getAllExtractedData(projectId: number) {
    return getDB().prepare(`
    SELECT ed.* FROM extracted_data ed
    JOIN articles a ON ed.article_id = a.id
    WHERE a.project_id = ?
    ORDER BY ed.extracted_at DESC
  `).all(projectId);
}

// =====================================================
// Settings Operations
// =====================================================

export function getSetting(key: string) {
    return getDB().prepare('SELECT value FROM app_settings WHERE key = ?').get(key);
}

export function setSetting(key: string, value: string) {
    const result = getDB().prepare(`
    INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)
  `).run(key, value);
    return result.changes > 0;
}

export function getAllSettings() {
    const rows = getDB().prepare('SELECT key, value FROM app_settings').all() as Array<{ key: string; value: string }>;
    return rows.reduce((acc, row) => {
        acc[row.key] = row.value;
        return acc;
    }, {} as Record<string, string>);
}

// =====================================================
// AI Usage Logging
// =====================================================

export function logAIUsage(data: {
    operation: string;
    article_id?: number;
    provider: string;
    model: string;
    input_tokens?: number;
    output_tokens?: number;
    total_tokens?: number;
    cost_usd?: number;
    latency_ms?: number;
    status: string;
    error_message?: string;
}) {
    getDB().prepare(`
    INSERT INTO ai_usage_logs (
      operation, article_id, provider, model, input_tokens,
      output_tokens, total_tokens, cost_usd, latency_ms, status, error_message
    ) VALUES (
      @operation, @article_id, @provider, @model, @input_tokens,
      @output_tokens, @total_tokens, @cost_usd, @latency_ms, @status, @error_message
    )
  `).run(data);
}

export function getAIUsageSummary(month: string) {
    return getDB().prepare('SELECT * FROM v_monthly_ai_costs WHERE month = ?').all(month);
}
