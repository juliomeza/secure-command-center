// frontend/src/components/LoginPage.tsx
import React from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { MicrosoftLoginButton } from 'react-social-login-buttons';

const LoginPage: React.FC = () => {
    const { isAuthenticated, isLoading } = useAuth();
    const location = useLocation();
    const from = location.state?.from?.pathname || "/"; // Redirect location after login

    const handleMicrosoftLogin = () => {
        // Redirect to the backend's Microsoft OAuth2 start URL with prompt=select_account
        // This forces Microsoft to show the account selection screen
        window.location.href = `/auth/login/azuread-oauth2/?prompt=select_account`;
    };

    if (isLoading) {
        return <div>Loading...</div>;
    }

    // If user is already authenticated, redirect them away from login page
    if (isAuthenticated) {
       return <Navigate to={from} replace />;
    }

    return (
        <div className="container login-page">
            <h2>Login</h2>
            <p>Please login to access the dashboard.</p>
            <MicrosoftLoginButton 
                onClick={handleMicrosoftLogin}
                style={{ width: '250px', margin: '0 auto' }}
                light
            >
                Login with Microsoft
            </MicrosoftLoginButton>
            {/*
            // Placeholder for future email/password login form
            <hr />
            <h4>Or login with Email/Password (Not Implemented)</h4>
            <form>
                <div><label>Email: <input type="email" disabled /></label></div>
                <div><label>Password: <input type="password" disabled /></label></div>
                <button type="submit" disabled>Login</button>
            </form>
             */}
        </div>
    );
};

export default LoginPage;