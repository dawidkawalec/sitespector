'use client'

/**
 * Appearance Settings Page
 * 
 * Theme selection: Light, Dark, System
 */

import { useTheme } from 'next-themes'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sun, Moon, Monitor } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function AppearancePage() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Appearance</h1>
        <p className="text-muted-foreground mt-1">
          Customize how SiteSpector looks to you
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Theme</CardTitle>
          <CardDescription>
            Choose your preferred color scheme
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <Button
              variant={theme === 'light' ? 'default' : 'outline'}
              onClick={() => setTheme('light')}
              className="h-24 flex-col gap-2"
            >
              <Sun className="h-6 w-6" />
              <span>Light</span>
            </Button>
            
            <Button
              variant={theme === 'dark' ? 'default' : 'outline'}
              onClick={() => setTheme('dark')}
              className="h-24 flex-col gap-2"
            >
              <Moon className="h-6 w-6" />
              <span>Dark</span>
            </Button>
            
            <Button
              variant={theme === 'system' ? 'default' : 'outline'}
              onClick={() => setTheme('system')}
              className="h-24 flex-col gap-2"
            >
              <Monitor className="h-6 w-6" />
              <span>System</span>
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground mt-4">
            System theme follows your operating system preferences
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
