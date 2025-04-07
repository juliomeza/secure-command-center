// frontend/src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Outlet } from 'react-router-dom';
import { AuthProvider } from './components/AuthProvider';
import LoginPage from './components/LoginPage';
import DashboardPage from './components/DashboardPage';
import ExecutiveDashboard from './components/ExecutiveDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import TestHamburgerPage from './components/TestHamburgerPage';

// Layout component without navigation bar for authenticated pages
const MainLayout: React.FC = () => {
    return (
        <div>
            <main>
                {/* Child routes will render here */}
                <Outlet />
            </main>
        </div>
    );
}

// Special layout for login page without navigation bar
const LoginLayout: React.FC = () => {
    return (
        <div className="login-layout">
            <main>
                <Outlet />
            </main>
        </div>
    );
}

// Main App component setting up routes
const App: React.FC = () => {
    return (
        <AuthProvider> {/* Wrap the entire app in AuthProvider */}
            <Router>
                <Routes>
                    {/* Login route with special layout */}
                    <Route path="/login" element={<LoginLayout />}>
                        <Route index element={<LoginPage />} />
                    </Route>
                    
                    {/* Main layout for authenticated routes */}
                    <Route path="/" element={<MainLayout />}>
                        {/* Protected Routes */}
                        <Route element={<ProtectedRoute />}>
                            {/* Executive Dashboard is the protected home page */}
                            <Route index element={<ExecutiveDashboard />} />
                            {/* Legacy dashboard page (for reference) */}
                            <Route path="/user-profile" element={<DashboardPage />} />
                            {/* Explicit dashboard route for social auth redirect */}
                            <Route path="/dashboard" element={<ExecutiveDashboard />} />
                            {/* Add other protected routes here */}
                            {/* <Route path="/settings" element={<SettingsPage />} /> */}
                        </Route>

                        {/* Test route for HamburgerMenu */}
                        <Route path="/test-hamburger" element={<TestHamburgerPage />} />
                        
                        {/* Catch-all for 404 Not Found */}
                        <Route path="*" element={<div><h2>404 Not Found</h2><Link to="/">Go Home</Link></div>} />
                    </Route>
                </Routes>
            </Router>
        </AuthProvider>
    );
};

export default App;