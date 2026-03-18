'use client'

import { useState, useEffect, useRef } from 'react'
import { useWorkspace } from '@/lib/WorkspaceContext'
import { usePlanGate } from '@/lib/usePlanGate'
import { brandingAPI, type BrandingSettings } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Upload, Trash2, Lock, Image } from 'lucide-react'

export default function BrandingPage() {
  const { currentWorkspace } = useWorkspace()
  const { plan, isLoading: planLoading } = usePlanGate()

  const [branding, setBranding] = useState<BrandingSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Form state
  const [companyName, setCompanyName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactUrl, setContactUrl] = useState('')
  const [accentColor, setAccentColor] = useState('#ff8945')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isAgencyPlus = ['agency', 'enterprise'].includes(plan)
  const isEnterprise = plan === 'enterprise'

  useEffect(() => {
    if (!currentWorkspace?.id) return
    loadBranding()
  }, [currentWorkspace?.id])

  const loadBranding = async () => {
    if (!currentWorkspace?.id) return
    setIsLoading(true)
    setError('')
    try {
      const data = await brandingAPI.get(currentWorkspace.id)
      setBranding(data)
      setCompanyName(data.branding_company_name || '')
      setContactEmail(data.branding_contact_email || '')
      setContactUrl(data.branding_contact_url || '')
      setAccentColor(data.branding_accent_color || '#ff8945')
    } catch (e: any) {
      setError(e.message || 'Nie udalo sie wczytac ustawien brandingu')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!currentWorkspace?.id) return
    setIsSaving(true)
    setError('')
    setSuccess('')
    try {
      const data = await brandingAPI.update(currentWorkspace.id, {
        branding_company_name: companyName || null,
        branding_contact_email: contactEmail || null,
        branding_contact_url: contactUrl || null,
        branding_accent_color: accentColor !== '#ff8945' ? accentColor : null,
      })
      setBranding(data)
      setSuccess('Ustawienia brandingu zapisane')
      setTimeout(() => setSuccess(''), 3000)
    } catch (e: any) {
      setError(e.message || 'Nie udalo sie zapisac')
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !currentWorkspace?.id) return

    if (file.size > 2 * 1024 * 1024) {
      setError('Logo nie moze przekraczac 2 MB')
      return
    }

    setIsUploading(true)
    setError('')
    try {
      const data = await brandingAPI.uploadLogo(currentWorkspace.id, file)
      setBranding(data)
      setSuccess('Logo przesłane')
      setTimeout(() => setSuccess(''), 3000)
    } catch (e: any) {
      setError(e.message || 'Nie udalo sie przeslac logo')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleLogoDelete = async () => {
    if (!currentWorkspace?.id) return
    setError('')
    try {
      const data = await brandingAPI.deleteLogo(currentWorkspace.id)
      setBranding(data)
      setSuccess('Logo usuniete')
      setTimeout(() => setSuccess(''), 3000)
    } catch (e: any) {
      setError(e.message || 'Nie udalo sie usunac logo')
    }
  }

  if (isLoading || planLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-stone-900 dark:text-white">Branding</h1>
        <p className="mt-1 text-sm text-stone-500 dark:text-white/60">
          Personalizuj raporty PDF swoim logotypem i danymi kontaktowymi.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert>
          <AlertDescription className="text-green-700 dark:text-green-400">{success}</AlertDescription>
        </Alert>
      )}

      {/* Logo Upload — Agency+ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            Logo na raportach PDF
          </CardTitle>
          <CardDescription>
            Twoje logo pojawi sie na okladce i w stopce kazdego raportu PDF.
            {!isAgencyPlus && ' Wymaga planu Agency lub Enterprise.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isAgencyPlus ? (
            <div className="flex items-center gap-3 rounded-lg border border-stone-200 bg-stone-50 p-4 dark:border-white/10 dark:bg-white/5">
              <Lock className="h-5 w-5 text-stone-400" />
              <p className="text-sm text-stone-500">Branding logo wymaga planu Agency ($29.99/mies.) lub wyzszego.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {branding?.branding_logo_url && (
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-40 items-center justify-center rounded-lg border border-stone-200 bg-white p-2 dark:border-white/10 dark:bg-slate-800">
                    <img
                      src={branding.branding_logo_url}
                      alt="Logo"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <Button variant="outline" size="sm" onClick={handleLogoDelete}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Usun
                  </Button>
                </div>
              )}

              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" />
                  )}
                  {branding?.branding_logo_url ? 'Zmien logo' : 'Przeslij logo'}
                </Button>
                <p className="mt-2 text-xs text-stone-400">PNG, JPG, SVG lub WebP. Max 2 MB.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* White-label — Enterprise */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            White-Label
            {!isEnterprise && <Lock className="h-4 w-4 text-stone-400" />}
          </CardTitle>
          <CardDescription>
            Pelne usunicie "SiteSpector" z raportow — Twoja firma, Twoj kontakt, Twoje kolory.
            {!isEnterprise && ' Dostepne tylko w planie Enterprise.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isEnterprise ? (
            <div className="flex items-center gap-3 rounded-lg border border-stone-200 bg-stone-50 p-4 dark:border-white/10 dark:bg-white/5">
              <Lock className="h-5 w-5 text-stone-400" />
              <p className="text-sm text-stone-500">White-label wymaga planu Enterprise ($99/mies.).</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Nazwa firmy</Label>
                  <Input
                    id="companyName"
                    placeholder="np. Agencja WebPro"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                  <p className="text-xs text-stone-400">Zamieni "SiteSpector" na okladce i w tresci raportu.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accentColor">Kolor akcentu</Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="h-10 w-12 cursor-pointer rounded border border-stone-200 p-1"
                    />
                    <Input
                      id="accentColor"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      placeholder="#ff8945"
                      className="font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Email kontaktowy</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    placeholder="np. kontakt@webpro.pl"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactUrl">Adres www</Label>
                  <Input
                    id="contactUrl"
                    placeholder="np. webpro.pl"
                    value={contactUrl}
                    onChange={(e) => setContactUrl(e.target.value)}
                  />
                </div>
              </div>

              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Zapisz ustawienia
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
