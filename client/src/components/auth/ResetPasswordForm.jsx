import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import authService from '../../services/auth.service.js';

export const ResetPasswordForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isShaking, setIsShaking] = useState(false);
  const navigate = useNavigate();

  const [resetEmail, setResetEmail] = useState('');

  // Security Check: Redirect if resetVerified or resetEmail is missing
  useEffect(() => {
    const isVerified = sessionStorage.getItem('resetVerified');
    const storedEmail = sessionStorage.getItem('resetEmail');

    if (isVerified !== 'true' || !storedEmail) {
      toast.error('Unauthorized access. Please verify your OTP code first.');
      navigate('/forgot-password', { replace: true });
    } else {
      setResetEmail(storedEmail);
    }
  }, [navigate]);

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
    mode: 'onChange',
  });

  const watchPassword = watch('password', '');
  const watchConfirmPassword = watch('confirmPassword', '');

  // Dynamic Password Strength Meter Calculation
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
        return { score, label: 'Very Weak', color: 'bg-rose-600', textColor: 'text-rose-500' };
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
    setError(null);

    const email = sessionStorage.getItem('resetEmail') || resetEmail;
    if (!email) {
      toast.error('Session expired. Please start forgot password flow again.');
      navigate('/forgot-password', { replace: true });
      return;
    }

    setLoading(true);

    try {
      const response = await authService.resetPassword({
        email,
        password: data.password,
      });

      if (response?.success || response?.statusCode === 200) {
        toast.success('Password updated successfully.');

        // Clear sensitive session storage flags
        sessionStorage.removeItem('resetEmail');
        sessionStorage.removeItem('resetVerified');

        // Automatically redirect to login page after 2 seconds
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 2000);
      } else {
        const errMsg = response?.message || 'Failed to update password. Please try again.';
        setError(errMsg);
        toast.error(errMsg);
        triggerShake();
      }
    } catch (err) {
      const errMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Failed to reset password. Please try again.';
      setError(errMsg);
      toast.error(errMsg);
      triggerShake();
    } finally {
      setLoading(false);
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
      {/* Error Alert */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <div className="flex-1">{error}</div>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-rose-400 hover:text-rose-200 text-xs font-bold cursor-pointer"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Password Input */}
      <div>
        <label htmlFor="password" className="block text-xs font-medium text-slate-300 mb-1">
          New Password
        </label>
        <div className="relative group">
          <Lock className="w-4 h-4 text-slate-400 group-focus-within:text-indigo-300 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200 pointer-events-none" />
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter new password"
            autoFocus
            autoComplete="new-password"
            {...register('password', {
              required: 'New password is required',
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

        {/* Live Password Strength Meter */}
        {watchPassword && (
          <div className="mt-2 space-y-1.5">
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
            placeholder="Confirm new password"
            autoComplete="new-password"
            {...register('confirmPassword', {
              required: 'Please confirm your new password',
              validate: (val) => val === watchPassword || 'Passwords do not match',
            })}
            className={`w-full bg-[#0F172A]/90 border ${
              errors.confirmPassword
                ? 'border-rose-500/80 ring-1 ring-rose-500/50'
                : watchConfirmPassword && watchConfirmPassword === watchPassword
                ? 'border-emerald-500/80 ring-1 ring-emerald-500/30'
                : 'border-[#2A3247]'
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

        {/* Real-time Confirm Password Matching Indicator */}
        {watchConfirmPassword && (
          <div className="mt-1.5">
            {watchConfirmPassword === watchPassword ? (
              <p className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 inline" />
                <span>Passwords match</span>
              </p>
            ) : (
              <p className="text-xs text-rose-400 font-medium flex items-center gap-1">
                <span>•</span> Passwords do not match
              </p>
            )}
          </div>
        )}
      </div>

      {/* Primary Submit Button */}
      <motion.button
        type="submit"
        disabled={loading}
        whileHover={{ scale: loading ? 1 : 1.01 }}
        whileTap={{ scale: loading ? 1 : 0.98 }}
        className="w-full py-2.5 px-4 rounded-xl font-semibold text-slate-950 bg-gradient-to-r from-[#A5B4FC] to-[#D8B4FE] hover:opacity-95 active:scale-[0.99] transition-all duration-200 shadow-lg shadow-indigo-500/20 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm cursor-pointer mt-5"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-slate-900" />
            <span>Updating...</span>
          </>
        ) : (
          <span>Update Password</span>
        )}
      </motion.button>
    </motion.form>
  );
};

export default ResetPasswordForm;
