import { useState, useEffect, useCallback } from 'react';
import { ipcClient } from '../lib/ipc/renderer';
import type { Article } from '../lib/ipc/types';

export function usePDFManager(projectId: number) {
    const [articles, setArticles] = useState<Article[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [extractionProgress, setExtractionProgress] = useState<Record<number, { status: string; progress: number }>>({});

    const loadArticles = useCallback(async () => {
        if (!projectId) return;
        try {
            setIsLoading(true);
            const data = await ipcClient.getArticles(projectId);
            setArticles(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load articles');
        } finally {
            setIsLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        loadArticles();

        // Subscribe to extraction progress
        const unsubscribe = ipcClient.onPDFExtractionProgress((progress) => {
            setExtractionProgress(prev => ({
                ...prev,
                [progress.article_id]: {
                    status: progress.status,
                    progress: progress.progress
                }
            }));

            if (progress.status === 'complete') {
                loadArticles();
            }
        });

        return () => {
            if (typeof unsubscribe === 'function') {
                unsubscribe();
            }
        };
    }, [loadArticles, projectId]);

    const uploadPDFs = async () => {
        try {
            const { file_paths } = await ipcClient.selectPDF();
            if (!file_paths || file_paths.length === 0) return;

            setIsLoading(true);
            for (const path of file_paths) {
                await ipcClient.uploadPDF({ project_id: projectId, file_path: path });
            }
            await loadArticles();
        } catch (err: any) {
            setError(err.message || 'Failed to upload PDFs');
        } finally {
            setIsLoading(false);
        }
    };

    return {
        articles,
        isLoading,
        error,
        extractionProgress,
        uploadPDFs,
        loadArticles
    };
}
