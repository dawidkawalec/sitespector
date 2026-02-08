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
            variant="ghost"
            role="combobox"
            aria-expanded={open}
            aria-label="Select workspace"
            className="w-full justify-between bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:text-white"
          >
            <span className="truncate font-semibold">
              {currentWorkspace ? currentWorkspace.name : 'Select workspace'}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[250px] p-0 bg-[#0b363d] border-white/10 text-white">
          <Command className="bg-transparent text-white">
            <CommandInput placeholder="Szukaj workspace..." className="text-white" />
            <CommandList className="text-white">
              <CommandEmpty>Nie znaleziono.</CommandEmpty>
              
              {personalWorkspaces.length > 0 && (
                <CommandGroup heading="Osobiste" className="text-white/50">
                  {personalWorkspaces.map((workspace) => (
                    <CommandItem
                      key={workspace.id}
                      onSelect={() => {
                        switchWorkspace(workspace.id)
                        setOpen(false)
                      }}
                      className="text-white focus:bg-white/10 focus:text-white"
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
                  <CommandSeparator className="bg-white/10" />
                  <CommandGroup heading="Zespoły" className="text-white/50">
                    {teamWorkspaces.map((workspace) => (
                      <CommandItem
                        key={workspace.id}
                        onSelect={() => {
                          switchWorkspace(workspace.id)
                          setOpen(false)
                        }}
                        className="text-white focus:bg-white/10 focus:text-white"
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

              <CommandSeparator className="bg-white/10" />
              <CommandList>
                <CommandGroup>
                  <CommandItem
                    onSelect={() => {
                      setOpen(false)
                      setShowCreateTeam(true)
                    }}
                    className="text-accent focus:bg-white/10 focus:text-accent"
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
