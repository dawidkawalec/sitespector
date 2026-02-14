'use client';

import { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Nav } from 'react-bootstrap';
import { RiSearchEyeFill } from 'react-icons/ri';
import Topbar from '@/component/layout/Topbar/page';
import Footer from '@/component/layout/Footer/page';
import { supabase, getAppUrl } from '@/lib/supabase';

const GoogleIcon = () => (
  <svg className="me-2" width="20" height="20" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);
const GitHubIcon = () => (
  <svg className="me-2" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
);

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [magicSent, setMagicSent] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    if (params.get('mode') === 'register') setMode('register');
  }, []);

  const appUrl = getAppUrl();
  const callbackUrl = `${appUrl}/auth/callback`;

  const redirectToApp = (session: { access_token: string; refresh_token: string } | null) => {
    if (!session) {
      window.location.href = appUrl + '/login';
      return;
    }
    const hash = `access_token=${encodeURIComponent(session.access_token)}&refresh_token=${encodeURIComponent(session.refresh_token)}&type=recovery`;
    window.location.href = `${callbackUrl}#${hash}`;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) { setError('Brak konfiguracji Supabase'); return; }
    setLoading(true);
    setError('');
    try {
      const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) throw err;
      redirectToApp(data.session);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Nieprawidłowy email lub hasło');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) { setError('Brak konfiguracji Supabase'); return; }
    setLoading(true);
    setError('');
    if (password !== confirmPassword) {
      setError('Hasła nie są identyczne');
      setLoading(false);
      return;
    }
    if (password.length < 8) {
      setError('Hasło min. 8 znaków, wielka i mała litera, cyfra');
      setLoading(false);
      return;
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      setError('Hasło musi zawierać wielką literę, małą literę i cyfrę');
      setLoading(false);
      return;
    }
    try {
      const { data, error: err } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: callbackUrl, data: { full_name: fullName || null } },
      });
      if (err) throw err;
      if (data.session) redirectToApp(data.session);
      else setMagicSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Rejestracja nie powiodła się');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'github') => {
    if (!supabase) { setError('Brak konfiguracji Supabase'); return; }
    setError('');
    try {
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: callbackUrl },
      });
      if (err) throw err;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Logowanie nie powiodło się');
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) { setError('Brak konfiguracji Supabase'); return; }
    setLoading(true);
    setError('');
    try {
      const { error: err } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: callbackUrl },
      });
      if (err) throw err;
      setMagicSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Wysłanie linku nie powiodło się');
    } finally {
      setLoading(false);
    }
  };

  if (magicSent) {
    return (
      <>
        <Topbar />
        <section className="auth-hero-section">
          <Container>
            <Row className="justify-content-center">
              <Col xs={12} md={8} lg={6} className="auth-card text-center">
                <div className="mb-4">
                  <RiSearchEyeFill size={48} className="text-orange" />
                </div>
                <h2 className="auth-heading">Sprawdź e-mail</h2>
                <p className="auth-subheading mt-2">Link do logowania wysłany na <strong>{email}</strong></p>
                <div className="mt-4">
                  <Button variant="outline-primary" className="px-4" onClick={() => setMagicSent(false)}>Wróć</Button>
                </div>
              </Col>
            </Row>
          </Container>
        </section>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Topbar />
      <section className="auth-hero-section">
        <Container>
          <Row className="justify-content-center">
            <Col xs={12} sm={10} md={8} lg={5} className="auth-card">
              <div className="text-center mb-4">
                <RiSearchEyeFill size={48} className="text-orange" />
                <h1 className="auth-heading mt-2">SiteSpector</h1>
                <p className="auth-subheading">Zaloguj się lub załóż konto, aby kontynuować.</p>
              </div>

              <Nav variant="pills" className="nav-pills mb-4 justify-content-center flex-nowrap">
                <Nav.Item>
                  <Nav.Link active={mode === 'login'} onClick={() => setMode('login')}>Zaloguj się</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link active={mode === 'register'} onClick={() => setMode('register')}>Zarejestruj się</Nav.Link>
                </Nav.Item>
              </Nav>

              {error && <div className="alert alert-danger text-start">{error}</div>}

              <div className="d-grid gap-2 mb-3">
                <Button variant="outline-primary" className="d-flex align-items-center justify-content-center" onClick={() => handleOAuth('google')}>
                  <GoogleIcon /> Kontynuuj z Google
                </Button>
                <Button variant="outline-primary" className="d-flex align-items-center justify-content-center" onClick={() => handleOAuth('github')}>
                  <GitHubIcon /> Kontynuuj z GitHub
                </Button>
              </div>
              <p className="auth-divider">lub e-mail</p>

              {mode === 'login' ? (
                <Form onSubmit={handleLogin}>
                  <Form.Group className="mb-3">
                    <Form.Label className="form-label">Email</Form.Label>
                    <Form.Control type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="twoj@email.com" required />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label className="form-label">Hasło</Form.Label>
                    <Form.Control type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                  </Form.Group>
                  <Button type="submit" className="btn-orange text-light w-100 mb-2" disabled={loading}>
                    {loading ? 'Logowanie...' : 'Zaloguj się'}
                  </Button>
                  <div className="text-center">
                    <button type="button" className="auth-link-btn small" onClick={handleMagicLink}>
                      Zaloguj się linkiem magicznym
                    </button>
                  </div>
                </Form>
              ) : (
                <Form onSubmit={handleRegister}>
                  <Form.Group className="mb-3">
                    <Form.Label className="form-label">Imię i nazwisko (opcjonalnie)</Form.Label>
                    <Form.Control type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Jan Kowalski" />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label className="form-label">Email</Form.Label>
                    <Form.Control type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="twoj@email.com" required />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label className="form-label">Hasło</Form.Label>
                    <Form.Control type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                    <Form.Text className="text-muted small">Min. 8 znaków, wielka i mała litera, cyfra</Form.Text>
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label className="form-label">Potwierdź hasło</Form.Label>
                    <Form.Control type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                  </Form.Group>
                  <Button type="submit" className="btn-orange text-light w-100" disabled={loading}>
                    {loading ? 'Tworzenie konta...' : 'Zarejestruj się'}
                  </Button>
                </Form>
              )}

              <p className="auth-link-row">
                {mode === 'login' ? (
                  <>Nie masz konta? <button type="button" className="auth-link-btn" onClick={() => setMode('register')}>Zarejestruj się</button></>
                ) : (
                  <>Masz konto? <button type="button" className="auth-link-btn" onClick={() => setMode('login')}>Zaloguj się</button></>
                )}
              </p>
            </Col>
          </Row>
        </Container>
      </section>
      <Footer />
    </>
  );
}
