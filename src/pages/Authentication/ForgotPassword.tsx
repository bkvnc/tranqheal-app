import { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../config/firebase';
import Alert from '../UiElements/Alerts';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleResetPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setAlert(null);

    if (!email) {
      setAlert({ type: 'error', message: 'Please enter your email.' });
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setAlert({ type: 'success', message: 'Password reset email sent. Check your inbox!' });
    } catch (error) {
      console.error('Error sending reset email:', error);
      setAlert({ type: 'error', message: 'Failed to send reset email. Please try again.' });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 p-10 bg-white dark:bg-boxdark shadow rounded">
        <h2 className="text-center text-2xl font-bold text-black dark:text-white">
          Reset Password
        </h2>
        {alert && <Alert type={alert.type} message={alert.message} />}
        <form onSubmit={handleResetPassword}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-white">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 p-2 w-full border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary dark:border-form-strokedark dark:bg-form-input"
              placeholder="Enter your email"
              required
            />
          </div>
          <div>
            <button
              type="submit"
              className="w-full py-2 px-4 border border-transparent rounded-md bg-primary text-white hover:bg-opacity-90"
            >
              Send Reset Email
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
