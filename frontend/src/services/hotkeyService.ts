export class HotkeyService {
  private listeners: Map<string, () => void> = new Map()

  constructor() {
    this.setupGlobalListener()
  }

  private setupGlobalListener() {
    document.addEventListener('keydown', (event) => {
      // Don't trigger hotkeys when typing in inputs
      if (event.target instanceof HTMLInputElement || 
          event.target instanceof HTMLTextAreaElement ||
          event.target instanceof HTMLSelectElement) {
        return
      }

      const key = this.getKeyString(event)
      const handler = this.listeners.get(key)
      
      if (handler) {
        event.preventDefault()
        handler()
      }
    })
  }

  private getKeyString(event: KeyboardEvent): string {
    const parts: string[] = []
    
    if (event.ctrlKey) parts.push('ctrl')
    if (event.metaKey) parts.push('cmd')
    if (event.altKey) parts.push('alt')
    if (event.shiftKey) parts.push('shift')
    
    parts.push(event.key.toLowerCase())
    
    return parts.join('+')
  }

  register(hotkey: string, handler: () => void) {
    this.listeners.set(hotkey.toLowerCase(), handler)
  }

  unregister(hotkey: string) {
    this.listeners.delete(hotkey.toLowerCase())
  }

  clear() {
    this.listeners.clear()
  }
}

export const hotkeyService = new HotkeyService()