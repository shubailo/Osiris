"use client"

import { StatCard } from "@/components/stat-card"
import { QuickActions } from "@/components/quick-actions"
import { RecentActivity } from "@/components/recent-activity"
import { FileStack, CheckCircle2, CheckCheck, XCircle } from "lucide-react"

interface ProjectStats {
  totalArticles: number
  screened: number
  included: number
  excluded: number
  extracted: number
  pending: number
}

interface ActivityItem {
  id: string
  type: string
  message: string
  timestamp: string
  icon: string
}

interface DashboardViewProps {
  projectStats: ProjectStats
  recentActivity: ActivityItem[]
  onNavigate: (tab: number) => void
}

export function DashboardView({ projectStats, recentActivity, onNavigate }: DashboardViewProps) {
  const screenedPercent =
    projectStats.totalArticles > 0 ? Math.round((projectStats.screened / projectStats.totalArticles) * 100) : 0

  return (
    // QML: ScrollView { contentWidth: -1 }
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header - QML: Column { spacing: 4 } */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Project overview and recent activity</p>
      </div>

      {/* Stats Grid - QML: GridLayout { columns: 4 } */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Articles" value={projectStats.totalArticles} icon={FileStack} variant="info" />
        <StatCard
          title="Screened"
          value={projectStats.screened}
          subtitle={`${screenedPercent}%`}
          icon={CheckCircle2}
          variant="success"
        />
        <StatCard title="Included" value={projectStats.included} icon={CheckCheck} variant="success" />
        <StatCard title="Excluded" value={projectStats.excluded} icon={XCircle} variant="destructive" />
      </div>

      {/* Bottom Section - QML: RowLayout { } */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <QuickActions projectStats={projectStats} onNavigate={onNavigate} />
        <div className="lg:col-span-2">
          <RecentActivity activities={recentActivity} />
        </div>
      </div>
    </div>
  )
}
