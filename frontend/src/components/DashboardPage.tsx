// frontend/src/components/DashboardPage.tsx
import React from 'react';
import { useAuth } from './AuthProvider';

const DashboardPage: React.FC = () => {
    const { user, isLoading, error } = useAuth();

    if (isLoading) {
        return <div className="container dashboard-page">Loading user data...</div>;
    }

    if (error) {
         return <div className="container dashboard-page error">Error loading user data: {error}</div>;
    }

    if (!user) {
        // This case should ideally be handled by ProtectedRoute, but good as a fallback
        return <div className="container dashboard-page">User not found. Please login again.</div>;
    }

    return (
        <div className="container dashboard-page">
            <h2>Dashboard</h2>
            <p>Welcome, {user.first_name || user.username}!</p>
            <ul>
                <li><strong>Name:</strong> {user.first_name} {user.last_name}</li>
                <li><strong>Email:</strong> {user.email}</li>
                <li><strong>Username:</strong> {user.username}</li>
                <li><strong>Company:</strong> {user.profile?.company?.name || 'N/A'}</li>
                <li><strong>Job Title:</strong> {user.profile?.job_title || 'N/A'}</li>
                <li><strong>Azure AD Object ID:</strong> {user.profile?.azure_oid || 'N/A'}</li>
            </ul>

            {/* Displaying raw user object for debugging/more info */}
            <h3>Raw User Data:</h3>
            <pre>{JSON.stringify(user, null, 2)}</pre>

            {/* Example of how to integrate existing dashboard */}
            {/* <section>
                <h3>Executive Dashboard Data (Placeholder)</h3>
                <p>Here you would fetch and display data from your existing dashboard APIs.</p>
                <p>You could make authenticated requests using the established session.</p>
                 Example: Fetch data from '/api/executive-summary/'
            </section> */}
        </div>
    );
};

export default DashboardPage;