'use client'

/**
 * Workspace Context Provider
 * 
 * Manages workspace state across the application:
 * - Fetches user's workspaces from Supabase
 * - Tracks current active workspace
 * - Provides workspace switching functionality
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from './supabase'

export interface Workspace {
  id: string
  name: string
  slug: string
  type: 'personal' | 'team'
  owner_id: string
  role: 'owner' | 'admin' | 'member'
}

interface WorkspaceContextType {
  workspaces: Workspace[]
  currentWorkspace: Workspace | null
  switchWorkspace: (workspaceId: string) => void
  refreshWorkspaces: () => Promise<void>
  isLoading: boolean
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined)

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchWorkspaces = async () => {
    setIsLoading(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setWorkspaces([])
        setCurrentWorkspace(null)
        setIsLoading(false)
        return
      }

      // Fetch workspaces where user is a member
      const { data: members, error } = await supabase
        .from('workspace_members')
        .select(`
          workspace_id,
          role,
          workspaces (
            id,
            name,
            slug,
            type,
            owner_id
          )
        `)
        .eq('user_id', user.id)

      if (error) {
        console.error('Error fetching workspaces:', error)
        setIsLoading(false)
        return
      }

      // Transform data
      const workspaceList: Workspace[] = (members || []).map((m: any) => ({
        id: m.workspaces.id,
        name: m.workspaces.name,
        slug: m.workspaces.slug,
        type: m.workspaces.type,
        owner_id: m.workspaces.owner_id,
        role: m.role
      }))

      setWorkspaces(workspaceList)

      // Set current workspace from localStorage or default to first
      const savedWorkspaceId = localStorage.getItem('currentWorkspaceId')
      const workspace = workspaceList.find(w => w.id === savedWorkspaceId) || workspaceList[0]
      setCurrentWorkspace(workspace || null)

    } catch (error) {
      console.error('Error fetching workspaces:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const switchWorkspace = (workspaceId: string) => {
    const workspace = workspaces.find(w => w.id === workspaceId)
    if (workspace) {
      setCurrentWorkspace(workspace)
      localStorage.setItem('currentWorkspaceId', workspaceId)
      
      // Trigger a full page refresh to reload data for new workspace
      window.location.reload()
    }
  }

  useEffect(() => {
    // Fetch workspaces on mount
    fetchWorkspaces()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, _session) => {
      if (event === 'SIGNED_IN') {
        fetchWorkspaces()
      } else if (event === 'SIGNED_OUT') {
        setWorkspaces([])
        setCurrentWorkspace(null)
        localStorage.removeItem('currentWorkspaceId')
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        currentWorkspace,
        switchWorkspace,
        refreshWorkspaces: fetchWorkspaces,
        isLoading
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  )
}

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext)
  if (!context) {
    throw new Error('useWorkspace must be used within WorkspaceProvider')
  }
  return context
}
