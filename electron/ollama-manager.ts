/**
 * Ollama Manager - Singleton for local AI model management
 */

import { spawn, ChildProcess } from 'child_process';
import * as http from 'http';

export interface OllamaModel {
    name: string;
    size: string;
    modified_at: string;
    digest?: string;
    details?: {
        family?: string;
        parameter_size?: string;
        quantization_level?: string;
    };
}

export interface AvailableModel {
    name: string;
    description: string;
    parameter_size: string;
    recommended_for: string[];
    requires_gpu: boolean;
}

export class OllamaManager {
    private static instance: OllamaManager;
    private connected: boolean = false;
    private baseURL: string = 'http://localhost:11434';
    private downloadProcesses: Map<string, ChildProcess> = new Map();

    private constructor() { }

    static getInstance(): OllamaManager {
        if (!OllamaManager.instance) {
            OllamaManager.instance = new OllamaManager();
        }
        return OllamaManager.instance;
    }

    /**
     * Check if Ollama is running
     */
    async checkConnection(): Promise<boolean> {
        try {
            const version = await this.makeRequest('/api/version', 'GET');
            this.connected = !!version;
            console.log(` Ollama connected (version: ${version?.version || 'unknown'})`);
            return this.connected;
        } catch (error) {
            this.connected = false;
            console.warn('⚠️ Ollama not detected. Local AI features will be unavailable.');
            return false;
        }
    }

    /**
     * Get list of downloaded models
     */
    async listModels(): Promise<OllamaModel[]> {
        try {
            const response = await this.makeRequest('/api/tags', 'GET');
            return response?.models || [];
        } catch (error) {
            console.error('Failed to list Ollama models:', error);
            return [];
        }
    }

    /**
     * Get list of available models for download
     */
    getAvailableModels(): AvailableModel[] {
        return [
            {
                name: 'llama3.3:70b',
                description: 'Meta Llama 3.3 70B - Flagship reasoning model',
                parameter_size: '70B',
                recommended_for: ['medical screening', 'complex reasoning', 'high accuracy'],
                requires_gpu: true
            },
            {
                name: 'mistral-large',
                description: 'Mistral Large - Strong generalist model',
                parameter_size: '123B',
                recommended_for: ['medical text', 'analysis', 'multilingual'],
                requires_gpu: true
            },
            {
                name: 'gemma2:27b',
                description: 'Google Gemma 2 27B - Efficient and capable',
                parameter_size: '27B',
                recommended_for: ['extraction', 'classification', 'structured output'],
                requires_gpu: false
            },
            {
                name: 'llama3.2:3b',
                description: 'Meta Llama 3.2 3B - Fast and lightweight',
                parameter_size: '3B',
                recommended_for: ['testing', 'low-resource systems'],
                requires_gpu: false
            },
            {
                name: 'qwen2.5:14b',
                description: 'Qwen 2.5 14B - Excellent for medical domain',
                parameter_size: '14B',
                recommended_for: ['medical terminology', 'scientific text'],
                requires_gpu: false
            }
        ];
    }

    /**
     * Get detailed information about a model
     */
    async getModelInfo(modelName: string): Promise<any> {
        try {
            const response = await this.makeRequest('/api/show', 'POST', { name: modelName });
            return response;
        } catch (error: any) {
            throw new Error(`Failed to get model info: ${error.message}`);
        }
    }

    /**
     * Download a model with progress tracking
     */
    async downloadModel(
        modelName: string,
        onProgress: (progress: { status: string; completed: number; total: number }) => void
    ): Promise<void> {
        return new Promise((resolve, reject) => {
            const curlProcess = spawn('curl', [
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
                    if (!line.trim()) continue;

                    try {
                        const progress = JSON.parse(line);
                        onProgress({
                            status: progress.status || 'downloading',
                            completed: progress.completed || 0,
                            total: progress.total || 100
                        });
                    } catch (e) {
                        // Invalid JSON, ignore
                    }
                }
            });

            curlProcess.on('close', (code) => {
                this.downloadProcesses.delete(modelName);
                if (code === 0) {
                    resolve();
                } else {
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
    cancelDownload(modelName: string): boolean {
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
    async generate(
        model: string,
        prompt: string,
        options?: {
            system?: string;
            temperature?: number;
            stream?: boolean;
        }
    ): Promise<string> {
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
        } catch (error) {
            console.error(`Ollama generation error (${model}):`, error);
            throw error;
        }
    }

    /**
     * Make HTTP request to Ollama API
     */
    private makeRequest(
        endpoint: string,
        method: 'GET' | 'POST',
        body?: any
    ): Promise<any> {
        return new Promise((resolve, reject) => {
            const url = new URL(endpoint, this.baseURL);
            const options: http.RequestOptions = {
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
                    } catch (e) {
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

    isConnected(): boolean {
        return this.connected;
    }

    /**
     * Get user-friendly error message for common issues
     */
    getConnectionErrorMessage(): string {
        return `Ollama is not running. To use local AI features:

1. Download Ollama from https://ollama.ai
2. Install and start the Ollama service
3. Restart this application

Ollama runs in the background and provides free local AI processing.`;
    }

    /**
     * Get estimated download size for a model
     */
    getModelSize(modelName: string): string {
        const sizeMap: Record<string, string> = {
            'llama3.3:70b': '40 GB',
            'mistral-large': '68 GB',
            'gemma2:27b': '16 GB',
            'llama3.2:3b': '2 GB',
            'qwen2.5:14b': '8 GB'
        };
        return sizeMap[modelName] || 'Unknown';
    }
}
