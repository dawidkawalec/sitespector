'use client'

import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface SiteSpectorLogoProps {
  href?: string
  logoHeight?: number
  maxWidthPx?: number
  variant?: 'dark' | 'light'
  className?: string
  onClick?: () => void
}

export function SiteSpectorLogo({
  href = '/',
  logoHeight = 28,
  maxWidthPx,
  variant = 'dark',
  className,
  onClick,
}: SiteSpectorLogoProps) {
  const safeMaxWidthPx = maxWidthPx ?? Math.round(logoHeight * 6)
  const logoSrc = variant === 'light' ? '/sitespector_logo_light.svg' : '/sitespector_logo_dark.svg'

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn('inline-flex min-w-0 items-center', className)}
      aria-label="SiteSpector"
    >
      <Image
        src={logoSrc}
        alt="SiteSpector"
        width={3068}
        height={759}
        unoptimized
        style={{
          height: `${logoHeight}px`,
          width: 'auto',
          maxWidth: `${safeMaxWidthPx}px`,
        }}
        className="w-auto max-w-full object-contain"
      />
    </Link>
  )
}
