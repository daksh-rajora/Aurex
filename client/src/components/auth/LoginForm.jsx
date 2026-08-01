import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { useLogin } from '../../hooks/useLogin.js';
import GithubButton from './GithubButton.jsx';

export const LoginForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [searchParams] = useSearchParams();
  const { handleLogin, loading, error: reduxError, resetError } = useLogin();
  const [queryError, setQueryError] = useState(null);

  useEffect(() => {
    const err = searchParams.get('error');
    if (err) {
      setQueryError(decodeURIComponent(err));
    }
  }, [searchParams]);

  const activeError = queryError || reduxError;

  const handleDismissError = () => {
    setQueryError(null);
    resetError();
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (data) => {
    setQueryError(null);
    await handleLogin({
      email: data.email,
      password: data.password,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {/* Server & OAuth Error Alert */}
      <AnimatePresence>
        {activeError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2.5"
          >
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">{activeError}</div>
            <button
              type="button"
              onClick={handleDismissError}
              className="text-rose-400 hover:text-rose-200 text-xs font-bold"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Email Input */}
      <div>
        <label htmlFor="email" className="block text-xs font-medium text-slate-300 mb-1.5">
          Email Address
        </label>
        <div className="relative">
          <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="email"
            type="email"
            placeholder="name@company.com"
            autoComplete="email"
            {...register('email', {
              required: 'Email address is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Please enter a valid email address',
              },
            })}
            className={`w-full bg-[#0F172A]/90 border ${
              errors.email ? 'border-rose-500/80 ring-1 ring-rose-500/50' : 'border-[#2A3247]'
            } rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all duration-200`}
          />
        </div>
        {errors.email && (
          <p className="text-xs text-rose-400 mt-1.5 flex items-center gap-1">
            <span>•</span> {errors.email.message}
          </p>
        )}
      </div>

      {/* Password Input */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor="password" className="block text-xs font-medium text-slate-300">
            Password
          </label>
          <Link
            to="/forgot-password"
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
          >
            Forgot Password?
          </Link>
        </div>
        <div className="relative">
          <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            autoComplete="current-password"
            {...register('password', {
              required: 'Password is required',
            })}
            className={`w-full bg-[#0F172A]/90 border ${
              errors.password ? 'border-rose-500/80 ring-1 ring-rose-500/50' : 'border-[#2A3247]'
            } rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all duration-200`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-1"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.password && (
          <p className="text-xs text-rose-400 mt-1.5 flex items-center gap-1">
            <span>•</span> {errors.password.message}
          </p>
        )}
      </div>

      {/* Remember Me Checkbox */}
      <div className="flex items-center">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            {...register('rememberMe')}
            className="w-4 h-4 rounded border-[#2A3247] bg-[#0F172A] text-indigo-500 focus:ring-indigo-400 focus:ring-offset-0 cursor-pointer accent-indigo-500"
          />
          <span className="text-xs text-slate-400">Remember me</span>
        </label>
      </div>

      {/* Primary Submit Button */}
      <motion.button
        type="submit"
        disabled={loading}
        whileHover={{ scale: loading ? 1 : 1.01 }}
        whileTap={{ scale: loading ? 1 : 0.98 }}
        className="w-full py-3 px-4 rounded-xl font-semibold text-slate-950 bg-gradient-to-r from-[#A5B4FC] to-[#D8B4FE] hover:opacity-95 active:scale-[0.99] transition-all duration-200 shadow-lg shadow-indigo-500/20 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm cursor-pointer mt-6"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-slate-900" />
            <span>Signing in...</span>
          </>
        ) : (
          <span>Sign In</span>
        )}
      </motion.button>

      {/* Divider */}
      <div className="relative my-6 flex items-center justify-center">
        <div className="w-full border-t border-[#2A3247]"></div>
        <span className="absolute bg-[#141B2D] px-3 text-[11px] font-semibold text-[#94A3B8] tracking-wider uppercase">
          OR CONTINUE WITH
        </span>
      </div>

      {/* GitHub Button */}
      <GithubButton />

      {/* Sign Up Redirect Link */}
      <p className="text-center text-xs text-[#94A3B8] pt-2">
        Don't have an account?{' '}
        <Link
          to="/signup"
          className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors ml-1"
        >
          Sign up
        </Link>
      </p>
    </form>
  );
};

export default LoginForm;
