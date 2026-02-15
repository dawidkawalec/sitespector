'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RiSearchEyeFill } from 'react-icons/ri'

const GoogleIcon = () => (
  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
)

const GitHubIcon = () => (
  <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
)

export default function LoginPage() {
  // Next.js requires useSearchParams() to be wrapped in a Suspense boundary for prerendering.
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <LoginPageInner />
    </Suspense>
  )
}

function LoginPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const modeRegister = searchParams.get('mode') === 'register'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [showMagicLink, setShowMagicLink] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [activeTab, setActiveTab] = useState(modeRegister ? 'register' : 'login')

  useEffect(() => {
    if (modeRegister) setActiveTab('register')
  }, [modeRegister])

  useEffect(() => {
    const checkSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (session) {
          router.push('/dashboard')
        }
      } catch (err) {
        console.error('Error checking session:', err)
      } finally {
        setCheckingAuth(false)
      }
    }
    checkSession()
  }, [router])

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (signInError) throw signInError
      router.push('/dashboard')
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Nieprawidłowy email lub hasło'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    if (password !== confirmPassword) {
      setError('Hasła nie są identyczne')
      setLoading(false)
      return
    }
    if (password.length < 8) {
      setError('Hasło musi mieć co najmniej 8 znaków')
      setLoading(false)
      return
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      setError('Hasło musi zawierać małą i wielką literę oraz cyfrę')
      setLoading(false)
      return
    }
    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: { full_name: fullName || null },
        },
      })
      if (signUpError) throw signUpError
      router.push('/dashboard')
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Rejestracja nie powiodła się'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleOAuth = async (provider: 'google' | 'github') => {
    setError('')
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      })
      if (oauthError) throw oauthError
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Logowanie OAuth nie powiodło się'
      )
    }
  }

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { error: magicError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (magicError) throw magicError
      setMagicLinkSent(true)
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Wysłanie linku nie powiodło się'
      )
    } finally {
      setLoading(false)
    }
  }

  if (checkingAuth) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4">
        <Card className="w-full max-w-md border-[#0b363d]/12 bg-white shadow-2xl">
          <CardContent className="pt-6">
            <div className="flex justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#0b363d] border-t-transparent" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (magicLinkSent) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4">
        <Card className="w-full max-w-md border-[#0b363d]/12 bg-white shadow-2xl">
          <CardHeader>
            <CardTitle className="text-[#0b363d]">Sprawdź e-mail</CardTitle>
            <CardDescription className="text-[#616c6e]">
              Wysłaliśmy link do logowania na adres {email}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-[#616c6e]">
              Kliknij link w wiadomości, aby się zalogować. Możesz zamknąć tę
              stronę.
            </p>
            <Button
              variant="outline"
              className="w-full border-[#0b363d] text-[#0b363d] hover:bg-[#0b363d]/6"
              onClick={() => {
                setMagicLinkSent(false)
                setShowMagicLink(false)
              }}
            >
              Wróć do logowania
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <Card className="public-card w-full max-w-md border shadow-2xl relative z-10 bg-white">
        <CardHeader className="space-y-1 text-center">
          <div className="mb-4 flex justify-center">
            <div className="rounded-2xl bg-[#0b363d]/10 p-3 text-[#ff8945]">
              <RiSearchEyeFill size={48} />
            </div>
          </div>
          <CardTitle className="text-3xl font-black tracking-tight text-[#0b363d]">
            SiteSpector
          </CardTitle>
          <CardDescription className="public-card-muted text-base text-[#616c6e]">
            Zaloguj się lub załóż konto, aby kontynuować.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as 'login' | 'register')}
            className="w-full"
          >
            <TabsList className="public-tabs-bg grid w-full grid-cols-2 bg-[#0b363d]/8">
              <TabsTrigger value="login" className="public-tabs-trigger data-[state=active]:bg-white data-[state=active]:text-[#0b363d] data-[state=inactive]:text-[#616c6e]">
                Zaloguj się
              </TabsTrigger>
              <TabsTrigger value="register" className="public-tabs-trigger data-[state=active]:bg-white data-[state=active]:text-[#0b363d] data-[state=inactive]:text-[#616c6e]">
                Zarejestruj się
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4 pt-4">
              {!showMagicLink ? (
                <>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="public-btn-outline w-full border-[#0b363d] text-[#0b363d]"
                      onClick={() => handleOAuth('google')}
                      type="button"
                    >
                      <GoogleIcon />
                      Kontynuuj z Google
                    </Button>
                    <Button
                      variant="outline"
                      className="public-btn-outline w-full border-[#0b363d] text-[#0b363d]"
                      onClick={() => handleOAuth('github')}
                      type="button"
                    >
                      <GitHubIcon />
                      Kontynuuj z GitHub
                    </Button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <Separator className="public-separator bg-[#0b363d]/15" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-[#616c6e]">
                        lub e-mail
                      </span>
                    </div>
                  </div>
                  <form onSubmit={handleEmailLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email" className="text-[#0b363d]">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="twoj@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="public-input border-[#0b363d]/20 bg-white text-[#0b363d] placeholder:text-[#616c6e]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password" className="text-[#0b363d]">Hasło</Label>
                      <Input
                        id="login-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="public-input border-[#0b363d]/20 bg-white text-[#0b363d]"
                      />
                    </div>
                    <Button
                      type="submit"
                      className="public-btn-accent w-full bg-[#ff8945] text-white hover:bg-[#e67a3d]"
                      disabled={loading}
                    >
                      {loading ? 'Logowanie...' : 'Zaloguj się'}
                    </Button>
                  </form>
                  <div className="text-center">
                    <Button
                      variant="link"
                      onClick={() => setShowMagicLink(true)}
                      type="button"
                      className="text-sm text-[#616c6e] hover:text-[#0b363d]"
                    >
                      Lub zaloguj się linkiem magicznym
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <form onSubmit={handleMagicLink} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="magic-email" className="text-[#0b363d]">Email</Label>
                      <Input
                        id="magic-email"
                        type="email"
                        placeholder="twoj@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="public-input border-[#0b363d]/20 bg-white text-[#0b363d]"
                      />
                      <p className="text-sm text-[#616c6e]">
                        Wyślemy Ci link do logowania
                      </p>
                    </div>
                    <Button
                      type="submit"
                      className="public-btn-accent w-full bg-[#ff8945] text-white hover:bg-[#e67a3d]"
                      disabled={loading}
                    >
                      {loading ? 'Wysyłanie...' : 'Wyślij link'}
                    </Button>
                  </form>
                  <div className="text-center">
                    <Button
                      variant="link"
                      onClick={() => setShowMagicLink(false)}
                      type="button"
                      className="text-sm text-[#616c6e] hover:text-[#0b363d]"
                    >
                      Wróć do logowania hasłem
                    </Button>
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="register" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="public-btn-outline w-full border-[#0b363d] text-[#0b363d]"
                  onClick={() => handleOAuth('google')}
                  type="button"
                >
                  <GoogleIcon />
                  Zarejestruj z Google
                </Button>
                <Button
                  variant="outline"
                  className="public-btn-outline w-full border-[#0b363d] text-[#0b363d]"
                  onClick={() => handleOAuth('github')}
                  type="button"
                >
                  <GitHubIcon />
                  Zarejestruj z GitHub
                </Button>
              </div>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="public-separator bg-[#0b363d]/15" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-[#616c6e]">
                    lub e-mail
                  </span>
                </div>
              </div>
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reg-name" className="text-[#0b363d]">Imię i nazwisko (opcjonalnie)</Label>
                  <Input
                    id="reg-name"
                    type="text"
                    placeholder="Jan Kowalski"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="public-input border-[#0b363d]/20 bg-white text-[#0b363d]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-email" className="text-[#0b363d]">Email</Label>
                  <Input
                    id="reg-email"
                    type="email"
                    placeholder="twoj@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="public-input border-[#0b363d]/20 bg-white text-[#0b363d]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-password" className="text-[#0b363d]">Hasło</Label>
                  <Input
                    id="reg-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="public-input border-[#0b363d]/20 bg-white text-[#0b363d]"
                  />
                  <p className="text-xs text-[#616c6e]">
                    Min. 8 znaków, wielka i mała litera, cyfra
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-confirm" className="text-[#0b363d]">Potwierdź hasło</Label>
                  <Input
                    id="reg-confirm"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="public-input border-[#0b363d]/20 bg-white text-[#0b363d]"
                  />
                </div>
                <Button
                  type="submit"
                  className="public-btn-accent w-full bg-[#ff8945] text-white hover:bg-[#e67a3d]"
                  disabled={loading}
                >
                  {loading ? 'Tworzenie konta...' : 'Zarejestruj się'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <p className="pt-4 text-center text-sm text-[#616c6e]">
            {activeTab === 'login' ? (
              <>
                Nie masz konta?{' '}
                <button
                  type="button"
                  onClick={() => setActiveTab('register')}
                  className="text-[#0b363d] font-medium hover:underline hover:text-[#ff8945]"
                >
                  Zarejestruj się
                </button>
              </>
            ) : (
              <>
                Masz już konto?{' '}
                <button
                  type="button"
                  onClick={() => setActiveTab('login')}
                  className="text-[#0b363d] font-medium hover:underline hover:text-[#ff8945]"
                >
                  Zaloguj się
                </button>
              </>
            )}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
