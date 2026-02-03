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
            className="w-full justify-between"
          >
            <span className="truncate">
              {currentWorkspace ? currentWorkspace.name : 'Select workspace'}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[250px] p-0">
          <Command>
            <CommandInput placeholder="Search workspace..." />
            <CommandList>
              <CommandEmpty>No workspace found.</CommandEmpty>
              
              {personalWorkspaces.length > 0 && (
                <CommandGroup heading="Personal">
                  {personalWorkspaces.map((workspace) => (
                    <CommandItem
                      key={workspace.id}
                      onSelect={() => {
                        switchWorkspace(workspace.id)
                        setOpen(false)
                      }}
                    >
                      <span className="truncate">{workspace.name}</span>
                      <Check
                        className={
                          currentWorkspace?.id === workspace.id
                            ? "ml-auto h-4 w-4"
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
                  <CommandGroup heading="Teams">
                    {teamWorkspaces.map((workspace) => (
                      <CommandItem
                        key={workspace.id}
                        onSelect={() => {
                          switchWorkspace(workspace.id)
                          setOpen(false)
                        }}
                      >
                        <span className="truncate">{workspace.name}</span>
                        <Check
                          className={
                            currentWorkspace?.id === workspace.id
                              ? "ml-auto h-4 w-4"
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
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Team
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
