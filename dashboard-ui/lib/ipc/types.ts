/**
 * IPC Contract Definitions
 * Type-safe communication between Electron main and renderer processes
 */

// =====================================================
// Database Operations - Projects
// =====================================================

export interface Project {
  id: number;
  name: string;
  prospero_id?: string;
  prospero_file_path?: string;
  pico_criteria?: PICOCriteria;
  research_question?: string;
  inclusion_criteria?: string[];
  exclusion_criteria?: string[];
  created_at: string;
  updated_at: string;
}

export interface PICOCriteria {
  population: string;
  intervention: string;
  comparison: string;
  outcomes: string;
}

export interface CreateProjectRequest {
  name: string;
  research_question?: string;
  pico_criteria?: PICOCriteria;
}

// =====================================================
// Database Operations - Articles
// =====================================================

export interface Article {
  id: number;
  project_id: number;
  pdf_path: string;
  original_filename: string;
  file_size_bytes?: number;
  upload_date: string;

  // Metadata
  title?: string;
  authors?: string;
  journal?: string;
  year?: number;
  doi?: string;
  pmid?: string;

  // Extracted content
  full_text?: string;
  abstract?: string;
  methods?: string;
  results?: string;
  discussion?: string;

  // Processing status
  extraction_status: 'pending' | 'processing' | 'complete' | 'failed';
  extraction_error?: string;

  created_at: string;
  updated_at: string;
}

export interface ArticleWithDecision extends Article {
  decision: 'include' | 'exclude' | 'pending' | 'needs_review';
  confidence?: number;
  reasoning?: string;
  ai_provider?: string;
  is_manual_override?: boolean;
  model_votes?: ModelVote[];
  consensus_type?: string;
}

// =====================================================
// Database Operations - Screening
// =====================================================

export interface ScreeningDecision {
  id: number;
  article_id: number;
  decision: 'include' | 'exclude' | 'pending' | 'needs_review';
  confidence?: number;
  reasoning: string;
  ai_provider: string;
  model_votes?: ModelVote[];
  consensus_type?: 'unanimous' | '2-1' | '3-way-split' | 'single-model' | 'manual';
  is_manual_override: boolean;
  override_reason?: string;
  decided_at: string;
  decided_by: string;
}

export interface ModelVote {
  model: string;
  decision: 'include' | 'exclude';
  confidence: number;
  reasoning: string;
}

// =====================================================
// Database Operations - Extraction
// =====================================================

export interface ExtractedData {
  id: number;
  article_id: number;

  // PICO
  population?: PopulationData;
  intervention?: InterventionData;
  comparison?: InterventionData;
  outcomes?: OutcomeData[];

  // Study design
  study_design?: string;
  sample_size?: number;
  duration_weeks?: number;

  // Results
  primary_outcomes?: OutcomeResult[];
  secondary_outcomes?: OutcomeResult[];
  subgroup_analyses?: SubgroupAnalysis[];
  statistics?: Statistics;

  // Flow Tracking
  randomized_n?: number;
  analyzed_n?: number;
  attrition_rate?: number;

  // Quality & Synthesis
  risk_of_bias?: RiskOfBias;
  quality_score?: QualityScore;
  author_conclusion?: string;

  // Metadata & Verification
  extraction_evidence?: Record<string, EvidenceHighlight>; // Linked to field keys
  extracted_by: string;
  ai_model?: string;
  extraction_confidence?: number;
  manual_edits_made: boolean;

  extracted_at: string;
  last_edited_at: string;
}

export interface EvidenceHighlight {
  text: string;
  page: number;
  rects: number[][]; // [x1, y1, x2, y2]
}

export interface SubgroupAnalysis {
  group_name: string;
  n: number;
  result: OutcomeResult;
}

export interface PopulationData {
  description: string;
  sample_size: number;
  demographics?: {
    mean_age?: number;
    gender_distribution?: string;
    ethnicity?: string;
  };
}

export interface InterventionData {
  name: string;
  description: string;
  dosage?: string;
  duration?: string;
}

export interface OutcomeData {
  name: string;
  type: 'continuous' | 'dichotomous' | 'ordinal';
  measurement: string;
  timepoint: string;
  value?: any;
}

export interface OutcomeResult {
  outcome: string;
  intervention_mean?: number;
  intervention_sd?: number;
  intervention_n?: number;
  control_mean?: number;
  control_sd?: number;
  control_n?: number;
  p_value?: number;
  std_error?: number;
  hazard_ratio?: number;
  effect_size?: number;
  effect_size_type?: 'SMD' | 'MD' | 'RR' | 'OR' | 'HR';
  is_derived?: boolean;
}

export interface Statistics {
  test_used?: string;
  p_values?: number[];
  confidence_intervals?: Array<[number, number]>;
  effect_sizes?: number[];
}

export interface RiskOfBias {
  random_sequence_generation: 'low' | 'high' | 'unclear';
  allocation_concealment: 'low' | 'high' | 'unclear';
  blinding_participants: 'low' | 'high' | 'unclear';
  blinding_assessors: 'low' | 'high' | 'unclear';
  incomplete_outcome: 'low' | 'high' | 'unclear';
  selective_reporting: 'low' | 'high' | 'unclear';
  other_bias: 'low' | 'high' | 'unclear';
}

export interface QualityScore {
  tool: string;
  score: number | string;
}

// =====================================================
// AI Operations
// =====================================================

export interface ScreenArticleRequest {
  article_id: number;
  pico_criteria: PICOCriteria;
  provider?: 'local' | 'cloud';
  force_cloud?: boolean; // Override hybrid mode
}

