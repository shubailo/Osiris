/**
 * Renderer-side IPC client
 * Provides type-safe access to Electron APIs exposed via contextBridge
 */

import { IPC_CHANNELS } from './types';
import type {
    Project, CreateProjectRequest, Article, ArticleWithDecision,
    ScreeningDecision, ExtractedData, ScreenArticleRequest, ScreenArticleResponse,
    ExtractDataRequest, ExtractDataResponse, UploadPDFRequest, UploadPDFResponse,
    SelectPDFResponse, OllamaStatusResponse, DownloadModelRequest, DownloadModelProgress,
    ExportCSVRequest, ExportCSVResponse, GeneratePRISMARequest, GeneratePRISMAResponse,
    AppSettings, UpdateSettingRequest, ProjectStats, AIUsageSummary
} from './types';

// The 'window.electron' object is injected by preload.ts
// types are defined in global.d.ts

export const ipcClient = {
    // Projects
    getProjects: () => window.electron.getProjects(),
    getProject: (id: number) => window.electron.getProject(id),
    createProject: (data: CreateProjectRequest) => window.electron.createProject(data),
    updateProject: (id: number, data: Partial<Project>) => window.electron.updateProject(id, data),
    deleteProject: (id: number) => window.electron.deleteProject(id),
    getProjectStats: (projectId: number) => window.electron.getProjectStats(projectId),

    // Articles
    getArticles: (projectId: number) => window.electron.getArticles(projectId),
    getArticle: (id: number) => window.electron.getArticle(id),
    getArticlesWithDecisions: (projectId: number) => window.electron.getArticlesWithDecisions(projectId),
    searchArticles: (projectId: number, query: string) => window.electron.searchArticles(projectId, query),

    // Screening
    saveScreeningDecision: (decision: Omit<ScreeningDecision, 'id' | 'decided_at'>) =>
        window.electron.saveScreeningDecision(decision),
    updateScreeningDecision: (articleId: number, data: Partial<ScreeningDecision>) =>
        window.electron.updateScreeningDecision(articleId, data),
    getScreeningDecision: (articleId: number) =>
        window.electron.getScreeningDecision(articleId),

    // Extraction
    saveExtractedData: (data: Omit<ExtractedData, 'id' | 'extracted_at' | 'last_edited_at'>) =>
        window.electron.saveExtractedData(data),
    updateExtractedData: (articleId: number, data: Partial<ExtractedData>) =>
        window.electron.updateExtractedData(articleId, data),
    getExtractedData: (articleId: number) =>
        window.electron.getExtractedData(articleId),
    getAllExtractedData: (projectId: number) =>
        window.electron.getAllExtractedData(projectId),

    // AI Operations
    screenArticle: (request: ScreenArticleRequest) =>
        window.electron.screenArticle(request),
    screenBatch: (articles: ScreenArticleRequest[]) =>
        window.electron.screenBatch(articles),
    extractData: (request: ExtractDataRequest) =>
        window.electron.extractData(request),
    getAIUsageSummary: (month: string) =>
        window.electron.getAIUsageSummary(month),

    // Ollama
    ollamaCheckStatus: () => window.electron.ollamaCheckStatus(),
    ollamaDownloadModel: (request: DownloadModelRequest) => window.electron.ollamaDownloadModel(request),
    ollamaCancelDownload: (modelName: string) => window.electron.ollamaCancelDownload(modelName),

    // Listeners
    onModelDownloadProgress: (callback: (progress: DownloadModelProgress) => void) =>
        window.electron.onModelDownloadProgress(callback),
    onPDFExtractionProgress: (callback: (progress: { article_id: number; status: string; progress: number }) => void) =>
        window.electron.onPDFExtractionProgress(callback),
    onScreeningProgress: (callback: (progress: { article_id: number; model: string; status: string }) => void) =>
        window.electron.onScreeningProgress(callback),

    // File Operations
    selectPDF: () => window.electron.selectPDF(),
    uploadPDF: (request: UploadPDFRequest) => window.electron.uploadPDF(request),
    exportCSV: (request: ExportCSVRequest) => window.electron.exportCSV(request),
    exportPRISMA: (request: GeneratePRISMARequest) => window.electron.exportPRISMA(request),
    openDataFolder: () => window.electron.openDataFolder(),

    // Settings
    getAllSettings: () => window.electron.getAllSettings(),
    updateSetting: (request: UpdateSettingRequest) => window.electron.updateSetting(request),
    setAPIKey: (key: string) => window.electron.setAPIKey(key),
    getAPIKey: () => window.electron.getAPIKey(),
};
