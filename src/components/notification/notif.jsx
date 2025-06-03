"use client"

import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Notification({ notification, onClose }) {
  const getIcon = () => {
    switch (notification.type) {
      case "success":
        return <CheckCircle className="h-5 w-5" />
      case "error":
        return <AlertCircle className="h-5 w-5" />
      case "warning":
        return <AlertTriangle className="h-5 w-5" />
      default:
        return <Info className="h-5 w-5" />
    }
  }

  const getColorClasses = () => {
    switch (notification.type) {
      case "success":
        return "bg-green-50 border-green-200 text-green-800"
      case "error":
        return "bg-red-50 border-red-200 text-red-800"
      case "warning":
        return "bg-yellow-50 border-yellow-200 text-yellow-800"
      default:
        return "bg-blue-50 border-blue-200 text-blue-800"
    }
  }

  return (
    <div className={`flex items-center p-4 mb-3 border rounded-lg shadow-lg ${getColorClasses()}`}>
      <div className="flex-shrink-0">{getIcon()}</div>
      <div className="ml-3 flex-1">
        <p className="text-sm font-medium">{notification.message}</p>
      </div>
      <Button variant="ghost" size="sm" onClick={() => onClose(notification.id)} className="ml-2 h-6 w-6 p-0">
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}
