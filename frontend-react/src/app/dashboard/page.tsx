'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import Header from '@/components/Header';
import FleetGrid from '@/components/FleetGrid';
import PBXModal from '@/components/PBXModal';
import EmptyState from '@/components/EmptyState';
import { PBXData } from '@/types';

export default function DashboardPage() {
  const [pbxData, setPbxData] = useState<PBXData[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPBX, setEditingPBX] = useState<PBXData | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const router = useRouter();

  useEffect(() => {
    // Check authentication
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/check');
        const auth = await response.json();

        if (!auth.authenticated) {
          router.push('/');
          return;
        }

        // Initialize Socket.io connection to backend server
        const socketInstance = io('http://localhost:3000', {
          transports: ['websocket', 'polling'],
          timeout: 5000,
        });
        
        setSocket(socketInstance);

        socketInstance.on('connect', () => {
          console.log('✅ Socket.io connected');
          setConnectionStatus('connected');
          setLoading(false);
        });

        socketInstance.on('fleet-update', (data: PBXData[]) => {
          console.log('📊 Fleet update received:', data);
          setPbxData(data);
          setLastUpdate(new Date());
        });

        socketInstance.on('disconnect', () => {
          console.log('❌ Socket.io disconnected');
          setConnectionStatus('disconnected');
        });

        socketInstance.on('connect_error', (error) => {
          console.error('Socket.io connection error:', error);
          setConnectionStatus('disconnected');
          setLoading(false);
        });

        return () => {
          socketInstance.disconnect();
        };
      } catch (error) {
        console.error('Auth check failed:', error);
        setLoading(false);
        // Don't redirect immediately, show error state
      }
    };

    checkAuth();
  }, [router]);

  const handleAddPBX = () => {
    setEditingPBX(null);
    setIsModalOpen(true);
  };

  const handleEditPBX = (pbx: PBXData) => {
    setEditingPBX(pbx);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPBX(null);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      if (socket) {
        socket.disconnect();
      }
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Connecting to dashboard...</p>
          <p className="text-sm text-gray-500 mt-2">
            Make sure the backend server is running on port 3000
          </p>
        </div>
      </div>
    );
  }

  if (connectionStatus === 'disconnected') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="w-8 h-8 bg-red-500 rounded-full"></div>
          </div>
          <h2 className="text-xl font-semibold mb-2">Connection Failed</h2>
          <p className="text-gray-400 mb-4">
            Cannot connect to the backend server
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Please ensure the backend is running on port 3000
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg transition-all"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header
        lastUpdate={lastUpdate}
        onAddPBX={handleAddPBX}
        onLogout={handleLogout}
        connectionStatus={connectionStatus}
      />

      <main className="container mx-auto px-6 py-8">
        {pbxData.length === 0 ? (
          <EmptyState onAddPBX={handleAddPBX} />
        ) : (
          <FleetGrid pbxData={pbxData} onEditPBX={handleEditPBX} />
        )}
      </main>

      <PBXModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        editingPBX={editingPBX}
      />
    </div>
  );
}