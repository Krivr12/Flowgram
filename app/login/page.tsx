// Implementing SPEC-001
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

type FormState = 'idle' | 'loading' | 'success' | 'error';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [formState, setFormState] = useState<FormState>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  function validateEmail(value: string): boolean {
    return value.includes('@') && value.length > 3;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!validateEmail(email)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setFormState('loading');

    // Phase 1: Simulate magic link send
    await new Promise((resolve) => setTimeout(resolve, 1200));

    // Simulate success (Phase 3: replace with Supabase auth.signInWithOtp)
    const simulateSuccess = true;
    if (simulateSuccess) {
      setFormState('success');
      setSuccessMessage('Check your inbox for a magic link');
    } else {
      setFormState('error');
      setErrorMessage('Something went wrong. Try again.');
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-4xl">⚡</span>
          <h1 className="text-2xl font-bold text-white mt-2">Flowgram</h1>
          <p className="text-slate-400 text-sm mt-1">Real-time event tracking</p>
        </div>

        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>
              Enter your email to receive a magic link.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                    disabled={formState === 'loading' || formState === 'success'}
                    aria-describedby={errorMessage ? 'email-error' : undefined}
                    aria-invalid={!!errorMessage}
                  />
                </div>
                {errorMessage && (
                  <p id="email-error" className="text-sm text-red-400 mt-1" role="alert">
                    {errorMessage}
                  </p>
                )}
              </div>

              {successMessage && (
                <div className="rounded-lg bg-green-500/10 border border-green-500/20 px-4 py-3">
                  <p className="text-sm text-green-400">{successMessage}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={formState === 'loading' || formState === 'success'}
              >
                {formState === 'loading' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending…
                  </>
                ) : formState === 'success' ? (
                  'Magic link sent!'
                ) : (
                  'Send Magic Link'
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="justify-center">
            <Link
              href="/admin"
              className="text-sm text-slate-400 hover:text-violet-400 transition-colors"
            >
              Continue as Admin →
            </Link>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
