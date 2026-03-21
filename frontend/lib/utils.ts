/**
 * Utility functions for SiteSpector frontend
 */

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Date formatting
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('pl-PL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

// Score formatting and coloring
export function formatScore(score: number | null | undefined): string {
  if (score === null || score === undefined) return 'N/A'
  // Scores should be stable and comparable; always show 2 decimals.
  return new Intl.NumberFormat('pl-PL', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: false,
  }).format(score)
}

export function getScoreColor(score: number | null | undefined): string {
  if (score === null || score === undefined) return 'text-muted-foreground'
  if (score >= 90) return 'text-[#81d86f]'
  if (score >= 50) return 'text-[#ff8945]'
  return 'text-[#dc3545]'
}

// Status badge variants
export function getStatusBadgeVariant(
  status: 'pending' | 'processing' | 'awaiting_context' | 'completed' | 'failed'
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'pending':
      return 'secondary'
    case 'processing':
      return 'default'
    case 'awaiting_context':
      return 'default'
    case 'completed':
      return 'outline'
    case 'failed':
      return 'destructive'
    default:
      return 'default'
  }
}

// URL truncation
export function truncateUrl(url: string, maxLength: number = 50): string {
  if (url.length <= maxLength) return url
  
  try {
    const urlObj = new URL(url)
    const domain = urlObj.hostname
    const path = urlObj.pathname + urlObj.search
    
    if (domain.length + 10 >= maxLength) {
      return domain.substring(0, maxLength - 3) + '...'
    }
    
    const availableLength = maxLength - domain.length - 6
    const truncatedPath = path.length > availableLength 
      ? path.substring(0, availableLength) + '...'
      : path
      
    return domain + truncatedPath
  } catch {
    return url.substring(0, maxLength - 3) + '...'
  }
}

// Number formatting
export function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) return 'N/A'
  // Avoid long floats in UI; cap to 2 decimals (do not force trailing zeros).
  return new Intl.NumberFormat('pl-PL', {
    maximumFractionDigits: 2,
  }).format(num)
}

// File size formatting
export function formatFileSize(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined) return 'N/A'
  
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  
  return `${size.toFixed(2)} ${units[unitIndex]}`
}

// Time duration formatting
export function formatDuration(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined) return 'N/A'
  
  if (seconds < 1) {
    return `${Math.round(seconds * 1000)}ms`
  }
  
  if (seconds < 60) {
    return `${seconds.toFixed(2)}s`
  }
  
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.round(seconds % 60)
  return `${minutes}m ${remainingSeconds}s`
}
