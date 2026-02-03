"use client"

import { cn } from "@/lib/utils"
import { LayoutDashboard, Settings, Search, FileText, BarChart3, Settings2 } from "lucide-react"
import { AIStatusWidget } from "./ai-status-widget"

// QML-friendly: Explicit tab configuration that maps to QML ListModel
const tabs = [
  { id: 0, name: "Dashboard", icon: LayoutDashboard },
  { id: 1, name: "Setup", icon: Settings },
  { id: 2, name: "Screening", icon: Search },
  { id: 3, name: "Extraction", icon: FileText },
  { id: 4, name: "Analysis", icon: BarChart3 },
]

interface TopNavProps {
  currentTab: number
  onTabChange: (index: number) => void
}

export function TopNav({ currentTab, onTabChange }: TopNavProps) {
  return (
    // QML: Rectangle { id: header; anchors.top: parent.top; height: 64 }
    <header className="sticky top-0 z-50 h-16 border-b border-border bg-card">
      <div className="flex h-full items-center justify-between px-6">
        {/* Logo - QML: Row { spacing: 12 } */}
        <div className="flex items-center gap-3">
          {/* Logo icon - QML: Rectangle { width: 40; height: 40; radius: 10 } */}
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <span className="text-sm font-bold text-primary-foreground">IR</span>
          </div>
          {/* Logo text - QML: Column { spacing: 2 } */}
          <div className="flex flex-col">
            <span className="text-base font-semibold text-foreground">IRIS</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
              Intelligent Review & Insight System
            </span>
          </div>
        </div>

        {/* Navigation - QML: Row { spacing: 4; padding: 4 } */}
        <nav className="flex items-center gap-1 rounded-xl bg-muted p-1">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = currentTab === tab.id
            return (
              // QML: Rectangle { property bool isActive; color: isActive ? Theme.card : "transparent" }
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                  isActive ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.name}</span>
              </button>
            )
          })}
        </nav>
        {/* Right actions - QML: Row { spacing: 12 } */}
        <div className="flex items-center gap-4">
          <AIStatusWidget />

          <button
            onClick={() => onTabChange(5)}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card transition-colors",
              currentTab === 5 ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  )
}
