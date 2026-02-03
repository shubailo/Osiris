"use strict";
/**
 * IPC Contract Definitions
 * Type-safe communication between Electron main and renderer processes
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.IPC_CHANNELS = void 0;
// =====================================================
// IPC Channel Names (Enum for type safety)
// =====================================================
exports.IPC_CHANNELS = {
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
};
