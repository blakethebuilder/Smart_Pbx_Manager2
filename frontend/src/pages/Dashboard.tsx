import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Grid, List, FileUp } from 'lucide-react'
import { usePBXStore } from '../stores/pbxStore'
import { pbxService } from '../services/pbxService'
import PBXGrid from '../components/PBX/PBXGrid'
import PBXQuickAccess from '../components/PBX/PBXQuickAccess'
import AddPBXModal from '../components/PBX/AddPBXModal'
import PBXLoader from '../components/PBX/PBXLoader'
import AnnouncementBox from '../components/AnnouncementBox'

const Dashboard = () => {
  const { 
    pbxInstances, 
    selectedPBX, 
    searchQuery,
    favorites,
    setPBXInstances 
  } = usePBXStore()
  
  const [showAddModal, setShowAddModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isLoading, setIsLoading] = useState(true)

  const loadPBXInstances = async () => {
    try {
      setIsLoading(true)
      const instances = await pbxService.getAllPBX()
      setPBXInstances(instances)
    } catch (error) {
      console.error('Failed to load PBX instances:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadPBXInstances()
  }, [setPBXInstances])

  const filteredInstances = pbxInstances.filter(pbx =>
    pbx.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pbx.url.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const stats = {
    total: pbxInstances.length,
    favorites: favorites.length,
    notes: pbxInstances.reduce((acc, pbx) => acc + (pbx.notes?.length || 0), 0),
    recent: pbxInstances.filter(pbx => {
      const lastNote = pbx.notes?.[pbx.notes.length - 1]
      if (!lastNote) return false
      const noteDate = new Date(lastNote.timestamp)
      const now = new Date()
      return (now.getTime() - noteDate.getTime()) < 24 * 60 * 60 * 1000 // Last 24h
    }).length
  }

  if (selectedPBX) {
    return <PBXLoader />
  }
  
const handlePreviewImport = () => {
    const csvData = (document.getElementById('csvInput') as HTMLTextAreaElement).value;
    const previewDiv = document.getElementById('importPreviewContent');
    const previewArea = document.getElementById('importPreviewArea');
    const errorDiv = document.getElementById('importError');

    errorDiv.classList.add('hidden');
    previewArea.classList.remove('hidden');

    const lines = csvData.trim().split('\\n').filter(line => line.trim() !== '');
    if (lines.length === 0) {
        previewDiv.innerHTML = '<div class="text-red-400">No data found to preview.</div>';
        return;
    }
    
    const headers = lines[0].toLowerCase().includes('name') ? lines[0].split(/[,\\t]/).map(h => h.trim()) : ['name', 'url', 'appId', 'appSecret', 'isShared'];

    const previewHtml = lines.slice(1).map((line, index) => {
        const values = line.split(/[,\\t]/).map(v => v.trim());
        
        if (values.length !== headers.length) {
            return \`<div class="text-red-400">Line \${index + 2} (Skipped): Column mismatch (\${values.length} cols found).</div>\`;
        }

        const pbx = {};
        headers.forEach((header, i) => {
            let value = values[i];
            if (header === 'isshared' && value !== undefined) {
                pbx[header] = value.toLowerCase() === 'true' || value === '1';
            } else if (value) {
                pbx[header] = value;
            }
        });

        return \`
            <div class="border-b border-dark-800 py-1">
                <span class="font-bold text-white">\${index + 1}.</span> \${pbx.name || '[No Name]'} (\${pbx.url || 'No URL'})
            </div>
        \`;
    }).join('');

    previewDiv.innerHTML = previewHtml;
  };

  const handleBulkImport = async () => {
    const csvData = (document.getElementById('csvInput') as HTMLTextAreaElement).value;
    const errorDiv = document.getElementById('importError');
    // Find button within the modal context
    const btn = (document.querySelector('.fixed.inset-0.z-50 .btn-primary') as HTMLButtonElement);
    
    if (!csvData.trim()) {
        errorDiv.textContent = 'CSV data cannot be empty.';
        errorDiv.classList.remove('hidden');
        return;
    }

    setIsLoading(true);
    btn.disabled = true;
    errorDiv.classList.add('hidden');

    const lines = csvData.trim().split('\\n').filter(line => line.trim() !== '');
    if (lines.length <= 1) {
        errorDiv.textContent = 'No actual data rows found after header.';
        errorDiv.classList.remove('hidden');
        setIsLoading(false);
        btn.disabled = false;
        return;
    }

    const headers = lines[0].split(/[,\\t]/).map(h => h.trim().toLowerCase());
    
    const instancesToImport = lines.slice(1).map(line => {
        const values = line.split(/[,\\t]/).map(v => v.trim());
        const pbx = {};
        headers.forEach((header, i) => {
            let value = values[i];
            if (header === 'isshared' && value !== undefined) {
                pbx[header] = value.toLowerCase() === 'true' || value === '1';
            } else if (value) {
                pbx[header] = value;
            }
        });
        return pbx;
    });

    try {
        const res = await pbxService.bulkImport(instancesToImport);
        
        if (res.success) {
            alert(\`Import successful! Created: \${res.created}, Updated: \${res.updated}\`);
            loadPBXInstances(); // Reload data
            setShowImportModal(false);
        } else {
            throw new Error(\`Import failed: \${res.errors.length} errors.\`);
        }
    } catch (err) {
        errorDiv.textContent = err instanceof Error ? err.message : 'An unknown error occurred during import.';
        errorDiv.classList.remove('hidden');
    } finally {
        setIsLoading(false);
        btn.disabled = false;
    }
  };
