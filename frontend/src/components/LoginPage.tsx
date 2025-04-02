// frontend/src/components/LoginPage.tsx
import React from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { 
    MicrosoftLoginButton,
    GoogleLoginButton
} from 'react-social-login-buttons';

const LoginPage: React.FC = () => {
    const { isAuthenticated, isLoading } = useAuth();
    const location = useLocation();
    const from = location.state?.from?.pathname || "/";

    const handleMicrosoftLogin = () => {
        window.location.href = `/auth/login/azuread-oauth2/?prompt=select_account`;
    };
    
    const handleGoogleLogin = () => {
        window.location.href = `/auth/login/google-oauth2/`;
    };

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (isAuthenticated) {
       return <Navigate to={from} replace />;
    }

    return (
        <div className="container login-page">
            <h2>Login</h2>
            <p>Please login to access the dashboard.</p>
            
            {/* Microsoft Login Button - using default styling */}
            <MicrosoftLoginButton 
                onClick={handleMicrosoftLogin}
                style={{ width: '250px', margin: '0 auto 10px' }}
                text="Sign in with Microsoft"
            />
            
            {/* Google Login Button */}
            <GoogleLoginButton
                onClick={handleGoogleLogin}
                style={{ width: '250px', margin: '10px auto 0' }}
                text="Sign in with Google"
            />
        </div>
    );
};

export default LoginPage;