export interface ScreenArticleResponse {
  decision: 'include' | 'exclude';
  confidence: number;
  reasoning: string;
  model_votes?: ModelVote[];
  consensus_type: string;
  provider: string;
  cost_usd?: number;
}

export interface ExtractDataRequest {
  article_id: number;
  provider?: 'local' | 'cloud';
}

export interface ExtractDataResponse {
  extracted_data: Partial<ExtractedData>;
  confidence: number;
  provider: string;
  cost_usd?: number;
}

// =====================================================
// File Operations
// =====================================================

export interface UploadPDFRequest {
  project_id: number;
  file_path: string; // Temporary path from file dialog
}

export interface UploadPDFResponse {
  article: Article;
  extraction_started: boolean;
}

export interface SelectPDFResponse {
  file_paths: string[]; // User-selected PDF paths
}

// =====================================================
// Ollama Operations
// =====================================================

export interface OllamaStatusResponse {
  connected: boolean;
  version?: string;
  models: string[]; // Available models
}

export interface DownloadModelRequest {
  model_name: string;
}

export interface DownloadModelProgress {
  model_name: string;
  progress: number; // 0-100
  status: 'downloading' | 'complete' | 'failed';
  error?: string;
}

// =====================================================
// Export Operations
// =====================================================

export interface ExportCSVRequest {
  project_id: number;
  format: 'revman' | 'generic';
}

export interface ExportCSVResponse {
  file_path: string; // Where user saved the file
  exported_count: number;
}

export interface GeneratePRISMARequest {
  project_id: number;
}

export interface GeneratePRISMAResponse {
  svg_data: string;
  counts: {
    screened: number;
    included: number;
    excluded: number;
  };
}

// =====================================================
// Settings Operations
// =====================================================

export interface AppSettings {
  ai_provider_mode: 'local' | 'cloud' | 'hybrid';
  local_models: string[];
  export_format_default: 'csv' | 'json' | 'xml';
  screening_confidence_threshold: number;
  monthly_cost_limit_usd: number;
  current_month_cost_usd: number;
  ollama_status: 'not_checked' | 'connected' | 'disconnected';
  cloud_api_key_encrypted?: string;
}

export interface UpdateSettingRequest {
  key: keyof AppSettings;
  value: any;
}

// =====================================================
// Statistics / Summary
// =====================================================

export interface ProjectStats {
  project_id: number;
  project_name: string;
  total_articles: number;
  included: number;
  excluded: number;
  pending: number;
  extracted: number;
}

export interface AIUsageSummary {
  month: string;
  provider: string;
  request_count: number;
  total_tokens: number;
  total_cost_usd: number;
  avg_latency_ms: number;
}

// =====================================================
// IPC Channel Names (Enum for type safety)
// =====================================================

export const IPC_CHANNELS = {
  // Projects
  DB_GET_PROJECTS: 'db:get-projects',
  DB_GET_PROJECT: 'db:get-project',
  DB_CREATE_PROJECT: 'db:create-project',
  DB_UPDATE_PROJECT: 'db:update-project',
  DB_DELETE_PROJECT: 'db:delete-project',
  DB_GET_PROJECT_STATS: 'db:get-project-stats',

  // Articles
  DB_GET_ARTICLES: 'db:get-articles',
  DB_GET_ARTICLE: 'db:get-article',
  DB_GET_ARTICLES_WITH_DECISIONS: 'db:get-articles-with-decisions',
  DB_SEARCH_ARTICLES: 'db:search-articles',

  // Screening
  DB_SAVE_SCREENING_DECISION: 'db:save-screening-decision',
  DB_UPDATE_SCREENING_DECISION: 'db:update-screening-decision',
  DB_GET_SCREENING_DECISION: 'db:get-screening-decision',

  // Extraction
  DB_SAVE_EXTRACTED_DATA: 'db:save-extracted-data',
  DB_UPDATE_EXTRACTED_DATA: 'db:update-extracted-data',
  DB_GET_EXTRACTED_DATA: 'db:get-extracted-data',
  DB_GET_ALL_EXTRACTED_DATA: 'db:get-all-extracted-data',

  // AI Operations
  AI_SCREEN_ARTICLE: 'ai:screen-article',
  AI_SCREEN_BATCH: 'ai:screen-batch',
  AI_EXTRACT_DATA: 'ai:extract-data',
  AI_GET_USAGE_SUMMARY: 'ai:get-usage-summary',

  // Ollama
  OLLAMA_CHECK_STATUS: 'ollama:check-status',
  OLLAMA_DOWNLOAD_MODEL: 'ollama:download-model',
  OLLAMA_CANCEL_DOWNLOAD: 'ollama:cancel-download',

  // File Operations
  FS_SELECT_PDF: 'fs:select-pdf',
  FS_UPLOAD_PDF: 'fs:upload-pdf',
  FS_EXPORT_CSV: 'fs:export-csv',
  FS_EXPORT_PRISMA: 'fs:export-prisma',
  FS_OPEN_DATA_FOLDER: 'fs:open-data-folder',

  // Settings
  SETTINGS_GET_ALL: 'settings:get-all',
  SETTINGS_UPDATE: 'settings:update',
  SETTINGS_SET_API_KEY: 'settings:set-api-key',
  SETTINGS_GET_API_KEY: 'settings:get-api-key',

  // Events (main → renderer)
  EVENT_MODEL_DOWNLOAD_PROGRESS: 'event:model-download-progress',
  EVENT_PDF_EXTRACTION_PROGRESS: 'event:pdf-extraction-progress',
  EVENT_SCREENING_PROGRESS: 'event:screening-progress',
} as const;

export type IPCChannel = typeof IPC_CHANNELS[keyof typeof IPC_CHANNELS];
