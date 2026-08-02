import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, AtSign, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { useRegister } from '../../hooks/useRegister.js';
import GithubButton from './GithubButton.jsx';

export const RegisterForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [searchParams] = useSearchParams();
  const { handleRegister, loading, error: reduxError, resetError } = useRegister();
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
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      fullName: '',
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    mode: 'onChange',
  });

  const watchPassword = watch('password', '');

  // Calculate Password Strength
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: '', color: 'bg-slate-700' };

    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (/[a-z]/.test(pwd)) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    switch (score) {
      case 1:
      case 2:
        return { score, label: 'Weak', color: 'bg-rose-500', textColor: 'text-rose-400' };
      case 3:
        return { score, label: 'Medium', color: 'bg-amber-500', textColor: 'text-amber-400' };
      case 4:
        return { score, label: 'Strong', color: 'bg-emerald-500', textColor: 'text-emerald-400' };
      case 5:
        return { score, label: 'Very Strong', color: 'bg-indigo-400', textColor: 'text-indigo-300' };
      default:
        return { score: 0, label: '', color: 'bg-slate-700', textColor: 'text-slate-400' };
    }
  };

  const strength = getPasswordStrength(watchPassword);

  const onSubmit = async (data) => {
    setQueryError(null);
    await handleRegister({
      fullName: data.fullName,
      username: data.username,
      email: data.email,
      password: data.password,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
      {/* Server & OAuth Error Alert */}
      <AnimatePresence>
        {activeError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2"
          >
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">{activeError}</div>
            <button
              type="button"
              onClick={handleDismissError}
              className="text-rose-400 hover:text-rose-200 text-xs font-bold cursor-pointer"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full Name Input */}
      <div>
        <label htmlFor="fullName" className="block text-xs font-medium text-slate-300 mb-1">
          Full Name
        </label>
        <div className="relative group">
          <User className="w-4 h-4 text-slate-400 group-focus-within:text-indigo-300 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200 pointer-events-none" />
          <input
            id="fullName"
            type="text"
            placeholder="Enter your name"
            autoComplete="name"
            {...register('fullName', {
              required: 'Full name is required',
              minLength: {
                value: 3,
                message: 'Full name must be at least 3 characters',
              },
              maxLength: {
                value: 100,
                message: 'Full name cannot exceed 100 characters',
              },
            })}
            className={`w-full bg-[#0F172A]/90 border ${
              errors.fullName ? 'border-rose-500/80 ring-1 ring-rose-500/50' : 'border-[#2A3247]'
            } rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 focus:shadow-[0_0_20px_rgba(165,180,252,0.15)] transition-all duration-200`}
          />
        </div>
        {errors.fullName && (
          <p className="text-xs text-rose-400 mt-1 flex items-center gap-1 font-medium">
            <span>•</span> {errors.fullName.message}
          </p>
        )}
      </div>

      {/* Username Input */}
      <div>
        <label htmlFor="username" className="block text-xs font-medium text-slate-300 mb-1">
          Username
        </label>
        <div className="relative group">
          <AtSign className="w-4 h-4 text-slate-400 group-focus-within:text-indigo-300 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200 pointer-events-none" />
          <input
            id="username"
            type="text"
            placeholder="username"
            autoComplete="username"
            {...register('username', {
              required: 'Username is required',
              minLength: {
                value: 3,
                message: 'Username must be at least 3 characters',
              },
              maxLength: {
                value: 30,
                message: 'Username cannot exceed 30 characters',
              },
              pattern: {
                value: /^[a-zA-Z0-9_]+$/,
                message: 'Only letters, numbers, and underscores allowed',
              },
            })}
            className={`w-full bg-[#0F172A]/90 border ${
              errors.username ? 'border-rose-500/80 ring-1 ring-rose-500/50' : 'border-[#2A3247]'
            } rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 focus:shadow-[0_0_20px_rgba(165,180,252,0.15)] transition-all duration-200`}
          />
        </div>
        {errors.username && (
          <p className="text-xs text-rose-400 mt-1 flex items-center gap-1 font-medium">
            <span>•</span> {errors.username.message}
          </p>
        )}
      </div>

      {/* Email Input */}
      <div>
        <label htmlFor="email" className="block text-xs font-medium text-slate-300 mb-1">
          Email Address
        </label>
        <div className="relative group">
          <Mail className="w-4 h-4 text-slate-400 group-focus-within:text-indigo-300 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200 pointer-events-none" />
          <input
            id="email"
            type="email"
            placeholder="name@email.com"
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
            } rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 focus:shadow-[0_0_20px_rgba(165,180,252,0.15)] transition-all duration-200`}
          />
        </div>
        {errors.email && (
          <p className="text-xs text-rose-400 mt-1 flex items-center gap-1 font-medium">
            <span>•</span> {errors.email.message}
          </p>
        )}
      </div>

      {/* Password Input */}
      <div>
        <label htmlFor="password" className="block text-xs font-medium text-slate-300 mb-1">
          Password
        </label>
        <div className="relative group">
          <Lock className="w-4 h-4 text-slate-400 group-focus-within:text-indigo-300 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200 pointer-events-none" />
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            autoComplete="new-password"
            {...register('password', {
              required: 'Password is required',
              minLength: {
                value: 8,
                message: 'Password must be at least 8 characters long',
              },
              validate: {
                hasUpper: (v) => /[A-Z]/.test(v) || 'Must contain at least one uppercase letter',
                hasLower: (v) => /[a-z]/.test(v) || 'Must contain at least one lowercase letter',
                hasNumber: (v) => /[0-9]/.test(v) || 'Must contain at least one number',
                hasSpecial: (v) => /[^A-Za-z0-9]/.test(v) || 'Must contain at least one special character',
              },
            })}
            className={`w-full bg-[#0F172A]/90 border ${
              errors.password ? 'border-rose-500/80 ring-1 ring-rose-500/50' : 'border-[#2A3247]'
            } rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 focus:shadow-[0_0_20px_rgba(165,180,252,0.15)] transition-all duration-200`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-1 cursor-pointer"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.password && (
          <p className="text-xs text-rose-400 mt-1 flex items-center gap-1 font-medium">
            <span>•</span> {errors.password.message}
          </p>
        )}

        {/* Password Strength Meter */}
        {watchPassword && (
          <div className="mt-1.5 space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 font-medium">Password Strength:</span>
              <span className={`font-semibold ${strength.textColor}`}>{strength.label}</span>
            </div>
            <div className="h-1.5 w-full bg-[#0F172A] rounded-full overflow-hidden flex gap-1 p-0.5 border border-[#2A3247]/50">
              {[1, 2, 3, 4, 5].map((step) => (
                <div
                  key={step}
                  className={`h-full flex-1 rounded-full transition-all duration-300 ${
                    step <= strength.score ? strength.color : 'bg-slate-800'
                  }`}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Confirm Password Input */}
      <div>
        <label htmlFor="confirmPassword" className="block text-xs font-medium text-slate-300 mb-1">
          Confirm Password
        </label>
        <div className="relative group">
          <Lock className="w-4 h-4 text-slate-400 group-focus-within:text-indigo-300 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200 pointer-events-none" />
          <input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="••••••••"
            autoComplete="new-password"
            {...register('confirmPassword', {
              required: 'Please confirm your password',
              validate: (val) => val === watchPassword || 'Passwords do not match',
            })}
            className={`w-full bg-[#0F172A]/90 border ${
              errors.confirmPassword ? 'border-rose-500/80 ring-1 ring-rose-500/50' : 'border-[#2A3247]'
            } rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 focus:shadow-[0_0_20px_rgba(165,180,252,0.15)] transition-all duration-200`}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-1 cursor-pointer"
            aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
          >
            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-xs text-rose-400 mt-1 flex items-center gap-1 font-medium">
            <span>•</span> {errors.confirmPassword.message}
          </p>
        )}
      </div>

      {/* Primary Submit Button */}
      <motion.button
        type="submit"
        disabled={loading}
        whileHover={{ scale: loading ? 1 : 1.01 }}
        whileTap={{ scale: loading ? 1 : 0.98 }}
        className="w-full py-2.5 px-4 rounded-xl font-semibold text-slate-950 bg-gradient-to-r from-[#A5B4FC] to-[#D8B4FE] hover:opacity-95 active:scale-[0.99] transition-all duration-200 shadow-lg shadow-indigo-500/20 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm cursor-pointer mt-4"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-slate-900" />
            <span>Creating Account...</span>
          </>
        ) : (
          <span>Create Account</span>
        )}
      </motion.button>

      {/* Divider */}
      <div className="relative my-3.5 flex items-center justify-center">
        <div className="w-full border-t border-[#2A3247]"></div>
        <span className="absolute bg-[#141B2D] px-3 text-[11px] font-semibold text-[#94A3B8] tracking-wider uppercase">
          OR CONTINUE WITH
        </span>
      </div>

      {/* GitHub Button */}
      <GithubButton />

      {/* Sign In Redirect Link */}
      <p className="text-center text-xs text-[#94A3B8] pt-1">
        Already have an account?{' '}
        <Link
          to="/login"
          className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors ml-1 hover:underline"
        >
          Sign In
        </Link>
      </p>
    </form>
  );
};

export default RegisterForm;
