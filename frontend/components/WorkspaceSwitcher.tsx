'use client'

/**
 * Workspace Switcher Component
 * 
 * Dropdown to switch between personal and team workspaces.
 * Shows "Personal" and "Teams" sections with create team option.
 */

import { Check, ChevronsUpDown, PlusCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useWorkspace } from '@/lib/WorkspaceContext'
import { useState } from 'react'
import { CreateTeamDialog } from './teams/CreateTeamDialog'

export function WorkspaceSwitcher() {
  const { workspaces, currentWorkspace, switchWorkspace } = useWorkspace()
  const [open, setOpen] = useState(false)
  const [showCreateTeam, setShowCreateTeam] = useState(false)

  const personalWorkspaces = workspaces.filter(w => w.type === 'personal')
  const teamWorkspaces = workspaces.filter(w => w.type === 'team')

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label="Select workspace"
            className="h-9 w-full justify-between gap-2 border-border/70 bg-background/80 text-foreground shadow-sm transition-all duration-200 hover:bg-muted/70 hover:border-border hover:shadow-md focus-visible:ring-2 focus-visible:ring-primary/35"
          >
            <span className="truncate text-sm font-medium">
              {currentWorkspace ? currentWorkspace.name : 'Select workspace'}
            </span>
            <ChevronsUpDown className="ml-1 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-[280px] p-0">
          <Command className="bg-popover text-popover-foreground">
            <CommandInput placeholder="Szukaj workspace..." />
            <CommandList>
              <CommandEmpty>Nie znaleziono.</CommandEmpty>
              
              {personalWorkspaces.length > 0 && (
                <CommandGroup heading="Osobiste">
                  {personalWorkspaces.map((workspace) => (
                    <CommandItem
                      key={workspace.id}
                      onSelect={() => {
                        switchWorkspace(workspace.id)
                        setOpen(false)
                      }}
                      className="gap-2 rounded-md aria-selected:bg-muted/80 aria-selected:text-foreground"
                    >
                      <span className="truncate">{workspace.name}</span>
                      <Check
                        className={
                          currentWorkspace?.id === workspace.id
                            ? "ml-auto h-4 w-4 text-accent"
                            : "ml-auto h-4 w-4 opacity-0"
                        }
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              
              {teamWorkspaces.length > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup heading="Zespoły">
                    {teamWorkspaces.map((workspace) => (
                      <CommandItem
                        key={workspace.id}
                        onSelect={() => {
                          switchWorkspace(workspace.id)
                          setOpen(false)
                        }}
                        className="gap-2 rounded-md aria-selected:bg-muted/80 aria-selected:text-foreground"
                      >
                        <span className="truncate">{workspace.name}</span>
                        <Check
                          className={
                            currentWorkspace?.id === workspace.id
                              ? "ml-auto h-4 w-4 text-accent"
                              : "ml-auto h-4 w-4 opacity-0"
                          }
                        />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}

              <CommandSeparator />
              <CommandList>
                <CommandGroup>
                  <CommandItem
                    onSelect={() => {
                      setOpen(false)
                      setShowCreateTeam(true)
                    }}
                    className="text-accent rounded-md aria-selected:bg-accent/10 aria-selected:text-accent"
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Stwórz Zespół
                  </CommandItem>
                </CommandGroup>
              </CommandList>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <CreateTeamDialog 
        open={showCreateTeam} 
        onOpenChange={setShowCreateTeam}
      />
    </>
  )
}
