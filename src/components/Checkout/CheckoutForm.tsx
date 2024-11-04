import React, { FC, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PaymongoService } from '../../service/paymongoService';
import type { Plan } from '../../hooks/types';
import type { SourceCreateParams } from '../../hooks/types';

interface CheckoutFormProps {
  plan: Plan;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
}

const CheckoutForm: FC<CheckoutFormProps> = ({ plan, onSuccess, onError }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'gcash' | 'maya'>('card');
  const [formData, setFormData] = useState({
    cardNumber: '',
    expMonth: '',
    expYear: '',
    cvc: '',
    name: '',
    email: '',
    phone: '',  
    address: {
      line1: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'PH'
    }
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prevFormData => ({
      ...prevFormData,
      [name]: value
    }));
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prevFormData => ({
      ...prevFormData,
      address: {
        ...prevFormData.address,
        [name]: value
      }
    }));
  };

  const handlePaymentMethodChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPaymentMethod(e.target.value as 'card' | 'gcash' | 'maya');
  };

  const handleCardPayment = async () => {
    const paymentIntent = await PaymongoService.createPaymentIntent(plan.price);
    const paymentMethodData = await PaymongoService.createPaymentMethod(
      {
        number: formData.cardNumber.replace(/\s/g, ''),
        exp_month: parseInt(formData.expMonth),
        exp_year: parseInt(formData.expYear),
        cvc: formData.cvc
      },
      {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address
      }
    );

    const result = await PaymongoService.attachPaymentMethod(paymentIntent.id, paymentMethodData.id);

    if (result.attributes.status === 'succeeded') {
      onSuccess(result.id);
      navigate('/subscription/success');
    } else {
      onError('Payment failed. Please try again.');
    }
  };

  const handleRedirectPayment = async () => {
    if (paymentMethod === 'gcash' || paymentMethod === 'maya') {
      const sourceParams: SourceCreateParams = {
        type: paymentMethod,
        amount: plan.price * 100,
        currency: 'PHP',
        redirect: {
          success: 'http://localhost:5173/subscription/success',
          failed: 'http://localhost:5173/subscription/failed'
        },
        billing: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone
        }
      };
  
      
      const source = await PaymongoService.createSource(sourceParams);
      if (source && source.attributes.redirect.checkout_url) {
        window.location.href = source.attributes.redirect.checkout_url;
      } else {
        onError('Payment failed. Unable to create source.');
      }
    } else {
      onError('Invalid payment method selected.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (paymentMethod === 'card') {
        await handleCardPayment();
      } else {
        await handleRedirectPayment();
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-lg mx-auto space-y-4 bg-white rounded-lg shadow-lg p-6">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold dark:text-black">Payment Details</h2>
        
        <div className="space-y-2">
          {['card', 'gcash', 'maya'].map(method => (
            <label key={method}>
              <input
                type="radio"
                value={method}
                checked={paymentMethod === method}
                onChange={handlePaymentMethodChange}
              />
              {method.charAt(0).toUpperCase() + method.slice(1)}
            </label>
          ))}
        </div>

        {paymentMethod === 'card' && (
          <div className="space-y-2">
            <input
              type="text"
              name="cardNumber"
              placeholder="Card Number"
              value={formData.cardNumber}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              required
            />
            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                name="expMonth"
                placeholder="MM"
                value={formData.expMonth}
                onChange={handleInputChange}
                className="p-2 border rounded"
                required
              />
              <input
                type="text"
                name="expYear"
                placeholder="YY"
                value={formData.expYear}
                onChange={handleInputChange}
                className="p-2 border rounded"
                required
              />
              <input
                type="text"
                name="cvc"
                placeholder="CVC"
                value={formData.cvc}
                onChange={handleInputChange}
                className="p-2 border rounded"
                required
              />
            </div>
          </div>
        )}

        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Billing Information</h3>
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
            required
          />
          <input
            type="tel"
            name="phone"
            placeholder="Phone"
            value={formData.phone}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-black hover:text-white py-2 px-4 rounded-lg hover:bg-[#9F4FDD] transition-colors disabled:bg-blue-300"
      >
        {loading ? 'Processing...' : `Pay ₱${plan.price.toLocaleString()}`}
      </button>
    </form>
  );
};

export default CheckoutForm;
