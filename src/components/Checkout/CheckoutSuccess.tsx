import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import type { Subscription } from '../../hooks/types';

const CheckoutSuccess: React.FC = () => {
  const { subscriptionId } = useParams<{ subscriptionId: string }>();
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState<Subscription | null>(null);

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!subscriptionId) return;

      try {
        const docRef = doc(db, 'subscriptions', subscriptionId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setSubscription({ id: docSnap.id, ...docSnap.data() } as Subscription);
        }
      } catch (error) {
        console.error('Error fetching subscription:', error);
      }
    };

    fetchSubscription();
  }, [subscriptionId]);

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg text-center">
      <svg
        className="w-16 h-16 mx-auto text-success mb-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 13l4 4L19 7"
        />
      </svg>

      <h2 className="text-2xl font-bold mb-4">Payment Successful!</h2>
      
      {subscription && (
        <div className="mb-6 text-left">
          <p className="mb-2">
            <span className="font-semibold">Plan Type:</span> {subscription.planType}
          </p>
          <p className="mb-2">
            <span className="font-semibold">Start Date:</span>{' '}
            {subscription.startDate.toLocaleDateString()}
          </p>
          <p className="mb-2">
            <span className="font-semibold">End Date:</span>{' '}
            {subscription.endDate.toLocaleDateString()}
          </p>
        </div>
      )}

      <div className="space-y-4">
        <p className="text-gray-600">
          Thank you for your subscription! You will receive a confirmation email shortly.
        </p>
        
        <button
          onClick={() => navigate('/dashboardforums')}
          className="bg-primary  text-white py-2 px-6 rounded-md hover:bg-blue-700 transition-colors"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
};

export default CheckoutSuccess;