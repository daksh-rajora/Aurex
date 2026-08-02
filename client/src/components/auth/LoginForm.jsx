import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { useLogin } from '../../hooks/useLogin.js';
import GithubButton from './GithubButton.jsx';

export const LoginForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [searchParams] = useSearchParams();
  const { handleLogin, loading, resetError } = useLogin();
  const [serverAlert, setServerAlert] = useState(null);

  useEffect(() => {
    const err = searchParams.get('error');
    if (err) {
      setServerAlert(decodeURIComponent(err));
    }
  }, [searchParams]);

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
    mode: 'onChange',
  });

  const onSubmit = async (data) => {
    setServerAlert(null);
    clearErrors();
    resetError();

    const res = await handleLogin({
      email: data.email,
      password: data.password,
    });

    if (res && !res.success) {
      triggerShake();
      const msg = res.error || '';
      const lowerMsg = msg.toLowerCase();
      const status = res.status;
      const targetField = res.field;

      // 1. Map Email Errors
      if (
        status === 404 ||
        targetField === 'email' ||
        targetField === 'emailOrUsername' ||
        lowerMsg.includes('user not found') ||
        lowerMsg.includes('email') ||
        lowerMsg.includes('user does not exist') ||
        lowerMsg.includes('invalid email')
      ) {
        setError('email', {
          type: 'server',
          message: msg.includes('user not found') ? 'User not found' : msg,
        });
        return;
      }

      // 2. Map Password Errors
      if (
        status === 401 ||
        targetField === 'password' ||
        lowerMsg.includes('password') ||
        lowerMsg.includes('incorrect password') ||
        lowerMsg.includes('wrong password')
      ) {
        setError('password', {
          type: 'server',
          message: msg.includes('incorrect password') ? 'Incorrect password' : msg,
        });
        return;
      }

      // 3. Map Server 500 / Network Failures
      if (status >= 500 || !status || lowerMsg.includes('network') || lowerMsg.includes('server')) {
        setServerAlert('Server unavailable. Please try again later.');
      } else {
        setServerAlert(msg);
      }
    }
  };

  const onError = () => {
    triggerShake();
  };

  return (
    <motion.form
      onSubmit={handleSubmit(onSubmit, onError)}
      animate={isShaking ? { x: [-8, 8, -6, 6, -3, 3, 0] } : { x: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
      noValidate
    >
      {/* Top Server & Network Error Alert Only */}
      <AnimatePresence>
        {serverAlert && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2"
          >
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">{serverAlert}</div>
            <button
              type="button"
              onClick={() => setServerAlert(null)}
              className="text-rose-400 hover:text-rose-200 text-xs font-bold cursor-pointer"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Email Input */}
      <div>
        <label htmlFor="email" className="block text-xs font-medium text-slate-300 mb-1">
          Email Address
        </label>
        <div className="relative group">
          <Mail
            className={`w-4 h-4 ${
              errors.email ? 'text-rose-400' : 'text-slate-400 group-focus-within:text-indigo-300'
            } absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200 pointer-events-none`}
          />
          <input
            id="email"
            type="email"
            autoFocus
            placeholder="Enter your email address"
            autoComplete="email"
            aria-label="Email Address"
            {...register('email', {
              required: 'Please enter your email.',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Please enter a valid email.',
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
        <div className="flex items-center justify-between mb-1">
          <label htmlFor="password" className="block text-xs font-medium text-slate-300">
            Password
          </label>
          <Link
            to="/forgot-password"
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium hover:underline transition-all duration-200"
          >
            Forgot Password?
          </Link>
        </div>
        <div className="relative group">
          <Lock
            className={`w-4 h-4 ${
              errors.password ? 'text-rose-400' : 'text-slate-400 group-focus-within:text-indigo-300'
            } absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200 pointer-events-none`}
          />
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your password"
            autoComplete="current-password"
            aria-label="Password"
            {...register('password', {
              required: 'Please enter your password.',
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
            <motion.div
              key={showPassword ? 'hide' : 'show'}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.15 }}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </motion.div>
          </button>
        </div>
        {errors.password && (
          <p className="text-xs text-rose-400 mt-1 flex items-center gap-1 font-medium">
            <span>•</span> {errors.password.message}
          </p>
        )}
      </div>

      {/* Custom Gradient Remember Me Checkbox */}
      <div className="flex items-center pt-0.5">
        <label className="flex items-center gap-2 cursor-pointer select-none group">
          <div className="relative flex items-center justify-center">
            <input
              type="checkbox"
              {...register('rememberMe')}
              className="peer appearance-none w-4 h-4 rounded-md border border-[#2A3247] bg-[#0F172A] checked:bg-gradient-to-r checked:from-[#A5B4FC] checked:to-[#D8B4FE] checked:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer"
            />
            <svg
              className="w-3 h-3 text-slate-950 absolute opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none stroke-[3]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors">
            Remember me
          </span>
        </label>
      </div>

      {/* Primary Submit Button */}
      <motion.button
        type="submit"
        disabled={loading}
        whileHover={{ scale: loading ? 1 : 1.01 }}
        whileTap={{ scale: loading ? 1 : 0.98 }}
        className="w-full py-2.5 px-4 rounded-xl font-semibold text-slate-950 bg-gradient-to-r from-[#A5B4FC] to-[#D8B4FE] hover:opacity-95 active:scale-[0.99] transition-all duration-200 shadow-lg shadow-indigo-500/20 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm cursor-pointer mt-4.5"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-slate-900" />
            <span>Signing In...</span>
          </>
        ) : (
          <span>Sign In</span>
        )}
      </motion.button>

      {/* Divider */}
      <div className="relative my-4 flex items-center justify-center">
        <div className="w-full border-t border-[#2A3247]"></div>
        <span className="absolute bg-[#141B2D] px-3 text-[11px] font-semibold text-[#94A3B8] tracking-wider uppercase">
          OR CONTINUE WITH
        </span>
      </div>

      {/* GitHub Button */}
      <GithubButton />

      {/* Sign Up Redirect Link */}
      <p className="text-center text-xs text-[#94A3B8] pt-1">
        Don't have an account?{' '}
        <Link
          to="/register"
          className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors ml-1 hover:underline"
        >
          Sign up
        </Link>
      </p>
    </motion.form>
  );
};

export default LoginForm;
