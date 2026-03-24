import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

interface ComplianceBadgeProps {
  status: "APPROVED" | "REJECTED" | "PENDING"
  notes?: string
  variant?: "default" | "banner"
}

export function ComplianceBadge({
  status,
  notes,
  variant = "default",
}: ComplianceBadgeProps) {
  const config = {
    APPROVED: {
      icon: CheckCircle2,
      label: "Approved",
      className: "bg-success/10 text-success border-success/20",
      bannerClassName: "bg-success/10 border-success/30",
    },
    REJECTED: {
      icon: XCircle,
      label: "Rejected",
      className: "bg-destructive/10 text-destructive border-destructive/20",
      bannerClassName: "bg-destructive/10 border-destructive/30",
    },
    PENDING: {
      icon: AlertTriangle,
      label: "Pending Review",
      className: "bg-warning/10 text-warning border-warning/20",
      bannerClassName: "bg-warning/10 border-warning/30",
    },
  }

  const { icon: Icon, label, className, bannerClassName } = config[status]

  if (variant === "banner") {
    return (
      <div
        className={cn(
          "flex items-start gap-3 rounded-lg border p-4",
          bannerClassName
        )}
      >
        <Icon className="mt-0.5 h-5 w-5 shrink-0" />
        <div className="space-y-1">
          <p className="font-semibold">{label}</p>
          {notes && (
            <p className="text-sm opacity-80">{notes}</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium",
        className
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  )
}
