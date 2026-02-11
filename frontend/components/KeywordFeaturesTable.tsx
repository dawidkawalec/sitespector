'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatNumber } from '@/lib/utils'

export interface KeywordFeatureRow {
  range: string
  top3: number
  top10: number
  top50: number
  estimatedTrafficPercent?: number
  estimatedTraffic?: number
}

export function KeywordFeaturesTable({
  title,
  rows,
}: {
  title: string
  rows: KeywordFeatureRow[]
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Zakres</TableHead>
                <TableHead className="text-right">TOP 3</TableHead>
                <TableHead className="text-right">TOP 10</TableHead>
                <TableHead className="text-right">TOP 50</TableHead>
                <TableHead className="text-right">Ruch %</TableHead>
                <TableHead className="text-right">Szacowany ruch</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.range}>
                  <TableCell className="font-medium">{row.range}</TableCell>
                  <TableCell className="text-right">{formatNumber(row.top3)}</TableCell>
                  <TableCell className="text-right">{formatNumber(row.top10)}</TableCell>
                  <TableCell className="text-right">{formatNumber(row.top50)}</TableCell>
                  <TableCell className="text-right">
                    {row.estimatedTrafficPercent !== undefined ? `${row.estimatedTrafficPercent.toFixed(2)}%` : '—'}
                  </TableCell>
                  <TableCell className="text-right">{row.estimatedTraffic !== undefined ? formatNumber(row.estimatedTraffic) : '—'}</TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Brak danych.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

