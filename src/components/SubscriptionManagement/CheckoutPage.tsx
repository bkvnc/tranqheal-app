import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import CheckoutForm from '../Checkout/CheckoutForm';
import { plans, Plan } from '../../hooks/types';

const CheckoutPage: React.FC = () => {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();

  // Find the selected plan based on the URL parameter
  const plan = plans.find((p: Plan) => p.id === planId);

  if (!plan) {
    return <div className="text-center p-6">Plan not found. Please select a valid plan.</div>;
  }

  const handleSuccess = () => {
    toast.success('Subscription successful!');
    // Optionally, navigate to a success page
    navigate('subscription/success');
  };

  const handleError = (error: string) => {
    toast.error(`Subscription failed: ${error}`);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-3xl font-semibold mb-4 dark:text-black">Checkout</h2>
        <p className="mb-8 text-lg text-gray-700">
          You are subscribing to the <strong>{plan.name}</strong> plan for ₱{plan.price.toLocaleString()}.
        </p>

        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
          <CheckoutForm 
            plan={plan} 
            onSuccess={handleSuccess} 
            onError={handleError} 
          />
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
