import { Shield, Plus } from 'lucide-react';

interface EmptyStateProps {
  onAddPBX: () => void;
}

export default function EmptyState({ onAddPBX }: EmptyStateProps) {
  return (
    <div className="text-center py-16">
      <div className="w-24 h-24 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
        <Shield className="w-12 h-12 text-gray-500" />
      </div>
      <h3 className="text-xl font-semibold mb-2">No PBX Instances</h3>
      <p className="text-gray-400 mb-6">Add your first PBX to start monitoring</p>
      <button
        onClick={onAddPBX}
        className="bg-blue-500 hover:bg-blue-600 px-6 py-3 rounded-lg font-medium flex items-center space-x-2 mx-auto transition-all"
      >
        <Plus className="w-5 h-5" />
        <span>Add Your First PBX</span>
      </button>
    </div>
  );
}