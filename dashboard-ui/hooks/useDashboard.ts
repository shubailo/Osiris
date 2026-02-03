import { useState, useEffect, useCallback } from 'react';
import { ipcClient } from '../lib/ipc/renderer';

export interface DashboardStats {
    totalArticles: number;
    screened: number;
    included: number;
    excluded: number;
    extracted: number;
    pending: number;
}

export function useDashboard(projectId: number) {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [recentActivity, setRecentActivity] = useState<any[]>([]);

    const loadDashboard = useCallback(async () => {
        if (!projectId) return;
        try {
            setIsLoading(true);
            const data = await ipcClient.getProjectStats(projectId);
            setStats({
                totalArticles: data.total_articles,
                screened: data.included + data.excluded,
                included: data.included,
                excluded: data.excluded,
                extracted: data.extracted,
                pending: data.pending
            });

            setRecentActivity([
                {
                    id: "1",
                    type: "screening",
                    message: `AI finished screening ${data.included + data.excluded} articles`,
                    timestamp: "Recently",
                    icon: "search",
                }
            ]);

            setError(null);
        } catch (err: any) {
            setError(err.message || 'Failed to load dashboard data');
        } finally {
            setIsLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        loadDashboard();
    }, [loadDashboard]);

    return {
        stats,
        isLoading,
        error,
        recentActivity,
        refresh: loadDashboard
    };
}
