"use client"

import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

// QML-friendly: Variant enum that maps to QML property string variant
type Variant = "primary" | "success" | "warning" | "destructive" | "info" | "purple"

interface StatCardProps {
  title: string
  value: number
  subtitle?: string
  icon: LucideIcon
  variant: Variant
}

// QML-friendly: Explicit style mapping (would be a JS object in QML)
const variantStyles: Record<Variant, { iconBg: string; iconColor: string; borderHover: string }> = {
  primary: {
    iconBg: "bg-primary-light",
    iconColor: "text-primary",
    borderHover: "hover:border-primary/40",
  },
  success: {
    iconBg: "bg-success-light",
    iconColor: "text-success",
    borderHover: "hover:border-success/40",
  },
  warning: {
    iconBg: "bg-warning-light",
    iconColor: "text-warning",
    borderHover: "hover:border-warning/40",
  },
  destructive: {
    iconBg: "bg-destructive-light",
    iconColor: "text-destructive",
    borderHover: "hover:border-destructive/40",
  },
  info: {
    iconBg: "bg-info-light",
    iconColor: "text-info",
    borderHover: "hover:border-info/40",
  },
  purple: {
    iconBg: "bg-purple-light",
    iconColor: "text-purple",
    borderHover: "hover:border-purple/40",
  },
}

export function StatCard({ title, value, subtitle, icon: Icon, variant }: StatCardProps) {
  const styles = variantStyles[variant]

  return (
    // QML: Rectangle { id: card; radius: 16; color: Theme.card; border.color: Theme.border }
    <div className={cn("group rounded-2xl border border-border bg-card p-5 transition-colors", styles.borderHover)}>
      {/* QML: Row { anchors.fill: parent; spacing: 16 } */}
      <div className="flex items-start justify-between">
        {/* QML: Column { spacing: 8 } */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {/* QML: Row { spacing: 4; baseline: true } */}
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-foreground">{value.toLocaleString()}</span>
            {subtitle && <span className={cn("text-sm font-medium", styles.iconColor)}>{subtitle}</span>}
          </div>
        </div>

        {/* Icon container - QML: Rectangle { width: 48; height: 48; radius: 12 } */}
        <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", styles.iconBg)}>
          <Icon className={cn("h-6 w-6", styles.iconColor)} />
        </div>
      </div>
    </div>
  )
}
