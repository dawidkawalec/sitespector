'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

interface PageStatusChartProps {
  statusData: {
    [key: string]: number
  }
}

export function PageStatusChart({ statusData }: PageStatusChartProps) {
  const data = [
    { name: '200 OK', value: statusData['200'] || 0, color: '#81d86f' },
    { name: '301 Redirect', value: statusData['301'] || 0, color: '#ff8945' },
    { name: '302 Redirect', value: statusData['302'] || 0, color: '#eea47f' },
    { name: '404 Not Found', value: statusData['404'] || 0, color: '#dc3545' },
    { name: 'Inne', value: statusData['other'] || 0, color: '#616c6e' },
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
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} />
        <Tooltip 
          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
        />
        <Legend iconType="circle" />
        <Bar dataKey="value" fill="#0b363d" name="Liczba stron" radius={[4, 4, 0, 0]} />
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
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} />
        <Tooltip 
          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
        />
        <Legend iconType="circle" />
        <Bar dataKey="value" fill="#ff8945" name="Liczba stron" radius={[4, 4, 0, 0]} />
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
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} />
        <Tooltip 
          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
        />
        <Legend iconType="circle" />
        <Bar dataKey="value" fill="#adefd1" name="Liczba obrazów" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

interface PositionsDistributionChartProps {
  data: {
    [key: string]: number
  }
}

export function PositionsDistributionChart({ data }: PositionsDistributionChartProps) {
  if (!data) return <div className="text-muted-foreground text-center py-8">Brak danych</div>
  
  const chartData = Object.entries(data)
    .map(([pos, count]) => ({ pos: parseInt(pos), count }))
    .sort((a, b) => a.pos - b.pos)

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
        <XAxis dataKey="pos" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} />
        <Tooltip />
        <Bar dataKey="count" fill="#0b363d" name="Liczba fraz" radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

interface SeasonalityChartProps {
  data: {
    [key: string]: { value: number; deviation: any }
  }
}

export function SeasonalityChart({ data }: SeasonalityChartProps) {
  if (!data) return <div className="text-muted-foreground text-center py-8">Brak danych</div>
  
  const months = ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze', 'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru']
  const chartData = Object.entries(data)
    .map(([key, val]) => {
      const monthIdx = parseInt(key.replace('trend_', '')) - 1
      return { month: months[monthIdx], value: val.value, idx: monthIdx }
    })
    .sort((a, b) => a.idx - b.idx)

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
        <XAxis dataKey="month" axisLine={false} tickLine={false} />
        <YAxis axisLine={false} tickLine={false} hide />
        <Tooltip formatter={(value: number) => value.toLocaleString()} />
        <Bar dataKey="value" fill="#ff8945" name="Widoczność" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

interface CompetitorsBarChartProps {
  competitors: any[]
}

export function CompetitorsBarChart({ competitors }: CompetitorsBarChartProps) {
  const data = competitors.slice(0, 8).map(c => ({
    name: c.domain,
    visibility: c.statistics?.visibility?.recent_value || 0
  })).sort((a, b) => b.visibility - a.visibility)

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
        <XAxis type="number" hide />
        <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} tick={{fontSize: 10}} />
        <Tooltip formatter={(value: number) => Math.round(value).toLocaleString()} />
        <Bar dataKey="visibility" fill="#81d86f" name="Widoczność" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

interface LinkAttributesPieChartProps {
  attributes: any[]
}

export function LinkAttributesPieChart({ attributes }: LinkAttributesPieChartProps) {
  const COLORS = ['#81d86f', '#ff8945', '#eea47f', '#dc3545', '#616c6e']
  
  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie
          data={attributes}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          paddingAngle={5}
          dataKey="count"
          nameKey="attribute"
        >
          {attributes.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}
