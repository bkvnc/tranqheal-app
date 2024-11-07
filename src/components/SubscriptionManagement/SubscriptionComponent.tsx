import React, { useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions'; // Import the necessary Firebase functions

const SubscriptionComponent = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    
    const functions = getFunctions();
    const createPaymentIntent = httpsCallable(functions, 'createPaymentIntent');

    const handleSubscription = async (planId) => {
        setLoading(true);
        setError('');
        setSuccessMessage('');

        try {
            const response = await createPaymentIntent({ planId });
            console.log("Payment Intent Created:", response.data);
        
            setSuccessMessage(`Successfully subscribed to the ${planId === 'annual' ? 'Annual' : 'Semi-Annual'} Plan!`);
        } catch (error) {
            console.error("Error creating payment intent:", error);
            setError("Error creating payment intent. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto p-6 bg-white shadow-lg rounded-lg space-y-6">
            <h2 className="text-2xl font-semibold text-center">Choose a Subscription Plan</h2>

            {successMessage && <div className="bg-green-100 text-green-800 p-4 rounded">{successMessage}</div>}
            {error && <div className="bg-red-100 text-red-800 p-4 rounded">{error}</div>}

            <div className="grid grid-cols-1 gap-4">
                <div className="border border-gray-300 rounded-lg p-4 hover:shadow-lg transition-shadow duration-300">
                    <h3 className="text-xl font-bold">Annual Plan</h3>
                    <p className="text-gray-700">Price: <span className="font-semibold">PHP 1299 for 1 year</span></p>
                    <button
                        className={`mt-4 w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition duration-200 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={() => handleSubscription('annual')}
                        disabled={loading}
                    >
                        {loading ? 'Processing...' : 'Subscribe Annually'}
                    </button>
                </div>

                <div className="border border-gray-300 rounded-lg p-4 hover:shadow-lg transition-shadow duration-300">
                    <h3 className="text-xl font-bold">Semi-Annual Plan</h3>
                    <p className="text-gray-700">Price: <span className="font-semibold">PHP 799 for 6 months</span></p>
                    <button
                        className={`mt-4 w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition duration-200 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={() => handleSubscription('semi-annual')}
                        disabled={loading}
                    >
                        {loading ? 'Processing...' : 'Subscribe Semi-Annually'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SubscriptionComponent;
