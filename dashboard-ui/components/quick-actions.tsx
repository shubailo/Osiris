"use client"

import { cn } from "@/lib/utils"
import { Upload, Search, FileText, BarChart3, ArrowRight } from "lucide-react"

interface ProjectStats {
  totalArticles: number
  included: number
  extracted: number
}

interface QuickActionsProps {
  projectStats: ProjectStats
  onNavigate: (tab: number) => void
}

// QML-friendly: Action model that maps to QML ListModel
const actions = [
  {
    id: 0,
    name: "Upload PDFs",
    icon: Upload,
    tab: 1,
    description: "Import articles to your project",
    minArticles: 0,
    minIncluded: 0,
    minExtracted: 0,
  },
  {
    id: 1,
    name: "Start Screening",
    icon: Search,
    tab: 2,
    description: "Review and validate articles",
    minArticles: 1,
    minIncluded: 0,
    minExtracted: 0,
  },
  {
    id: 2,
    name: "Extract Data",
    icon: FileText,
    tab: 3,
    description: "Pull structured data from articles",
    minArticles: 0,
    minIncluded: 1,
    minExtracted: 0,
  },
  {
    id: 3,
    name: "View Analysis",
    icon: BarChart3,
    tab: 4,
    description: "PRISMA flow and insights",
    minArticles: 0,
    minIncluded: 0,
    minExtracted: 1,
  },
]

export function QuickActions({ projectStats, onNavigate }: QuickActionsProps) {
  // QML-friendly: Explicit enabled check function
  const isActionEnabled = (action: (typeof actions)[0]) => {
    return (
      projectStats.totalArticles >= action.minArticles &&
      projectStats.included >= action.minIncluded &&
      projectStats.extracted >= action.minExtracted
    )
  }

  return (
    // QML: Rectangle { radius: 16; color: Theme.card; border.color: Theme.border }
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Header - QML: Rectangle { height: 60; color: Theme.muted } */}
      <div className="p-4 border-b border-border bg-muted/50">
        <h2 className="text-base font-semibold text-foreground">Quick Actions</h2>
        <p className="text-sm text-muted-foreground">Jump to common tasks</p>
      </div>

      {/* Actions list - QML: ListView { model: actionsModel } */}
      <div className="p-2">
        {actions.map((action) => {
          const Icon = action.icon
          const enabled = isActionEnabled(action)

          return (
            // QML: delegate: ActionItem { }
            <button
              key={action.id}
              onClick={() => enabled && onNavigate(action.tab)}
              disabled={!enabled}
              className={cn(
                "group flex w-full items-center gap-3 rounded-xl p-3 transition-colors",
                enabled ? "hover:bg-muted cursor-pointer" : "opacity-40 cursor-not-allowed",
              )}
            >
              {/* Icon - QML: Rectangle { width: 44; height: 44; radius: 10 } */}
              <div
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-xl transition-colors",
                  enabled
                    ? "bg-primary-light text-primary group-hover:bg-primary group-hover:text-primary-foreground"
                    : "bg-muted text-muted-foreground",
                )}
              >
                <Icon className="h-5 w-5" />
              </div>

              {/* Text - QML: Column { } */}
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-foreground">{action.name}</p>
                <p className="text-xs text-muted-foreground">{action.description}</p>
              </div>

              {/* Arrow indicator */}
              {enabled && (
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
