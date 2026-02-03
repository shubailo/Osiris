"use client"

import { useState, useCallback } from "react"
import { cn } from "@/lib/utils"
import { Upload, FileText, Check, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { usePDFManager } from "@/hooks/usePDFManager"

interface SetupViewProps {
  projectId?: number
}

export function SetupView({ projectId = 1 }: SetupViewProps) {
  const { articles, isLoading, error, extractionProgress, uploadPDFs } = usePDFManager(projectId)
  const [isDraggingProspero, setIsDraggingProspero] = useState(false)
  const [isDraggingArticles, setIsDraggingArticles] = useState(false)

  const handleProsperoUpload = useCallback(async () => {
    await uploadPDFs()
  }, [uploadPDFs])

  const handleArticlesUpload = useCallback(async () => {
    await uploadPDFs()
  }, [uploadPDFs])

  const removeFile = (id: number) => {
    // TODO: Implement delete article in hook
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Step Header */}
      <div className="flex items-center gap-4 mb-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white font-bold">1</div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Project Setup</h1>
          <p className="text-muted-foreground">Upload your PROSPERO protocol and research articles</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Protocol Section */}
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-border bg-muted/30">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Meta-Analysis Protocol
            </h2>
            <p className="text-sm text-muted-foreground">Upload your PROSPERO PDF to auto-configure PICO</p>
          </div>

          <div className="flex-1 p-5">
            <div
              onDragOver={(e) => {
                e.preventDefault()
                setIsDraggingProspero(true)
              }}
              onDragLeave={() => setIsDraggingProspero(false)}
              onDrop={(e) => {
                e.preventDefault()
                setIsDraggingProspero(false)
                handleProsperoUpload()
              }}
              className={cn(
                "flex flex-col items-center justify-center h-48 rounded-xl border-2 border-dashed transition-all",
                isDraggingProspero
                  ? "border-primary bg-primary-light"
                  : "border-border hover:border-primary/50 hover:bg-muted/50",
              )}
            >
              {isLoading ? (
                <Loader2 className="h-10 w-10 text-primary animate-spin mb-3" />
              ) : (
                <Upload className="h-10 w-10 text-muted-foreground mb-3" />
              )}

              <p className="text-sm font-medium text-foreground mb-1 text-center px-4">
                Drag and drop your protocol PDF here
              </p>
              <p className="text-xs text-muted-foreground mb-4">Support for PDF only</p>

              <Button
                variant="outline"
                onClick={handleProsperoUpload}
                disabled={isLoading}
                className="rounded-lg h-9"
              >
                Browse Files
              </Button>
            </div>
          </div>
        </div>

        {/* Articles Section */}
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-border bg-muted/30 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Research Articles
            </h2>
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
              {articles.length} Loaded
            </Badge>
          </div>

          <div className="p-4">
            {articles.length === 0 ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault()
                  setIsDraggingArticles(true)
                }}
                onDragLeave={() => setIsDraggingArticles(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setIsDraggingArticles(false)
                  handleArticlesUpload()
                }}
                className={cn(
                  "flex flex-col items-center justify-center p-10 rounded-xl border-2 border-dashed transition-colors",
                  isDraggingArticles
                    ? "border-primary bg-primary-light"
                    : "border-border hover:border-primary/50 hover:bg-muted/50",
                )}
              >
                {isLoading ? (
                  <Loader2 className="h-10 w-10 text-primary animate-spin mb-3" />
                ) : (
                  <Upload className="h-10 w-10 text-muted-foreground mb-3" />
                )}

                <p className="text-sm font-medium text-foreground mb-1">Drag and drop article PDFs here</p>
                <p className="text-sm text-muted-foreground mb-3">or</p>

                <Button
                  onClick={handleArticlesUpload}
                  disabled={isLoading}
                  className="bg-primary hover:bg-primary/90"
                >
                  Browse Files
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{articles.length} files uploaded</p>
                  <Button variant="outline" size="sm" onClick={handleArticlesUpload} disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                    Add More
                  </Button>
                </div>

                {/* File List */}
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {articles.map((article) => {
                    const progress = extractionProgress[article.id]
                    const isExtracting = progress && progress.status === 'processing'

                    return (
                      <div
                        key={article.id}
                        className="group flex flex-col gap-2 p-3 rounded-xl bg-muted/50 border border-border"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10">
                            <FileText className="h-4 w-4 text-blue-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{article.original_filename}</p>
                            <p className="text-[10px] text-muted-foreground capitalize">{article.extraction_status}</p>
                          </div>
                          {article.extraction_status === 'complete' ? (
                            <Badge className="bg-emerald-500/10 text-emerald-500 border-0 text-[10px] font-bold uppercase">Ready</Badge>
                          ) : (
                            <Badge className="bg-orange-500/10 text-orange-500 border-0 text-[10px] font-bold uppercase">
                              {article.extraction_status}
                            </Badge>
                          )}
                          <button
                            onClick={() => removeFile(article.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-all"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>

                        {isExtracting && (
                          <div className="space-y-1 mt-1">
                            <div className="flex justify-between text-[10px] text-muted-foreground">
                              <span>Extracting text & sections...</span>
                              <span>{Math.round(progress.progress)}%</span>
                            </div>
                            <Progress value={progress.progress} className="h-1" />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
