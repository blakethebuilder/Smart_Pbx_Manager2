export const formatLastCheck = (lastCheck: string | null): string => {
  if (!lastCheck) return 'Never'
  
  const date = new Date(lastCheck)
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
  
  if (diffInMinutes < 1) return 'Just now'
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`
  
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours}h ago`
  
  const diffInDays = Math.floor(diffInHours / 24)
  return `${diffInDays}d ago`
}

export const formatUptime = (uptime: string): string => {
  return uptime
}

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'healthy':
      return 'text-success-500'
    case 'error':
      return 'text-error-500'
    default:
      return 'text-slate-500'
  }
}

export const getStatusDotClass = (status: string): string => {
  switch (status) {
    case 'healthy':
      return 'status-dot status-connected'
    case 'error':
      return 'status-dot status-disconnected'
    default:
      return 'status-dot status-unknown'
  }
}

export const getPriorityColor = (priority: 'low' | 'medium' | 'high'): string => {
  switch (priority) {
    case 'high':
      return 'text-error-500 bg-error-500/10 border-error-500/20'
    case 'medium':
      return 'text-warning-500 bg-warning-500/10 border-warning-500/20'
    case 'low':
      return 'text-slate-400 bg-slate-500/10 border-slate-500/20'
  }
}