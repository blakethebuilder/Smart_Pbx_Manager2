// Live Monitoring Dashboard - Enhanced App Logic

const API_BASE = '/api';
let refreshInterval = null;
let inboundCallTimers = new Map();

// Initialize dashboard on page load
document.addEventListener('DOMContentLoaded', () => {
  loadDashboard();
  setupAutoRefresh();
  setupFormHandler();
  setupWebSocketHandlers();
  loadLiveMonitoring();
});

/**
 * Setup WebSocket event handlers
 */
function setupWebSocketHandlers() {
  // Extension status updates
  wsClient.on('extension_status', (data) => {
    console.log('Extension status update:', data);
    updateExtensionStatus(data.extension, data.status, data.callInfo);
  });

  // Trunk status updates
  wsClient.on('trunk_registration', (data) => {
    console.log('Trunk registration update:', data);
    updateTrunkStatus(data.trunk, data.status);
  });

  wsClient.on('trunk_call_state', (data) => {
    console.log('Trunk call state update:', data);
    updateCallStatus(data);
  });

  // Inbound call request (URGENT)
  wsClient.on('inbound_call_request', (data) => {
    console.log('🚨 INBOUND CALL:', data);
    showInboundCallPopup(data);
  });

  // Call accepted/refused
  wsClient.on('call_accepted', (data) => {
    console.log('✅ Call accepted:', data);
    closeInboundCallPopup(data.callId);
  });

  wsClient.on('call_refused', (data) => {
    console.log('❌ Call refused:', data);
    closeInboundCallPopup(data.callId);
  });
}

/**
 * Load live monitoring data
 */
async function loadLiveMonitoring() {
  try {
    const [extensionsRes, trunksRes, callsRes] = await Promise.all([
      fetch(`${API_BASE}/../yeastar/extensions`),
      fetch(`${API_BASE}/../yeastar/trunks`),
      fetch(`${API_BASE}/../yeastar/calls`)
    ]);

    const extensions = await extensionsRes.json();
    const trunks = await trunksRes.json();
    const calls = await callsRes.json();

    if (extensions.success) renderExtensions(extensions.data);
    if (trunks.success) renderTrunks(trunks.data);
    if (calls.success) renderActiveCalls(calls.data);
  } catch (error) {
    console.error('Error loading live monitoring:', error);
  }
}

/**
 * Render extensions grid
 */
function renderExtensions(extensions) {
  const container = document.getElementById('extensionsGrid');
  if (!container) return;

  if (extensions.length === 0) {
    container.innerHTML = '<div class="text-gray-500 text-center py-8">No extension data yet. Waiting for webhook events...</div>';
    return;
  }

  container.innerHTML = extensions.map(ext => `
    <div class="bg-dark-700/50 rounded-lg p-4 border border-dark-600" id="ext-${ext.extension}">
      <div class="flex items-center justify-between mb-2">
        <span class="font-semibold">Ext ${ext.extension}</span>
        <span class="extension-status-badge ${getExtensionStatusClass(ext.status)}">${ext.status}</span>
      </div>
      ${ext.callInfo ? `
        <div class="text-xs text-gray-400 mt-2">
          <div>📞 ${ext.callInfo.caller} → ${ext.callInfo.callee}</div>
        </div>
      ` : ''}
    </div>
  `).join('');
}

/**
 * Update single extension status
 */
function updateExtensionStatus(extension, status, callInfo) {
  const extCard = document.getElementById(`ext-${extension}`);

  if (!extCard) {
    // Extension not in grid yet, reload
    loadLiveMonitoring();
    return;
  }

  // Update status badge
  const badge = extCard.querySelector('.extension-status-badge');
  if (badge) {
    badge.className = `extension-status-badge ${getExtensionStatusClass(status)}`;
    badge.textContent = status;
  }

  // Add pulsing animation for ringing
  if (status === 'Ringing') {
    extCard.classList.add('animate-pulse-glow');
  } else {
    extCard.classList.remove('animate-pulse-glow');
  }
}

/**
 * Get extension status CSS class
 */
