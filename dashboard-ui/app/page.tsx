"use client"

import { useState, useEffect } from "react"
import { TopNav } from "@/components/top-nav"
import { DashboardView } from "@/components/dashboard-view"
import { SetupView } from "@/components/setup-view"
import { ScreeningView } from "@/components/screening-view"
import { ExtractionView } from "@/components/extraction-view"
import { SettingsView } from "@/components/settings-view"
import { OfflineModeIndicator } from "@/components/offline-mode-indicator"
import { ProgressNotifications } from "@/components/progress-notifications"
import { useDashboard, type DashboardStats } from "@/hooks/useDashboard"
import { useAIStatus } from "@/hooks/useAIStatus"
import { useNotifications } from "@/hooks/useNotifications"

export default function IRISDashboard() {
  const [currentTab, setCurrentTab] = useState(0)
  const projectId = 1 // Default project for now

  const {
    stats,
    isLoading: isStatsLoading,
    recentActivity,
    refresh: refreshDashboard
  } = useDashboard(projectId)

  const { status: aiStatus } = useAIStatus()
  const { notifications, dismissNotification } = useNotifications()

  // Tab change handler to refresh data
  const handleTabChange = (tab: number) => {
    setCurrentTab(tab)
    if (tab === 0) refreshDashboard()
  }

  if (isStatsLoading && !stats) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-primary animate-pulse" />
          <p className="text-sm font-medium text-muted-foreground">Initializing IRIS...</p>
        </div>
      </div>
    )
  }

  const projectStats: DashboardStats = stats || {
    totalArticles: 0,
    screened: 0,
    included: 0,
    excluded: 0,
    extracted: 0,
    pending: 0,
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNav currentTab={currentTab} onTabChange={handleTabChange} />
      <main>
        {currentTab === 0 && (
          <DashboardView
            projectStats={projectStats}
            recentActivity={recentActivity}
            onNavigate={handleTabChange}
          />
        )}
        {currentTab === 1 && (
          <SetupView projectId={projectId} />
        )}
        {currentTab === 2 && (
          <ScreeningView projectId={projectId} />
        )}
        {currentTab === 3 && (
          <ExtractionView projectId={projectId} />
        )}
        {currentTab === 4 && <div className="flex h-full items-center justify-center"><p className="text-muted-foreground">Analysis coming soon</p></div>}
        {currentTab === 5 && <SettingsView />}
      </main>

      {/* Progress Notifications */}
      <ProgressNotifications
        notifications={notifications}
        onDismiss={dismissNotification}
      />

      {/* Offline Mode Indicator */}
      <OfflineModeIndicator />
    </div>
  )
}
