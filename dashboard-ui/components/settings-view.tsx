"use client"

import { useSettings } from "@/hooks/useSettings"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Download, Check, X, AlertCircle, Cpu, HardDrive, FileText, Table, Braces } from "lucide-react"
import { cn } from "@/lib/utils"

export function SettingsView() {
    const {
        ollamaStatus,
        installedModels,
        availableModels,
        downloads,
        downloadModel,
        cancelDownload,
        refreshStatus
    } = useSettings()

    const isModelInstalled = (modelName: string) => {
        return installedModels.some((m: any) => m.name === modelName)
    }

    const getDownloadProgress = (modelName: string) => {
        return downloads[modelName]
    }

    return (
        <div className="flex h-full flex-col gap-6 p-8">
            {/* Header */}
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground">
                    Configure local AI models and manage Ollama integration
                </p>
            </div>

            {/* Ollama Connection Status */}
            <Card className="p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-lg",
                            ollamaStatus?.connected ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                        )}>
                            {ollamaStatus?.connected ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}
                        </div>
                        <div>
                            <h3 className="font-semibold">Local AI (Ollama)</h3>
                            <p className="text-sm text-muted-foreground">
                                {ollamaStatus?.connected
                                    ? `Connected • ${installedModels.length} models installed`
                                    : "Not connected"}
                            </p>
                        </div>
                    </div>
                    <Button onClick={refreshStatus} variant="outline" size="sm">
                        Refresh Status
                    </Button>
                </div>

                {!ollamaStatus?.connected && (
                    <div className="mt-4 flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900/50 dark:bg-yellow-900/10">
                        <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
                        <div className="flex-1 text-sm">
                            <p className="font-medium text-yellow-900 dark:text-yellow-100">Ollama is not running</p>
                            <p className="mt-1 text-yellow-700 dark:text-yellow-300">
                                To use local AI features:
                            </p>
                            <ol className="mt-2 ml-4 list-decimal space-y-1 text-yellow-700 dark:text-yellow-300">
                                <li>Download Ollama from <a href="https://ollama.ai" target="_blank" rel="noopener noreferrer" className="underline">ollama.ai</a></li>
                                <li>Install and start the Ollama service</li>
                                <li>Restart this application</li>
                            </ol>
                        </div>
                    </div>
                )}
            </Card>

            {/* Model Management */}
            <Card className="flex-1 p-6">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold">AI Models</h3>
                        <p className="text-sm text-muted-foreground">
                            Download and manage local AI models for screening and extraction
                        </p>
                    </div>
                </div>

                <div className="space-y-3">
                    {availableModels.map((model: any) => {
                        const isInstalled = isModelInstalled(model.name)
                        const downloadProgress = getDownloadProgress(model.name)
                        const isDownloading = downloadProgress?.status === 'downloading'

                        return (
                            <div
                                key={model.name}
                                className="flex items-center justify-between rounded-lg border border-border bg-card p-4"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-medium">{model.name}</h4>
                                        {isInstalled && (
                                            <Badge variant="secondary" className="h-5">
                                                <Check className="mr-1 h-3 w-3" />
                                                Installed
                                            </Badge>
                                        )}
                                        {model.requires_gpu && (
                                            <Badge variant="outline" className="h-5">
                                                <Cpu className="mr-1 h-3 w-3" />
                                                GPU Recommended
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="mt-1 text-sm text-muted-foreground">{model.description}</p>
                                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                                        <HardDrive className="h-3 w-3" />
                                        <span>Size: {model.parameter_size}</span>
                                        <span>•</span>
                                        <span>Best for: {model.recommended_for.join(', ')}</span>
                                    </div>

                                    {isDownloading && downloadProgress && (
                                        <div className="mt-3">
                                            <div className="mb-1 flex items-center justify-between text-xs">
                                                <span className="text-muted-foreground">{downloadProgress.status}</span>
                                                <span className="text-muted-foreground">
                                                    {Math.round(downloadProgress.progress)}%
                                                </span>
                                            </div>
                                            <Progress
                                                value={downloadProgress.progress}
                                                className="h-1.5"
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="ml-4">
                                    {isInstalled ? (
                                        <Button variant="ghost" size="sm" disabled>
                                            Installed
                                        </Button>
                                    ) : isDownloading ? (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => cancelDownload(model.name)}
                                        >
                                            Cancel
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => downloadModel(model.name)}
                                            disabled={!ollamaStatus?.connected}
                                        >
                                            <Download className="mr-2 h-4 w-4" />
                                            Download
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </Card>

            {/* Export Preferences */}
            <Card className="p-6">
                <div className="mb-6">
                    <h3 className="text-lg font-semibold">Export Preferences</h3>
                    <p className="text-sm text-muted-foreground">
                        Configure default export formats for screening results and extracted data
                    </p>
                </div>

                <div className="space-y-4">
                    {/* PRISMA Diagram Export */}
                    <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                <FileText className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="font-medium">PRISMA Flow Diagram</p>
                                <p className="text-sm text-muted-foreground">Export screening flow as PRISMA-compliant diagram (PNG)</p>
                            </div>
                        </div>
                        <Switch defaultChecked />
                    </div>

                    {/* CSV Export for RevMan */}
                    <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                                <Table className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <p className="font-medium">CSV for RevMan</p>
                                <p className="text-sm text-muted-foreground">Export extracted data in RevMan-compatible CSV format</p>
                            </div>
                        </div>
                        <Switch defaultChecked />
                    </div>

                    {/* JSON Export */}
                    <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                                <Braces className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="font-medium">JSON Export</p>
                                <p className="text-sm text-muted-foreground">Export all project data in JSON format for archival</p>
                            </div>
                        </div>
                        <Switch defaultChecked />
                    </div>
                </div>
            </Card>
        </div>
    )
}
