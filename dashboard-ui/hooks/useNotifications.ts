import { useState, useCallback } from 'react';
import type { ToastNotification } from '@/components/progress-notifications';

let notificationId = 0;

export function useNotifications() {
    const [notifications, setNotifications] = useState<ToastNotification[]>([]);

    const addNotification = useCallback((
        notification: Omit<ToastNotification, 'id'>
    ): string => {
        const id = `notification-${++notificationId}`;
        const newNotification: ToastNotification = {
            id,
            duration: 5000, // Default 5 seconds
            ...notification,
        };

        setNotifications(prev => [...prev, newNotification]);
        return id;
    }, []);

    const updateNotification = useCallback((
        id: string,
        updates: Partial<Omit<ToastNotification, 'id'>>
    ) => {
        setNotifications(prev =>
            prev.map(n => (n.id === id ? { ...n, ...updates } : n))
        );
    }, []);

    const dismissNotification = useCallback((id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    const clearAll = useCallback(() => {
        setNotifications([]);
    }, []);

    // Convenience methods
    const success = useCallback((title: string, message?: string) => {
        return addNotification({ type: 'success', title, message });
    }, [addNotification]);

    const error = useCallback((title: string, message?: string) => {
        return addNotification({ type: 'error', title, message, duration: 8000 });
    }, [addNotification]);

    const info = useCallback((title: string, message?: string) => {
        return addNotification({ type: 'info', title, message });
    }, [addNotification]);

    const loading = useCallback((title: string, message?: string) => {
        return addNotification({ type: 'loading', title, message, duration: 0 });
    }, [addNotification]);

    return {
        notifications,
        addNotification,
        updateNotification,
        dismissNotification,
        clearAll,
        success,
        error,
        info,
        loading,
    };
}
