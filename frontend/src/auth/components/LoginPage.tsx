// frontend/src/components/LoginPage.tsx
import React, { useEffect } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { MicrosoftLoginButton, GoogleLoginButton} from 'react-social-login-buttons';

const LoginPage: React.FC = () => {
    const { isAuthenticated, isLoading, checkAuthStatus } = useAuth();
    const location = useLocation();
    const from = location.state?.from?.pathname || "/";

    // Determine if we're in production based on hostname
    const isProduction = window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1');
    
    // Get base URL for API calls - Use the correct backend URL for OAuth
    const baseURL = isProduction
        ? 'https://dashboard-control-back.onrender.com'
        : '';

    useEffect(() => {
        // Check for authentication on mount and URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        // Check for OAuth callback parameters OR JWT tokens from our custom flow
        const hasAuthParams = urlParams.has('code') || urlParams.has('state') || urlParams.has('jwt_access');

        if (hasAuthParams) {
            console.log('[LoginPage] Auth parameters detected in URL, checking auth status');
            // Call the renamed function
            checkAuthStatus();
        }
        // Update dependency array
    }, [checkAuthStatus]);

    // Add a redirect attempts counter
    const attemptKey = 'loginRedirectAttempts';

    const handleMicrosoftLogin = () => {
        // Check and handle redirect attempts to avoid loops
        const attempts = parseInt(sessionStorage.getItem(attemptKey) || '0');
        
        if (attempts > 3) {
            console.log('Too many redirect attempts, clearing counter');
            sessionStorage.removeItem(attemptKey);
            alert('There was a problem with authentication. Please try again later.');
            return;
        }
        
        sessionStorage.setItem(attemptKey, (attempts + 1).toString());
        
        console.log('Redirecting to Microsoft login');
        window.location.assign(`${baseURL}/auth/login/azuread-oauth2/?prompt=select_account`);
    };
    
    const handleGoogleLogin = () => {
        // Check and handle redirect attempts to avoid loops
        const attempts = parseInt(sessionStorage.getItem(attemptKey) || '0');
        
        if (attempts > 3) {
            console.log('Too many redirect attempts, clearing counter');
            sessionStorage.removeItem(attemptKey);
            alert('There was a problem with authentication. Please try again later.');
            return;
        }
        
        sessionStorage.setItem(attemptKey, (attempts + 1).toString());
        
        console.log('Redirecting to Google login');
        window.location.assign(`${baseURL}/auth/login/google-oauth2/`);
    };

    // Clear redirect attempts counter when the page loads normally
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            // Only reset if we access the login page directly
            if (!location.state?.from) {
                console.log('Reset of redirect attempts counter');
                sessionStorage.removeItem(attemptKey);
            }
        }
    }, [isLoading, isAuthenticated, location.state]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-center">
                    <div 
                        data-testid="loading-spinner"
                        className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"
                    ></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    if (isAuthenticated) {
       console.log(`User is authenticated, redirecting to: ${from}`);
       // Clear the counter on successful authentication and redirect
       sessionStorage.removeItem(attemptKey);
       return <Navigate to={from} replace />;
    }

    return (
        <div className="login-container">
            <h1>Welcome back</h1>
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