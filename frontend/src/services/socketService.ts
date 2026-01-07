import { io, Socket } from 'socket.io-client'

class SocketService {
  private socket: Socket | null = null
  private listeners: Map<string, Function[]> = new Map()

  connect(): void {
    if (this.socket?.connected) return

    this.socket = io('/', {
      transports: ['websocket', 'polling'],
      timeout: 20000,
    })

    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket?.id)
    })

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason)
    })

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error)
    })

    // Re-register all listeners
    this.listeners.forEach((callbacks, event) => {
      callbacks.forEach(callback => {
        this.socket?.on(event, callback)
      })
    })
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  on(event: string, callback: (...args: any[]) => void): void {
    // Store the listener for re-registration on reconnect
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)?.push(callback)

    // Register with socket if connected
    if (this.socket) {
      this.socket.on(event, callback as any)
    }
  }

  off(event: string, callback?: (...args: any[]) => void): void {
    if (callback) {
      const callbacks = this.listeners.get(event)
      if (callbacks) {
        const index = callbacks.indexOf(callback)
        if (index > -1) {
          callbacks.splice(index, 1)
        }
      }
    } else {
      this.listeners.delete(event)
    }

    if (this.socket) {
      this.socket.off(event, callback as any)
    }
  }

  emit(event: string, data?: any): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data)
    }
  }

  get connected(): boolean {
    return this.socket?.connected ?? false
  }
}

export const socketService = new SocketService()