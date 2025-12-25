// MSP Fleet Dashboard - Client-side Logic

const socket = io();
let pbxData = [];

// Check authentication on page load
document.addEventListener('DOMContentLoaded', async () => {
    const authCheck = await fetch('/api/auth/check');
    const auth = await authCheck.json();

    if (!auth.authenticated) {
        window.location.href = '/';
        return;
    }

    // Connect Socket.io
    socket.on('connect', () => {
        console.log('✅ Socket.io connected');
    });

    socket.on('fleet-update', (data) => {
        console.log('📊 Fleet update received:', data);
        pbxData = data;
        renderFleet(data);
        updateLastUpdateTime();
    });

    // Setup form handler
    document.getElementById('pbxForm').addEventListener('submit', savePBX);
});

/**
 * Render fleet grid
 */
function renderFleet(data) {
    const grid = document.getElementById('fleetGrid');
    const emptyState = document.getElementById('emptyState');

    if (!data || data.length === 0) {
        grid.classList.add('hidden');
        emptyState.classList.remove('hidden');
        return;
    }

    grid.classList.remove('hidden');
    emptyState.classList.add('hidden');

    grid.innerHTML = data.map(pbx => createHealthCard(pbx)).join('');
}

/**
 * Create health card for a PBX
 */
function createHealthCard(pbx) {
    const { health } = pbx;
    const statusClass = `status-${health.status}`;
    const statusIcon = getStatusIcon(health.status);
    const statusText = getStatusText(health.status);

    return `
    <div class="health-card ${statusClass}">
      <div class="card-header">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center space-x-2">
            ${statusIcon}
            <h3 class="font-bold text-lg">${escapeHtml(pbx.name)}</h3>
          </div>
          <button onclick="editPBX('${pbx.id}')" class="text-gray-400 hover:text-white">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path>
            </svg>
          </button>
        </div>
        <div class="text-xs text-gray-400 truncate">${new URL(pbx.url).hostname}</div>
      </div>
      
      <div class="card-body">
        ${health.issues && health.issues.length > 0 ? `
          <div class="alert mb-3">
            ${health.issues.map(issue => `<div class="text-xs">${escapeHtml(issue)}</div>`).join('')}
          </div>
        ` : ''}
        
        <div class="stat-row">
          <span class="stat-label">Trunks:</span>
          <span class="stat-value">
            ${health.trunks.registered}/${health.trunks.total}
            ${health.trunks.registered === health.trunks.total ? '✅' : '⚠️'}
          </span>
        </div>
        
        <div class="stat-row">
          <span class="stat-label">Extensions:</span>
          <span class="stat-value">${health.extensions.online}/${health.extensions.total} Online</span>
        </div>
        
        <div class="stat-row">
          <span class="stat-label">Calls:</span>
          <span class="stat-value">${health.calls.active}/${health.calls.max} Active</span>
        </div>
        
        <div class="stat-row">
          <span class="stat-label">Status:</span>
          <span class="stat-value font-semibold">${statusText}</span>
        </div>
      </div>
    </div>
  `;
}

/**
 * Get status icon
 */
function getStatusIcon(status) {
    const icons = {
        healthy: '<div class="status-indicator bg-green-500"></div>',
        warning: '<div class="status-indicator bg-yellow-500"></div>',
        critical: '<div class="status-indicator bg-red-500"></div>',
        error: '<div class="status-indicator bg-gray-500"></div>'
    };
    return icons[status] || icons.error;
}

/**
 * Get status text
 */
function getStatusText(status) {
    const texts = {
        healthy: 'All Systems Go',
        warning: 'Minor Issues',
        critical: 'Critical',
        error: 'Disconnected'
    };
    return texts[status] || 'Unknown';
}

/**
 * Update last update time
 */
function updateLastUpdateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    document.getElementById('updateTime').textContent = timeString;
}

/**
 * Open add modal
 */
function openAddModal() {
    document.getElementById('modalTitle').textContent = 'Add PBX Instance';
    document.getElementById('pbxForm').reset();
    document.getElementById('pbxId').value = '';
    document.getElementById('formError').classList.add('hidden');
    document.getElementById('pbxModal').classList.remove('hidden');
}

/**
 * Edit PBX
 */
function editPBX(id) {
    const pbx = pbxData.find(p => p.id === id);
    if (!pbx) return;

    document.getElementById('modalTitle').textContent = 'Edit PBX Instance';
    document.getElementById('pbxId').value = id;
    document.getElementById('pbxName').value = pbx.name;
    document.getElementById('pbxUrl').value = pbx.url;
    document.getElementById('appId').placeholder = 'Enter to update';
    document.getElementById('appSecret').placeholder = 'Enter to update';
    document.getElementById('formError').classList.add('hidden');
    document.getElementById('pbxModal').classList.remove('hidden');
}

/**
 * Save PBX
 */
async function savePBX(e) {
    e.preventDefault();

    const id = document.getElementById('pbxId').value;
    const name = document.getElementById('pbxName').value;
    const url = document.getElementById('pbxUrl').value;
    const appId = document.getElementById('appId').value;
    const appSecret = document.getElementById('appSecret').value;

    const method = id ? 'PUT' : 'POST';
    const endpoint = id ? `/api/pbx/${id}` : '/api/pbx';

    try {
        const response = await fetch(endpoint, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, url, appId, appSecret })
        });

        const data = await response.json();

        if (data.success) {
            closeModal();
            // Fleet will update automatically via Socket.io
        } else {
            showFormError(data.error);
        }
    } catch (error) {
        showFormError('Network error');
    }
}

/**
 * Close modal
 */
function closeModal() {
    document.getElementById('pbxModal').classList.add('hidden');
    document.getElementById('pbxForm').reset();
}

/**
 * Show form error
 */
function showFormError(message) {
    const errorDiv = document.getElementById('formError');
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
}

/**
 * Logout
 */
async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
}

/**
 * Escape HTML
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Make functions globally available
window.openAddModal = openAddModal;
window.editPBX = editPBX;
window.closeModal = closeModal;
window.logout = logout;
