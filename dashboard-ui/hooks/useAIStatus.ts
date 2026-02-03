import { useState, useEffect, useCallback } from 'react';
import { ipcClient } from '../lib/ipc/renderer';
import type { OllamaStatusResponse, DownloadModelProgress } from '../lib/ipc/types';

export function useAIStatus() {
    const [status, setStatus] = useState<OllamaStatusResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [downloads, setDownloads] = useState<Record<string, DownloadModelProgress>>({});

    const refreshStatus = useCallback(async () => {
        try {
            setIsLoading(true);
            const res = await ipcClient.ollamaCheckStatus();
            setStatus(res);
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Failed to connect to Ollama');
            setStatus({ connected: false, models: [] });
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshStatus();

        // Subscribe to download progress
        const unsubscribe = ipcClient.onModelDownloadProgress((progress) => {
            setDownloads(prev => ({
                ...prev,
                [progress.model_name]: progress
            }));

            // If a download completed, refresh the model list
            if (progress.status === 'complete') {
                refreshStatus();
            }
        });

        return () => {
            if (typeof unsubscribe === 'function') {
                unsubscribe();
            }
        };
    }, [refreshStatus]);

    const downloadModel = async (modelName: string) => {
        try {
            await ipcClient.ollamaDownloadModel({ model_name: modelName });
        } catch (err: any) {
            setError(err.message || `Failed to start download for ${modelName}`);
        }
    };

    const cancelDownload = async (modelName: string) => {
        try {
            await ipcClient.ollamaCancelDownload(modelName);
            setDownloads(prev => {
                const next = { ...prev };
                delete next[modelName];
                return next;
            });
        } catch (err: any) {
            setError(err.message || `Failed to cancel download for ${modelName}`);
        }
    };

    return {
        status,
        isLoading,
        error,
        downloads,
        refreshStatus,
        downloadModel,
        cancelDownload
    };
}
