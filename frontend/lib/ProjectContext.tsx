'use client'

/**
 * Project Context Provider
 *
 * Manages project state within the current workspace:
 * - Fetches projects when workspace changes
 * - Tracks current active project (e.g. when viewing a project page)
 * - Provides refresh for project list
 */

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { useWorkspace } from './WorkspaceContext'
import { projectsAPI, type Project } from './api'

interface ProjectContextType {
  projects: Project[]
  currentProject: Project | null
  setCurrentProject: (project: Project | null) => void
  refreshProjects: () => Promise<void>
  isLoading: boolean
  error: string | null
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined)

export function ProjectProvider({ children }: { children: ReactNode }) {
  const { currentWorkspace } = useWorkspace()
  const [projects, setProjects] = useState<Project[]>([])
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchProjects = useCallback(async () => {
    if (!currentWorkspace?.id) {
      setProjects([])
      setCurrentProject(null)
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      const list = await projectsAPI.list(currentWorkspace.id)
      setProjects(list ?? [])
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to load projects'
      setError(message)
      setProjects([])
    } finally {
      setIsLoading(false)
    }
  }, [currentWorkspace?.id])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  return (
    <ProjectContext.Provider
      value={{
        projects,
        currentProject,
        setCurrentProject,
        refreshProjects: fetchProjects,
        isLoading,
        error,
      }}
    >
      {children}
    </ProjectContext.Provider>
  )
}

export function useProject() {
  const context = useContext(ProjectContext)
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider')
  }
  return context
}
