import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import UnauthorizedPage from './UnauthorizedPage';
import { useAuth } from './AuthProvider'; // Import useAuth to mock it

// Mock the useAuth hook
jest.mock('./AuthProvider', () => ({
    useAuth: jest.fn(),
}));

// Mock the console functions to avoid cluttering test output
jest.spyOn(console, 'log').mockImplementation(() => {});
jest.spyOn(console, 'error').mockImplementation(() => {});

describe('UnauthorizedPage', () => {
    let mockLogout: jest.Mock;

    beforeEach(() => {
        // Reset mocks and provide default implementation for each test
        mockLogout = jest.fn().mockResolvedValue(undefined); // Mock logout as an async function
        (useAuth as jest.Mock).mockReturnValue({
            logout: mockLogout,
        });
        // Use fake timers
        jest.useFakeTimers();
    });

    afterEach(() => {
        // Restore real timers
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
        // Clear mocks after each test
        jest.clearAllMocks();
    });

    it('renders the unauthorized message and redirect text', () => {
        render(<UnauthorizedPage />);

        expect(screen.getByText('Access Denied')).toBeInTheDocument();
        expect(
            screen.getByText(
                /You are authenticated, but you do not have permission to access this application./
            )
        ).toBeInTheDocument();
        expect(screen.getByText(/Redirecting to login page shortly.../)).toBeInTheDocument();
        expect(screen.getByRole('status')).toBeInTheDocument(); // Checks for the spinner div via implicit role
    });

    it('calls logout after the timeout', async () => {
        render(<UnauthorizedPage />);

        // Check that logout is not called immediately
        expect(mockLogout).not.toHaveBeenCalled();

        // Fast-forward time by 4000ms (4 seconds)
        act(() => {
            jest.advanceTimersByTime(4000);
        });


        // Wait for any promises triggered by the timer to resolve (like the async logout)
        await waitFor(() => {
            expect(mockLogout).toHaveBeenCalledTimes(1);
        });

        // Ensure console log for timeout finish was called
        expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Timeout finished. Logging out now...'));
    });

     it('does not call logout if component unmounts before timeout', () => {
        const { unmount } = render(<UnauthorizedPage />);

        // Check that logout is not called immediately
        expect(mockLogout).not.toHaveBeenCalled();

        // Fast-forward time by less than 4 seconds
        act(() => {
            jest.advanceTimersByTime(3000);
        });

        expect(mockLogout).not.toHaveBeenCalled();

        // Unmount the component
        unmount();

         // Ensure cleanup log was called
        expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Cleanup: Clearing logout timer.'));

        // Fast-forward time past the original timeout
         act(() => {
            jest.advanceTimersByTime(2000); // Advance past the 4s mark
        });


        // Logout should still not have been called because the timer was cleared
        expect(mockLogout).not.toHaveBeenCalled();
    });

    it('handles logout failure gracefully', async () => {
        // Override mockLogout for this specific test to simulate failure
        mockLogout.mockRejectedValue(new Error('Logout failed'));
        (useAuth as jest.Mock).mockReturnValue({
            logout: mockLogout,
        });

        render(<UnauthorizedPage />);

        // Fast-forward time
        act(() => {
            jest.advanceTimersByTime(4000);
        });

        // Wait for the logout attempt and error handling
        await waitFor(() => {
            expect(mockLogout).toHaveBeenCalledTimes(1);
        });

        // Check if the error was logged
        await waitFor(() => {
             expect(console.error).toHaveBeenCalledWith(
                "[UnauthorizedPage] Automatic logout failed:",
                expect.any(Error) // Check that an Error object was passed
            );
        });

        // Optional: Check if component state resets or handles the error appropriately
        // (In this case, the component logs the error but doesn't change UI significantly after failure)
    });

     it('does not schedule multiple timeouts if re-rendered', async () => {
        const { rerender } = render(<UnauthorizedPage />);

        // Initial check
        expect(mockLogout).not.toHaveBeenCalled();
        expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Scheduling automatic logout...'));
        const initialScheduleCount = (console.log as jest.Mock).mock.calls.filter(call => call[0].includes('Scheduling automatic logout...')).length;
        expect(initialScheduleCount).toBe(1);


        // Rerender the component (e.g., due to parent state change)
        rerender(<UnauthorizedPage />);

        // Check that scheduling log wasn't called again because isLoggingOut should be false initially,
        // but the effect dependency `isLoggingOut` prevents re-running the timeout setup logic
        // unless isLoggingOut changes. Let's advance time slightly to ensure no immediate re-schedule.
         act(() => {
            jest.advanceTimersByTime(100);
        });
         const rerenderScheduleCount = (console.log as jest.Mock).mock.calls.filter(call => call[0].includes('Scheduling automatic logout...')).length;
         expect(rerenderScheduleCount).toBe(1); // Should still be 1


        // Now advance time fully
        act(() => {
            jest.advanceTimersByTime(4000);
        });

        await waitFor(() => {
            expect(mockLogout).toHaveBeenCalledTimes(1); // Should still only be called once
        });
    });
});
