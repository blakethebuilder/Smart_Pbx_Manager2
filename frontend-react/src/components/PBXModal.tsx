'use client';

import { useState, useEffect } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import { PBXData, PBXFormData } from '@/types';

interface PBXModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingPBX: PBXData | null;
}

export default function PBXModal({ isOpen, onClose, editingPBX }: PBXModalProps) {
  const [formData, setFormData] = useState<PBXFormData>({
    name: '',
    url: '',
    appId: '',
    appSecret: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (editingPBX) {
        setFormData({
          name: editingPBX.name,
          url: editingPBX.url,
          appId: '',
          appSecret: '',
        });
      } else {
        setFormData({
          name: '',
          url: '',
          appId: '',
          appSecret: '',
        });
      }
      setError('');
      setShowSecret(false);
    }
  }, [isOpen, editingPBX]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const method = editingPBX ? 'PUT' : 'POST';
    const endpoint = editingPBX ? `/api/pbx/${editingPBX.id}` : '/api/pbx';

    try {
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        onClose();
      } else {
        setError(data.error || 'Failed to save PBX');
      }
    } catch (error) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof PBXFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-xl shadow-2xl max-w-md w-full border border-slate-700">
        <div className="p-6 border-b border-slate-700 flex items-center justify-between">
          <h3 className="text-xl font-semibold">
            {editingPBX ? 'Edit PBX Instance' : 'Add PBX Instance'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">PBX Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Main Office"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">PBX URL</label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) => handleChange('url', e.target.value)}
              required
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://your-pbx.yeastar.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">App ID (Client ID)</label>
            <input
              type="text"
              value={formData.appId}
              onChange={(e) => handleChange('appId', e.target.value)}
              required={!editingPBX}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={editingPBX ? "Enter to update" : "Your API App ID"}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">App Secret (Client Secret)</label>
            <div className="relative">
              <input
                type={showSecret ? 'text' : 'password'}
                value={formData.appSecret}
                onChange={(e) => handleChange('appSecret', e.target.value)}
                required={!editingPBX}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={editingPBX ? "Enter to update" : "Your API App Secret"}
              />
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg font-medium transition-all"
            >
              {loading ? 'Saving...' : 'Save PBX'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg font-medium transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}