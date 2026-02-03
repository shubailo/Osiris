"use client"

import { useEffect, useState } from "react"
import { X, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ToastNotification {
    id: string
    type: "success" | "error" | "info" | "loading"
    title: string
    message?: string
    duration?: number // ms, 0 = no auto-dismiss
    progress?: number // 0-100 for loading toasts
}

interface ProgressNotificationsProps {
    notifications: ToastNotification[]
    onDismiss: (id: string) => void
}

export function ProgressNotifications({ notifications, onDismiss }: ProgressNotificationsProps) {
    return (
        <div className="fixed bottom-4 right-4 z-50 flex max-w-md flex-col gap-2">
            {notifications.map((notification) => (
                <NotificationToast
                    key={notification.id}
                    notification={notification}
                    onDismiss={onDismiss}
                />
            ))}
        </div>
    )
}

function NotificationToast({
    notification,
    onDismiss,
}: {
    notification: ToastNotification
    onDismiss: (id: string) => void
}) {
    const [isExiting, setIsExiting] = useState(false)

    // Auto-dismiss after duration
    useEffect(() => {
        if (notification.duration && notification.duration > 0 && notification.type !== 'loading') {
            const timer = setTimeout(() => {
                handleDismiss()
            }, notification.duration)
            return () => clearTimeout(timer)
        }
    }, [notification.duration, notification.type])

    const handleDismiss = () => {
        setIsExiting(true)
        setTimeout(() => onDismiss(notification.id), 200) // Wait for exit animation
    }

    const icons = {
        success: <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-500" />,
        error: <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-500" />,
        info: <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-500" />,
        loading: <Loader2 className="h-5 w-5 animate-spin text-blue-600 dark:text-blue-500" />,
    }

    const backgrounds = {
        success: "border-green-200 bg-green-50 dark:border-green-900/50 dark:bg-green-900/20",
        error: "border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-900/20",
        info: "border-blue-200 bg-blue-50 dark:border-blue-900/50 dark:bg-blue-900/20",
        loading: "border-blue-200 bg-blue-50 dark:border-blue-900/50 dark:bg-blue-900/20",
    }

    const textColors = {
        success: "text-green-900 dark:text-green-100",
        error: "text-red-900 dark:text-red-100",
        info: "text-blue-900 dark:text-blue-100",
        loading: "text-blue-900 dark:text-blue-100",
    }

    return (
        <div
            className={cn(
                "flex items-start gap-3 rounded-lg border p-4 shadow-lg transition-all",
                backgrounds[notification.type],
                isExiting ? "translate-x-full opacity-0" : "translate-x-0 opacity-100"
            )}
        >
            <div className="mt-0.5">{icons[notification.type]}</div>
            <div className="flex-1">
                <p className={cn("text-sm font-medium", textColors[notification.type])}>
                    {notification.title}
                </p>
                {notification.message && (
                    <p className={cn("mt-1 text-xs", textColors[notification.type] + " opacity-80")}>
                        {notification.message}
                    </p>
                )}
                {notification.type === 'loading' && notification.progress !== undefined && (
                    <div className="mt-2">
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-blue-200 dark:bg-blue-900/30">
                            <div
                                className="h-full bg-blue-600 transition-all dark:bg-blue-500"
                                style={{ width: `${notification.progress}%` }}
                            />
                        </div>
                        <p className={cn("mt-1 text-xs", textColors[notification.type] + " opacity-60")}>
                            {Math.round(notification.progress)}%
                        </p>
                    </div>
                )}
            </div>
            {notification.type !== 'loading' && (
                <button
                    onClick={handleDismiss}
                    className={cn(
                        "rounded-lg p-1 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                    )}
                >
                    <X className="h-4 w-4" />
                </button>
            )}
        </div>
    )
}