function getExtensionStatusClass(status) {
  const classes = {
    'Idle': 'badge-gray',
    'Ringing': 'badge-warning animate-pulse',
    'Busy': 'badge-danger',
    'Registered': 'badge-success',
    'Unregistered': 'badge-gray'
  };
  return classes[status] || 'badge-gray';
}

/**
 * Render trunks grid
 */
function renderTrunks(trunks) {
  const container = document.getElementById('trunksGrid');
  if (!container) return;

  if (trunks.length === 0) {
    container.innerHTML = '<div class="text-gray-500 text-center py-8">No trunk data yet. Waiting for webhook events...</div>';
    return;
  }

  container.innerHTML = trunks.map(trunk => `
    <div class="bg-dark-700/50 rounded-lg p-4 border border-dark-600" id="trunk-${trunk.trunk}">
      <div class="flex items-center justify-between">
        <span class="font-semibold">${trunk.trunk}</span>
        <span class="badge ${trunk.status === 'Registered' ? 'badge-success' : 'badge-gray'}">${trunk.status}</span>
      </div>
    </div>
  `).join('');
}

/**
 * Update trunk status
 */
function updateTrunkStatus(trunk, status) {
  const trunkCard = document.getElementById(`trunk-${trunk}`);

  if (!trunkCard) {
    loadLiveMonitoring();
    return;
  }

  const badge = trunkCard.querySelector('.badge');
  if (badge) {
    badge.className = `badge ${status === 'Registered' ? 'badge-success' : 'badge-gray'}`;
    badge.textContent = status;
  }
}

/**
 * Render active calls
 */
function renderActiveCalls(calls) {
  const container = document.getElementById('activeCallsList');
  if (!container) return;

  if (calls.length === 0) {
    container.innerHTML = '<div class="text-gray-500 text-center py-8">No active calls</div>';
    return;
  }

  container.innerHTML = calls.map(call => `
    <div class="bg-dark-700/50 rounded-lg p-4 border border-dark-600">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm font-medium">${call.from} → ${call.to}</span>
        <span class="badge badge-warning">${call.state}</span>
      </div>
      <div class="text-xs text-gray-400">
        Trunk: ${call.trunk} | Call ID: ${call.callId}
      </div>
    </div>
  `).join('');
}

/**
 * Update call status
 */
function updateCallStatus(data) {
  // Reload active calls
  loadLiveMonitoring();
}

/**
 * Show inbound call popup with countdown
 */
function showInboundCallPopup(data) {
  const { callId, from, to, trunk, expiresAt } = data;

  // Create popup if it doesn't exist
  let popup = document.getElementById('inboundCallPopup');
  if (!popup) {
    popup = document.createElement('div');
    popup.id = 'inboundCallPopup';
    popup.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4';
    document.body.appendChild(popup);
  }

  const remainingMs = expiresAt - Date.now();
  const remainingSeconds = Math.ceil(remainingMs / 1000);

  popup.innerHTML = `
    <div class="bg-gradient-to-br from-warning/20 to-danger/20 border-2 border-warning rounded-2xl shadow-2xl max-w-md w-full p-8 animate-slideIn">
      <div class="text-center mb-6">
        <div class="w-20 h-20 bg-warning rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
          <svg class="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"></path>
          </svg>
        </div>
        <h2 class="text-2xl font-bold text-white mb-2">Inbound Call</h2>
        <div class="text-4xl font-bold text-warning mb-2">${from}</div>
        <div class="text-gray-300">→ ${to}</div>
        <div class="text-sm text-gray-400 mt-2">via ${trunk}</div>
      </div>
      
      <div class="bg-dark-800/50 rounded-lg p-4 mb-6">
        <div class="text-center">
          <div class="text-sm text-gray-400 mb-2">Time remaining</div>
          <div id="countdown-${callId}" class="text-5xl font-bold text-warning countdown-timer">${remainingSeconds}</div>
          <div class="text-xs text-gray-500 mt-1">seconds</div>
        </div>
      </div>
      
      <div class="grid grid-cols-2 gap-4">
        <button onclick="acceptInboundCall('${callId}')" 
                class="bg-success hover:bg-green-600 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg">
          <svg class="w-6 h-6 mx-auto mb-1" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"></path>
          </svg>
          Accept
        </button>
        <button onclick="refuseInboundCall('${callId}')" 
                class="bg-danger hover:bg-red-600 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg">
          <svg class="w-6 h-6 mx-auto mb-1" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"></path>
          </svg>
          Refuse
        </button>
      </div>
    </div>
  `;

  popup.classList.remove('hidden');

  // Start countdown timer
  startCountdownTimer(callId, remainingSeconds);
}

