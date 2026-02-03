-- Meta-Analysis AI Assistant - SQLite Database Schema
-- Version: 1.0
-- Description: Schema for projects, articles, screening decisions, and extracted data

-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

-- =====================================================
-- Table: projects
-- Description: Systematic review projects
-- =====================================================
CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  prospero_id TEXT, -- PROSPERO registration number (e.g., CRD42024123456)
  prospero_file_path TEXT, -- Path to uploaded PROSPERO PDF
  pico_criteria TEXT, -- JSON: {population, intervention, comparison, outcomes}
  research_question TEXT,
  inclusion_criteria TEXT, -- JSON array of criteria
  exclusion_criteria TEXT, -- JSON array of criteria
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index for quick project lookup
CREATE INDEX IF NOT EXISTS idx_projects_name ON projects(name);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);

-- =====================================================
-- Table: articles
-- Description: Uploaded full-text articles for screening
-- =====================================================
CREATE TABLE IF NOT EXISTS articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  
  -- File information
  pdf_path TEXT NOT NULL, -- Absolute path to stored PDF
  original_filename TEXT NOT NULL,
  file_size_bytes INTEGER,
  upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- Metadata (extracted or manual)
  title TEXT,
  authors TEXT, -- Comma-separated list
  journal TEXT,
  year INTEGER,
  doi TEXT,
  pmid TEXT, -- PubMed ID
  
  -- Extracted content
  full_text TEXT, -- Complete extracted text
  abstract TEXT,
  methods TEXT, -- Methods section
  results TEXT, -- Results section
  discussion TEXT, -- Discussion section
  
  -- Processing status
  extraction_status TEXT DEFAULT 'pending', -- pending, processing, complete, failed
  extraction_error TEXT, -- Error message if extraction failed
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_articles_project_id ON articles(project_id);
CREATE INDEX IF NOT EXISTS idx_articles_year ON articles(year DESC);
CREATE INDEX IF NOT EXISTS idx_articles_extraction_status ON articles(extraction_status);
CREATE INDEX IF NOT EXISTS idx_articles_title ON articles(title); -- For search
CREATE INDEX IF NOT EXISTS idx_articles_authors ON articles(authors); -- For search

-- Full-text search index for articles
CREATE VIRTUAL TABLE IF NOT EXISTS articles_fts USING fts5(
  title, 
  authors, 
  journal, 
  abstract,
  content='articles',
  content_rowid='id'
);

-- Trigger to keep FTS index in sync
CREATE TRIGGER IF NOT EXISTS articles_fts_insert AFTER INSERT ON articles BEGIN
  INSERT INTO articles_fts(rowid, title, authors, journal, abstract)
  VALUES (new.id, new.title, new.authors, new.journal, new.abstract);
END;

CREATE TRIGGER IF NOT EXISTS articles_fts_update AFTER UPDATE ON articles BEGIN
  UPDATE articles_fts SET 
    title = new.title,
    authors = new.authors,
    journal = new.journal,
    abstract = new.abstract
  WHERE rowid = new.id;
END;

CREATE TRIGGER IF NOT EXISTS articles_fts_delete AFTER DELETE ON articles BEGIN
  DELETE FROM articles_fts WHERE rowid = old.id;
END;

