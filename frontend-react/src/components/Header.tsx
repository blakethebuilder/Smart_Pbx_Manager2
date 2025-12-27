import { Shield, Plus, LogOut } from 'lucide-react';

interface HeaderProps {
  lastUpdate: Date | null;
  onAddPBX: () => void;
  onLogout: () => void;
  connectionStatus?: 'connecting' | 'connected' | 'disconnected';
}

export default function Header({ lastUpdate, onAddPBX, onLogout, connectionStatus = 'connected' }: HeaderProps) {
  const formatTime = (date: Date | null) => {
    if (!date) return '--:--';
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'bg-green-500';
      case 'connecting':
        return 'bg-yellow-500';
      case 'disconnected':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'disconnected':
        return 'Disconnected';
      default:
        return 'Unknown';
    }
  };

  return (
    <header className="border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">MSP Fleet Dashboard</h1>
              <p className="text-sm text-gray-400">Real-time PBX Monitoring</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-400 flex items-center">
              <span className={`inline-block w-2 h-2 rounded-full mr-2 ${getStatusColor()} ${connectionStatus === 'connected' ? 'animate-pulse' : ''}`}></span>
              {connectionStatus === 'connected' ? (
                <>Last update: <span className="ml-1">{formatTime(lastUpdate)}</span></>
              ) : (
                <span>{getStatusText()}</span>
              )}
            </div>
            
            <button
              onClick={onAddPBX}
              disabled={connectionStatus !== 'connected'}
              className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg font-medium transition-all flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add PBX</span>
            </button>
            
            <button
              onClick={onLogout}
              className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-slate-700"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}