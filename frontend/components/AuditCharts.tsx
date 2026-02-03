'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

interface PageStatusChartProps {
  statusData: {
    [key: string]: number
  }
}

export function PageStatusChart({ statusData }: PageStatusChartProps) {
  const data = [
    { name: '200 OK', value: statusData['200'] || 0, color: '#16a34a' },
    { name: '301 Redirect', value: statusData['301'] || 0, color: '#ca8a04' },
    { name: '302 Redirect', value: statusData['302'] || 0, color: '#eab308' },
    { name: '404 Not Found', value: statusData['404'] || 0, color: '#dc2626' },
    { name: 'Inne', value: statusData['other'] || 0, color: '#6b7280' },
  ].filter(item => item.value > 0)  // Only show non-zero values
  
  if (data.length === 0) {
    return <div className="text-muted-foreground text-center py-8">Brak danych</div>
  }
  
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={(entry) => `${entry.name}: ${entry.value}`}
          outerRadius={100}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  )
}

interface ResponseTimeChartProps {
  pages: Array<{
    response_time: number
    [key: string]: any
  }>
}

export function ResponseTimeChart({ pages }: ResponseTimeChartProps) {
  if (!pages || pages.length === 0) {
    return <div className="text-muted-foreground text-center py-8">Brak danych</div>
  }
  
  // Group pages by response time buckets
  const buckets = {
    '<200ms': 0,
    '200-500ms': 0,
    '500ms-1s': 0,
    '1-2s': 0,
    '>2s': 0,
  }
  
  pages.forEach(p => {
    const time = p.response_time * 1000
    if (time < 200) buckets['<200ms']++
    else if (time < 500) buckets['200-500ms']++
    else if (time < 1000) buckets['500ms-1s']++
    else if (time < 2000) buckets['1-2s']++
    else buckets['>2s']++
  })
  
  const data = Object.entries(buckets).map(([name, value]) => ({ name, value }))
  
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="value" fill="#3b82f6" name="Liczba stron" />
      </BarChart>
    </ResponsiveContainer>
  )
}

interface WordCountChartProps {
  pages: Array<{
    word_count: number
    [key: string]: any
  }>
}

export function WordCountChart({ pages }: WordCountChartProps) {
  if (!pages || pages.length === 0) {
    return <div className="text-muted-foreground text-center py-8">Brak danych</div>
  }
  
  // Group pages by word count
  const buckets = {
    '0-100': 0,
    '100-300': 0,
    '300-500': 0,
    '500-1000': 0,
    '>1000': 0,
  }
  
  pages.forEach(p => {
    const count = p.word_count
    if (count < 100) buckets['0-100']++
    else if (count < 300) buckets['100-300']++
    else if (count < 500) buckets['300-500']++
    else if (count < 1000) buckets['500-1000']++
    else buckets['>1000']++
  })
  
  const data = Object.entries(buckets).map(([name, value]) => ({ name, value }))
  
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="value" fill="#8b5cf6" name="Liczba stron" />
      </BarChart>
    </ResponsiveContainer>
  )
}

interface ImageSizeChartProps {
  images: Array<{
    size_bytes: number
    [key: string]: any
  }>
}

export function ImageSizeChart({ images }: ImageSizeChartProps) {
  if (!images || images.length === 0) {
    return <div className="text-muted-foreground text-center py-8">Brak danych</div>
  }
  
  // Group images by size
  const buckets = {
    '<50KB': 0,
    '50-100KB': 0,
    '100-500KB': 0,
    '500KB-1MB': 0,
    '>1MB': 0,
  }
  
  images.forEach(img => {
    const sizeKB = img.size_bytes / 1024
    if (sizeKB < 50) buckets['<50KB']++
    else if (sizeKB < 100) buckets['50-100KB']++
    else if (sizeKB < 500) buckets['100-500KB']++
    else if (sizeKB < 1024) buckets['500KB-1MB']++
    else buckets['>1MB']++
  })
  
  const data = Object.entries(buckets).map(([name, value]) => ({ name, value }))
  
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="value" fill="#ec4899" name="Liczba obrazów" />
      </BarChart>
    </ResponsiveContainer>
  )
}