/**
 * Start countdown timer for inbound call
 */
function startCountdownTimer(callId, seconds) {
  let remaining = seconds;
  const countdownEl = document.getElementById(`countdown-${callId}`);

  // Clear existing timer if any
  if (inboundCallTimers.has(callId)) {
    clearInterval(inboundCallTimers.get(callId));
  }

  const timer = setInterval(() => {
    remaining--;

    if (countdownEl) {
      countdownEl.textContent = remaining;

      // Change color as time runs out
      if (remaining <= 3) {
        countdownEl.classList.add('text-danger', 'animate-pulse');
      }
    }

    if (remaining <= 0) {
      clearInterval(timer);
      inboundCallTimers.delete(callId);

      // Auto-refuse
      refuseInboundCall(callId, true);
    }
  }, 1000);

  inboundCallTimers.set(callId, timer);
}

/**
 * Accept inbound call
 */
async function acceptInboundCall(callId) {
  // Get PBX ID (assuming first PBX for now - in production, determine from call data)
  const pbxInstances = await fetch(`${API_BASE}/pbx`).then(r => r.json());
  if (!pbxInstances.success || pbxInstances.data.length === 0) {
    showToast('No PBX configured', 'error');
    return;
  }

  const pbxId = pbxInstances.data[0].id;

  try {
    const response = await fetch(`${API_BASE}/call/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pbxId, callId })
    });

    const data = await response.json();

    if (data.success) {
      showToast('Call accepted', 'success');
      closeInboundCallPopup(callId);
    } else {
      showToast(`Failed to accept call: ${data.error}`, 'error');
    }
  } catch (error) {
    showToast('Network error', 'error');
  }
}

/**
 * Refuse inbound call
 */
async function refuseInboundCall(callId, isTimeout = false) {
  // Get PBX ID
  const pbxInstances = await fetch(`${API_BASE}/pbx`).then(r => r.json());
  if (!pbxInstances.success || pbxInstances.data.length === 0) {
    showToast('No PBX configured', 'error');
    return;
  }

  const pbxId = pbxInstances.data[0].id;

  try {
    const response = await fetch(`${API_BASE}/call/refuse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pbxId, callId })
    });

    const data = await response.json();

    if (data.success) {
      showToast(isTimeout ? 'Call timed out - auto-refused' : 'Call refused', isTimeout ? 'warning' : 'info');
      closeInboundCallPopup(callId);
    } else {
      showToast(`Failed to refuse call: ${data.error}`, 'error');
    }
  } catch (error) {
    showToast('Network error', 'error');
  }
}

/**
 * Close inbound call popup
 */
function closeInboundCallPopup(callId) {
  // Clear timer
  if (inboundCallTimers.has(callId)) {
    clearInterval(inboundCallTimers.get(callId));
    inboundCallTimers.delete(callId);
  }

  const popup = document.getElementById('inboundCallPopup');
  if (popup) {
    popup.classList.add('hidden');
  }
}

// Make functions globally available
window.acceptInboundCall = acceptInboundCall;
window.refuseInboundCall = refuseInboundCall;

/**
 * Load dashboard data (existing function - keeping for PBX management)
 */
async function loadDashboard() {
  try {
    const [pbxResponse, statusResponse] = await Promise.all([
      fetch(`${API_BASE}/pbx`),
      fetch(`${API_BASE}/dashboard/status`)
    ]);

    const pbxData = await pbxResponse.json();
    const statusData = await statusResponse.json();

    if (pbxData.success && statusData.success) {
      renderDashboard(statusData.data);
      updateLastRefreshTime();
    } else {
      showToast('Failed to load dashboard data', 'error');
    }
  } catch (error) {
    console.error('Error loading dashboard:', error);
    showToast('Error connecting to server', 'error');
  }
}

