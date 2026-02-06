"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "../../lib/utils"
import { Button } from "../ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList, // Import CommandList as well
} from "../ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover"

export interface Teacher {
  id: string
  name: string
  short: string
}

interface TeacherComboboxProps {
  teachers: Teacher[]
  selectedTeacherId: string | null
  onSelect: (teacherId: string) => void
}

export function TeacherCombobox({ teachers, selectedTeacherId, onSelect }: TeacherComboboxProps) {
  const [open, setOpen] = React.useState(false)

  const selectedTeacher = teachers.find((t) => t.id === selectedTeacherId)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[300px] justify-between"
        >
          {selectedTeacher ? selectedTeacher.name : "Öğretmen seçiniz..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Öğretmen ara..." />
          <CommandList>
            <CommandEmpty>Öğretmen bulunamadı.</CommandEmpty>
            <CommandGroup>
              {teachers.map((teacher) => (
                <CommandItem
                  key={teacher.id}
                  value={teacher.name}
                  onSelect={() => {
                    onSelect(teacher.id === selectedTeacherId ? "" : teacher.id)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedTeacherId === teacher.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {teacher.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
