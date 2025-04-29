// frontend/src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Outlet } from 'react-router-dom';
import { AuthProvider } from './auth/components/AuthProvider';
import LoginPage from './auth/components/LoginPage';
import ExecutiveDashboard from './features/dashboard/components/ExecutiveDashboard';
import ProtectedRoute from './auth/components/ProtectedRoute';

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
        <Router>
            <AuthProvider> {/* AuthProvider ahora dentro del Router */}
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
                            {/* Explicit dashboard route for social auth redirect */}
                            <Route path="/dashboard" element={<ExecutiveDashboard />} />
                            {/* Add other protected routes here */}
                            {/* <Route path="/settings" element={<SettingsPage />} /> */}
                        </Route>
                       
                        {/* Catch-all for 404 Not Found */}
                        <Route path="*" element={<div><h2>404 Not Found</h2><Link to="/">Go Home</Link></div>} />
                    </Route>
                </Routes>
            </AuthProvider>
        </Router>
    );
};

export default App;