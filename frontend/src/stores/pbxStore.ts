import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { notesService, type TechNote } from '../services/notesService'

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

      addNote: async (pbxId, noteData) => {
        try {
          const newNote = await notesService.createNote(pbxId, noteData)
          
          set((state) => ({
            pbxInstances: state.pbxInstances.map(pbx => 
              pbx.id === pbxId 
                ? {
                    ...pbx,
                    notes: [...(pbx.notes || []), newNote]
                  }
                : pbx
            )
          }))
        } catch (error) {
          console.error('Failed to add note:', error)
          throw error
        }
      },

      updateNote: async (pbxId, noteId, content) => {
        try {
          await notesService.updateNote(noteId, pbxId, content)
          
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
        } catch (error) {
          console.error('Failed to update note:', error)
          throw error
        }
      },

      deleteNote: async (pbxId, noteId) => {
        try {
          await notesService.deleteNote(noteId, pbxId)
          
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
        } catch (error) {
          console.error('Failed to delete note:', error)
          throw error
        }
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