/**
 * Render dashboard with PBX status data
 */
function renderDashboard(statuses) {
  const pbxGrid = document.getElementById('pbxGrid');
  const emptyState = document.getElementById('emptyState');
  const statsOverview = document.getElementById('statsOverview');

  if (statuses.length === 0) {
    if (pbxGrid) pbxGrid.classList.add('hidden');
    if (emptyState) emptyState.classList.remove('hidden');
    if (statsOverview) statsOverview.innerHTML = '';
    return;
  }

  if (pbxGrid) pbxGrid.classList.remove('hidden');
  if (emptyState) emptyState.classList.add('hidden');

  // Calculate overall stats
  const stats = calculateStats(statuses);
  renderStatsOverview(stats);

  // Render PBX cards
  if (pbxGrid) {
    pbxGrid.innerHTML = statuses.map(pbx => createPBXCard(pbx)).join('');
  }
}

/**
 * Calculate overall statistics
 */
function calculateStats(statuses) {
  return {
    totalInstances: statuses.length,
    healthyInstances: statuses.filter(s => s.status === 'healthy').length,
    totalTrunks: statuses.reduce((sum, s) => sum + (s.trunks?.total || 0), 0),
    onlineTrunks: statuses.reduce((sum, s) => sum + (s.trunks?.online || 0), 0),
    totalExtensions: statuses.reduce((sum, s) => sum + (s.extensions?.total || 0), 0),
    registeredExtensions: statuses.reduce((sum, s) => sum + (s.extensions?.registered || 0), 0),
    activeCalls: statuses.reduce((sum, s) => sum + (s.calls?.active || 0), 0)
  };
}

/**
 * Render stats overview cards
 */
function renderStatsOverview(stats) {
  const statsOverview = document.getElementById('statsOverview');
  if (!statsOverview) return;

  statsOverview.innerHTML = `
    <div class="stat-card rounded-xl p-6 card-hover">
      <div class="flex items-center justify-between mb-2">
        <span class="text-gray-400 text-sm font-medium">PBX Instances</span>
        <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"></path>
        </svg>
      </div>
      <div class="metric">${stats.totalInstances}</div>
      <div class="text-xs text-gray-500 mt-1">${stats.healthyInstances} healthy</div>
    </div>

    <div class="stat-card rounded-xl p-6 card-hover">
      <div class="flex items-center justify-between mb-2">
        <span class="text-gray-400 text-sm font-medium">Trunks Online</span>
        <svg class="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
      </div>
      <div class="metric">${stats.onlineTrunks}/${stats.totalTrunks}</div>
      <div class="progress-bar mt-2">
        <div class="progress-fill" style="width: ${stats.totalTrunks > 0 ? (stats.onlineTrunks / stats.totalTrunks * 100) : 0}%"></div>
      </div>
    </div>

    <div class="stat-card rounded-xl p-6 card-hover">
      <div class="flex items-center justify-between mb-2">
        <span class="text-gray-400 text-sm font-medium">Extensions</span>
        <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
        </svg>
      </div>
      <div class="metric">${stats.registeredExtensions}/${stats.totalExtensions}</div>
      <div class="text-xs text-gray-500 mt-1">Registered</div>
    </div>

    <div class="stat-card rounded-xl p-6 card-hover">
      <div class="flex items-center justify-between mb-2">
        <span class="text-gray-400 text-sm font-medium">Active Calls</span>
        <svg class="w-5 h-5 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
        </svg>
      </div>
      <div class="metric">${stats.activeCalls}</div>
      <div class="text-xs text-gray-500 mt-1">Concurrent</div>
    </div>
  `;
}

/**
 * Create a PBX status card
 */
