"use strict";
/**
 * Ollama Manager - Singleton for local AI model management
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
exports.OllamaManager = void 0;
const child_process_1 = require("child_process");
const http = __importStar(require("http"));
class OllamaManager {
    constructor() {
        this.connected = false;
        this.baseURL = 'http://localhost:11434';
        this.downloadProcesses = new Map();
    }
    static getInstance() {
        if (!OllamaManager.instance) {
            OllamaManager.instance = new OllamaManager();
        }
        return OllamaManager.instance;
    }
    /**
     * Check if Ollama is running
     */
    async checkConnection() {
        try {
            const version = await this.makeRequest('/api/version', 'GET');
            this.connected = !!version;
            console.log(` Ollama connected (version: ${version?.version || 'unknown'})`);
            return this.connected;
        }
        catch (error) {
            this.connected = false;
            console.warn('⚠️ Ollama not detected. Local AI features will be unavailable.');
            return false;
        }
    }
    /**
     * Get list of downloaded models
     */
    async listModels() {
        try {
            const response = await this.makeRequest('/api/tags', 'GET');
            return response?.models || [];
        }
        catch (error) {
            console.error('Failed to list Ollama models:', error);
            return [];
        }
    }
    /**
     * Download a model with progress tracking
     */
    async downloadModel(modelName, onProgress) {
        return new Promise((resolve, reject) => {
            const curlProcess = (0, child_process_1.spawn)('curl', [
                '-X', 'POST',
                `${this.baseURL}/api/pull`,
                '-d', JSON.stringify({ name: modelName }),
                '-H', 'Content-Type: application/json'
            ]);
            this.downloadProcesses.set(modelName, curlProcess);
            let buffer = '';
            curlProcess.stdout.on('data', (data) => {
                buffer += data.toString();
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';
                for (const line of lines) {
                    if (!line.trim())
                        continue;
                    try {
                        const progress = JSON.parse(line);
                        onProgress({
                            status: progress.status || 'downloading',
                            completed: progress.completed || 0,
                            total: progress.total || 100
                        });
                    }
                    catch (e) {
                        // Invalid JSON, ignore
                    }
                }
            });
            curlProcess.on('close', (code) => {
                this.downloadProcesses.delete(modelName);
                if (code === 0) {
                    resolve();
                }
                else {
                    reject(new Error(`Model download failed with code ${code}`));
                }
            });
            curlProcess.on('error', (error) => {
                this.downloadProcesses.delete(modelName);
                reject(error);
            });
        });
    }
    /**
     * Cancel an ongoing download
     */
    cancelDownload(modelName) {
        const process = this.downloadProcesses.get(modelName);
        if (process) {
            process.kill();
            this.downloadProcesses.delete(modelName);
            return true;
        }
        return false;
    }
    /**
     * Generate completion from a model
     */
    async generate(model, prompt, options) {
        try {
            const response = await this.makeRequest('/api/generate', 'POST', {
                model,
                prompt,
                system: options?.system,
                temperature: options?.temperature || 0.7,
                stream: options?.stream || false,
                format: 'json' // Request JSON output
            });
            return response?.response || '';
        }
        catch (error) {
            console.error(`Ollama generation error (${model}):`, error);
            throw error;
        }
    }
    /**
     * Make HTTP request to Ollama API
     */
    makeRequest(endpoint, method, body) {
        return new Promise((resolve, reject) => {
            const url = new URL(endpoint, this.baseURL);
            const options = {
                method,
                timeout: 5000
            };
            if (body && method === 'POST') {
                options.headers = {
                    'Content-Type': 'application/json'
                };
            }
            const req = http.request(url, options, (res) => {
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });
                res.on('end', () => {
                    try {
                        const parsed = JSON.parse(data);
                        resolve(parsed);
                    }
                    catch (e) {
                        resolve(data);
                    }
                });
            });
            req.on('error', (error) => {
                reject(error);
            });
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });
            if (body && method === 'POST') {
                req.write(JSON.stringify(body));
            }
            req.end();
        });
    }
    isConnected() {
        return this.connected;
    }
}
exports.OllamaManager = OllamaManager;
