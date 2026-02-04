'use client'

/**
 * Theme Toggle Component
 * 
 * Allows users to switch between light and dark mode.
 * Uses next-themes for theme management.
 */

import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start"
      >
        <Sun className="h-4 w-4 mr-3" />
        <span>Motyw</span>
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="w-full justify-start"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      {theme === 'dark' ? (
        <Sun className="h-4 w-4 mr-3" />
      ) : (
        <Moon className="h-4 w-4 mr-3" />
      )}
      <span>Motyw: {theme === 'dark' ? 'Ciemny' : 'Jasny'}</span>
    </Button>
  )
}