function createPBXCard(pbx) {
  const statusClass = `status-${pbx.status}`;
  const statusIcon = getStatusIcon(pbx.status);
  const statusText = pbx.status.charAt(0).toUpperCase() + pbx.status.slice(1);

  return `
    <div class="pbx-card bg-dark-800 rounded-xl border border-dark-700 overflow-hidden card-hover">
      <!-- Header with status indicator -->
      <div class="${statusClass} p-4 flex items-center justify-between">
        <div class="flex items-center space-x-3">
          ${statusIcon}
          <div>
            <h3 class="font-semibold text-lg">${escapeHtml(pbx.name)}</h3>
            <p class="text-xs opacity-90">${new URL(pbx.url).hostname}</p>
          </div>
        </div>
        <div class="flex space-x-2">
          <button onclick="editPBX(${pbx.id})" class="p-2 hover:bg-white/10 rounded-lg transition-colors" title="Edit">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
            </svg>
          </button>
          <button onclick="deletePBX(${pbx.id}, '${escapeHtml(pbx.name)}')" class="p-2 hover:bg-white/10 rounded-lg transition-colors" title="Delete">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
          </button>
        </div>
      </div>

      <!-- Status details -->
      <div class="p-4 space-y-3">
        ${pbx.issues && pbx.issues.length > 0 ? `
          <div class="bg-danger/10 border border-danger/30 rounded-lg p-3">
            <div class="flex items-start space-x-2">
              <svg class="w-4 h-4 text-danger mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
              </svg>
              <div class="text-xs text-danger">
                ${pbx.issues.map(issue => `<div>${escapeHtml(issue)}</div>`).join('')}
              </div>
            </div>
          </div>
        ` : ''}

        <!-- Metrics -->
        <div class="grid grid-cols-2 gap-3">
          <div class="bg-dark-700/50 rounded-lg p-3">
            <div class="text-xs text-gray-400 mb-1">Trunks</div>
            <div class="flex items-baseline space-x-1">
              <span class="text-lg font-semibold">${pbx.trunks?.online || 0}</span>
              <span class="text-xs text-gray-500">/ ${pbx.trunks?.total || 0}</span>
            </div>
            ${pbx.trunks?.offline > 0 ? `<span class="badge badge-danger mt-1">${pbx.trunks.offline} offline</span>` : `<span class="badge badge-success mt-1">All online</span>`}
          </div>

          <div class="bg-dark-700/50 rounded-lg p-3">
            <div class="text-xs text-gray-400 mb-1">Extensions</div>
            <div class="flex items-baseline space-x-1">
              <span class="text-lg font-semibold">${pbx.extensions?.registered || 0}</span>
              <span class="text-xs text-gray-500">/ ${pbx.extensions?.total || 0}</span>
            </div>
            <span class="badge badge-gray mt-1">Registered</span>
          </div>
        </div>

        <div class="bg-dark-700/50 rounded-lg p-3">
          <div class="flex items-center justify-between">
            <span class="text-xs text-gray-400">Active Calls</span>
            <span class="text-xl font-semibold text-warning">${pbx.calls?.active || 0}</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Get status icon based on health status
 */
function getStatusIcon(status) {
  const icons = {
    healthy: '<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>',
    warning: '<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>',
    critical: '<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path></svg>',
    error: '<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path></svg>'
  };
  return icons[status] || icons.error;
}

/**
 * Setup auto-refresh
 */
function setupAutoRefresh() {
  // Refresh every 30 seconds
  refreshInterval = setInterval(() => {
    loadDashboard();
  }, 30000);
}

/**
 * Manual refresh
 */
function refreshDashboard() {
  loadDashboard();
  loadLiveMonitoring();
  showToast('Dashboard refreshed', 'success');
}

/**
 * Update last refresh time
 */
function updateLastRefreshTime() {
  const updateTimeEl = document.getElementById('updateTime');
  if (updateTimeEl) {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    updateTimeEl.textContent = timeString;
  }
}

/**
 * Setup form handler
 */
function setupFormHandler() {
  const form = document.getElementById('pbxForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await savePBX();
    });
  }
}

/**
 * Open add modal
 */
function openAddModal() {
  const modalTitle = document.getElementById('modalTitle');
  const form = document.getElementById('pbxForm');
  const pbxId = document.getElementById('pbxId');
  const formError = document.getElementById('formError');
  const modal = document.getElementById('pbxModal');

  if (modalTitle) modalTitle.textContent = 'Add PBX Instance';
  if (form) form.reset();
  if (pbxId) pbxId.value = '';
  if (formError) formError.classList.add('hidden');
  if (modal) modal.classList.remove('hidden');
}

/**
 * Edit PBX
 */
async function editPBX(id) {
  try {
    const response = await fetch(`${API_BASE}/pbx/${id}`);
    const data = await response.json();

    if (data.success) {
      document.getElementById('modalTitle').textContent = 'Edit PBX Instance';
      document.getElementById('pbxId').value = data.data.id;
      document.getElementById('pbxName').value = data.data.name;
      document.getElementById('pbxUrl').value = data.data.url;
      document.getElementById('formError').classList.add('hidden');

      // Note: We don't populate credentials for security
      document.getElementById('clientId').value = '';
      document.getElementById('clientSecret').value = '';
      document.getElementById('clientId').placeholder = 'Enter to update (leave blank to keep current)';
      document.getElementById('clientSecret').placeholder = 'Enter to update (leave blank to keep current)';

      document.getElementById('pbxModal').classList.remove('hidden');
    }
  } catch (error) {
    showToast('Failed to load PBX details', 'error');
  }
}

/**
 * Save PBX (add or update)
 */
async function savePBX() {
  const id = document.getElementById('pbxId').value;
  const name = document.getElementById('pbxName').value;
  const url = document.getElementById('pbxUrl').value;
  const clientId = document.getElementById('clientId').value;
  const clientSecret = document.getElementById('clientSecret').value;

  // For edit mode, allow empty credentials (keep existing)
  if (id && (!clientId || !clientSecret)) {
    showFormError('Please enter credentials to update them');
    return;
  }

  const method = id ? 'PUT' : 'POST';
  const endpoint = id ? `${API_BASE}/pbx/${id}` : `${API_BASE}/pbx`;

  try {
    const response = await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, url, clientId, clientSecret })
    });

    const data = await response.json();

    if (data.success) {
      closeModal();
      loadDashboard();
      showToast(id ? 'PBX updated successfully' : 'PBX added successfully', 'success');
    } else {
      showFormError(data.error || 'Failed to save PBX');
    }
  } catch (error) {
    showFormError('Network error. Please try again.');
  }
}

/**
 * Delete PBX
 */
async function deletePBX(id, name) {
  if (!confirm(`Are you sure you want to delete "${name}"?`)) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/pbx/${id}`, {
      method: 'DELETE'
    });

    const data = await response.json();

    if (data.success) {
      loadDashboard();
      showToast('PBX deleted successfully', 'success');
    } else {
      showToast('Failed to delete PBX', 'error');
    }
  } catch (error) {
    showToast('Network error. Please try again.', 'error');
  }
}

/**
 * Close modal
 */
function closeModal() {
  const modal = document.getElementById('pbxModal');
  const form = document.getElementById('pbxForm');

  if (modal) modal.classList.add('hidden');
  if (form) form.reset();
}

/**
 * Show form error
 */
function showFormError(message) {
  const errorDiv = document.getElementById('formError');
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
  }
}

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toastMessage');
  const toastIcon = document.getElementById('toastIcon');

  if (!toast || !toastMessage || !toastIcon) return;

  const icons = {
    success: '<svg class="w-5 h-5 text-success" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>',
    error: '<svg class="w-5 h-5 text-danger" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path></svg>',
    warning: '<svg class="w-5 h-5 text-warning" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>',
    info: '<svg class="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path></svg>'
  };

  toastIcon.innerHTML = icons[type] || icons.info;
  toastMessage.textContent = message;
  toast.classList.remove('hidden');

  setTimeout(() => {
    toast.classList.add('hidden');
  }, 3000);
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Close modal on escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeModal();
  }
});

// Make functions globally available
window.openAddModal = openAddModal;
window.editPBX = editPBX;
window.deletePBX = deletePBX;
window.refreshDashboard = refreshDashboard;
window.closeModal = closeModal;
