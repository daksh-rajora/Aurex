import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import authService from '../services/auth.service.js';
import {
  loginStart,
  loginSuccess,
  loginFailure,
  clearAuthError,
} from '../redux/slices/authSlice.js';

export const useLogin = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { loading, error: reduxError } = useSelector((state) => state.auth);
  const [serverError, setServerError] = useState(null);

  const handleLogin = async (data) => {
    setServerError(null);
    dispatch(loginStart());

    try {
      const response = await authService.login(data);

      const user = response?.data?.user || response?.user || response?.data;
      const token = response?.data?.token || response?.token || response?.accessToken;

      dispatch(loginSuccess({ user, token }));
      navigate('/dashboard');
      return { success: true };
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Login failed. Please check your credentials.';

      setServerError(errorMessage);
      dispatch(loginFailure(errorMessage));
      return { success: false, error: errorMessage };
    }
  };

  const resetError = () => {
    setServerError(null);
    dispatch(clearAuthError());
  };

  return {
    handleLogin,
    loading,
    error: serverError || reduxError,
    resetError,
  };
};

export default useLogin;
