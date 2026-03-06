'use client'

import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface SiteSpectorLogoProps {
  href?: string
  logoHeight?: number
  className?: string
  onClick?: () => void
}

export function SiteSpectorLogo({
  href = '/',
  logoHeight = 28,
  className,
  onClick,
}: SiteSpectorLogoProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn('inline-flex min-w-0 items-center', className)}
      aria-label="SiteSpector"
    >
      <Image
        src="/sitespector_logo_transp.svg"
        alt="SiteSpector"
        width={3068}
        height={759}
        unoptimized
        style={{ height: `${logoHeight}px`, width: 'auto' }}
        className="w-auto max-w-full object-contain"
      />
    </Link>
  )
}
