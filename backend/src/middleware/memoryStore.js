/**
 * Simple in-memory session store
 * Ensures sessions persist properly
 */

class MemorySessionStore {
    constructor() {
        this.sessions = new Map();
        console.log('🗄️ Memory session store initialized');
    }

    get(sessionId, callback) {
        const session = this.sessions.get(sessionId);
        console.log(`📖 Session GET: ${sessionId} -> ${session ? 'found' : 'not found'}`);
        callback(null, session);
    }

    set(sessionId, session, callback) {
        this.sessions.set(sessionId, session);
        console.log(`💾 Session SET: ${sessionId} -> authenticated: ${session.authenticated}`);
        callback(null);
    }

    destroy(sessionId, callback) {
        const existed = this.sessions.delete(sessionId);
        console.log(`🗑️ Session DESTROY: ${sessionId} -> ${existed ? 'deleted' : 'not found'}`);
        callback(null);
    }

    length(callback) {
        callback(null, this.sessions.size);
    }

    clear(callback) {
        this.sessions.clear();
        console.log('🧹 All sessions cleared');
        callback(null);
    }

    touch(sessionId, session, callback) {
        if (this.sessions.has(sessionId)) {
            this.sessions.set(sessionId, session);
            console.log(`👆 Session TOUCH: ${sessionId}`);
        }
        callback(null);
    }
}

export default MemorySessionStore;