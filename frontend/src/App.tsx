// frontend/src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './components/AuthProvider';
import LoginPage from './components/LoginPage';
import DashboardPage from './components/DashboardPage';
import ProtectedRoute from './components/ProtectedRoute';

// Layout component with navigation for authenticated pages
const MainLayout: React.FC = () => {
    const { isAuthenticated, logout, user } = useAuth();

    return (
        <div>
            <nav>
                <ul>
                    <li><Link to="/">Home (Dashboard)</Link></li>
                    {!isAuthenticated && <li><Link to="/login">Login</Link></li>}
                    {isAuthenticated && (
                        <li>
                            <button onClick={logout} className='logout-button'>
                                Logout ({user?.username})
                            </button>
                        </li>
                    )}
                </ul>
            </nav>
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
            <div className="company-name">
                <h3>Company Name</h3>
            </div>
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
                            {/* Dashboard is the protected home page */}
                            <Route index element={<DashboardPage />} />
                            {/* Explicit dashboard route for social auth redirect */}
                            <Route path="/dashboard" element={<DashboardPage />} />
                            {/* Add other protected routes here */}
                            {/* <Route path="/settings" element={<SettingsPage />} /> */}
                        </Route>

                        {/* Catch-all for 404 Not Found */}
                        <Route path="*" element={<div><h2>404 Not Found</h2><Link to="/">Go Home</Link></div>} />
                    </Route>
                </Routes>
            </Router>
        </AuthProvider>
    );
};

export default App;