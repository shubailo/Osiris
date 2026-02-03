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

            const included = articlesData.filter((a: ArticleWithDecision) => a.decision === 'include') as ArticleWithDecision[];
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
            return true;
        } catch (err: any) {
            setError(err.message || 'Extraction failed');
            return false;
        } finally {
            setIsExtracting(false);
        }
    };

    const batchExtract = async () => {
        const pending = articles.filter(a => a.extraction_status !== 'complete');
        if (pending.length === 0) return;

        setIsExtracting(true);
        try {
            for (const article of pending) {
                await extractArticle(article.id);
            }
        } finally {
            setIsExtracting(false);
            await loadData();
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
        batchExtract,
        getArticleExtractedData,
        refresh: loadData
    };
}
