// frontend/src/components/LoginPage.tsx
import React, { useEffect } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { MicrosoftLoginButton, GoogleLoginButton} from 'react-social-login-buttons';

const LoginPage: React.FC = () => {
    const { isAuthenticated, isLoading, checkAuth } = useAuth();
    const location = useLocation();
    const from = location.state?.from?.pathname || "/";
    
    // Determine if we're in production based on hostname
    const isProduction = window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1');
    
    // Get base URL for API calls
    const baseURL = isProduction ? window.location.origin : '';
    
    useEffect(() => {
        // Check for authentication on mount and URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const hasAuthParams = urlParams.has('code') || urlParams.has('token');
        
        if (hasAuthParams) {
            console.log('Auth parameters detected in URL, checking auth status');
            checkAuth();
        }
    }, [checkAuth]);

    const handleMicrosoftLogin = () => {
        console.log('Redirecting to Microsoft login');
        window.location.href = `${baseURL}/auth/login/azuread-oauth2/?prompt=select_account`;
    };
    
    const handleGoogleLogin = () => {
        console.log('Redirecting to Google login');
        window.location.href = `${baseURL}/auth/login/google-oauth2/`;
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Cargando...</p>
                </div>
            </div>
        );
    }

    if (isAuthenticated) {
       console.log(`User is authenticated, redirecting to: ${from}`);
       return <Navigate to={from} replace />;
    }

    return (
        <div className="login-page">
            <h2>Welcome back</h2>
            <p>Please enter your details</p>
            
            {/* Microsoft Login Button */}
            <MicrosoftLoginButton 
                onClick={handleMicrosoftLogin}
                style={{ width: '250px', margin: '0 auto' }}
                className="login-button"
                text="Sign in with Microsoft"
            />
            
            <div className="or-separator">or</div>
            
            {/* Google Login Button */}
            <GoogleLoginButton
                onClick={handleGoogleLogin}
                style={{ width: '250px', margin: '0 auto' }}
                className="login-button"
                text="Sign in with Google"
            />

            {/* Don't have an account link */}
            <div className="signup-link">
                Don't have an account? <a href="/signup">Sign up</a>
            </div>
        </div>
    );
};

export default LoginPage;