'use client'

/**
 * DataExplorerTable - Reusable data table with pagination, search, sort, and export
 * 
 * Used across audit detail pages for displaying large datasets
 * from Screaming Frog, Lighthouse, and Senuto.
 */

import React, { useState, useMemo, useCallback } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FileJson,
  FileSpreadsheet,
} from 'lucide-react'

interface ColumnDef {
  key: string
  label: string
  sortable?: boolean
  render?: (value: any, row: any) => React.ReactNode
  className?: string
  maxWidth?: string
}

interface DataExplorerTableProps {
  data: any[]
  columns: ColumnDef[]
  pageSize?: number
  title?: string
  description?: string
  exportFilename?: string
  maxDisplayRows?: number
  searchPlaceholder?: string
}

type SortDirection = 'asc' | 'desc' | null

export function DataExplorerTable({
  data,
  columns,
  pageSize = 25,
  title,
  description,
  exportFilename = 'export',
  maxDisplayRows,
  searchPlaceholder = 'Szukaj...',
}: DataExplorerTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<SortDirection>(null)

  // Filter data by search
  const filteredData = useMemo(() => {
    if (!searchTerm) return data
    const lower = searchTerm.toLowerCase()
    return data.filter(row =>
      columns.some(col => {
        const val = row[col.key]
        if (val == null) return false
        return String(val).toLowerCase().includes(lower)
      })
    )
  }, [data, searchTerm, columns])

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortKey || !sortDir) return filteredData
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortKey] ?? ''
      const bVal = b[sortKey] ?? ''
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal
      }
      const aStr = String(aVal).toLowerCase()
      const bStr = String(bVal).toLowerCase()
      if (sortDir === 'asc') return aStr.localeCompare(bStr)
      return bStr.localeCompare(aStr)
    })
  }, [filteredData, sortKey, sortDir])

  // Limit display if maxDisplayRows set
  const displayData = maxDisplayRows ? sortedData.slice(0, maxDisplayRows) : sortedData
  const isLimited = maxDisplayRows && sortedData.length > maxDisplayRows

  // Pagination
  const totalFiltered = displayData.length
  const totalPages = Math.ceil(totalFiltered / pageSize)
  const paginatedData = displayData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  // Reset page on search/sort change
  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, sortKey, sortDir])

  const handleSort = useCallback((key: string) => {
    if (sortKey === key) {
      if (sortDir === 'asc') setSortDir('desc')
      else if (sortDir === 'desc') { setSortKey(null); setSortDir(null) }
      else setSortDir('asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }, [sortKey, sortDir])

  // Export CSV
  const exportCSV = useCallback(() => {
    const headers = columns.map(c => c.label)
    const rows = sortedData.map(row =>
      columns.map(col => {
        const val = row[col.key]
        if (val == null) return ''
        const str = String(val)
        // Escape CSV
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`
        }
        return str
      })
    )

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${exportFilename}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [sortedData, columns, exportFilename])

  // Export JSON
  const exportJSON = useCallback(() => {
    const jsonStr = JSON.stringify(sortedData, null, 2)
    const blob = new Blob([jsonStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${exportFilename}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [sortedData, exportFilename])

  const SortIcon = ({ colKey }: { colKey: string }) => {
    if (sortKey !== colKey) return <ArrowUpDown className="h-3 w-3 text-muted-foreground/50" />
    if (sortDir === 'asc') return <ArrowUp className="h-3 w-3 text-accent" />
    return <ArrowDown className="h-3 w-3 text-accent" />
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      {(title || description) && (
        <div>
          {title && <h3 className="text-lg font-bold">{title}</h3>}
          {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            className="pl-8 h-9 text-xs"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-[10px]">
            {totalFiltered.toLocaleString()} rekordów
          </Badge>
          <Button variant="outline" size="sm" onClick={exportCSV} className="gap-1.5 text-xs h-8">
            <FileSpreadsheet className="h-3 w-3" /> CSV
          </Button>
          <Button variant="outline" size="sm" onClick={exportJSON} className="gap-1.5 text-xs h-8">
            <FileJson className="h-3 w-3" /> JSON
          </Button>
        </div>
      </div>

      {/* Limit notice */}
      {isLimited && (
        <div className="text-xs text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-100 dark:border-yellow-900/30 rounded-lg p-3">
          Wyświetlono {maxDisplayRows?.toLocaleString()} z {sortedData.length.toLocaleString()} rekordów. 
          Pobierz pełny eksport CSV/JSON aby zobaczyć wszystkie dane.
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map(col => (
                <TableHead
                  key={col.key}
                  className={col.className}
                  style={col.maxWidth ? { maxWidth: col.maxWidth } : undefined}
                >
                  {col.sortable !== false ? (
                    <button
                      onClick={() => handleSort(col.key)}
                      className="flex items-center gap-1 hover:text-foreground transition-colors"
                    >
                      {col.label}
                      <SortIcon colKey={col.key} />
                    </button>
                  ) : (
                    col.label
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map((row, idx) => (
                <TableRow key={idx}>
                  {columns.map(col => (
                    <TableCell
                      key={col.key}
                      className={col.className}
                      style={col.maxWidth ? { maxWidth: col.maxWidth } : undefined}
                    >
                      {col.render
                        ? col.render(row[col.key], row)
                        : row[col.key] != null
                          ? String(row[col.key])
                          : <span className="text-muted-foreground/50">—</span>
                      }
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  {searchTerm ? 'Brak wyników dla podanego filtru.' : 'Brak danych.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-muted-foreground">
            {((currentPage - 1) * pageSize + 1).toLocaleString()} – {Math.min(currentPage * pageSize, totalFiltered).toLocaleString()} z {totalFiltered.toLocaleString()}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline" size="icon" className="h-7 w-7"
              onClick={() => setCurrentPage(1)} disabled={currentPage === 1}
            >
              <ChevronsLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline" size="icon" className="h-7 w-7"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <div className="flex items-center gap-1 px-2">
              <span className="text-[11px]">Str.</span>
              <Input
                className="h-7 w-12 text-center text-[11px] px-1"
                value={currentPage}
                onChange={(e) => {
                  const val = parseInt(e.target.value)
                  if (!isNaN(val) && val >= 1 && val <= totalPages) setCurrentPage(val)
                }}
              />
              <span className="text-[11px] text-muted-foreground">z {totalPages}</span>
            </div>
            <Button
              variant="outline" size="icon" className="h-7 w-7"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline" size="icon" className="h-7 w-7"
              onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}
            >
              <ChevronsRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
