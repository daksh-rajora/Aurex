import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import authService from '../../services/auth.service.js';

export const VerifyOtpForm = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // 1. Read stored email from location state or sessionStorage
  const [email, setEmail] = useState(() => {
    return location.state?.email || sessionStorage.getItem('resetEmail') || '';
  });

  // 2. Redirect back to forgot-password if no email is stored in session
  useEffect(() => {
    const currentEmail = location.state?.email || sessionStorage.getItem('resetEmail');
    if (!currentEmail) {
      toast.error('No active reset request found. Please enter your email.');
      navigate('/forgot-password', { replace: true });
    } else {
      sessionStorage.setItem('resetEmail', currentEmail);
      setEmail(currentEmail);
    }
  }, [location.state, navigate]);

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState(null);
  const [isShaking, setIsShaking] = useState(false);

  // 10:00 Countdown Timer (600 seconds)
  const [timeLeft, setTimeLeft] = useState(600);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError(null);

    // Auto focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pastedData) return;

    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);
    setError(null);

    const focusIndex = Math.min(pastedData.length, 5);
    inputRefs.current[focusIndex]?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const targetEmail = sessionStorage.getItem('resetEmail') || email;
    if (!targetEmail) {
      toast.error('Session expired. Please request a new OTP.');
      navigate('/forgot-password', { replace: true });
      return;
    }

    const otpCode = otp.join('');
    if (otpCode.length !== 6 || !/^\d{6}$/.test(otpCode)) {
      const validationMsg = 'Please enter a valid 6-digit OTP.';
      setError(validationMsg);
      toast.error(validationMsg);
      triggerShake();
      return;
    }

    // Development Console Log
    if (import.meta.env.DEV || process.env.NODE_ENV !== 'production') {
      console.log('Sending Verify OTP Request:', {
        email: targetEmail,
        otp: otpCode,
      });
    }

    setLoading(true);

    try {
      const response = await authService.verifyResetOtp({
        email: targetEmail,
        otp: otpCode,
      });

      if (response?.success || response?.data?.verified || response?.statusCode === 200) {
        toast.success('OTP verified successfully.');
        sessionStorage.setItem('resetVerified', 'true');
        sessionStorage.setItem('resetEmail', targetEmail);

        navigate('/auth/reset-password', {
          state: { email: targetEmail, verified: true },
        });
      } else {
        const errMsg = response?.message || 'Invalid or expired OTP.';
        setError(errMsg);
        toast.error(errMsg);
        triggerShake();
      }
    } catch (err) {
      const errMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Invalid or expired OTP.';
      setError(errMsg);
      toast.error(errMsg);
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    const targetEmail = sessionStorage.getItem('resetEmail') || email;
    if (!targetEmail) {
      toast.error('Session expired. Please request a new OTP.');
      navigate('/forgot-password', { replace: true });
      return;
    }

    if (timeLeft > 0 || resending) return;

    setResending(true);
    setError(null);

    try {
      await authService.forgotPassword({ email: targetEmail });
      toast.success('OTP sent successfully.');
      setTimeLeft(600);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      const errMsg =
        err.response?.data?.message ||
        err.message ||
        'Failed to resend OTP. Please try again.';
      toast.error(errMsg);
    } finally {
      setResending(false);
    }
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      animate={isShaking ? { x: [-8, 8, -6, 6, -3, 3, 0] } : { x: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-5"
    >
      {/* Email Info Banner */}
      <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs text-center leading-relaxed">
        We sent a verification code to your email{' '}
        <span className="font-semibold text-white break-all">{email}</span>
      </div>

      {/* Error Alert Banner */}
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

      {/* 6-Digit OTP Inputs */}
      <div>
        <label className="block text-xs font-medium text-slate-300 mb-2 text-center">
          Enter 6-Digit Code
        </label>
        <div className="flex items-center justify-between gap-1.5 sm:gap-2" onPaste={handlePaste}>
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              autoFocus={index === 0}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className={`w-11 h-12 sm:w-12 sm:h-13 text-center text-lg font-bold text-white bg-[#0F172A]/90 border ${
                digit
                  ? 'border-indigo-400 ring-2 ring-indigo-500/20'
                  : error
                  ? 'border-rose-500/80 ring-1 ring-rose-500/50'
                  : 'border-[#2A3247]'
              } rounded-xl focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 focus:shadow-[0_0_20px_rgba(165,180,252,0.15)] transition-all duration-200`}
            />
          ))}
        </div>
      </div>

      {/* Timer & Resend OTP Section */}
      <div className="flex items-center justify-between text-xs pt-1">
        <div className="text-slate-400 flex items-center gap-1.5">
          <span>Expires in:</span>
          <span className="font-mono font-bold text-indigo-300">{formatTime(timeLeft)}</span>
        </div>

        <button
          type="button"
          onClick={handleResend}
          disabled={timeLeft > 0 || resending}
          className={`font-semibold transition-all duration-200 flex items-center gap-1 cursor-pointer ${
            timeLeft > 0 || resending
              ? 'text-slate-500 cursor-not-allowed opacity-50'
              : 'text-indigo-400 hover:text-indigo-300 hover:underline'
          }`}
        >
          {resending ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Resending...</span>
            </>
          ) : (
            <>
              <RefreshCw className="w-3 h-3" />
              <span>Resend OTP</span>
            </>
          )}
        </button>
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
            <span>Verifying...</span>
          </>
        ) : (
          <span>Verify Code</span>
        )}
      </motion.button>

      {/* Back to Login Link */}
      <div className="pt-1 text-center">
        <Link
          to="/login"
          className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors inline-flex items-center gap-1"
        >
          <ArrowLeft className="w-3 h-3 inline" />
          <span>Back to Login</span>
        </Link>
      </div>
    </motion.form>
  );
};

export default VerifyOtpForm;
