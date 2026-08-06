import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import authService from '../services/auth.service.js';
import {
  loginStart,
  loginSuccess,
  loginFailure,
  clearAuthError,
} from '../redux/slices/authSlice.js';

export const useRegister = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { loading, error: reduxError } = useSelector((state) => state.auth);
  const [serverError, setServerError] = useState(null);

  const handleRegister = async (data) => {
    setServerError(null);
    dispatch(loginStart());

    try {
      const response = await authService.register({
        fullName: data.fullName,
        username: data.username,
        email: data.email,
        password: data.password,
      });

      const user = response?.data?.user || response?.user || response?.data;
      const token = response?.data?.token || response?.token || response?.accessToken;

      if (token && user) {
        dispatch(loginSuccess({ user, token }));
        toast.success('Account created successfully! Welcome to Aurex.');
        navigate('/dashboard');
      } else {
        // If JWT token isn't returned on registration, redirect user to login page
        dispatch(clearAuthError());
        toast.success('Account created successfully! Please sign in.');
        navigate('/login');
      }

      return { success: true };
    } catch (err) {
      let errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Registration failed. Please try again.';

      if (Array.isArray(err.response?.data?.errors) && err.response.data.errors.length > 0) {
        errorMessage = err.response.data.errors.map((e) => e.message).join('; ');
      }

      setServerError(errorMessage);
      dispatch(loginFailure(errorMessage));
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const resetError = () => {
    setServerError(null);
    dispatch(clearAuthError());
  };

  return {
    handleRegister,
    loading,
    error: serverError || reduxError,
    resetError,
  };
};

export default useRegister;
