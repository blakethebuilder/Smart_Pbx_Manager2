/**
 * Webhook Event Handler
 * Processes events from Yeastar PBX webhooks
 */

// In-memory event storage
const extensionStates = new Map(); // extension -> {status, timestamp, callInfo}
const trunkStates = new Map();     // trunk -> {status, timestamp}
const activeCalls = new Map();     // callId -> {from, to, status, timestamp}
const pendingInboundCalls = new Map(); // callId -> {from, to, trunk, timestamp, timeout}

/**
 * Handle Event 30008: Extension Status Changed
 * Statuses: Ringing, Busy, Idle, Registered, Unregistered
 */
export function handleExtensionStatusChanged(event) {
    const { extension, status, call_id, caller_number, callee_number } = event;

    console.log(`📞 Extension ${extension} status changed to: ${status}`);

    extensionStates.set(extension, {
        status,
        timestamp: Date.now(),
        callInfo: call_id ? {
            callId: call_id,
            caller: caller_number,
            callee: callee_number
        } : null
    });

    return {
        type: 'extension_status',
        extension,
        status,
        callInfo: extensionStates.get(extension).callInfo
    };
}

/**
 * Handle Event 30010: Trunk Registration Changed
 * Statuses: Registered, Unregistered
 */
export function handleTrunkRegistrationChanged(event) {
    const { trunk, status } = event;

    console.log(`🔌 Trunk ${trunk} registration: ${status}`);

    trunkStates.set(trunk, {
        status,
        timestamp: Date.now(),
        type: 'registration'
    });

    return {
        type: 'trunk_registration',
        trunk,
        status
    };
}

/**
 * Handle Event 30011: Trunk Call State Changed
 * States: Ringing, Answered, Hungup
 */
export function handleTrunkCallStateChanged(event) {
    const { trunk, call_id, state, caller_number, callee_number } = event;

    console.log(`📡 Trunk ${trunk} call ${call_id} state: ${state}`);

    if (state === 'Hungup') {
        activeCalls.delete(call_id);
    } else {
        activeCalls.set(call_id, {
            trunk,
            state,
            from: caller_number,
            to: callee_number,
            timestamp: Date.now()
        });
    }

    return {
        type: 'trunk_call_state',
        trunk,
        callId: call_id,
        state,
        from: caller_number,
        to: callee_number
    };
}

/**
 * Handle Event 30016: Inbound Call Request
 * CRITICAL: Must respond within 10 seconds with accept or refuse
 */
export function handleInboundCallRequest(event) {
    const { call_id, caller_number, callee_number, trunk } = event;

    console.log(`🚨 INBOUND CALL: ${caller_number} → ${callee_number} via ${trunk}`);
    console.log(`⏱️  Call ID: ${call_id} - Must respond within 10 seconds!`);

    // Store pending call
    const callData = {
        callId: call_id,
        from: caller_number,
        to: callee_number,
        trunk,
        timestamp: Date.now(),
        expiresAt: Date.now() + 10000, // 10 seconds
        status: 'pending'
    };

    pendingInboundCalls.set(call_id, callData);

    // Auto-refuse after 10 seconds if no action taken
    setTimeout(() => {
        if (pendingInboundCalls.has(call_id)) {
            const call = pendingInboundCalls.get(call_id);
            if (call.status === 'pending') {
                console.log(`⏰ Call ${call_id} timed out - auto-refusing`);
                call.status = 'timeout';
                // The UI should handle the actual refuse API call
            }
        }
    }, 10000);

    return {
        type: 'inbound_call_request',
        callId: call_id,
        from: caller_number,
        to: callee_number,
        trunk,
        expiresAt: callData.expiresAt
    };
}

/**
 * Mark inbound call as accepted
 */
export function markCallAccepted(callId) {
    if (pendingInboundCalls.has(callId)) {
        const call = pendingInboundCalls.get(callId);
        call.status = 'accepted';
        console.log(`✅ Call ${callId} marked as accepted`);

        // Remove from pending after a delay
        setTimeout(() => {
            pendingInboundCalls.delete(callId);
        }, 5000);

        return true;
    }
    return false;
}

/**
 * Mark inbound call as refused
 */
export function markCallRefused(callId) {
    if (pendingInboundCalls.has(callId)) {
        const call = pendingInboundCalls.get(callId);
        call.status = 'refused';
        console.log(`❌ Call ${callId} marked as refused`);

        // Remove from pending
        pendingInboundCalls.delete(callId);
        return true;
    }
    return false;
}

/**
 * Get all extension states
 */
export function getAllExtensionStates() {
    return Array.from(extensionStates.entries()).map(([extension, data]) => ({
        extension,
        ...data
    }));
}

/**
 * Get all trunk states
 */
export function getAllTrunkStates() {
    return Array.from(trunkStates.entries()).map(([trunk, data]) => ({
        trunk,
        ...data
    }));
}

/**
 * Get all active calls
 */
export function getAllActiveCalls() {
    return Array.from(activeCalls.entries()).map(([callId, data]) => ({
        callId,
        ...data
    }));
}

/**
 * Get all pending inbound calls
 */
export function getPendingInboundCalls() {
    const now = Date.now();
    return Array.from(pendingInboundCalls.entries())
        .filter(([_, call]) => call.status === 'pending' && call.expiresAt > now)
        .map(([callId, data]) => ({
            callId,
            ...data,
            remainingSeconds: Math.ceil((data.expiresAt - now) / 1000)
        }));
}

/**
 * Process webhook event
 */
export function processWebhookEvent(event) {
    const eventType = event.event || event.type;

    switch (eventType) {
        case '30008':
        case 'ExtensionStatusChanged':
            return handleExtensionStatusChanged(event);

        case '30010':
        case 'TrunkRegistrationChanged':
            return handleTrunkRegistrationChanged(event);

        case '30011':
        case 'TrunkCallStateChanged':
            return handleTrunkCallStateChanged(event);

        case '30016':
        case 'InboundCallRequest':
            return handleInboundCallRequest(event);

        default:
            console.log(`Unknown event type: ${eventType}`);
            return null;
    }
}
