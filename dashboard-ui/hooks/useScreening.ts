import { useState, useCallback } from 'react';
import { ipcClient } from '../lib/ipc/renderer';
import type { ArticleWithDecision, ScreenArticleResponse, PICOCriteria } from '../lib/ipc/types';

export function useScreening(projectId: number) {
    const [articles, setArticles] = useState<ArticleWithDecision[]>([]);
    const [isScreening, setIsScreening] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [error, setError] = useState<string | null>(null);

    const loadArticles = useCallback(async () => {
        if (!projectId) return;
        try {
            const data = await ipcClient.getArticlesWithDecisions(projectId);
            setArticles(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load articles');
        }
    }, [projectId]);

    const startScreening = async (picoCriteria: PICOCriteria) => {
        const pendingArticles = articles.filter(a => a.decision === 'pending' || !a.decision);
        if (pendingArticles.length === 0) return;

        try {
            setIsScreening(true);
            setError(null);
            setProgress({ current: 0, total: pendingArticles.length });

            // Run screening in serial but update progress
            for (let i = 0; i < pendingArticles.length; i++) {
                const article = pendingArticles[i];

                try {
                    const result = await ipcClient.screenArticle({
                        article_id: article.id,
                        pico_criteria: picoCriteria,
                        provider: 'local'
                    });

                    // Save the decision immediately
                    await ipcClient.saveScreeningDecision({
                        article_id: article.id,
                        decision: result.decision,
                        confidence: result.confidence,
                        reasoning: result.reasoning,
                        consensus_type: result.consensus_type,
                        model_votes: result.model_votes,
                        ai_provider: 'local-council',
                        is_manual_override: false,
                        decided_by: 'ai'
                    });

                    setProgress(prev => ({ ...prev, current: i + 1 }));

                    // Refresh local state periodically or at the end
                    if ((i + 1) % 5 === 0 || i === pendingArticles.length - 1) {
                        await loadArticles();
                    }
                } catch (err) {
                    console.error(`Failed to screen article ${article.id}:`, err);
                    // Continue with next article
                }
            }
        } catch (err: any) {
            setError(err.message || 'Screening failed');
        } finally {
            setIsScreening(false);
            await loadArticles();
        }
    };

    const updateManualDecision = async (articleId: number, decision: 'include' | 'exclude') => {
        try {
            await ipcClient.saveScreeningDecision({
                article_id: articleId,
                decision,
                confidence: 100,
                reasoning: 'Manually updated by user',
                consensus_type: 'manual',
                ai_provider: 'manual',
                is_manual_override: true,
                decided_by: 'user'
            });
            await loadArticles();
        } catch (err: any) {
            setError(err.message || 'Failed to update decision');
        }
    };

    return {
        articles,
        isScreening,
        progress,
        error,
        loadArticles,
        startScreening,
        updateManualDecision
    };
}
