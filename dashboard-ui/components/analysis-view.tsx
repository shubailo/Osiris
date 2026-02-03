"use client"

import { useState } from "react"
import { StatCard } from "@/components/stat-card"
import { BarChart3, Users, Calendar, Download, ArrowDown, GitBranch, ChevronDown, ChevronUp, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface AnalysisViewProps {
  stats: { included: number; totalArticles: number }
}

type AnalysisTab = "prisma" | "forest" | "funnel"

// QML-friendly: PRISMA flow data as explicit object
const prismaFlow = {
  identified: 1247,
  duplicates: 315,
  screened: 932,
  excluded: 687,
  fullText: 245,
  fullTextExcluded: 197,
  included: 48,
  exclusionReasons: [
    { reason: "Wrong population", count: 89 },
    { reason: "Wrong intervention", count: 67 },
    { reason: "Wrong study design", count: 41 },
  ],
}

interface Study {
  id: string
  author: string
  year: number
  effectSize: number // e.g., SMD, OR, RR
  lowerCI: number
  upperCI: number
  weight: number // percentage
  n: number // sample size
  subgroup?: string
}

const forestPlotData: Study[] = [
  { id: "1", author: "Smith et al.", year: 2019, effectSize: 0.45, lowerCI: 0.12, upperCI: 0.78, weight: 8.2, n: 124 },
  {
    id: "2",
    author: "Johnson et al.",
    year: 2020,
    effectSize: 0.32,
    lowerCI: -0.05,
    upperCI: 0.69,
    weight: 7.1,
    n: 98,
  },
  {
    id: "3",
    author: "Williams et al.",
    year: 2020,
    effectSize: 0.58,
    lowerCI: 0.28,
    upperCI: 0.88,
    weight: 9.4,
    n: 156,
  },
  { id: "4", author: "Brown et al.", year: 2021, effectSize: 0.21, lowerCI: -0.12, upperCI: 0.54, weight: 6.8, n: 87 },
  { id: "5", author: "Davis et al.", year: 2021, effectSize: 0.67, lowerCI: 0.41, upperCI: 0.93, weight: 10.2, n: 203 },
  { id: "6", author: "Miller et al.", year: 2022, effectSize: 0.39, lowerCI: 0.08, upperCI: 0.7, weight: 8.5, n: 134 },
  { id: "7", author: "Wilson et al.", year: 2022, effectSize: 0.52, lowerCI: 0.19, upperCI: 0.85, weight: 8.9, n: 145 },
  { id: "8", author: "Moore et al.", year: 2023, effectSize: 0.28, lowerCI: -0.08, upperCI: 0.64, weight: 7.3, n: 102 },
  { id: "9", author: "Taylor et al.", year: 2023, effectSize: 0.61, lowerCI: 0.32, upperCI: 0.9, weight: 9.8, n: 178 },
  {
    id: "10",
    author: "Anderson et al.",
    year: 2024,
    effectSize: 0.44,
    lowerCI: 0.15,
    upperCI: 0.73,
    weight: 8.6,
    n: 141,
  },
  { id: "11", author: "Thomas et al.", year: 2024, effectSize: 0.36, lowerCI: 0.02, upperCI: 0.7, weight: 7.8, n: 112 },
  {
    id: "12",
    author: "Jackson et al.",
    year: 2024,
    effectSize: 0.55,
    lowerCI: 0.24,
    upperCI: 0.86,
    weight: 7.4,
    n: 108,
  },
]

const metaAnalysisSummary = {
  pooledEffect: 0.44,
  pooledLowerCI: 0.32,
  pooledUpperCI: 0.56,
  pValue: 0.001,
  heterogeneity: {
    Q: 18.4,
    df: 11,
    pHet: 0.073,
    I2: 40.2,
    tau2: 0.024,
  },
  model: "Random Effects (REML)",
  totalN: 1588,
}

const plotConfig = {
  minX: -0.5,
  maxX: 1.5,
  nullLine: 0,
  ticks: [-0.5, 0, 0.5, 1.0, 1.5],
}

export function AnalysisView({ stats }: AnalysisViewProps) {
  const [activeTab, setActiveTab] = useState<AnalysisTab>("forest")
  const [showHetDetails, setShowHetDetails] = useState(false)

  const toXPercent = (value: number) => {
    const range = plotConfig.maxX - plotConfig.minX
    return ((value - plotConfig.minX) / range) * 100
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground">Analysis & Results</h1>
          <p className="text-muted-foreground">Meta-analysis visualizations and PRISMA flow diagram</p>
        </div>
        <Button className="bg-primary hover:bg-primary-hover">
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Included in Analysis"
          value={prismaFlow.included}
          subtitle="studies"
          icon={BarChart3}
          variant="info"
        />
        <StatCard
          title="Total Participants"
          value={metaAnalysisSummary.totalN}
          subtitle="across all studies"
          icon={Users}
          variant="success"
        />
        <StatCard title="Publication Period" value={2019} subtitle="to 2024" icon={Calendar} variant="warning" />
      </div>

      <div className="flex gap-2 p-1 rounded-xl bg-card border border-border w-fit">
        {[
          { id: "forest" as const, label: "Forest Plot", icon: GitBranch },
          { id: "prisma" as const, label: "PRISMA Diagram", icon: ArrowDown },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === tab.id
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "forest" && (
        <div className="space-y-4">
          {/* Forest Plot Card */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="p-5 border-b border-border bg-muted/50 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Forest Plot</h2>
                <p className="text-sm text-muted-foreground">Standardized Mean Difference (SMD) with 95% CI</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground px-2 py-1 rounded-md bg-muted">
                  {metaAnalysisSummary.model}
                </span>
              </div>
            </div>

            <div className="p-6">
              {/* Forest Plot - QML: Column with repeater */}
              <div className="space-y-0">
                {/* Header row */}
                <div className="grid grid-cols-[200px_80px_1fr_100px_60px] gap-4 pb-3 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <span>Study</span>
                  <span className="text-right">N</span>
                  <span className="text-center">Effect Size (95% CI)</span>
                  <span className="text-right">SMD [95% CI]</span>
                  <span className="text-right">Weight</span>
                </div>

                {/* Study rows */}
                {forestPlotData.map((study, index) => (
                  <div
                    key={study.id}
                    className={cn(
                      "grid grid-cols-[200px_80px_1fr_100px_60px] gap-4 py-3 items-center",
                      index % 2 === 0 ? "bg-transparent" : "bg-muted/30",
                    )}
                  >
                    {/* Study name */}
                    <span className="text-sm text-foreground font-medium">
                      {study.author} ({study.year})
                    </span>

                    {/* Sample size */}
                    <span className="text-sm text-muted-foreground text-right">{study.n}</span>

                    {/* Visual plot - QML: Rectangle with Canvas */}
                    <div className="relative h-8 mx-4">
                      {/* Background with grid lines */}
                      <div className="absolute inset-0 flex justify-between">
                        {plotConfig.ticks.map((tick) => (
                          <div
                            key={tick}
                            className={cn(
                              "w-px h-full",
                              tick === plotConfig.nullLine ? "bg-muted-foreground/50" : "bg-border",
                            )}
                            style={{ left: `${toXPercent(tick)}%`, position: "absolute" }}
                          />
                        ))}
                      </div>

                      {/* CI line */}
                      <div
                        className="absolute top-1/2 -translate-y-1/2 h-0.5 bg-primary"
                        style={{
                          left: `${toXPercent(study.lowerCI)}%`,
                          width: `${toXPercent(study.upperCI) - toXPercent(study.lowerCI)}%`,
                        }}
                      />

                      {/* Effect size point - size based on weight */}
                      <div
                        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-sm bg-primary"
                        style={{
                          left: `${toXPercent(study.effectSize)}%`,
                          width: `${Math.max(8, study.weight * 1.2)}px`,
                          height: `${Math.max(8, study.weight * 1.2)}px`,
                        }}
                      />
                    </div>

                    {/* Numeric values */}
                    <span className="text-xs text-muted-foreground text-right font-mono">
                      {study.effectSize.toFixed(2)} [{study.lowerCI.toFixed(2)}, {study.upperCI.toFixed(2)}]
                    </span>

                    {/* Weight */}
                    <span className="text-sm text-muted-foreground text-right">{study.weight.toFixed(1)}%</span>
                  </div>
                ))}

                {/* X-axis labels */}
                <div className="grid grid-cols-[200px_80px_1fr_100px_60px] gap-4 pt-2 border-t border-border">
                  <span></span>
                  <span></span>
                  <div className="relative h-6 mx-4">
                    {plotConfig.ticks.map((tick) => (
                      <span
                        key={tick}
                        className="absolute text-xs text-muted-foreground -translate-x-1/2"
                        style={{ left: `${toXPercent(tick)}%` }}
                      >
                        {tick.toFixed(1)}
                      </span>
                    ))}
                  </div>
                  <span></span>
                  <span></span>
                </div>

                {/* Summary diamond row - QML: special item */}
                <div className="grid grid-cols-[200px_80px_1fr_100px_60px] gap-4 py-4 mt-2 border-t-2 border-primary/30 bg-primary/5">
                  <span className="text-sm text-foreground font-bold">Overall Effect</span>
                  <span className="text-sm text-muted-foreground text-right font-semibold">
                    {metaAnalysisSummary.totalN}
                  </span>

                  {/* Diamond shape for summary */}
                  <div className="relative h-8 mx-4">
                    {/* Grid lines */}
                    <div className="absolute inset-0 flex justify-between">
                      {plotConfig.ticks.map((tick) => (
                        <div
                          key={tick}
                          className={cn(
                            "w-px h-full",
                            tick === plotConfig.nullLine ? "bg-muted-foreground/50" : "bg-border",
                          )}
                          style={{ left: `${toXPercent(tick)}%`, position: "absolute" }}
                        />
                      ))}
                    </div>

                    {/* Diamond SVG */}
                    <svg className="absolute inset-0 w-full h-full overflow-visible">
                      <polygon
                        points={`
                          ${toXPercent(metaAnalysisSummary.pooledLowerCI)}%,50%
                          ${toXPercent(metaAnalysisSummary.pooledEffect)}%,20%
                          ${toXPercent(metaAnalysisSummary.pooledUpperCI)}%,50%
                          ${toXPercent(metaAnalysisSummary.pooledEffect)}%,80%
                        `}
                        fill="currentColor"
                        className="text-success"
                      />
                    </svg>
                  </div>

                  <span className="text-xs text-success text-right font-mono font-semibold">
                    {metaAnalysisSummary.pooledEffect.toFixed(2)} [{metaAnalysisSummary.pooledLowerCI.toFixed(2)},{" "}
                    {metaAnalysisSummary.pooledUpperCI.toFixed(2)}]
                  </span>

                  <span className="text-sm text-foreground text-right font-bold">100%</span>
                </div>
              </div>

              {/* Favors labels */}
              <div className="grid grid-cols-[200px_80px_1fr_100px_60px] gap-4 mt-4">
                <span></span>
                <span></span>
                <div className="flex justify-between text-xs text-muted-foreground mx-4">
                  <span>← Favors Control</span>
                  <span>Favors Treatment →</span>
                </div>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>

          {/* Heterogeneity & Summary Stats - QML: Row with two Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Heterogeneity Card */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <button
                onClick={() => setShowHetDetails(!showHetDetails)}
                className="w-full p-5 flex items-center justify-between hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-warning-light">
                    <Info className="h-5 w-5 text-warning" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-base font-semibold text-foreground">Heterogeneity</h3>
                    <p className="text-sm text-muted-foreground">
                      I² = {metaAnalysisSummary.heterogeneity.I2.toFixed(1)}% (
                      {metaAnalysisSummary.heterogeneity.I2 < 25
                        ? "Low"
                        : metaAnalysisSummary.heterogeneity.I2 < 75
                          ? "Moderate"
                          : "High"}
                      )
                    </p>
                  </div>
                </div>
                {showHetDetails ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </button>

              {showHetDetails && (
                <div className="px-5 pb-5 pt-0 space-y-3 border-t border-border">
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">Cochran's Q</span>
                      <p className="text-lg font-semibold text-foreground">
                        {metaAnalysisSummary.heterogeneity.Q.toFixed(2)}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">df</span>
                      <p className="text-lg font-semibold text-foreground">{metaAnalysisSummary.heterogeneity.df}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">p-value (Q)</span>
                      <p className="text-lg font-semibold text-foreground">
                        {metaAnalysisSummary.heterogeneity.pHet.toFixed(3)}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">τ² (tau-squared)</span>
                      <p className="text-lg font-semibold text-foreground">
                        {metaAnalysisSummary.heterogeneity.tau2.toFixed(3)}
                      </p>
                    </div>
                  </div>

                  {/* I² visual bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>I² Heterogeneity</span>
                      <span>{metaAnalysisSummary.heterogeneity.I2.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          metaAnalysisSummary.heterogeneity.I2 < 25
                            ? "bg-success"
                            : metaAnalysisSummary.heterogeneity.I2 < 75
                              ? "bg-warning"
                              : "bg-destructive",
                        )}
                        style={{ width: `${metaAnalysisSummary.heterogeneity.I2}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Low (0-25%)</span>
                      <span>Moderate (25-75%)</span>
                      <span>High (75%+)</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Summary Statistics Card */}
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-success-light">
                  <BarChart3 className="h-5 w-5 text-success" />
                </div>
                <h3 className="text-base font-semibold text-foreground">Summary Statistics</h3>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-success/10 border border-success/30">
                  <span className="text-xs text-muted-foreground">Pooled Effect (SMD)</span>
                  <p className="text-2xl font-bold text-success">{metaAnalysisSummary.pooledEffect.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">
                    95% CI: [{metaAnalysisSummary.pooledLowerCI.toFixed(2)},{" "}
                    {metaAnalysisSummary.pooledUpperCI.toFixed(2)}]
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">p-value</span>
                    <p className="text-lg font-semibold text-foreground">
                      {metaAnalysisSummary.pValue < 0.001 ? "< 0.001" : metaAnalysisSummary.pValue.toFixed(3)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">Z-score</span>
                    <p className="text-lg font-semibold text-foreground">7.24</p>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground p-3 rounded-lg bg-muted/50">
                  Effect is statistically significant (p {"<"} 0.05) with a moderate effect size favoring treatment.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PRISMA Diagram Tab - existing code with minor QML comments */}
      {activeTab === "prisma" && (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="p-5 border-b border-border bg-muted/50">
            <h2 className="text-lg font-semibold text-foreground">PRISMA 2020 Flow Diagram</h2>
            <p className="text-sm text-muted-foreground">Systematic review article flow</p>
          </div>

          <div className="p-6">
            {/* Flow diagram - QML: Column { anchors.horizontalCenter: parent.horizontalCenter } */}
            <div className="flex flex-col items-center space-y-4">
              {/* Identification */}
              <div className="text-center space-y-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Identification
                </span>
                <div className="relative">
                  <div className="w-72 p-4 rounded-xl bg-info-light border-2 border-info text-center">
                    <span className="text-2xl font-bold text-info">{prismaFlow.identified.toLocaleString()}</span>
                    <p className="text-sm text-foreground">Records identified</p>
                  </div>
                  <div className="absolute -right-44 top-1/2 -translate-y-1/2 w-36 p-3 rounded-xl bg-destructive-light border border-destructive text-center">
                    <span className="text-xl font-bold text-destructive">{prismaFlow.duplicates}</span>
                    <p className="text-xs text-foreground">Duplicates removed</p>
                  </div>
                </div>
              </div>

              <ArrowDown className="h-6 w-6 text-muted-foreground" />

              {/* Screening */}
              <div className="text-center space-y-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Screening</span>
                <div className="relative">
                  <div className="w-72 p-4 rounded-xl bg-info-light border-2 border-info text-center">
                    <span className="text-2xl font-bold text-info">{prismaFlow.screened}</span>
                    <p className="text-sm text-foreground">Records screened</p>
                  </div>
                  <div className="absolute -right-44 top-1/2 -translate-y-1/2 w-36 p-3 rounded-xl bg-destructive-light border border-destructive text-center">
                    <span className="text-xl font-bold text-destructive">{prismaFlow.excluded}</span>
                    <p className="text-xs text-foreground">Excluded</p>
                  </div>
                </div>
              </div>

              <ArrowDown className="h-6 w-6 text-muted-foreground" />

              {/* Eligibility */}
              <div className="text-center space-y-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Eligibility
                </span>
                <div className="flex items-start gap-4 justify-center">
                  <div className="w-52 p-4 rounded-xl bg-info-light border-2 border-info text-center">
                    <span className="text-2xl font-bold text-info">{prismaFlow.fullText}</span>
                    <p className="text-sm text-foreground">Full-text assessed</p>
                  </div>
                  <div className="w-56 p-3 rounded-xl bg-destructive-light border border-destructive">
                    <div className="text-center mb-2">
                      <span className="text-xl font-bold text-destructive">{prismaFlow.fullTextExcluded}</span>
                      <p className="text-xs text-foreground font-semibold">Excluded</p>
                    </div>
                    <div className="space-y-0.5 text-left">
                      {prismaFlow.exclusionReasons.map((item) => (
                        <p key={item.reason} className="text-xs text-muted-foreground">
                          • {item.reason}: {item.count}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <ArrowDown className="h-6 w-6 text-muted-foreground" />

              {/* Included */}
              <div className="text-center space-y-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Included</span>
                <div className="w-72 p-5 rounded-xl bg-success-light border-2 border-success text-center">
                  <span className="text-3xl font-bold text-success">{prismaFlow.included}</span>
                  <p className="text-sm text-foreground font-medium">Studies included in meta-analysis</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
