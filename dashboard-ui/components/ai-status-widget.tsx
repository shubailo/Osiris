"use client"

import { useAIStatus } from "@/hooks/useAIStatus"
import { Cpu, CheckCircle2, AlertCircle, Loader2, Download } from "lucide-react"
import { cn } from "@/lib/utils"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

export function AIStatusWidget() {
    const { status, isLoading, error, downloads } = useAIStatus()

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 text-muted-foreground animate-pulse">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-xs font-medium">Checking AI...</span>
            </div>
        )
    }

    const isConnected = status?.connected
    const activeDownloads = Object.values(downloads).filter(d => d.status === 'downloading')

    return (
        <TooltipProvider>
            <div className="flex items-center gap-2">
                {activeDownloads.length > 0 && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">
                        <Download className="h-3.5 w-3.5 animate-bounce" />
                        <span className="text-[10px] font-bold">
                            {Math.round(activeDownloads[0].progress)}%
                        </span>
                    </div>
                )}

                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all cursor-default",
                            isConnected
                                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                : "bg-red-500/10 text-red-500 border-red-500/20"
                        )}>
                            <Cpu className={cn("h-3.5 w-3.5", isConnected && "animate-pulse")} />
                            <span className="text-[10px] font-bold uppercase tracking-wider">
                                {isConnected ? "Local AI Ready" : "Local AI Offline"}
                            </span>
                            {isConnected ? (
                                <CheckCircle2 className="h-3 w-3" />
                            ) : (
                                <AlertCircle className="h-3 w-3" />
                            )}
                        </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" align="end" className="w-64 p-3 bg-card border-border shadow-xl">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold">Ollama Connection</span>
                                <span className={cn(
                                    "text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase",
                                    isConnected ? "bg-emerald-500/20 text-emerald-500" : "bg-red-500/20 text-red-500"
                                )}>
                                    {isConnected ? "Connected" : "Disconnected"}
                                </span>
                            </div>

                            {isConnected && (
                                <div className="space-y-1">
                                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">Active Models</span>
                                    <div className="flex flex-wrap gap-1">
                                        {status?.models.map(m => (
                                            <span key={m} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-foreground border border-border">
                                                {m}
                                            </span>
                                        ))}
                                        {status?.models.length === 0 && (
                                            <span className="text-[10px] italic text-muted-foreground">No models found</span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className="p-2 rounded bg-red-500/10 text-red-500 text-[10px] border border-red-500/20">
                                    {error}
                                </div>
                            )}
                        </div>
                    </TooltipContent>
                </Tooltip>
            </div>
        </TooltipProvider>
    )
}
