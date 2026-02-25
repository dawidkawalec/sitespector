'use client'

import { useEffect, useState } from 'react'
import { supabase } from './supabase'

interface AdminState {
  isSuperAdmin: boolean
  isLoading: boolean
  userId: string | null
}

/**
 * Hook that checks whether the currently signed-in user has the
 * is_super_admin flag set in the Supabase profiles table.
 *
 * Returns { isSuperAdmin, isLoading, userId }.
 * The result is cached for the lifetime of the component tree.
 */
export function useAdmin(): AdminState {
  const [state, setState] = useState<AdminState>({
    isSuperAdmin: false,
    isLoading: true,
    userId: null,
  })

  useEffect(() => {
    let cancelled = false

    async function check() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          if (!cancelled) setState({ isSuperAdmin: false, isLoading: false, userId: null })
          return
        }

        const { data } = await supabase
          .from('profiles')
          .select('is_super_admin')
          .eq('id', user.id)
          .single()

        if (!cancelled) {
          setState({
            isSuperAdmin: data?.is_super_admin === true,
            isLoading: false,
            userId: user.id,
          })
        }
      } catch {
        if (!cancelled) setState({ isSuperAdmin: false, isLoading: false, userId: null })
      }
    }

    check()
    return () => {
      cancelled = true
    }
  }, [])

  return state
}
