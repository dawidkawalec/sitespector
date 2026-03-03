'use client'

import Link from 'next/link'
import { RiSearchEyeFill } from 'react-icons/ri'
import { cn } from '@/lib/utils'

interface SiteSpectorLogoProps {
  href?: string
  iconSize?: number
  textClassName?: string
  className?: string
  onClick?: () => void
}

export function SiteSpectorLogo({
  href = '/',
  iconSize = 28,
  textClassName,
  className,
  onClick,
}: SiteSpectorLogoProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn('inline-flex min-w-0 items-center gap-2 whitespace-nowrap', className)}
      aria-label="SiteSpector"
    >
      <RiSearchEyeFill size={iconSize} className="shrink-0 text-[#ff8945]" />
      <span className={cn('truncate text-xl font-bold leading-none tracking-tight', textClassName)}>
        SiteSpector
      </span>
    </Link>
  )
}
