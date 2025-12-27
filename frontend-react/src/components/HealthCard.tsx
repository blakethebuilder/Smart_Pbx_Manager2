import { MoreVertical, ExternalLink } from 'lucide-react';
import { PBXData } from '@/types';
import { cn } from '@/lib/utils';

interface HealthCardProps {
  pbx: PBXData;
  onEdit: () => void;
}

export default function HealthCard({ pbx, onEdit }: HealthCardProps) {
  const { health } = pbx;
  
  const getStatusIcon = (status: string) => {
    const baseClasses = "status-indicator";
    switch (status) {
      case 'healthy':
        return <div className={cn(baseClasses, "bg-green-500")} />;
      case 'warning':
        return <div className={cn(baseClasses, "bg-yellow-500")} />;
      case 'critical':
        return <div className={cn(baseClasses, "bg-red-500")} />;
      default:
        return <div className={cn(baseClasses, "bg-gray-500")} />;
    }
  };

  const getStatusText = (status: string) => {
    const texts = {
      healthy: 'All Systems Go',
      warning: 'Minor Issues',
      critical: 'Critical',
      error: 'Disconnected'
    };
    return texts[status as keyof typeof texts] || 'Unknown';
  };

  const handlePBXClick = () => {
    window.open(pbx.url, '_blank');
  };

  return (
    <div className={cn("health-card", `status-${health.status}`)}>
      <div className="card-header">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            {getStatusIcon(health.status)}
            <h3 className="font-bold text-lg truncate">{pbx.name}</h3>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={handlePBXClick}
              className="text-gray-400 hover:text-white p-1 rounded transition-colors"
              title="Open PBX"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
            <button
              onClick={onEdit}
              className="text-gray-400 hover:text-white p-1 rounded transition-colors"
              title="Edit PBX"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="text-xs text-gray-400 truncate">
          {new URL(pbx.url).hostname}
        </div>
      </div>

      <div className="card-body mt-4">
        {health.issues && health.issues.length > 0 && (
          <div className="alert mb-3">
            {health.issues.map((issue, index) => (
              <div key={index} className="text-xs">{issue}</div>
            ))}
          </div>
        )}

        <div className="space-y-2">
          <div className="stat-row">
            <span className="stat-label">Trunks:</span>
            <span className="stat-value flex items-center space-x-1">
              <span>{health.trunks.registered}/{health.trunks.total}</span>
              <span>{health.trunks.registered === health.trunks.total ? '✅' : '⚠️'}</span>
            </span>
          </div>

          <div className="stat-row">
            <span className="stat-label">Extensions:</span>
            <span className="stat-value">{health.extensions.online}/{health.extensions.total} Online</span>
          </div>

          <div className="stat-row">
            <span className="stat-label">Calls:</span>
            <span className="stat-value">{health.calls.active}/{health.calls.max} Active</span>
          </div>

          <div className="stat-row">
            <span className="stat-label">Status:</span>
            <span className="stat-value font-semibold">{getStatusText(health.status)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}