import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Loader2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import authService from '../../services/auth.service.js';

export const ForgotPasswordForm = () => {
  const [loading, setLoading] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: '',
    },
    mode: 'onChange',
  });

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  const onSubmit = async (data) => {
    setLoading(true);
    const sanitizedEmail = data.email.trim().toLowerCase();

    try {
      await authService.forgotPassword({ email: sanitizedEmail });

      // Save email in sessionStorage for Verify OTP stage
      sessionStorage.setItem('resetEmail', sanitizedEmail);

      toast.success('OTP sent successfully.');
      navigate('/verify-otp', { state: { email: sanitizedEmail } });
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        'Failed to send OTP. Please try again.';
      toast.error(errorMessage);
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
      className="space-y-6"
      noValidate
    >
      {/* Email Address Input */}
      <div>
        <label htmlFor="email" className="block text-xs font-medium text-slate-300 mb-1.5">
          Email Address
        </label>
        <div className="relative group">
          <Mail className="w-4 h-4 text-slate-400 group-focus-within:text-indigo-300 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200 pointer-events-none" />
          <input
            id="email"
            type="email"
            autoFocus
            placeholder="Enter your registered email"
            autoComplete="email"
            aria-label="Email Address"
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
          <p className="text-xs text-rose-400 mt-1.5 flex items-center gap-1 font-medium">
            <span>•</span> {errors.email.message}
          </p>
        )}
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
            <span>Sending OTP...</span>
          </>
        ) : (
          <span>Send OTP</span>
        )}
      </motion.button>

      {/* Hidden Resend Support - Prepared for Verify OTP stage */}
      <div className="hidden text-center text-xs text-[#94A3B8]">
        Didn't receive the code?
      </div>

      {/* Bottom Section Link */}
      <div className="pt-2 text-center">
        <p className="text-xs text-[#94A3B8]">
          Remember your password?{' '}
          <Link
            to="/login"
            className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors inline-flex items-center gap-1 ml-1"
          >
            <ArrowLeft className="w-3 h-3 inline" />
            <span>Back to Login</span>
          </Link>
        </p>
      </div>
    </motion.form>
  );
};

export default ForgotPasswordForm;
