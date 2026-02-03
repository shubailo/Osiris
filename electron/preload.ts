import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import type {
    Project, CreateProjectRequest, Article, ArticleWithDecision,
    ScreeningDecision, ExtractedData, ScreenArticleRequest, ScreenArticleResponse,
    ExtractDataRequest, ExtractDataResponse, UploadPDFRequest, UploadPDFResponse,
    SelectPDFResponse, OllamaStatusResponse, DownloadModelRequest, DownloadModelProgress,
    ExportCSVRequest, ExportCSVResponse, GeneratePRISMARequest, GeneratePRISMAResponse,
    AppSettings, UpdateSettingRequest, ProjectStats, AIUsageSummary
} from '../dashboard-ui/lib/ipc/types';
/// <reference lib="dom" />
/**
 * Preload script for safe IPC exposure to renderer
 */
contextBridge.exposeInMainWorld('electron', {
    // =====================================================
    // Projects
    // =====================================================
    getProjects: () => ipcRenderer.invoke('db:get-projects') as Promise<Project[]>,

    getProject: (id: number) => ipcRenderer.invoke('db:get-project', id) as Promise<Project | null>,

    createProject: (data: CreateProjectRequest) =>
        ipcRenderer.invoke('db:create-project', data) as Promise<Project>,

    updateProject: (id: number, data: Partial<Project>) =>
        ipcRenderer.invoke('db:update-project', id, data) as Promise<boolean>,

    deleteProject: (id: number) =>
        ipcRenderer.invoke('db:delete-project', id) as Promise<boolean>,

    getProjectStats: (projectId: number) =>
        ipcRenderer.invoke('db:get-project-stats', projectId) as Promise<ProjectStats>,

    // =====================================================
    // Articles
    // =====================================================
    getArticles: (projectId: number) =>
        ipcRenderer.invoke('db:get-articles', projectId) as Promise<Article[]>,

    getArticle: (id: number) =>
        ipcRenderer.invoke('db:get-article', id) as Promise<Article | null>,

    getArticlesWithDecisions: (projectId: number) =>
        ipcRenderer.invoke('db:get-articles-with-decisions', projectId) as Promise<ArticleWithDecision[]>,

    searchArticles: (projectId: number, query: string) =>
        ipcRenderer.invoke('db:search-articles', projectId, query) as Promise<Article[]>,

    // =====================================================
    // Screening
    // =====================================================
    saveScreeningDecision: (decision: Omit<ScreeningDecision, 'id' | 'decided_at'>) =>
        ipcRenderer.invoke('db:save-screening-decision', decision) as Promise<number>,

    updateScreeningDecision: (articleId: number, data: Partial<ScreeningDecision>) =>
        ipcRenderer.invoke('db:update-screening-decision', articleId, data) as Promise<boolean>,

    getScreeningDecision: (articleId: number) =>
        ipcRenderer.invoke('db:get-screening-decision', articleId) as Promise<ScreeningDecision | null>,

    // =====================================================
    // Extraction
    // =====================================================
    saveExtractedData: (data: Omit<ExtractedData, 'id' | 'extracted_at' | 'last_edited_at'>) =>
        ipcRenderer.invoke('db:save-extracted-data', data) as Promise<number>,

    updateExtractedData: (articleId: number, data: Partial<ExtractedData>) =>
        ipcRenderer.invoke('db:update-extracted-data', articleId, data) as Promise<boolean>,

    getExtractedData: (articleId: number) =>
        ipcRenderer.invoke('db:get-extracted-data', articleId) as Promise<ExtractedData | null>,

    getAllExtractedData: (projectId: number) =>
        ipcRenderer.invoke('db:get-all-extracted-data', projectId) as Promise<ExtractedData[]>,

    // =====================================================
    // AI Operations
    // =====================================================
    screenArticle: (request: ScreenArticleRequest) =>
        ipcRenderer.invoke('ai:screen-article', request) as Promise<ScreenArticleResponse>,

    screenBatch: (articles: ScreenArticleRequest[]) =>
        ipcRenderer.invoke('ai:screen-batch', articles) as Promise<ScreenArticleResponse[]>,

    extractData: (request: ExtractDataRequest) =>
        ipcRenderer.invoke('ai:extract-data', request) as Promise<ExtractDataResponse>,

    getAIUsageSummary: (month: string) =>
        ipcRenderer.invoke('ai:get-usage-summary', month) as Promise<AIUsageSummary[]>,

    // =====================================================
    // Ollama
    // =====================================================
    ollamaCheckStatus: () =>
        ipcRenderer.invoke('ollama:check-status') as Promise<OllamaStatusResponse>,

    ollamaDownloadModel: (request: DownloadModelRequest) =>
        ipcRenderer.invoke('ollama:download-model', request) as Promise<void>,

    ollamaCancelDownload: (modelName: string) =>
        ipcRenderer.invoke('ollama:cancel-download', modelName) as Promise<void>,

    // Listen to download progress
    onModelDownloadProgress: (callback: (progress: DownloadModelProgress) => void) => {
        const listener = (_event: IpcRendererEvent, progress: DownloadModelProgress) => callback(progress);
        ipcRenderer.on('event:model-download-progress', listener);
        return () => ipcRenderer.removeListener('event:model-download-progress', listener);
    },

    // =====================================================
    // File Operations
    // =====================================================
    selectPDF: () =>
        ipcRenderer.invoke('fs:select-pdf') as Promise<SelectPDFResponse>,

    uploadPDF: (request: UploadPDFRequest) =>
        ipcRenderer.invoke('fs:upload-pdf', request) as Promise<UploadPDFResponse>,

    exportCSV: (request: ExportCSVRequest) =>
        ipcRenderer.invoke('fs:export-csv', request) as Promise<ExportCSVResponse>,

    exportPRISMA: (request: GeneratePRISMARequest) =>
        ipcRenderer.invoke('fs:export-prisma', request) as Promise<GeneratePRISMAResponse>,

    openDataFolder: () =>
        ipcRenderer.invoke('fs:open-data-folder') as Promise<void>,

    // =====================================================
    // Settings
    // =====================================================
    getAllSettings: () =>
        ipcRenderer.invoke('settings:get-all') as Promise<AppSettings>,

    updateSetting: (request: UpdateSettingRequest) =>
        ipcRenderer.invoke('settings:update', request) as Promise<boolean>,

    setAPIKey: (key: string) =>
        ipcRenderer.invoke('settings:set-api-key', key) as Promise<boolean>,

    getAPIKey: () =>
        ipcRenderer.invoke('settings:get-api-key') as Promise<string | null>,

    // =====================================================
    // Progress Events
    // =====================================================
    onPDFExtractionProgress: (callback: (progress: { article_id: number; status: string; progress: number }) => void) => {
        const listener = (_event: IpcRendererEvent, progress: any) => callback(progress);
        ipcRenderer.on('event:pdf-extraction-progress', listener);
        return () => ipcRenderer.removeListener('event:pdf-extraction-progress', listener);
    },

    onScreeningProgress: (callback: (progress: { article_id: number; model: string; status: string }) => void) => {
        const listener = (_event: IpcRendererEvent, progress: any) => callback(progress);
        ipcRenderer.on('event:screening-progress', listener);
        return () => ipcRenderer.removeListener('event:screening-progress', listener);
    },

    // Export Operations
    exportPrisma: (request: { project_id: number; output_path: string }) =>
        ipcRenderer.invoke('export:prisma-diagram', request),

    exportRevManCSV: (request: { project_id: number; output_path: string }) =>
        ipcRenderer.invoke('export:revman-csv', request),

    exportRevManXML: (request: { project_id: number; output_path: string }) =>
        ipcRenderer.invoke('export:revman-xml', request),

    exportJSON: (request: { project_id: number; output_path: string }) =>
        ipcRenderer.invoke('export:json', request),

    exportAll: (request: { project_id: number; output_dir: string }) =>
        ipcRenderer.invoke('export:all', request),

    selectExportLocation: () =>
        ipcRenderer.invoke('fs:select-export-location')
});

interface LocalWindow {
    electron: any;
}
declare const window: LocalWindow;

// Type definition for renderer (global.d.ts)
export type ElectronAPI = typeof window.electron;
