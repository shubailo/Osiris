"use client"

import { cn } from "@/lib/utils"
import { FileText, AlertCircle, Clock, Upload, Search } from "lucide-react"
import type { LucideIcon } from "lucide-react"

interface ActivityItem {
  id: string
  type: string
  message: string
  timestamp: string
  icon: string
}

interface RecentActivityProps {
  activities: ActivityItem[]
}

// QML-friendly: Explicit icon/color mapping
const typeConfig: Record<string, { icon: LucideIcon; bgColor: string; textColor: string }> = {
  screening: { icon: Search, bgColor: "bg-success-light", textColor: "text-success" },
  extraction: { icon: FileText, bgColor: "bg-purple-light", textColor: "text-purple" },
  upload: { icon: Upload, bgColor: "bg-info-light", textColor: "text-info" },
  error: { icon: AlertCircle, bgColor: "bg-destructive-light", textColor: "text-destructive" },
  default: { icon: Clock, bgColor: "bg-muted", textColor: "text-muted-foreground" },
}

export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    // QML: Rectangle { radius: 16; color: Theme.card }
    <div className="h-full rounded-2xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border bg-muted/50">
        <h2 className="text-base font-semibold text-foreground">Recent Activity</h2>
        <p className="text-sm text-muted-foreground">Your latest actions and updates</p>
      </div>

      <div className="p-3">
        {activities.length === 0 ? (
          // Empty state - QML: Item { visible: model.count === 0 }
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted mb-3">
              <Clock className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">No recent activity</p>
            <p className="text-xs text-muted-foreground mt-1">Your actions will appear here</p>
          </div>
        ) : (
          // Activity list - QML: ListView { }
          <div className="space-y-1">
            {activities.map((activity) => {
              const config = typeConfig[activity.type] || typeConfig.default
              const Icon = config.icon

              return (
                // QML: delegate: ActivityItem { }
                <div
                  key={activity.id}
                  className="flex items-start gap-3 rounded-xl p-3 hover:bg-muted/50 transition-colors"
                >
                  {/* Icon - QML: Rectangle { width: 44; height: 44; radius: 10 } */}
                  <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", config.bgColor)}>
                    <Icon className={cn("h-5 w-5", config.textColor)} />
                  </div>

                  {/* Content - QML: Column { } */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{activity.message}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{activity.timestamp}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
