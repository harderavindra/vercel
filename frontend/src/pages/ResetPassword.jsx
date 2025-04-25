import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Button from '../components/common/Button';
import StatusMessageWrapper from '../components/common/StatusMessageWrapper';
import InputText from '../components/common/InputText';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [message, setMessage] = useState({ text: '', type: '' }); // type: 'success' | 'error'
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validatePassword = (password) => {
    // Minimum 8 chars, at least 1 letter and 1 number
    const regex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
    return regex.test(password);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.newPassword) {
      newErrors.newPassword = 'Password is required';
    } else if (!validatePassword(formData.newPassword)) {
      newErrors.newPassword = 'Password must be at least 8 characters with at least 1 letter and 1 number';
    }

    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setMessage({ text: 'Please fix the errors below', type: 'error' });
      return;
    }

    try {
      setLoading(true);
      setMessage({ text: '', type: '' });

      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_BASE_URL}/api/users/reset-password/${token}`,
        { newPassword: formData.newPassword },
        { timeout: 10000 }
      );

      setMessage({ text: res.data.message, type: 'success' });
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 
                      err.message || 
                      'Failed to reset password. Please try again.';
      setMessage({ text: errorMsg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-100">
      <form 
        onSubmit={handleReset} 
        className="bg-white p-8 rounded-lg shadow-md w-full max-w-md"
        aria-labelledby="reset-password-title"
        noValidate
      >
        <h1 id="reset-password-title" className="text-2xl font-bold mb-4 text-gray-800">
          Reset Your Password
        </h1>

        <StatusMessageWrapper
          loading={loading}
          success={message.type === 'success' ? message.text : ''}
          error={message.type === 'error' ? message.text : ''}
          loadingMessage="Updating password..."
        />

        <div className="mb-4">
          <label htmlFor="newPassword" className="block text-sm text-gray-600 mb-1">
            New Password
          </label>
          <InputText
            id="newPassword"
            name="newPassword"
            type="password"
            placeholder="Enter new password"
            value={formData.newPassword}
            handleOnChange={handleChange}
            className={`w-full p-2 mb-1 border rounded ${errors.newPassword ? 'border-red-500' : 'border-gray-300'}`}
            disabled={loading}
            required
            aria-invalid={!!errors.newPassword}
            aria-describedby={errors.newPassword ? "newPassword-error" : undefined}
          />
          {errors.newPassword && (
            <p id="newPassword-error" className="text-sm text-red-600 mb-2">
              {errors.newPassword}
            </p>
          )}
        </div>

        <div className="mb-6">
          <label htmlFor="confirmPassword" className="block text-sm text-gray-600 mb-1">
            Confirm Password
          </label>
          <InputText
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            placeholder="Confirm new password"
            value={formData.confirmPassword}
            handleOnChange={handleChange}
            className={`w-full p-2 mb-1 border rounded ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'}`}
            disabled={loading}
            required
            aria-invalid={!!errors.confirmPassword}
            aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
          />
          {errors.confirmPassword && (
            <p id="confirmPassword-error" className="text-sm text-red-600 mb-2">
              {errors.confirmPassword}
            </p>
          )}
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full"
          aria-busy={loading}
        >
          {loading ? 'Resetting...' : 'Reset Password'}
        </Button>
      </form>
    </div>
  );
};

export default ResetPassword;