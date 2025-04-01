import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth-context'; // Assuming you have this for context

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const { login } = useAuth();  // Assuming you have a login function in your context

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Perform the login action
            await login(email, password);

            // After successful login, navigate to the home page or profile page
            navigate('/');  // or navigate('/profile') depending on where you want to go
        } catch (err) {
            console.error('Login failed:', err);
        }
    };

    return (
        <div>
            <h1>Login</h1>
            <form onSubmit={handleSubmit}>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    required
                />
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    required
                />
                <button type="submit">Login</button>
            </form>
        </div>
    );
};

export default LoginPage;
