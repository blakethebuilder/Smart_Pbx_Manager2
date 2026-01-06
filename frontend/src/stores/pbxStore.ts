import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface PBXInstance {
  id: string
  name: string
  url: string
  appId: string
  appSecret: string
  status: 'healthy' | 'error' | 'unknown'
  lastCheck: string | null
  health?: {
    status: string
    connected: boolean
    systemInfo?: {
      extensions: number
      activeCalls: number
      uptime: string
      version: string
    }
    error?: string
    apiType?: string
  }
  isShared?: boolean
  tags?: string[]
  notes?: TechNote[]
}

export interface TechNote {
  id: string
  content: string
  author: string
  timestamp: Date
  priority: 'low' | 'medium' | 'high'
}

interface PBXState {
  pbxInstances: PBXInstance[]
  selectedPBX: PBXInstance | null
  favorites: string[]
  recentlyAccessed: string[]
  searchQuery: string
  
  // Actions
  setPBXInstances: (instances: PBXInstance[]) => void
  selectPBX: (pbx: PBXInstance | null) => void
  addToFavorites: (pbxId: string) => void
  removeFromFavorites: (pbxId: string) => void
  addToRecentlyAccessed: (pbxId: string) => void
  setSearchQuery: (query: string) => void
  addNote: (pbxId: string, note: Omit<TechNote, 'id' | 'timestamp'>) => void
  updateNote: (pbxId: string, noteId: string, content: string) => void
  deleteNote: (pbxId: string, noteId: string) => void
  addTag: (pbxId: string, tag: string) => void
  removeTag: (pbxId: string, tag: string) => void
}

export const usePBXStore = create<PBXState>()(
  persist(
    (set, get) => ({
      pbxInstances: [],
      selectedPBX: null,
      favorites: [],
      recentlyAccessed: [],
      searchQuery: '',

      setPBXInstances: (instances) => {
        set({ pbxInstances: instances })
      },

      selectPBX: (pbx) => {
        set({ selectedPBX: pbx })
        if (pbx) {
          get().addToRecentlyAccessed(pbx.id)
        }
      },

      addToFavorites: (pbxId) => {
        set((state) => ({
          favorites: [...new Set([...state.favorites, pbxId])]
        }))
      },

      removeFromFavorites: (pbxId) => {
        set((state) => ({
          favorites: state.favorites.filter(id => id !== pbxId)
        }))
      },

      addToRecentlyAccessed: (pbxId) => {
        set((state) => {
          const recent = [pbxId, ...state.recentlyAccessed.filter(id => id !== pbxId)]
          return {
            recentlyAccessed: recent.slice(0, 10) // Keep only last 10
          }
        })
      },

      setSearchQuery: (query) => {
        set({ searchQuery: query })
      },

      addNote: (pbxId, noteData) => {
        set((state) => ({
          pbxInstances: state.pbxInstances.map(pbx => 
            pbx.id === pbxId 
              ? {
                  ...pbx,
                  notes: [
                    ...(pbx.notes || []),
                    {
                      ...noteData,
                      id: Date.now().toString(),
                      timestamp: new Date(),
                    }
                  ]
                }
              : pbx
          )
        }))
      },

      updateNote: (pbxId, noteId, content) => {
        set((state) => ({
          pbxInstances: state.pbxInstances.map(pbx => 
            pbx.id === pbxId 
              ? {
                  ...pbx,
                  notes: pbx.notes?.map(note => 
                    note.id === noteId 
                      ? { ...note, content }
                      : note
                  )
                }
              : pbx
          )
        }))
      },

      deleteNote: (pbxId, noteId) => {
        set((state) => ({
          pbxInstances: state.pbxInstances.map(pbx => 
            pbx.id === pbxId 
              ? {
                  ...pbx,
                  notes: pbx.notes?.filter(note => note.id !== noteId)
                }
              : pbx
          )
        }))
      },

      addTag: (pbxId, tag) => {
        set((state) => ({
          pbxInstances: state.pbxInstances.map(pbx => 
            pbx.id === pbxId 
              ? {
                  ...pbx,
                  tags: [...new Set([...(pbx.tags || []), tag])]
                }
              : pbx
          )
        }))
      },

      removeTag: (pbxId, tag) => {
        set((state) => ({
          pbxInstances: state.pbxInstances.map(pbx => 
            pbx.id === pbxId 
              ? {
                  ...pbx,
                  tags: pbx.tags?.filter(t => t !== tag)
                }
              : pbx
          )
        }))
      },
    }),
    {
      name: 'pbx-storage',
      partialize: (state) => ({
        favorites: state.favorites,
        recentlyAccessed: state.recentlyAccessed,
      }),
    }
  )
)