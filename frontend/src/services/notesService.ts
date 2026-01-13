export interface TechNote {
  id: string
  content: string
  author: string
  timestamp: string
  priority: 'low' | 'medium' | 'high'
  updatedAt?: string
}

export interface NoteWithPBX extends TechNote {
  pbxId: string
  pbxName: string
}

class NotesService {
  private baseUrl = '/api/notes'

  async getAllNotes(): Promise<NoteWithPBX[]> {
    try {
      const response = await fetch(this.baseUrl)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      console.error('Failed to fetch notes:', error)
      throw error
    }
  }

  async getNotesByPBX(pbxId: string): Promise<TechNote[]> {
    try {
      const response = await fetch(`${this.baseUrl}/pbx/${pbxId}`)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      console.error('Failed to fetch PBX notes:', error)
      throw error
    }
  }

  async createNote(pbxId: string, noteData: {
    content: string
    author: string
    priority: 'low' | 'medium' | 'high'
  }): Promise<TechNote> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pbxId,
          ...noteData
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || `HTTP ${response.status}`)
      }

      const result = await response.json()
      return result.note
    } catch (error) {
      console.error('Failed to create note:', error)
      throw error
    }
  }

  async updateNote(noteId: string, pbxId: string, content: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${noteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pbxId,
          content
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || `HTTP ${response.status}`)
      }
    } catch (error) {
      console.error('Failed to update note:', error)
      throw error
    }
  }

  async deleteNote(noteId: string, pbxId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${noteId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pbxId
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || `HTTP ${response.status}`)
      }
    } catch (error) {
      console.error('Failed to delete note:', error)
      throw error
    }
  }
}

export const notesService = new NotesService()