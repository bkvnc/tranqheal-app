import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Plan } from '../hooks/types';
import {useSubscriptionPlans} from '../hooks/useSubscriptionPlans';




const SubscriptionPlans: React.FC = () => {
  const navigate = useNavigate();
  const { plans, loading } = useSubscriptionPlans();
  if (loading) return <p>Loading subscription plans...</p>;

  console.log('Loading:', loading);
  console.log('Plans:', plans);

  const handleSubscribe = (planId: Plan['id']) => {
    navigate(`/checkout/${planId}`);
  };

  return (
    <div className="grid md:grid-cols-2 gap-8 p-6">
      {plans.map((plan) => (
        <div key={plan.id} className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4">{plan.name}</h2>
          <p className="text-gray-600 mb-4">{plan.description}</p>
          <p className="text-3xl font-bold mb-6">₱{plan.price.toLocaleString()}</p>
          {/* <ul className="mb-6">
            {plan.benefits.map((benefit, index) => (
              <li key={index} className="flex items-center mb-2">
                <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path 
                    fillRule="evenodd" 
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                    clipRule="evenodd"
                  />
                </svg>
                {benefit}
              </li>
            ))}
          </ul> */}
          <button
            onClick={() => handleSubscribe(plan.id)}
            className="w-full bg-[#9F4FDD] text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Subscribe Now
          </button>
        </div>
      ))}
    </div>
  );
};

export default SubscriptionPlans;