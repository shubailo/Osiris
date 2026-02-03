"use client"

import { useAIStatus } from "@/hooks/useAIStatus"
import { AlertCircle, WifiOff, Wifi } from "lucide-react"
import { cn } from "@/lib/utils"

export function OfflineModeIndicator() {
    const { status, isLoading } = useAIStatus()

    // Don't show during initial loading
    if (isLoading || !status) return null

    // Show warning if Ollama is disconnected
    if (!status.connected) {
        return (
            <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 shadow-lg dark:border-yellow-900/50 dark:bg-yellow-900/20">
                <WifiOff className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                        Local AI Offline
                    </span>
                    <span className="text-xs text-yellow-700 dark:text-yellow-300">
                        AI features unavailable. Check Settings.
                    </span>
                </div>
            </div>
        )
    }

    // Show brief confirmation when connected (auto-dismiss after 3s)
    return null
}
