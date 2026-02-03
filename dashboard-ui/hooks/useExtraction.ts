import { useState, useCallback, useEffect } from 'react';
import { ipcClient } from '../lib/ipc/renderer';
import type { ArticleWithDecision, ExtractedData } from '../lib/ipc/types';

export function useExtraction(projectId: number) {
    const [articles, setArticles] = useState<ArticleWithDecision[]>([]);
    const [extractedData, setExtractedData] = useState<ExtractedData[]>([]);
    const [isExtracting, setIsExtracting] = useState(false);
    const [selectedArticleId, setSelectedArticleId] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        if (!projectId) return;
        try {
            setIsLoading(true);
            const [articlesData, allExtracted] = await Promise.all([
                ipcClient.getArticlesWithDecisions(projectId),
                ipcClient.getAllExtractedData(projectId)
            ]);

            const included = articlesData.filter(a => a.decision === 'include');
            setArticles(included);
            setExtractedData(allExtracted);

            if (included.length > 0 && !selectedArticleId) {
                setSelectedArticleId(included[0].id);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to load extraction data');
        } finally {
            setIsLoading(false);
        }
    }, [projectId, selectedArticleId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const extractArticle = async (articleId: number) => {
        try {
            setIsExtracting(true);
            setError(null);

            const result = await ipcClient.extractData({
                article_id: articleId,
                provider: 'local'
            });

            // Save the result
            await ipcClient.saveExtractedData({
                article_id: articleId,
                ...result.extracted_data
            });

            await loadData();
        } catch (err: any) {
            setError(err.message || 'Extraction failed');
        } finally {
            setIsExtracting(false);
        }
    };

    const getArticleExtractedData = (articleId: number) => {
        return extractedData.find(d => d.article_id === articleId);
    };

    return {
        articles,
        extractedData,
        isExtracting,
        isLoading,
        error,
        selectedArticleId,
        setSelectedArticleId,
        extractArticle,
        getArticleExtractedData,
        refresh: loadData
    };
}
