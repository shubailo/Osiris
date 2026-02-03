"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Info,
  AlertCircle,
  CheckCircle2,
  Edit3,
  FileSpreadsheet
} from "lucide-react"
import type { ArticleWithDecision, ExtractedData } from "@/lib/ipc/types"

interface ExtractionTableProps {
  articles: ArticleWithDecision[]
  extractedData: Record<number, ExtractedData>
  onUpdateCell?: (articleId: number, field: string, value: any) => void
}

export function ExtractionTable({ articles, extractedData, onUpdateCell }: ExtractionTableProps) {
  const [editingCell, setEditingCell] = useState<{ id: number; field: string } | null>(null)

  const renderRoBCell = (bias: string | undefined) => {
    const colors = {
      low: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
      high: "bg-destructive/10 text-destructive border-destructive/20",
      unclear: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    }
    const val = bias?.toLowerCase() as keyof typeof colors
    return (
      <Badge variant="outline" className={cn("text-[10px] uppercase font-bold tracking-tight", colors[val] || "bg-muted text-muted-foreground")}>
        {bias || "N/A"}
      </Badge>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-[250px] font-bold text-foreground py-4">Study</TableHead>
              <TableHead className="w-[150px] font-bold text-foreground">Design</TableHead>
              <TableHead className="w-[100px] font-bold text-foreground text-center">N</TableHead>
              <TableHead className="w-[200px] font-bold text-foreground">Intervention</TableHead>
              <TableHead className="w-[200px] font-bold text-foreground">Outcomes</TableHead>
              <TableHead className="w-[120px] font-bold text-foreground text-center">RoB</TableHead>
              <TableHead className="w-[100px] font-bold text-foreground text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {articles.map((article) => {
              const data = extractedData[article.id]
              return (
                <TableRow key={article.id} className="group hover:bg-muted/30">
                  <TableCell className="py-4">
                    <div className="space-y-0.5">
                      <p className="font-semibold text-sm text-foreground truncate max-w-[220px]">
                        {article.authors || "Unknown Authors"}
                      </p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
                        {article.journal} ({article.year})
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-[10px] font-medium">
                      {data?.study_design || "N/A"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center font-medium">
                    {data?.sample_size || "-"}
                  </TableCell>
                  <TableCell>
                    <div className="text-xs space-y-1">
                      <p className="font-bold text-indigo-600 truncate max-w-[180px]">
                        {data?.intervention?.name || "N/A"}
                      </p>
                      <p className="text-muted-foreground line-clamp-1 italic">
                        {data?.intervention?.dosage || "Not specified"}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1.5">
                      {data?.primary_outcomes?.slice(0, 2).map((out, idx) => (
                        <div key={idx} className="flex items-center gap-1.5">
                          <span className="text-xs font-medium text-foreground truncate max-w-[140px]">{out.outcome}</span>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Badge variant="outline" className={cn("text-[10px] h-4 px-1", out.is_derived && "border-indigo-400 bg-indigo-50")}>
                                  {out.effect_size_type}: {out.effect_size}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="text-[10px] space-y-1">
                                  <p className="font-bold">Detailed Result</p>
                                  <p>Mean Difference: {out.effect_size}</p>
                                  <p>P-value: {out.p_value}</p>
                                  {out.is_derived && <p className="text-indigo-600 font-bold">Calculated by AI Assistant</p>}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col gap-1 items-center">
                      {renderRoBCell(data?.risk_of_bias?.random_sequence_generation)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-primary/10 text-primary transition-colors">
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-emerald-500/10 text-emerald-600 transition-colors">
                        <FileSpreadsheet className="h-4 w-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
            {articles.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground py-10">
                  <Info className="h-6 w-6 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No included articles found to synthesize.</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
