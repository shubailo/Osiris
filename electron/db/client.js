"use strict";
/**
 * SQLite Database Client
 * Type-safe interface for all database operations
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDatabase = initializeDatabase;
exports.getDB = getDB;
exports.closeDatabase = closeDatabase;
exports.getAllProjects = getAllProjects;
exports.getProjectById = getProjectById;
exports.createProject = createProject;
exports.updateProject = updateProject;
exports.deleteProject = deleteProject;
exports.getProjectStats = getProjectStats;
exports.getArticlesByProject = getArticlesByProject;
exports.getArticleById = getArticleById;
exports.getArticlesWithDecisions = getArticlesWithDecisions;
exports.searchArticles = searchArticles;
exports.insertArticle = insertArticle;
exports.updateArticle = updateArticle;
exports.saveScreeningDecision = saveScreeningDecision;
exports.getScreeningDecision = getScreeningDecision;
exports.saveExtractedData = saveExtractedData;
exports.getExtractedData = getExtractedData;
exports.getAllExtractedData = getAllExtractedData;
exports.getSetting = getSetting;
exports.setSetting = setSetting;
exports.getAllSettings = getAllSettings;
exports.logAIUsage = logAIUsage;
exports.getAIUsageSummary = getAIUsageSummary;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
let db = null;
/**
 * Initialize database with schema
 */
async function initializeDatabase(dbPath) {
    // Ensure directory exists
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    // Open database
    db = new better_sqlite3_1.default(dbPath);
    db.pragma('foreign_keys = ON');
    db.pragma('journal_mode = WAL'); // Write-Ahead Logging for better concurrency
    // Read schema file
    const schemaPath = path.join(__dirname, '../../dashboard-ui/lib/db/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    // Execute schema (idempotent - uses IF NOT EXISTS)
    db.exec(schema);
    console.log('✅ Database initialized successfully');
}
/**
 * Get database instance (throws if not initialized)
 */
function getDB() {
    if (!db) {
        throw new Error('Database not initialized. Call initializeDatabase() first.');
    }
    return db;
}
/**
 * Close database connection
 */
function closeDatabase() {
    if (db) {
        db.close();
        db = null;
    }
}
// =====================================================
// Project Operations
// =====================================================
function getAllProjects() {
    return getDB().prepare('SELECT * FROM projects ORDER BY created_at DESC').all();
}
function getProjectById(id) {
    return getDB().prepare('SELECT * FROM projects WHERE id = ?').get(id);
}
function createProject(data) {
    const result = getDB().prepare(`
    INSERT INTO projects (name, research_question, pico_criteria)
    VALUES (@name, @research_question, @pico_criteria)
  `).run(data);
    return getProjectById(result.lastInsertRowid);
}
function updateProject(id, data) {
    const fields = Object.keys(data).map(k => `${k} = @${k}`).join(', ');
    const result = getDB().prepare(`UPDATE projects SET ${fields} WHERE id = @id`).run({ id, ...data });
    return result.changes > 0;
}
function deleteProject(id) {
    const result = getDB().prepare('DELETE FROM projects WHERE id = ?').run(id);
    return result.changes > 0;
}
function getProjectStats(projectId) {
    return getDB().prepare('SELECT * FROM v_project_stats WHERE project_id = ?').get(projectId);
}
// =====================================================
// Article Operations
// =====================================================
function getArticlesByProject(projectId) {
    return getDB().prepare('SELECT * FROM articles WHERE project_id = ? ORDER BY upload_date DESC').all(projectId);
}
function getArticleById(id) {
    return getDB().prepare('SELECT * FROM articles WHERE id = ?').get(id);
}
function getArticlesWithDecisions(projectId) {
    return getDB().prepare('SELECT * FROM v_articles_with_decisions WHERE project_id = ? ORDER BY upload_date DESC').all(projectId);
}
function searchArticles(projectId, query) {
    return getDB().prepare(`
    SELECT a.* FROM articles a
    JOIN articles_fts fts ON a.id = fts.rowid
    WHERE a.project_id = ? AND articles_fts MATCH ?
    ORDER BY rank
  `).all(projectId, query);
}
function insertArticle(data) {
    const result = getDB().prepare(`
    INSERT INTO articles (
      project_id, pdf_path, original_filename, file_size_bytes,
      title, authors, journal, year, doi, extraction_status
    ) VALUES (
      @project_id, @pdf_path, @original_filename, @file_size_bytes,
      @title, @authors, @journal, @year, @doi, 'pending'
    )
  `).run(data);
    return getArticleById(result.lastInsertRowid);
}
function updateArticle(id, data) {
    const fields = Object.keys(data).map(k => `${k} = @${k}`).join(', ');
    const result = getDB().prepare(`UPDATE articles SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = @id`).run({ id, ...data });
    return result.changes > 0;
}
// =====================================================
// Screening Operations
// =====================================================
function saveScreeningDecision(data) {
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
    return result.lastInsertRowid;
}
function getScreeningDecision(articleId) {
    return getDB().prepare('SELECT * FROM screening_decisions WHERE article_id = ?').get(articleId);
}
// =====================================================
// Extraction Operations
// =====================================================
function saveExtractedData(data) {
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
    return result.lastInsertRowid;
}
function getExtractedData(articleId) {
    return getDB().prepare('SELECT * FROM extracted_data WHERE article_id = ?').get(articleId);
}
function getAllExtractedData(projectId) {
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
function getSetting(key) {
    return getDB().prepare('SELECT value FROM app_settings WHERE key = ?').get(key);
}
function setSetting(key, value) {
    const result = getDB().prepare(`
    INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)
  `).run(key, value);
    return result.changes > 0;
}
function getAllSettings() {
    const rows = getDB().prepare('SELECT key, value FROM app_settings').all();
    return rows.reduce((acc, row) => {
        acc[row.key] = row.value;
        return acc;
    }, {});
}
// =====================================================
// AI Usage Logging
// =====================================================
function logAIUsage(data) {
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
function getAIUsageSummary(month) {
    return getDB().prepare('SELECT * FROM v_monthly_ai_costs WHERE month = ?').all(month);
}
