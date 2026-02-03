import { useState, useEffect, useCallback } from 'react';
import { ipcClient } from '@/lib/ipc/renderer';
import type { OllamaStatusResponse, DownloadModelProgress } from '@/lib/ipc/types';

interface AvailableModel {
    name: string;
    description: string;
    parameter_size: string;
    recommended_for: string[];
    requires_gpu: boolean;
}

export function useSettings() {
    const [ollamaStatus, setOllamaStatus] = useState<OllamaStatusResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [downloads, setDownloads] = useState<Record<string, DownloadModelProgress>>({});

    // Available models list (from ollama-manager)
    const availableModels: AvailableModel[] = [
        {
            name: 'llama3.3:70b',
            description: 'Meta Llama 3.3 70B - Flagship reasoning model',
            parameter_size: '40 GB',
            recommended_for: ['medical screening', 'complex reasoning', 'high accuracy'],
            requires_gpu: true
        },
        {
            name: 'mistral-large',
            description: 'Mistral Large - Strong generalist model',
            parameter_size: '68 GB',
            recommended_for: ['medical text', 'analysis', 'multilingual'],
            requires_gpu: true
        },
        {
            name: 'gemma2:27b',
            description: 'Google Gemma 2 27B - Efficient and capable',
            parameter_size: '16 GB',
            recommended_for: ['extraction', 'classification', 'structured output'],
            requires_gpu: false
        },
        {
            name: 'llama3.2:3b',
            description: 'Meta Llama 3.2 3B - Fast and lightweight',
            parameter_size: '2 GB',
            recommended_for: ['testing', 'low-resource systems'],
            requires_gpu: false
        },
        {
            name: 'qwen2.5:14b',
            description: 'Qwen 2.5 14B - Excellent for medical domain',
            parameter_size: '8 GB',
            recommended_for: ['medical terminology', 'scientific text'],
            requires_gpu: false
        }
    ];

    const refreshStatus = useCallback(async () => {
        setIsLoading(true);
        try {
            const status = await ipcClient.ollamaCheckStatus();
            setOllamaStatus(status);
        } catch (error) {
            console.error('Failed to check Ollama status:', error);
            setOllamaStatus({ connected: false, models: [] });
        } finally {
            setIsLoading(false);
        }
    }, []);

    const downloadModel = async (modelName: string) => {
        try {
            await ipcClient.ollamaDownloadModel({ model_name: modelName });
        } catch (error) {
            console.error(`Failed to download model ${modelName}:`, error);
        }
    };

    const cancelDownload = async (modelName: string) => {
        try {
            await ipcClient.ollamaCancelDownload(modelName);
            setDownloads(prev => {
                const updated = { ...prev };
                delete updated[modelName];
                return updated;
            });
        } catch (error) {
            console.error(`Failed to cancel download for ${modelName}:`, error);
        }
    };

    // Subscribe to download progress
    useEffect(() => {
        const unsubscribe = ipcClient.onModelDownloadProgress((progress) => {
            setDownloads(prev => ({
                ...prev,
                [progress.model_name]: progress
            }));

            // Remove from downloads map when complete or failed
            if (progress.status === 'complete' || progress.status === 'failed') {
                setTimeout(() => {
                    setDownloads(prev => {
                        const updated = { ...prev };
                        delete updated[progress.model_name];
                        return updated;
                    });
                    // Refresh status to show newly installed model
                    if (progress.status === 'complete') {
                        refreshStatus();
                    }
                }, 2000);
            }
        });

        return () => unsubscribe();
    }, [refreshStatus]);

    // Initial status check
    useEffect(() => {
        refreshStatus();
    }, [refreshStatus]);

    return {
        ollamaStatus,
        installedModels: ollamaStatus?.models || [],
        availableModels,
        downloads,
        isLoading,
        downloadModel,
        cancelDownload,
        refreshStatus
    };
}
