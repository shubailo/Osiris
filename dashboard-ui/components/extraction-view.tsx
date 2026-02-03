"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { StatCard } from "@/components/stat-card"
import { FileText, CheckCircle2, Clock, Sparkles, Table, Upload, ChevronRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useExtraction } from "@/hooks/useExtraction"
import { ExtractionTable } from "./extraction-table"

interface ExtractionViewProps {
  projectId?: number
}

export function ExtractionView({ projectId = 1 }: ExtractionViewProps) {
  const {
    articles,
    extractedData,
    isExtracting,
    isLoading,
    error,
    selectedArticleId,
    setSelectedArticleId,
    extractArticle,
    batchExtract
  } = useExtraction(projectId)

  const [activeTab, setActiveTab] = useState("extraction")
  const [isVerifyMode, setIsVerifyMode] = useState(false)

  // Map extractedData array to Record<article_id, ExtractedData>
  const dataMap = (extractedData || []).reduce((acc, curr) => {
    acc[curr.article_id] = curr
    return acc
  }, {} as Record<number, any>)

  const selectedArticle = articles.find((a) => a.id === selectedArticleId)
  const extractedCount = articles.filter((a) => a.extraction_status === 'complete').length
  const pendingCount = articles.length - extractedCount

  const handleExtract = async (id: number) => {
    await extractArticle(id)
  }

  const handleBatchExtract = async () => {
    await batchExtract()
  }

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground">Data Extraction</h1>
        <p className="text-muted-foreground">Extract structured data from included articles</p>
      </div>

      {/* Action Banners */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Extraction Table Banner */}
        <div className="rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-400 p-5">
          <div className="space-y-3">
            <div>
              <h2 className="text-xl font-bold text-white">Extraction Table</h2>
              <p className="text-white/90 text-sm">Generate a template or upload your own</p>
            </div>
            <div className="flex gap-2">
              <Button className="flex-1 bg-white text-emerald-600 hover:bg-white/90 font-semibold border-0">
                <Table className="h-4 w-4 mr-2" />
                Generate
              </Button>
              <Button className="flex-1 bg-white text-emerald-600 hover:bg-white/90 font-semibold border-0">
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
            </div>
          </div>
        </div>

        {/* AI Extraction Banner */}
        <div className="rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-400 p-5">
          <div className="space-y-3">
            <div>
              <h2 className="text-xl font-bold text-white">AI Data Extraction</h2>
              <p className="text-white/90 text-sm">Automatically extract data using local LLMs</p>
            </div>
            <Button
              onClick={handleBatchExtract}
              disabled={pendingCount === 0 || isExtracting}
              className="w-full bg-white text-indigo-600 hover:bg-white/90 font-semibold border-0"
            >
              {isExtracting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
              {isExtracting ? "Extracting..." : "Start Batch Extraction"}
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        < StatCard title="Included Articles" value={articles.length} icon={FileText} variant="info" />
        <StatCard
          title="Data Extracted"
          value={extractedCount}
          subtitle={articles.length > 0 ? `${Math.round((extractedCount / articles.length) * 100)}%` : "0%"}
          icon={CheckCircle2}
          variant="success"
        />
        <StatCard title="Pending" value={pendingCount} icon={Clock} variant="warning" />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full h-12 p-1 bg-card border border-border rounded-xl">
          <TabsTrigger value="extraction" className="flex-1 h-full rounded-lg data-[state=active]:bg-muted font-medium">
            Data Extraction
          </TabsTrigger>
          <TabsTrigger value="summary" className="flex-1 h-full rounded-lg data-[state=active]:bg-muted font-medium">
            Extracted Data Summary
          </TabsTrigger>
        </TabsList>

        <TabsContent value="extraction" className="mt-4">
          <div className="grid grid-cols-3 gap-4">
            {/* Article List */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="p-4 border-b border-border bg-muted/50">
                <h3 className="text-base font-semibold text-foreground">Articles</h3>
                <p className="text-sm text-muted-foreground">Select an article to extract data</p>
              </div>
              <ScrollArea className="h-[420px]">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center p-10 gap-3">
                    <Loader2 className="h-6 w-6 text-primary animate-spin" />
                    <p className="text-xs text-muted-foreground">Loading articles...</p>
                  </div>
                ) : (
                  <div className="p-2 space-y-1">
                    {articles.map((article) => (
                      <button
                        key={article.id}
                        onClick={() => setSelectedArticleId(article.id)}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors",
                          selectedArticleId === article.id ? "bg-primary/10" : "hover:bg-muted font-normal",
                        )}
                      >
                        <div
                          className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                            article.extraction_status === 'complete' ? "bg-emerald-500/10" : "bg-muted",
                          )}
                        >
                          {article.extraction_status === 'complete' ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <FileText className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{article.title || article.original_filename}</p>
                          <p className="text-[10px] text-muted-foreground truncate uppercase font-bold tracking-wider">{article.extraction_status}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* Article Preview */}
            <div className="col-span-2 rounded-2xl border border-border bg-card overflow-hidden">
              <div className="p-4 border-b border-border bg-muted/50 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-foreground">Article Preview</h3>
                  <p className="text-sm text-muted-foreground">Review and extract data</p>
                </div>
                <div className="flex items-center gap-2">
                  {selectedArticle && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsVerifyMode(!isVerifyMode)}
                      className={cn("h-8 text-[10px] font-bold uppercase", isVerifyMode && "bg-primary/10 border-primary text-primary")}
                    >
                      {isVerifyMode ? "Close Verify" : "Verify Side-by-Side"}
                    </Button>
                  )}
                  {selectedArticle && (
                    <Badge
                      className={cn(
                        "border-0 px-3 py-1 text-[10px] uppercase font-bold tracking-wider",
                        selectedArticle.extraction_status === 'complete'
                          ? "bg-emerald-500/10 text-emerald-500"
                          : "bg-orange-500/10 text-orange-500",
                      )}
                    >
                      {selectedArticle.extraction_status === 'complete' ? "Extracted" : selectedArticle.extraction_status}
                    </Badge>
                  )}
                </div>
              </div>

              {selectedArticle ? (
                <div className="p-5 space-y-5 h-[420px] overflow-y-auto">
                  <div className="space-y-1">
                    <h4 className="text-lg font-semibold text-foreground leading-tight">{selectedArticle.title || selectedArticle.original_filename}</h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedArticle.authors} · {selectedArticle.journal} · {selectedArticle.year}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-muted/30 border border-border">
                    <h5 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Abstract</h5>
                    <p className="text-sm text-foreground leading-relaxed italic">{selectedArticle.abstract || "No abstract available."}</p>
                  </div>

                  {selectedArticle.extraction_status !== 'complete' ? (
                    <div className="pt-4">
                      <Button
                        onClick={() => handleExtract(selectedArticle.id)}
                        disabled={isExtracting}
                        className="w-full h-12 text-base font-semibold bg-gradient-to-r from-indigo-600 to-indigo-400 hover:opacity-90 shadow-lg shadow-indigo-500/20"
                      >
                        {isExtracting ? (
                          <>
                            <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                            Processing Article...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-5 w-5 mr-3" />
                            Extract Structured Data with AI
                          </>
                        )}
                      </Button>
                      <p className="text-[10px] text-center text-muted-foreground mt-2">
                        Powered by local AI Council (Llama 3.3, Mistral, Gemma)
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                        <div className="flex items-center gap-2 text-emerald-600 mb-2">
                          <CheckCircle2 className="h-5 w-5" />
                          <span className="font-bold">Extraction Complete</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Detailed extraction values are available in the Summary tab and CSV export.
                        </p>
                      </div>

                      {/* Extracted Data Snippet */}
                      <div className="space-y-2">
                        <h5 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Key Findings</h5>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 rounded-lg bg-card border border-border">
                            <p className="text-[10px] text-muted-foreground uppercase font-bold">Population</p>
                            <p className="text-sm text-foreground">Extracted from text...</p>
                          </div>
                          <div className="p-3 rounded-lg bg-card border border-border">
                            <p className="text-[10px] text-muted-foreground uppercase font-bold">Main Result</p>
                            <p className="text-sm text-foreground">Extracted from text...</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[350px] text-center">
                  <FileText className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-sm font-medium text-foreground">No article selected</p>
                  <p className="text-xs text-muted-foreground">Select an article from the list</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="summary" className="mt-4">
          {extractedCount > 0 ? (
            <ExtractionTable
              articles={articles.filter(a => a.extraction_status === 'complete')}
              extractedData={dataMap}
            />
          ) : (
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="p-4 border-b border-border bg-muted/50">
                <h3 className="text-base font-semibold text-foreground">Extracted Data Summary</h3>
                <p className="text-sm text-muted-foreground">Overview of all extracted data</p>
              </div>
              <div className="flex flex-col items-center justify-center h-[350px] text-center p-5">
                <Table className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm font-medium text-foreground">No data summary yet</p>
                <p className="text-xs text-muted-foreground max-w-md">
                  Extract data from articles to see a unified summary here.
                </p>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
