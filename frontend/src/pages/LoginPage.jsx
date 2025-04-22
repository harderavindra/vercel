import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth-context'; // Assuming you have this for context
import LogoImage from '../assets/m-logo.svg'
import InputText from '../components/common/InputText';
import { validateEmail, validatePassword } from "../utils/validation";
import Button from '../components/common/Button';
import StatusMessageWrapper from '../components/common/StatusMessageWrapper';
import { FiEye, FiEyeOff } from 'react-icons/fi';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('')
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false);


  const navigate = useNavigate();
  const { login } = useAuth();  // Assuming you have a login function in your context

  useEffect(() => {
    let timer;
    if (showPassword) {
      timer = setTimeout(() => setShowPassword(false), 3000); // 10 seconds
    }
    return () => clearTimeout(timer);
  }, [showPassword]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!validatePassword(password)) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    try {
      setLoading(true)

      // Perform the login action
      await login(email, password);

      setSuccess("Login successful! Redirecting...");
      setTimeout(() => navigate("/"), 1500);
    } catch (error) {
      setError("Invalid email or password. Please try again.");
    } finally {
      setIsSubmitting(false);
      setLoading(false)

    }
  };

  return (
    <div className="bg-gray-50 w-screen h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg p-6 flex flex-col shadow-lg ring-1  shadow-gray-200/50  ring-gray-200/70 ring-offset-0">

        <h2 className="text-xl  mb-4 text-center font-bold">Welcome back</h2>
        <span className="flex gap-3 text-2xl items-end font-semibold font-base/2 py-2 justify-center"><img src={LogoImage} className="h-8" alt="Description" />Catena</span>

        <form onSubmit={handleSubmit} autoComplete="on">
          <InputText
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            handleOnChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            aria-label="Email"
            aria-describedby="email-error"
            required
          />
          <div className='relative'>
            <InputText
              label="Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              handleOnChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              aria-label="Email"
              aria-describedby="email-error"
              required
            />
            <button
              type="button"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3 bottom-2 w-6 h-6 flex justify-center items-center cursor-pointer"
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
            </button>
          </div>

          <Button className='w-full my-4' type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </Button>

        </form>
        <StatusMessageWrapper loading={loading} success={success} error={error} />
      </div>
    </div>
  );
};

export default LoginPage;
