import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import type { Subscription } from '../../hooks/types';
import {Plan} from '../../hooks/types';

const CheckoutFailed: React.FC = () => {
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

  const Retry = (planId: Plan['id']) => {
    navigate(`/checkout/${planId}`);
  };


  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg text-center">
      <svg
        className="w-16 h-16 mx-auto text-danger mb-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>

      <h2 className="text-2xl font-bold mb-4">Payment Failed</h2>
      
      {subscription && (
        <div className="mb-6 text-left">
          <p className="mb-2">
            <span className="font-semibold">Plan Type:</span> {subscription.planType}
          </p>
          <p className="mb-2">
            <span className="font-semibold">Attempted Date:</span>{' '}
            {new Date().toLocaleDateString()}
          </p>
        </div>
      )}

      <div className="space-y-4">
        <p className="text-gray-600">
          Unfortunately, your payment could not be processed. Please try again.
        </p>
        
     
        <button
          onClick={() => navigate('/dashboard')}
          className="bg-blue-600  py-2 px-6 rounded-md hover:bg-primary transition-colors"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
};

export default CheckoutFailed;