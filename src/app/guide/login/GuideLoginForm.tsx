'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { sendGuideLoginOTP, verifyGuideOTP, loginGuideWithPassword } from '@/app/actions/guideAuth';

type Step = 'email' | 'otp';
type LoginMode = 'otp' | 'password';

export function GuideLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<LoginMode>('password');
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const urlError = searchParams.get('error');

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setLoading(true);
    setError('');

    const result = await loginGuideWithPassword(email.trim(), password.trim());

    setLoading(false);

    if (result.success) {
      const redirect = searchParams.get('redirect') || '/guide/dashboard';
      router.push(redirect);
      router.refresh();
    } else {
      setError(result.error || 'Login failed');
    }
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError('');

    const result = await sendGuideLoginOTP(email.trim());

    setLoading(false);

    if (result.success) {
      setMessage('A login code has been sent to your email');
      setStep('otp');
    } else {
      // Show generic message to prevent email enumeration
      setMessage('If this email is registered, you will receive a login code.');
      setStep('otp');
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) return;

    setLoading(true);
    setError('');

    const result = await verifyGuideOTP(email.trim(), otp.trim());

    setLoading(false);

    if (result.success) {
      const redirect = searchParams.get('redirect') || '/guide/dashboard';
      router.push(redirect);
      router.refresh();
    } else {
      setError(result.error || 'Verification failed');
    }
  };

  return (
    <div className="glass rounded-2xl p-8 shadow-lg">
      {urlError && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 mb-4 text-sm">
          Authentication failed. Please try again.
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 mb-4 text-sm">
          {error}
        </div>
      )}

      {message && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 rounded-xl p-3 mb-4 text-sm">
          {message}
        </div>
      )}

      {/* Mode toggle */}
      <div className="flex rounded-xl bg-gray-100 p-1 mb-4">
        <button
          type="button"
          onClick={() => { setMode('password'); setError(''); setMessage(''); }}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${mode === 'password' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
        >
          Password
        </button>
        <button
          type="button"
          onClick={() => { setMode('otp'); setError(''); setMessage(''); }}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${mode === 'otp' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
        >
          Email Code
        </button>
      </div>

      {mode === 'password' ? (
        <form onSubmit={handlePasswordLogin} className="space-y-4">
          <div>
            <label htmlFor="email-pw" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              id="email-pw"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              autoFocus
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:outline-none text-lg"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:outline-none text-lg"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !email.trim() || !password.trim()}
            className="w-full py-3 bg-primary text-white rounded-xl font-semibold text-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      ) : step === 'email' ? (
        <form onSubmit={handleSendOTP} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              autoFocus
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:outline-none text-lg"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="w-full py-3 bg-primary text-white rounded-xl font-semibold text-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send Login Code'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOTP} className="space-y-4">
          <p className="text-sm text-gray-600 mb-2">
            Enter the 6-digit code sent to <strong>{email}</strong>
          </p>

          <div>
            <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
              Verification Code
            </label>
            <input
              id="otp"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              required
              autoFocus
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:outline-none text-lg text-center tracking-widest font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={loading || otp.length < 6}
            className="w-full py-3 bg-primary text-white rounded-xl font-semibold text-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Verify & Sign In'}
          </button>

          <button
            type="button"
            onClick={() => {
              setStep('email');
              setOtp('');
              setMessage('');
              setError('');
            }}
            className="w-full py-2 text-gray-600 text-sm hover:text-gray-900 transition-colors"
          >
            Back to email
          </button>
        </form>
      )}
    </div>
  );
}
