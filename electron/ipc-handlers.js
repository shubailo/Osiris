"use strict";
/**
 * IPC Handler Implementations
 * Connects renderer IPC calls to database and AI operations
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerIPCHandlers = registerIPCHandlers;
const electron_1 = require("electron");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const electron_2 = require("electron");
const dbClient = __importStar(require("./db/client"));
const ollama_manager_1 = require("./ollama-manager");
const council_1 = require("./ai/council");
const extractor_1 = require("./pdf/extractor");
/**
 * Register all IPC handlers
 */
function registerIPCHandlers() {
    // =====================================================
    // Projects
    // =====================================================
    electron_1.ipcMain.handle('db:get-projects', async () => {
        return dbClient.getAllProjects();
    });
    electron_1.ipcMain.handle('db:get-project', async (_event, id) => {
        return dbClient.getProjectById(id);
    });
    electron_1.ipcMain.handle('db:create-project', async (_event, data) => {
        return dbClient.createProject({
            name: data.name,
            research_question: data.research_question,
            pico_criteria: data.pico_criteria ? JSON.stringify(data.pico_criteria) : undefined
        });
    });
    electron_1.ipcMain.handle('db:update-project', async (_event, id, data) => {
        return dbClient.updateProject(id, {
            ...data,
            pico_criteria: data.pico_criteria ? JSON.stringify(data.pico_criteria) : undefined
        });
    });
    electron_1.ipcMain.handle('db:delete-project', async (_event, id) => {
        return dbClient.deleteProject(id);
    });
    electron_1.ipcMain.handle('db:get-project-stats', async (_event, projectId) => {
        return dbClient.getProjectStats(projectId);
    });
    // =====================================================
    // Articles
    // =====================================================
    electron_1.ipcMain.handle('db:get-articles', async (_event, projectId) => {
        return dbClient.getArticlesByProject(projectId);
    });
    electron_1.ipcMain.handle('db:get-article', async (_event, id) => {
        return dbClient.getArticleById(id);
    });
    electron_1.ipcMain.handle('db:get-articles-with-decisions', async (_event, projectId) => {
        return dbClient.getArticlesWithDecisions(projectId);
    });
    electron_1.ipcMain.handle('db:search-articles', async (_event, projectId, query) => {
        return dbClient.searchArticles(projectId, query);
    });
    // =====================================================
    // Screening
    // =====================================================
    electron_1.ipcMain.handle('db:save-screening-decision', async (_event, decision) => {
        return dbClient.saveScreeningDecision({
            ...decision,
            model_votes: decision.model_votes ? JSON.stringify(decision.model_votes) : undefined
        });
    });
    electron_1.ipcMain.handle('db:update-screening-decision', async (_event, articleId, data) => {
        return dbClient.saveScreeningDecision({
            article_id: articleId,
            ...data,
            model_votes: data.model_votes ? JSON.stringify(data.model_votes) : undefined
        });
    });
    electron_1.ipcMain.handle('db:get-screening-decision', async (_event, articleId) => {
        const decision = dbClient.getScreeningDecision(articleId);
        if (decision && decision.model_votes) {
            return {
                ...decision,
                model_votes: JSON.parse(decision.model_votes)
            };
        }
        return decision;
    });
    // =====================================================
    // Extraction
    // =====================================================
    electron_1.ipcMain.handle('db:save-extracted-data', async (_event, data) => {
        return dbClient.saveExtractedData({
            ...data,
            population: data.population ? JSON.stringify(data.population) : undefined,
            intervention: data.intervention ? JSON.stringify(data.intervention) : undefined,
            comparison: data.comparison ? JSON.stringify(data.comparison) : undefined,
            outcomes: data.outcomes ? JSON.stringify(data.outcomes) : undefined,
            primary_outcomes: data.primary_outcomes ? JSON.stringify(data.primary_outcomes) : undefined,
            secondary_outcomes: data.secondary_outcomes ? JSON.stringify(data.secondary_outcomes) : undefined,
            statistics: data.statistics ? JSON.stringify(data.statistics) : undefined,
            risk_of_bias: data.risk_of_bias ? JSON.stringify(data.risk_of_bias) : undefined,
            quality_score: data.quality_score ? JSON.stringify(data.quality_score) : undefined
        });
    });
    electron_1.ipcMain.handle('db:update-extracted-data', async (_event, articleId, data) => {
        return dbClient.saveExtractedData({
            article_id: articleId,
            ...data,
            population: data.population ? JSON.stringify(data.population) : undefined,
            intervention: data.intervention ? JSON.stringify(data.intervention) : undefined,
            comparison: data.comparison ? JSON.stringify(data.comparison) : undefined,
            outcomes: data.outcomes ? JSON.stringify(data.outcomes) : undefined,
            primary_outcomes: data.primary_outcomes ? JSON.stringify(data.primary_outcomes) : undefined,
            secondary_outcomes: data.secondary_outcomes ? JSON.stringify(data.secondary_outcomes) : undefined,
            statistics: data.statistics ? JSON.stringify(data.statistics) : undefined,
            risk_of_bias: data.risk_of_bias ? JSON.stringify(data.risk_of_bias) : undefined,
            quality_score: data.quality_score ? JSON.stringify(data.quality_score) : undefined
        });
    });
    electron_1.ipcMain.handle('db:get-extracted-data', async (_event, articleId) => {
        const data = dbClient.getExtractedData(articleId);
        if (data) {
            return parseExtractedDataJSON(data);
        }
        return null;
    });
    electron_1.ipcMain.handle('db:get-all-extracted-data', async (_event, projectId) => {
        const allData = dbClient.getAllExtractedData(projectId);
        return allData.map(parseExtractedDataJSON);
    });
    // =====================================================
    // AI Operations
    // =====================================================
    electron_1.ipcMain.handle('ai:screen-article', async (event, request) => {
        const article = dbClient.getArticleById(request.article_id);
        if (!article) {
            throw new Error(`Article ${request.article_id} not found`);
        }
        const council = council_1.AICouncil.getInstance();
        const startTime = Date.now();
        try {
            const result = await council.screenArticle({
                id: article.id,
                title: article.title || '',
                abstract: article.abstract || '',
                full_text: article.full_text || '',
                methods: article.methods || '',
                results: article.results || ''
            }, request.pico_criteria, request.provider || 'local', request.force_cloud);
            // Log AI usage
            dbClient.logAIUsage({
                operation: 'screening',
                article_id: article.id,
                provider: result.provider,
                model: result.model_votes ? result.model_votes[0]?.model : 'unknown',
                latency_ms: Date.now() - startTime,
                cost_usd: result.cost_usd || 0,
                status: 'success'
            });
            return result;
        }
        catch (error) {
            dbClient.logAIUsage({
                operation: 'screening',
                article_id: article.id,
                provider: request.provider || 'local',
                model: 'unknown',
                latency_ms: Date.now() - startTime,
                status: 'failed',
                error_message: error.message
            });
            throw error;
        }
    });
    electron_1.ipcMain.handle('ai:screen-batch', async (event, requests) => {
        const results = [];
        for (const request of requests) {
            try {
                const result = await electron_1.ipcMain.handleOnce('ai:screen-article', request);
                results.push(result);
                // Send progress event
                event.sender.send('event:screening-progress', {
                    article_id: request.article_id,
                    status: 'complete',
                    progress: results.length / requests.length * 100
                });
            }
            catch (error) {
                results.push({
                    article_id: request.article_id,
                    error: error.message
                });
            }
        }
        return results;
    });
    electron_1.ipcMain.handle('ai:extract-data', async (_event, request) => {
        const article = dbClient.getArticleById(request.article_id);
        if (!article) {
            throw new Error(`Article ${request.article_id} not found`);
        }
        const council = council_1.AICouncil.getInstance();
        const startTime = Date.now();
        try {
            const result = await council.extractData({
                id: article.id,
                title: article.title || '',
                abstract: article.abstract || '',
                full_text: article.full_text || '',
                methods: article.methods || '',
                results: article.results || ''
            }, request.provider || 'local');
            dbClient.logAIUsage({
                operation: 'extraction',
                article_id: article.id,
                provider: request.provider || 'local',
                model: 'extraction-model',
                latency_ms: Date.now() - startTime,
                cost_usd: result.cost_usd || 0,
                status: 'success'
            });
            return result;
        }
        catch (error) {
            dbClient.logAIUsage({
                operation: 'extraction',
                article_id: article.id,
                provider: request.provider || 'local',
                model: 'extraction-model',
                latency_ms: Date.now() - startTime,
                status: 'failed',
                error_message: error.message
            });
            throw error;
        }
    });
    electron_1.ipcMain.handle('ai:get-usage-summary', async (_event, month) => {
        return dbClient.getAIUsageSummary(month);
    });
    // =====================================================
    // Ollama
    // =====================================================
    electron_1.ipcMain.handle('ollama:check-status', async () => {
        const ollama = ollama_manager_1.OllamaManager.getInstance();
        const connected = await ollama.checkConnection();
        const models = connected ? await ollama.listModels() : [];
        return {
            connected,
            version: connected ? 'detected' : undefined,
            models: models.map(m => m.name)
        };
    });
    electron_1.ipcMain.handle('ollama:download-model', async (event, request) => {
        const ollama = ollama_manager_1.OllamaManager.getInstance();
        await ollama.downloadModel(request.model_name, (progress) => {
            event.sender.send('event:model-download-progress', {
                model_name: request.model_name,
                progress: progress.total > 0 ? (progress.completed / progress.total * 100) : 0,
                status: progress.status,
            });
        });
    });
    electron_1.ipcMain.handle('ollama:cancel-download', async (_event, modelName) => {
        const ollama = ollama_manager_1.OllamaManager.getInstance();
        ollama.cancelDownload(modelName);
    });
    // =====================================================
    // File Operations
    // =====================================================
    electron_1.ipcMain.handle('fs:select-pdf', async () => {
        const result = await electron_1.dialog.showOpenDialog({
            properties: ['openFile', 'multiSelections'],
            filters: [
                { name: 'PDF Files', extensions: ['pdf'] }
            ]
        });
        return { file_paths: result.filePaths };
    });
    electron_1.ipcMain.handle('fs:upload-pdf', async (event, request) => {
        const { project_id, file_path } = request;
        // Create storage directory
        const storageDir = path.join(electron_2.app.getPath('userData'), 'pdfs', String(project_id));
        if (!fs.existsSync(storageDir)) {
            fs.mkdirSync(storageDir, { recursive: true });
        }
        // Copy PDF to storage
        const filename = path.basename(file_path);
        const storagePath = path.join(storageDir, `${Date.now()}_${filename}`);
        fs.copyFileSync(file_path, storagePath);
        // Get file size
        const stats = fs.statSync(storagePath);
        // Insert article record
        const article = dbClient.insertArticle({
            project_id,
            pdf_path: storagePath,
            original_filename: filename,
            file_size_bytes: stats.size
        });
        // Start extraction in background
        extractPDFInBackground(article.id, storagePath, event);
        return {
            article,
            extraction_started: true
        };
    });
    electron_1.ipcMain.handle('fs:export-csv', async (_event, request) => {
        const extractedData = dbClient.getAllExtractedData(request.project_id);
        // Generate CSV content
        const csv = generateRevManCSV(extractedData, request.format);
        // Show save dialog
        const result = await electron_1.dialog.showSaveDialog({
            defaultPath: `meta-analysis-export-${Date.now()}.csv`,
            filters: [
                { name: 'CSV Files', extensions: ['csv'] }
            ]
        });
        if (!result.canceled && result.filePath) {
            fs.writeFileSync(result.filePath, csv, 'utf-8');
            return {
                file_path: result.filePath,
                exported_count: extractedData.length
            };
        }
        throw new Error('Export canceled');
    });
    electron_1.ipcMain.handle('fs:export-prisma', async (_event, request) => {
        const stats = dbClient.getProjectStats(request.project_id);
        // Generate PRISMA SVG (simplified version)
        const svg = generatePRISMASVG(stats);
        return {
            svg_data: svg,
            counts: {
                screened: stats.total_articles,
                included: stats.included,
                excluded: stats.excluded
            }
        };
    });
    electron_1.ipcMain.handle('fs:open-data-folder', async () => {
        const dataPath = electron_2.app.getPath('userData');
        electron_1.shell.openPath(dataPath);
    });
    // =====================================================
    // Settings
    // =====================================================
    electron_1.ipcMain.handle('settings:get-all', async () => {
        const settings = dbClient.getAllSettings();
        // Parse JSON values
        return {
            ai_provider_mode: settings.ai_provider_mode || 'hybrid',
            local_models: settings.local_models ? JSON.parse(settings.local_models) : [],
            export_format_default: settings.export_format_default || 'csv',
            screening_confidence_threshold: parseInt(settings.screening_confidence_threshold || '75'),
            monthly_cost_limit_usd: parseFloat(settings.monthly_cost_limit_usd || '10.00'),
            current_month_cost_usd: parseFloat(settings.current_month_cost_usd || '0.00'),
            ollama_status: settings.ollama_status || 'not_checked',
            cloud_api_key_encrypted: settings.cloud_api_key_encrypted
        };
    });
    electron_1.ipcMain.handle('settings:update', async (_event, request) => {
        const value = typeof request.value === 'object'
            ? JSON.stringify(request.value)
            : String(request.value);
        return dbClient.setSetting(request.key, value);
    });
    electron_1.ipcMain.handle('settings:set-api-key', async (_event, key) => {
        // TODO: Encrypt the key before storing
        return dbClient.setSetting('cloud_api_key_encrypted', key);
    });
    electron_1.ipcMain.handle('settings:get-api-key', async () => {
        const setting = dbClient.getSetting('cloud_api_key_encrypted');
        // TODO: Decrypt the key
        return setting?.value || null;
    });
}
// =====================================================
// Helper Functions
// =====================================================
function parseExtractedDataJSON(data) {
    return {
        ...data,
        population: data.population ? JSON.parse(data.population) : null,
        intervention: data.intervention ? JSON.parse(data.intervention) : null,
        comparison: data.comparison ? JSON.parse(data.comparison) : null,
        outcomes: data.outcomes ? JSON.parse(data.outcomes) : null,
        primary_outcomes: data.primary_outcomes ? JSON.parse(data.primary_outcomes) : null,
        secondary_outcomes: data.secondary_outcomes ? JSON.parse(data.secondary_outcomes) : null,
        statistics: data.statistics ? JSON.parse(data.statistics) : null,
        risk_of_bias: data.risk_of_bias ? JSON.parse(data.risk_of_bias) : null,
        quality_score: data.quality_score ? JSON.parse(data.quality_score) : null
    };
}
async function extractPDFInBackground(articleId, pdfPath, event) {
    try {
        event.sender.send('event:pdf-extraction-progress', {
            article_id: articleId,
            status: 'processing',
            progress: 0
        });
        const extracted = await (0, extractor_1.extractPDFText)(pdfPath);
        // Update article with extracted content
        const updateData = {
            full_text: extracted.fullText,
            abstract: extracted.sections.abstract,
            methods: extracted.sections.methods,
            results: extracted.sections.results,
            discussion: extracted.sections.discussion,
            title: extracted.metadata.title || undefined,
            authors: extracted.metadata.authors?.join(', '),
            year: extracted.metadata.year,
            doi: extracted.metadata.doi,
            extraction_status: 'complete'
        };
        // TODO: Implement updateArticle in db client
        event.sender.send('event:pdf-extraction-progress', {
            article_id: articleId,
            status: 'complete',
            progress: 100
        });
    }
    catch (error) {
        console.error(`PDF extraction failed for article ${articleId}:`, error);
        event.sender.send('event:pdf-extraction-progress', {
            article_id: articleId,
            status: 'failed',
            progress: 0,
            error: error.message
        });
    }
}
function generateRevManCSV(data, format) {
    // Simplified RevMan CSV generation
    const headers = [
        'Study ID', 'Year', 'Authors', 'Intervention', 'Control', 'Outcome',
        'n (Intervention)', 'n (Control)', 'Mean (Intervention)', 'SD (Intervention)',
        'Mean (Control)', 'SD (Control)', 'P Value'
    ];
    const rows = data.map(d => {
        const primaryOutcome = d.primary_outcomes?.[0] || {};
        return [
            d.article_id,
            d.year || '',
            d.authors || '',
            d.intervention?.name || '',
            d.comparison?.name || '',
            primaryOutcome.outcome || '',
            primaryOutcome.intervention_n || '',
            primaryOutcome.control_n || '',
            primaryOutcome.intervention_mean || '',
            primaryOutcome.intervention_sd || '',
            primaryOutcome.control_mean || '',
            primaryOutcome.control_sd || '',
            primaryOutcome.p_value || ''
        ].join(',');
    });
    return [headers.join(','), ...rows].join('\n');
}
function generatePRISMASVG(stats) {
    // Simplified PRISMA diagram SVG
    return `
    <svg width="600" height="400" xmlns="http://www.w3.org/2000/svg">
      <rect x="200" y="20" width="200" height="60" fill="#e2e8f0" stroke="#334155" stroke-width="2"/>
      <text x="300" y="55" text-anchor="middle" font-family="Arial" font-size="14">
        Articles Screened: ${stats.total_articles}
      </text>
      
      <rect x="200" y="120" width="200" height="60" fill="#dcfce7" stroke="#16a34a" stroke-width="2"/>
      <text x="300" y="155" text-anchor="middle" font-family="Arial" font-size="14">
        Included: ${stats.included}
      </text>
      
      <rect x="200" y="220" width="200" height="60" fill="#fee2e2" stroke="#dc2626" stroke-width="2"/>
      <text x="300" y="255" text-anchor="middle" font-family="Arial" font-size="14">
        Excluded: ${stats.excluded}
      </text>
      
      <line x1="300" y1="80" x2="300" y2="120" stroke="#334155" stroke-width="2"/>
      <line x1="300" y1="180" x2="300" y2="220" stroke="#334155" stroke-width="2"/>
    </svg>
  `;
}
