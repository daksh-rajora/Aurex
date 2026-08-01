import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Loader2, AlertCircle } from 'lucide-react';
import { loginSuccess, loginFailure } from '../../redux/slices/authSlice.js';
import authService from '../../services/auth.service.js';

export const GithubCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [statusMessage, setStatusMessage] = useState('Signing you in...');
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    const processCallback = async () => {
      const token = searchParams.get('token');
      const errorParam = searchParams.get('error');

      if (errorParam) {
        const decodedError = decodeURIComponent(errorParam);
        setErrorMessage(decodedError);
        dispatch(loginFailure(decodedError));
        setTimeout(() => {
          navigate(`/login?error=${encodeURIComponent(decodedError)}`, { replace: true });
        }, 1500);
        return;
      }

      if (!token) {
        const missingTokenErr = 'No authentication token received from GitHub.';
        setErrorMessage(missingTokenErr);
        dispatch(loginFailure(missingTokenErr));
        setTimeout(() => {
          navigate(`/login?error=${encodeURIComponent(missingTokenErr)}`, { replace: true });
        }, 1500);
        return;
      }

      try {
        setStatusMessage('Verifying credentials & fetching user profile...');
        
        // 1. Store token in localStorage
        localStorage.setItem('token', token);

        // 2. Fetch authenticated user profile using token
        const response = await authService.getCurrentUser();
        const user = response?.data?.user || response?.data || response?.user;

        if (!user) {
          throw new Error('Failed to retrieve user profile.');
        }

        // 3. Update Redux store
        dispatch(loginSuccess({ user, token }));

        // 4. Redirect to dashboard
        setStatusMessage('Authentication successful! Redirecting...');
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 500);
      } catch (err) {
        console.error('[GitHub Callback Frontend Error]', err);
        const errMsg = err.response?.data?.message || err.message || 'Authentication failed.';
        setErrorMessage(errMsg);
        localStorage.removeItem('token');
        dispatch(loginFailure(errMsg));

        setTimeout(() => {
          navigate(`/login?error=${encodeURIComponent(errMsg)}`, { replace: true });
        }, 1500);
      }
    };

    processCallback();
  }, [searchParams, navigate, dispatch]);

  return (
    <div className="min-h-screen w-full bg-[#0B1120] text-slate-100 flex flex-col items-center justify-center p-6 relative overflow-hidden select-none">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="bg-[#141B2D] border border-[#2A3247] p-8 sm:p-10 rounded-2xl max-w-sm w-full text-center space-y-5 shadow-2xl backdrop-blur-xl relative z-10">
        <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
          Aurex AI
        </h1>

        {errorMessage ? (
          <div className="space-y-3 pt-2">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-base font-semibold text-rose-300">Authentication Failed</h2>
            <p className="text-xs text-slate-400 leading-relaxed">{errorMessage}</p>
            <p className="text-[11px] text-slate-500">Redirecting to login...</p>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <div className="relative w-12 h-12 mx-auto flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white tracking-tight">{statusMessage}</h2>
              <p className="text-xs text-[#94A3B8] mt-1.5">
                Please wait while we complete your GitHub login.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GithubCallback;
