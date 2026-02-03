"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { StatCard } from "@/components/stat-card"
import {
  FileStack,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  Download,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { useScreening } from "@/hooks/useScreening"
import type { PICOCriteria } from "@/lib/ipc/types"

interface ScreeningViewProps {
  projectId?: number
}

const decisionStyles: Record<string, { bg: string; text: string; label: string }> = {
  include: { bg: "bg-emerald-500/10", text: "text-emerald-500", label: "Include" },
  exclude: { bg: "bg-red-500/10", text: "text-red-500", label: "Exclude" },
  pending: { bg: "bg-orange-500/10", text: "text-orange-500", label: "Pending" },
  needs_review: { bg: "bg-yellow-500/10", text: "text-yellow-500", label: "Needs Review" },
  "": { bg: "bg-muted", text: "text-muted-foreground", label: "Pending" }
}

export function ScreeningView({ projectId = 1 }: ScreeningViewProps) {
  const {
    articles,
    isScreening,
    progress,
    error: screeningError,
    loadArticles,
    startScreening,
    updateManualDecision
  } = useScreening(projectId)

  const [searchText, setSearchText] = useState("")
  const [selectedArticles, setSelectedArticles] = useState<number[]>([])
  const [expandedArticleId, setExpandedArticleId] = useState<number | null>(null)

  // Initial load
  useEffect(() => {
    loadArticles()
  }, [loadArticles])

  const stats = {
    totalArticles: articles.length,
    included: articles.filter(a => a.decision === 'include').length,
    excluded: articles.filter(a => a.decision === 'exclude').length,
    pending: articles.filter(a => !a.decision || a.decision === 'pending').length
  }

  const filteredArticles = articles.filter(
    (a) =>
      (a.title || a.original_filename || "").toLowerCase().includes(searchText.toLowerCase()) ||
      (a.authors || "").toLowerCase().includes(searchText.toLowerCase()) ||
      (a.journal || "").toLowerCase().includes(searchText.toLowerCase()),
  )

  const toggleSelection = (id: number) => {
    setSelectedArticles((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]))
  }

  const toggleSelectAll = () => {
    if (selectedArticles.length === filteredArticles.length && filteredArticles.length > 0) {
      setSelectedArticles([])
    } else {
      setSelectedArticles(filteredArticles.map((a) => a.id))
    }
  }

  const handleStartScreening = async () => {
    // Default PICO criteria for demo
    const defaultPICO: PICOCriteria = {
      population: "Adults with anxiety",
      intervention: "Mindfulness meditation",
      comparison: "Standard care or waitlist",
      outcomes: "Reduction in anxiety symptoms"
    }
    await startScreening(defaultPICO)
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return "text-emerald-500"
    if (confidence >= 75) return "text-orange-500"
    return "text-red-500"
  }

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      {/* AI Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-purple to-[#c084fc] p-5 shadow-lg shadow-purple/20">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">AI Screening</h2>
            <p className="text-white/90 text-sm">Review and validate AI-powered screening decisions</p>
          </div>
          <Button
            disabled={stats.pending === 0 || isScreening}
            onClick={handleStartScreening}
            className="bg-white text-purple hover:bg-white/90 font-bold px-6 h-11 relative overflow-hidden"
          >
            {isScreening ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Screening {progress.current}/{progress.total}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                <span>Start AI Screening</span>
              </div>
            )}
            {isScreening && (
              <div className="absolute bottom-0 left-0 h-1 bg-purple/20 w-full">
                <div
                  className="h-full bg-purple transition-all duration-300"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
            )}
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Articles" value={stats.totalArticles} icon={FileStack} variant="info" />
        <StatCard title="Included" value={stats.included} icon={CheckCircle2} variant="success" />
        <StatCard title="Excluded" value={stats.excluded} icon={XCircle} variant="destructive" />
        <StatCard title="Pending" value={stats.pending} icon={Clock} variant="warning" />
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title, author, journal..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="pl-10 h-11 rounded-xl bg-card border-border shadow-sm focus:ring-primary/20"
          />
        </div>
        <Button variant="outline" className="h-11 px-4 rounded-xl bg-card border-border shadow-sm">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
        <Button variant="outline" className="h-11 px-4 rounded-xl bg-card border-border shadow-sm">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-4 p-4 border-b border-border bg-muted/30 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <div className="w-6">
            <Checkbox
              checked={selectedArticles.length === filteredArticles.length && filteredArticles.length > 0}
              onCheckedChange={toggleSelectAll}
            />
          </div>
          <div className="flex-[3]">Article Details</div>
          <div className="w-28 text-center">AI Decision</div>
          <div className="w-24 text-center">Confidence</div>
          <div className="flex-1">AI Reasoning</div>
          <div className="w-10"></div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-border">
          {filteredArticles.length === 0 ? (
            <div className="p-20 text-center flex flex-col items-center gap-3">
              <Search className="h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No articles found matching your search.</p>
            </div>
          ) : filteredArticles.map((article) => {
            const isExpanded = expandedArticleId === article.id
            const decision = article.decision || "pending"
            const styles = decisionStyles[decision]

            return (
              <div key={article.id}>
                {/* Main Row */}
                <div
                  className={cn(
                    "flex items-center gap-4 p-4 transition-colors cursor-pointer group",
                    isExpanded ? "bg-primary/5" : "hover:bg-muted/30",
                  )}
                  onClick={() => setExpandedArticleId(isExpanded ? null : article.id)}
                >
                  <div className="w-6" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedArticles.includes(article.id)}
                      onCheckedChange={() => toggleSelection(article.id)}
                    />
                  </div>

                  <div className="flex-[3] min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                      {article.title || article.original_filename}
                    </p>
                    <p className="text-xs text-muted-foreground truncate opacity-80 mt-0.5">
                      {article.authors || "Unknown Authors"} · {article.journal || "Unknown Journal"} · {article.year || "Unknown Year"}
                    </p>
                  </div>

                  <div className="w-28 flex justify-center">
                    <Badge className={cn("border-0 font-bold text-[10px] uppercase px-2 py-0.5", styles.bg, styles.text)}>
                      {styles.label}
                    </Badge>
                  </div>

                  <div className="w-24 px-2">
                    {article.confidence && article.confidence > 0 ? (
                      <div className="space-y-1">
                        <div className="flex justify-between items-center px-1">
                          <span className={cn("text-[10px] font-bold", getConfidenceColor(article.confidence))}>
                            {article.confidence}%
                          </span>
                        </div>
                        <Progress value={article.confidence} className="h-1 bg-muted" />
                      </div>
                    ) : (
                      <div className="text-center">
                        <span className="text-xs text-muted-foreground">—</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground truncate max-w-md italic">
                      {article.reasoning || "Pending AI review..."}
                    </p>
                  </div>

                  <div className="w-10 flex justify-end">
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground opacity-50 group-hover:opacity-100" />
                    )}
                  </div>
                </div>

                {/* Expanded Panel */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 bg-muted/10 border-t border-border/50 animate-in slide-in-from-top-2 duration-200">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                      <div className="lg:col-span-3 space-y-4">
                        <div>
                          <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
                            <FileStack className="h-3 w-3" />
                            Article Abstract
                          </h4>
                          <div className="p-4 rounded-xl bg-card border border-border shadow-inner">
                            <p className="text-sm text-foreground leading-relaxed italic">
                              {article.abstract || "Full abstract text not extracted yet. Check the original PDF."}
                            </p>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
                            <Sparkles className="h-3 w-3" />
                            AI Collaborative Reasoning
                          </h4>
                          <div className="p-4 rounded-xl bg-purple/5 border border-purple-500/10">
                            <p className="text-sm text-foreground leading-relaxed">
                              {article.reasoning || "AI Council has not processed this article yet. Start screening to generate reasoning."}
                            </p>
                            {article.consensus_type && (
                              <div className="flex gap-2 mt-3">
                                <Badge variant="outline" className="bg-purple-500/5 text-purple-600 border-purple-500/20 text-[10px] uppercase font-bold px-2 py-0.5">
                                  Consensus: {article.consensus_type}
                                </Badge>
                                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[10px] uppercase font-bold px-2 py-0.5">
                                  Models: {article.model_votes?.length || 3}
                                </Badge>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="p-4 rounded-xl bg-card border border-border shadow-sm">
                          <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Expert Override</h4>
                          <div className="space-y-2">
                            <Button
                              onClick={() => updateManualDecision(article.id, "include")}
                              variant={article.decision === "include" ? "default" : "outline"}
                              className={cn(
                                "w-full justify-start h-10 font-bold text-xs uppercase tracking-wider",
                                article.decision === "include" && "bg-emerald-600 hover:bg-emerald-700 text-white border-0",
                              )}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-3" />
                              Include
                            </Button>
                            <Button
                              onClick={() => updateManualDecision(article.id, "exclude")}
                              variant={article.decision === "exclude" ? "default" : "outline"}
                              className={cn(
                                "w-full justify-start h-10 font-bold text-xs uppercase tracking-wider",
                                article.decision === "exclude" && "bg-red-600 hover:bg-red-700 text-white border-0",
                              )}
                            >
                              <XCircle className="h-4 w-4 mr-3" />
                              Exclude
                            </Button>
                            <div className="pt-2 border-t border-border mt-2">
                              <p className="text-[10px] text-muted-foreground text-center italic">
                                Manual override will bypass AI scoring and consensus.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
