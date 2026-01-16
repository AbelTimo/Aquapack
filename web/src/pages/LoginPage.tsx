import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/services/api';
import { DEMO_CREDENTIALS } from '@/services/mockData';

interface LoginForm {
  email: string;
  password: string;
}

export default function LoginPage() {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    setError('');
    setIsLoading(true);

    try {
      const response = await authApi.login(data.email, data.password);
      setAuth(response.data.user, response.data.tokens);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError('');
    setIsDemoLoading(true);

    try {
      localStorage.setItem('aquapack-demo-mode', 'true');
      const response = await authApi.login(DEMO_CREDENTIALS.email, DEMO_CREDENTIALS.password);

      if (response?.data?.user && response?.data?.tokens) {
        setAuth(response.data.user, response.data.tokens);
        window.location.href = window.location.pathname.includes('/Aquapack') ? '/Aquapack/#/dashboard' : '/#/dashboard';
      } else {
        setError('Invalid response from demo login');
        setIsDemoLoading(false);
      }
    } catch (err: any) {
      console.error('Demo login error:', err);
      setError(err?.response?.data?.error?.message || err?.message || 'Demo login failed.');
      setIsDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-aqua-600 via-aqua-700 to-aqua-900 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <span className="text-2xl font-bold">Aquapack</span>
          </div>

          {/* Main content */}
          <div className="max-w-md">
            <h1 className="text-4xl font-bold mb-6 leading-tight">
              Hydrogeology Field Data Management
            </h1>
            <p className="text-xl text-aqua-100 mb-8">
              Collect, manage, and analyze groundwater data with ease. From borehole logging to water quality monitoring.
            </p>

            {/* Features */}
            <div className="space-y-4">
              {[
                { icon: '📍', text: 'GPS-enabled site documentation' },
                { icon: '📊', text: 'Real-time data visualization' },
                { icon: '📱', text: 'Offline-first mobile app' },
                { icon: '✅', text: 'Quality assurance workflows' },
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3 text-aqua-100">
                  <span className="text-xl">{feature.icon}</span>
                  <span>{feature.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <p className="text-sm text-aqua-200">
            Trusted by hydrogeology teams worldwide
          </p>
        </div>

        {/* Decorative elements */}
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute top-1/4 -right-10 w-60 h-60 bg-aqua-400/20 rounded-full blur-2xl" />
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-aqua-500 to-aqua-700 rounded-xl flex items-center justify-center shadow-lg shadow-aqua-500/30">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-gray-900">Aquapack</span>
          </div>

          {/* Header */}
          <div className="text-center lg:text-left mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
            <p className="mt-2 text-gray-600">Sign in to your account to continue</p>
          </div>

          {/* Error message */}
          {error && (
            <div className="alert-error mb-6 animate-slide-down">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Login form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="form-group">
              <label htmlFor="email" className="label">Email address</label>
              <input
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  },
                })}
                type="email"
                id="email"
                autoComplete="email"
                className={`input ${errors.email ? 'input-error' : ''}`}
                placeholder="you@example.com"
              />
              {errors.email && (
                <p className="form-error">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="password" className="label">Password</label>
              <input
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 8,
                    message: 'Password must be at least 8 characters',
                  },
                })}
                type="password"
                id="password"
                autoComplete="current-password"
                className={`input ${errors.password ? 'input-error' : ''}`}
                placeholder="Enter your password"
              />
              {errors.password && (
                <p className="form-error">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="checkbox" />
                <span className="text-sm text-gray-600">Remember me</span>
              </label>
              <a href="#" className="text-sm font-medium text-aqua-600 hover:text-aqua-700">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={isLoading || isDemoLoading}
              className="btn-primary w-full btn-lg"
            >
              {isLoading ? (
                <>
                  <span className="spinner spinner-sm" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="divider-text my-6">or continue with</div>

          {/* Demo login */}
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={isLoading || isDemoLoading}
            className="btn-outline w-full btn-lg"
          >
            {isDemoLoading ? (
              <>
                <span className="spinner spinner-sm" />
                Loading demo...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Try Demo Mode
              </>
            )}
          </button>

          {/* Sign up link */}
          <p className="mt-8 text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-aqua-600 hover:text-aqua-700">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
