import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ApiClientError, apiRequest } from '../../api/client';
import { ErrorAlert } from '../../components/ui/Primitives';
import { useAuthSession } from '../../hooks/useAuthSession';

const loginSchema = z.object({
  email: z.string().email('Enter a valid institutional or work email'),
  password: z.string().min(1, 'Password is required'),
});

const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  tenantName: z.string().optional(),
  tenantSlug: z.string().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export function AuthScreen() {
  const { login, register } = useAuthSession();
  const [mode, setMode] = useState<'login' | 'register' | 'recovery'>('login');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [recoveryEmail, setRecoveryEmail] = useState('');

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: 'owner@nordic-uni.edu', password: 'StrongPassword!2026' },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      tenantName: '',
      tenantSlug: '',
    },
  });

  const handleLogin = async (values: LoginFormValues) => {
    setErrorMsg(null);
    try {
      await login(values);
    } catch (err) {
      setErrorMsg(err instanceof ApiClientError ? err.userFacingMessage : 'Sign-in failed.');
    }
  };

  const handleRegister = async (values: RegisterFormValues) => {
    setErrorMsg(null);
    try {
      await register({
        fullName: values.fullName,
        email: values.email,
        password: values.password,
        tenantName: values.tenantName?.trim() || undefined,
        tenantSlug: values.tenantSlug?.trim() || undefined,
      });
    } catch (err) {
      setErrorMsg(err instanceof ApiClientError ? err.userFacingMessage : 'Registration failed.');
    }
  };

  const handlePasswordRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setStatusMsg(null);
    try {
      const res = await apiRequest<{ message: string }>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: recoveryEmail }),
      });
      setStatusMsg(res.message);
    } catch (err) {
      setErrorMsg(err instanceof ApiClientError ? err.userFacingMessage : 'Recovery request failed.');
    }
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
      }}
    >
      <section className="card" style={{ maxWidth: '460px', width: '100%' }} aria-label="Authentication">
        <div style={{ marginBottom: '1.25rem' }}>
          <h1 style={{ margin: '0 0 0.25rem 0', fontSize: '1.5rem' }}>Akademia AI</h1>
          <p style={{ margin: 0, color: '#475569', fontSize: '0.9rem' }}>
            Sign in or onboard your institution on the Multi-Tenant SaaS Learning Management & Intelligence Platform
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }} role="tablist">
          <button
            type="button"
            role="tab"
            data-testid="tab-login"
            aria-selected={mode === 'login'}
            className={`btn ${mode === 'login' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => {
              setMode('login');
              setErrorMsg(null);
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            role="tab"
            data-testid="tab-register"
            aria-selected={mode === 'register'}
            className={`btn ${mode === 'register' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => {
              setMode('register');
              setErrorMsg(null);
            }}
          >
            Create Account
          </button>
          <button
            type="button"
            role="tab"
            data-testid="tab-recovery"
            aria-selected={mode === 'recovery'}
            className={`btn ${mode === 'recovery' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => {
              setMode('recovery');
              setErrorMsg(null);
            }}
          >
            Account Recovery
          </button>
        </div>

        <ErrorAlert message={errorMsg} />
        {statusMsg && (
          <div
            role="status"
            style={{
              padding: '0.75rem',
              background: '#dcfce7',
              color: '#166534',
              borderRadius: '0.5rem',
              marginBottom: '1rem',
              fontSize: '0.9rem',
            }}
          >
            {statusMsg}
          </div>
        )}

        {mode === 'login' && (
          <form onSubmit={loginForm.handleSubmit(handleLogin)} noValidate>
            <div className="field">
              <label htmlFor="login-email">Email Address</label>
              <input
                id="login-email"
                data-testid="login-email-input"
                type="email"
                autoComplete="email"
                {...loginForm.register('email')}
              />
              {loginForm.formState.errors.email && (
                <span style={{ color: '#b91c1c', fontSize: '0.8rem' }}>
                  {loginForm.formState.errors.email.message}
                </span>
              )}
            </div>
            <div className="field">
              <label htmlFor="login-password">Password</label>
              <input
                id="login-password"
                data-testid="login-password-input"
                type="password"
                autoComplete="current-password"
                {...loginForm.register('password')}
              />
              {loginForm.formState.errors.password && (
                <span style={{ color: '#b91c1c', fontSize: '0.8rem' }}>
                  {loginForm.formState.errors.password.message}
                </span>
              )}
            </div>
            <button
              type="submit"
              data-testid="auth-submit-button"
              className="btn btn-primary"
              style={{ width: '100%' }}
              disabled={loginForm.formState.isSubmitting}
            >
              {loginForm.formState.isSubmitting ? 'Signing in...' : 'Sign In to Workspace'}
            </button>
          </form>
        )}

        {mode === 'register' && (
          <form onSubmit={registerForm.handleSubmit(handleRegister)} noValidate>
            <div className="field">
              <label htmlFor="register-name">Full Name</label>
              <input
                id="register-name"
                data-testid="register-fullname-input"
                type="text"
                {...registerForm.register('fullName')}
              />
              {registerForm.formState.errors.fullName && (
                <span style={{ color: '#b91c1c', fontSize: '0.8rem' }}>
                  {registerForm.formState.errors.fullName.message}
                </span>
              )}
            </div>
            <div className="field">
              <label htmlFor="register-email">Email Address</label>
              <input
                id="register-email"
                data-testid="register-email-input"
                type="email"
                {...registerForm.register('email')}
              />
              {registerForm.formState.errors.email && (
                <span style={{ color: '#b91c1c', fontSize: '0.8rem' }}>
                  {registerForm.formState.errors.email.message}
                </span>
              )}
            </div>
            <div className="field">
              <label htmlFor="register-password">Password (min 8 chars)</label>
              <input
                id="register-password"
                data-testid="register-password-input"
                type="password"
                {...registerForm.register('password')}
              />
              {registerForm.formState.errors.password && (
                <span style={{ color: '#b91c1c', fontSize: '0.8rem' }}>
                  {registerForm.formState.errors.password.message}
                </span>
              )}
            </div>
            <div className="field">
              <label htmlFor="register-tenant-name">Institution Name (Optional Initial Tenant)</label>
              <input
                id="register-tenant-name"
                data-testid="register-tenant-name-input"
                type="text"
                placeholder="e.g. Nordic Engineering University"
                {...registerForm.register('tenantName')}
              />
            </div>
            <div className="field">
              <label htmlFor="register-tenant-slug">Institution URL Slug (Optional)</label>
              <input
                id="register-tenant-slug"
                data-testid="register-tenant-slug-input"
                type="text"
                placeholder="e.g. nordic-uni"
                {...registerForm.register('tenantSlug')}
              />
            </div>
            <button
              type="submit"
              data-testid="auth-submit-button"
              className="btn btn-primary"
              style={{ width: '100%' }}
              disabled={registerForm.formState.isSubmitting}
            >
              {registerForm.formState.isSubmitting ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        )}

        {mode === 'recovery' && (
          <form onSubmit={handlePasswordRecovery}>
            <div className="field">
              <label htmlFor="recovery-email">Account Email</label>
              <input
                id="recovery-email"
                type="email"
                required
                value={recoveryEmail}
                onChange={(e) => setRecoveryEmail(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              Send Password Recovery Token
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
