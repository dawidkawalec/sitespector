'use client';

import React from 'react';
import Image from 'next/image';

interface ImageWithPlaceholderProps {
  src: string;
  alt: string;
  placeholder?: string;
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * ImagePlaceholder — renders the actual image if it exists,
 * or a styled placeholder box with description if it doesn't.
 * 
 * Usage:
 * ```tsx
 * <ImagePlaceholder
 *   src="/images/hero/dashboard.png"
 *   alt="Dashboard SiteSpector"
 *   placeholder="PLACEHOLDER: Screenshot dashboardu — 1200x800px"
 *   width={1200}
 *   height={800}
 * />
 * ```
 */
export default function ImagePlaceholder({
  src,
  alt,
  placeholder,
  width = 800,
  height = 500,
  className = '',
  style,
}: ImageWithPlaceholderProps) {
  const [hasError, setHasError] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);

  // Extract dimensions from placeholder text if available
  const dimensionMatch = placeholder?.match(/(\d+)x(\d+)/);
  const placeholderWidth = dimensionMatch ? parseInt(dimensionMatch[1]) : width;
  const placeholderHeight = dimensionMatch ? parseInt(dimensionMatch[2]) : height;
  const aspectRatio = placeholderWidth / placeholderHeight;

  // Clean placeholder text (remove "PLACEHOLDER: " prefix)
  const cleanPlaceholder = placeholder?.replace(/^PLACEHOLDER:\s*/i, '') || alt;

  if (hasError || !src) {
    return (
      <div
        className={`image-placeholder ${className}`}
        style={{
          width: '100%',
          maxWidth: placeholderWidth,
          aspectRatio: `${aspectRatio}`,
          backgroundColor: '#f8f9fa',
          border: '2px dashed #dee2e6',
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          color: '#6c757d',
          fontSize: '0.875rem',
          textAlign: 'center',
          ...style,
        }}
      >
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ marginBottom: '0.75rem', opacity: 0.5 }}
        >
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
        <span>{cleanPlaceholder}</span>
        <span style={{ fontSize: '0.75rem', opacity: 0.6, marginTop: '0.25rem' }}>
          {placeholderWidth}x{placeholderHeight}px
        </span>
      </div>
    );
  }

  return (
    <div className={className} style={{ position: 'relative', ...style }}>
      {!loaded && (
        <div
          style={{
            width: '100%',
            aspectRatio: `${aspectRatio}`,
            backgroundColor: '#f8f9fa',
            borderRadius: '12px',
            animation: 'pulse 1.5s infinite',
          }}
        />
      )}
      <Image
        src={src}
        alt={alt}
        width={placeholderWidth}
        height={placeholderHeight}
        className={`rounded-4 ${loaded ? '' : 'visually-hidden'}`}
        onError={() => setHasError(true)}
        onLoad={() => setLoaded(true)}
        style={{ width: '100%', height: 'auto' }}
        unoptimized
      />
    </div>
  );
}
