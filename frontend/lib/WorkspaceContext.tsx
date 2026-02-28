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
  error: string | null
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined)

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchWorkspaces = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setWorkspaces([])
        setCurrentWorkspace(null)
        setIsLoading(false)
        return
      }

      // Step 1: Get workspace_members for this user
      const { data: members, error: membersError } = await supabase
        .from('workspace_members')
        .select('workspace_id, role')
        .eq('user_id', user.id)

      if (membersError) {
        console.error('Error fetching workspace members:', membersError)
        setError(membersError.message || 'Failed to fetch workspace memberships')
        setIsLoading(false)
        return
      }

      if (!members || members.length === 0) {
        console.warn('⚠️ No workspace memberships found for user:', user.id)
        
        // Try to create a personal workspace as fallback
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single()
        
        const fullName = profile?.full_name || user.email?.split('@')[0] || 'User'
        const slug = `${fullName.toLowerCase().replace(/\s+/g, '-')}-${user.id.substring(0, 8)}`
        
        const { data: newWorkspace, error: createError } = await supabase
          .from('workspaces')
          .insert({
            name: `${fullName}'s Workspace`,
            slug,
            type: 'personal',
            owner_id: user.id
          })
          .select()
          .single()
        
        if (createError) {
          console.error('Failed to create workspace:', createError)
          setError('No workspace found and failed to create one. Please contact support.')
          setWorkspaces([])
          setCurrentWorkspace(null)
          setIsLoading(false)
          return
        }
        
        // Add user as owner
        await supabase.from('workspace_members').insert({
          workspace_id: newWorkspace.id,
          user_id: user.id,
          role: 'owner'
        })
        
        // Create free subscription
        await supabase.from('subscriptions').insert({
          workspace_id: newWorkspace.id,
          plan: 'free',
          status: 'active',
          audit_limit: 5,
          audits_used_this_month: 0
        })
        
        // Retry fetching workspaces
        await fetchWorkspaces()
        return
      }

      // Step 2: Get workspace details for each membership
      const workspaceIds = members.map(m => m.workspace_id)
      const { data: workspaces, error: workspacesError } = await supabase
        .from('workspaces')
        .select('id, name, slug, type, owner_id')
        .in('id', workspaceIds)

      if (workspacesError) {
        console.error('Error fetching workspaces:', workspacesError)
        setError(workspacesError.message || 'Failed to fetch workspaces')
        setIsLoading(false)
        return
      }

      if (!workspaces || workspaces.length === 0) {
        console.error('❌ No workspaces found for IDs:', workspaceIds)
        setError('Workspace memberships exist but workspace records not found')
        setWorkspaces([])
        setCurrentWorkspace(null)
        setIsLoading(false)
        return
      }

      // Step 3: Combine data
      const workspaceList: Workspace[] = workspaces.map((ws: any) => {
        const member = members.find(m => m.workspace_id === ws.id)
        return {
          id: ws.id,
          name: ws.name,
          slug: ws.slug,
          type: ws.type,
          owner_id: ws.owner_id,
          role: member?.role || 'member'
        }
      })

      setWorkspaces(workspaceList)

      // Set current workspace from localStorage or default to first
      const savedWorkspaceId = localStorage.getItem('currentWorkspaceId')
      const workspace = workspaceList.find(w => w.id === savedWorkspaceId) || workspaceList[0]
      setCurrentWorkspace(workspace || null)

    } catch (error: any) {
      console.error('❌ Unexpected error fetching workspaces:', error)
      setError(error.message || 'An unexpected error occurred')
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
        isLoading,
        error
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
