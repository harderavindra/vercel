import React, { useState } from 'react';
import axios from 'axios';
import Button from '../components/common/Button';
import { Link } from 'react-router-dom';
import StatusMessageWrapper from '../components/common/StatusMessageWrapper';
import InputText from '../components/common/InputText';
import { validateEmail } from '../utils/validation'; // Extracted validation

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});

  const handleBlur = () => {
    if (email && !validateEmail(email)) {
      setErrors({...errors, email: 'Invalid email format'});
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Invalid email format';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setError('Please fix the errors below');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');
      setErrors({});

      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_BASE_URL}/api/users/forgot-password`, 
        { email },
        { timeout: 10000 } // Add timeout
      );

      setSuccess(res.data.message || 'If an account exists with this email, you will receive a reset link.');
      setSubmitted(true);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 
                         err.message || 
                         'Network error. Please check your connection and try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md transition duration-300">
        <h1 className="text-2xl font-bold mb-4 text-gray-800" id="forgot-password-title">Forgot Password</h1>

        <StatusMessageWrapper
          loading={loading}
          success={success}
          error={error}
          loadingMessage="Sending reset link..."
        />

        {!submitted || error ? (
          <form 
            onSubmit={handleSubmit}
            aria-labelledby="forgot-password-title"
            noValidate
          >
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm text-gray-600 mb-1">
                Email Address
              </label>
              <InputText 
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                className={`w-full p-2 mb-1 border rounded ${errors.email ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                value={email}
                handleOnChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors({...errors, email: ''});
                  setError('');
                }}
                onBlur={handleBlur}
                disabled={loading}
                required
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
              />
              {errors.email && (
                <p id="email-error" className="text-sm text-red-600 mb-2">
                  {errors.email}
                </p>
              )}
            </div>

            <Button 
              type="submit" 
              disabled={loading || !email}
              aria-busy={loading}
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </form>
        ) : (
          <div className="text-center mt-6">
            <p className="mb-2 text-sm text-gray-600">Want to try logging in again?</p>
            <Link 
              to="/login" 
              className="text-blue-600 hover:underline font-medium"
              aria-label="Back to login page"
            >
              Back to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;