-- =====================================================
-- Table: screening_decisions
-- Description: AI council + manual screening decisions
-- =====================================================
CREATE TABLE IF NOT EXISTS screening_decisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  article_id INTEGER NOT NULL,
  
  -- Decision
  decision TEXT NOT NULL CHECK(decision IN ('include', 'exclude', 'pending', 'needs_review')),
  confidence INTEGER, -- 0-100 (AI confidence)
  reasoning TEXT NOT NULL, -- AI reasoning or manual justification
  
  -- AI Council metadata
  ai_provider TEXT, -- 'local-council', 'cloud-gpt4', 'cloud-claude', 'manual'
  model_votes TEXT, -- JSON: [{model: 'llama3.3', decision: 'include', confidence: 95, reasoning: '...'}]
  consensus_type TEXT, -- 'unanimous', '2-1', '3-way-split', 'single-model', 'manual'
  
  -- Manual override
  is_manual_override BOOLEAN DEFAULT 0,
  override_reason TEXT,
  
  -- Timestamps
  decided_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  decided_by TEXT DEFAULT 'ai', -- 'ai' or user identifier
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY(article_id) REFERENCES articles(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_screening_decision ON screening_decisions(decision);
CREATE INDEX IF NOT EXISTS idx_screening_article_id ON screening_decisions(article_id);
CREATE INDEX IF NOT EXISTS idx_screening_ai_provider ON screening_decisions(ai_provider);
CREATE INDEX IF NOT EXISTS idx_screening_decided_at ON screening_decisions(decided_at DESC);

-- Ensure only one active decision per article
CREATE UNIQUE INDEX IF NOT EXISTS idx_screening_article_unique ON screening_decisions(article_id);

-- =====================================================
-- Table: extracted_data
-- Description: Structured data extracted from included articles
-- =====================================================
CREATE TABLE IF NOT EXISTS extracted_data (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  article_id INTEGER NOT NULL,
  
  -- PICO Elements (JSON for flexibility)
  population TEXT, -- JSON: {description, sample_size, demographics}
  intervention TEXT, -- JSON: {name, description, dosage, duration}
  comparison TEXT, -- JSON: {name, description, dosage, duration}
  outcomes TEXT, -- JSON: [{name, type, measurement, timepoint, value}]
  
  -- Study Design
  study_design TEXT, -- 'RCT', 'Cohort', 'Case-Control', 'Meta-Analysis', etc.
  sample_size INTEGER,
  duration_weeks INTEGER,
  
  -- Results (JSON for structured storage)
  primary_outcomes TEXT, -- JSON: [{outcome, intervention_mean, intervention_sd, control_mean, control_sd, p_value, effect_size}]
  secondary_outcomes TEXT, -- JSON array
  statistics TEXT, -- JSON: {test_used, p_values, confidence_intervals, effect_sizes}
  
  -- Quality Assessment / Risk of Bias
  risk_of_bias TEXT, -- JSON: {random_sequence_generation, allocation_concealment, blinding, incomplete_outcome, selective_reporting, other}
  quality_score TEXT, -- JSON: {tool: 'Cochrane RoB 2', score: ...}
  
  -- Extraction metadata
  extracted_by TEXT DEFAULT 'ai', -- 'ai' or user identifier
  ai_model TEXT, -- Model used for extraction
  extraction_confidence INTEGER, -- 0-100
  manual_edits_made BOOLEAN DEFAULT 0,
  
  -- Timestamps
  extracted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_edited_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY(article_id) REFERENCES articles(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_extracted_article_id ON extracted_data(article_id);
CREATE INDEX IF NOT EXISTS idx_extracted_study_design ON extracted_data(study_design);
CREATE INDEX IF NOT EXISTS idx_extracted_sample_size ON extracted_data(sample_size);

-- Ensure only one extraction record per article
CREATE UNIQUE INDEX IF NOT EXISTS idx_extracted_article_unique ON extracted_data(article_id);

-- =====================================================
-- Table: ai_usage_logs
-- Description: Track AI API usage and costs
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Request details
  operation TEXT NOT NULL, -- 'screening', 'extraction', 'quality_assessment'
  article_id INTEGER,
  provider TEXT NOT NULL, -- 'local-ollama', 'cloud-openrouter'
  model TEXT NOT NULL, -- 'llama3.3:70b', 'gpt-4', 'claude-3.5-sonnet'
  
  -- Usage metrics
  input_tokens INTEGER,
  output_tokens INTEGER,
  total_tokens INTEGER,
  cost_usd REAL, -- Estimated cost for cloud API calls
  latency_ms INTEGER, -- Response time
  
  -- Status
  status TEXT CHECK(status IN ('success', 'failed', 'timeout')),
  error_message TEXT,
  
  -- Timestamps
  requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  
 FOREIGN KEY(article_id) REFERENCES articles(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_usage_provider ON ai_usage_logs(provider);
CREATE INDEX IF NOT EXISTS idx_ai_usage_operation ON ai_usage_logs(operation);
CREATE INDEX IF NOT EXISTS idx_ai_usage_requested_at ON ai_usage_logs(requested_at DESC);

-- =====================================================
-- Table: app_settings
-- Description: Application configuration (key-value store)
-- =====================================================
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Default settings
INSERT OR IGNORE INTO app_settings (key, value) VALUES 
  ('ai_provider_mode', 'hybrid'), -- local, cloud, hybrid
  ('local_models', '["llama3.3:70b", "mistral-large", "gemma2:27b"]'),
  ('export_format_default', 'csv'),
  ('screening_confidence_threshold', '75'), -- Suggest cloud if local confidence < X%
  ('monthly_cost_limit_usd', '10.00'),
  ('current_month_cost_usd', '0.00'),
  ('ollama_status', 'not_checked'), -- not_checked, connected, disconnected
  ('cloud_api_key_encrypted', ''); -- Encrypted OpenRouter API key

-- =====================================================
-- Views for convenience
-- =====================================================

-- Articles with screening status
CREATE VIEW IF NOT EXISTS v_articles_with_decisions AS
SELECT 
  a.*,
  COALESCE(sd.decision, 'pending') as decision,
  sd.confidence,
  sd.reasoning,
  sd.ai_provider,
  sd.is_manual_override
FROM articles a
LEFT JOIN screening_decisions sd ON a.id = sd.article_id;

-- Project summary statistics
CREATE VIEW IF NOT EXISTS v_project_stats AS
SELECT 
  p.id as project_id,
  p.name as project_name,
  COUNT(a.id) as total_articles,
  SUM(CASE WHEN sd.decision = 'include' THEN 1 ELSE 0 END) as included,
  SUM(CASE WHEN sd.decision = 'exclude' THEN 1 ELSE 0 END) as excluded,
  SUM(CASE WHEN sd.decision = 'pending' THEN 1 ELSE 0 END) as pending,
  SUM(CASE WHEN ed.id IS NOT NULL THEN 1 ELSE 0 END) as extracted
FROM projects p
LEFT JOIN articles a ON p.id = a.project_id
LEFT JOIN screening_decisions sd ON a.id = sd.article_id
LEFT JOIN extracted_data ed ON a.id = ed.article_id
GROUP BY p.id, p.name;

-- AI usage summary by month
CREATE VIEW IF NOT EXISTS v_monthly_ai_costs AS
SELECT 
  strftime('%Y-%m', requested_at) as month,
  provider,
  COUNT(*) as request_count,
  SUM(total_tokens) as total_tokens,
  SUM(cost_usd) as total_cost_usd,
  AVG(latency_ms) as avg_latency_ms
FROM ai_usage_logs
WHERE status = 'success'
GROUP BY month, provider
ORDER BY month DESC;

-- =====================================================
-- Triggers for updated_at timestamps
-- =====================================================

CREATE TRIGGER IF NOT EXISTS projects_updated_at AFTER UPDATE ON projects BEGIN
  UPDATE projects SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS articles_updated_at AFTER UPDATE ON articles BEGIN
  UPDATE articles SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS extracted_data_updated_at AFTER UPDATE ON extracted_data BEGIN
  UPDATE extracted_data SET last_edited_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS app_settings_updated_at AFTER UPDATE ON app_settings BEGIN
  UPDATE app_settings SET updated_at = CURRENT_TIMESTAMP WHERE key = NEW.key;
END;

-- =====================================================
-- Initial seed data for development
-- =====================================================

-- Create default project
INSERT OR IGNORE INTO projects (id, name, research_question, pico_criteria) VALUES (
  1,
  'Default Project',
  'Effects of mindfulness-based interventions on anxiety in adult populations',
  '{"population": "Adults (18+) with anxiety disorders", "intervention": "Mindfulness-based interventions", "comparison": "Standard care or waitlist control", "outcomes": "Anxiety symptom reduction"}'
);
