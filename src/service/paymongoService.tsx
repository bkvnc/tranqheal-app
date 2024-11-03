import type { 
    PaymentIntent, 
    PaymentMethod, 
    PaymongoError,
    SourceCreateParams 
  } from '../hooks/types';
  

  
  export class PaymongoService {
    private static readonly PAYMONGO_SECRET_KEY = import.meta.env.VITE_PAYMONGO_SECRET_KEY;
    private static readonly PAYMONGO_PUBLIC_KEY = import.meta.env.VITE_PAYMONGO_PUBLIC_KEY;
    private static readonly PAYMONGO_API = 'https://api.paymongo.com/v1';
  
    private static async handleResponse(response: Response) {
      if (!response.ok) {
        const errorData: PaymongoError = await response.json();
        throw new Error(errorData.errors[0].detail);
      }
      const data = await response.json();
      return data.data;
    }

    
  
    static async createPaymentIntent(
      amount: number,
      currency: string = 'PHP'
    ): Promise<PaymentIntent> {
      const payload = {
        data: {
          attributes: {
            amount: amount * 100,
            currency,
            payment_method_allowed: ['card'],
            payment_method_options: {
              card: { request_three_d_secure: 'automatic' }
            }
          }
        }
      };
      
  
      const response = await fetch(`${this.PAYMONGO_API}/payment_intents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa(this.PAYMONGO_SECRET_KEY || '')}`
        },
        body: JSON.stringify(payload)
      });
      return this.handleResponse(response);
    }
    static async createSource(sourceParams: SourceCreateParams) {
        const { type, amount } = sourceParams; // Destructure the type and amount
    
        const payload = {
            data: {
                attributes: {
                    amount: amount,
                    currency: 'PHP',
                    redirect: {
                        success: 'http://localhost:5173/subscription/success',
                        failed: 'http://localhost:5173/subscription/failed'
                    },
                    type
                }
            }
        };
    
        const response = await fetch(`${this.PAYMONGO_API}/sources`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${btoa(this.PAYMONGO_PUBLIC_KEY || '')}`
            },
            body: JSON.stringify(payload)
        });
    
        return this.handleResponse(response);
    }
      

      
    
    static async createPaymentMethod(
      cardDetails: {
        number: string;
        exp_month: number;
        exp_year: number;
        cvc: string;
      },
      billingDetails: {
        name: string;
        email: string;
        phone: string;
        address: {
          line1: string;
          line2?: string;
          city: string;
          state: string;
          postal_code: string;
          country: string;
        };
      }
    ): Promise<PaymentMethod> {
      const payload = {
        data: {
          attributes: {
            type: 'card',
            details: cardDetails,
            billing: billingDetails
          }
        }
      };
  
      const response = await fetch(`${this.PAYMONGO_API}/payment_methods`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa(this.PAYMONGO_PUBLIC_KEY || '')}`
        },
        body: JSON.stringify(payload)
      });
      return this.handleResponse(response);
    }

    
  
    static async attachPaymentMethod(
      paymentIntentId: string,
      paymentMethodId: string
    ): Promise<PaymentIntent> {
      const payload = {
        data: {
          attributes: {
            payment_method: paymentMethodId
          }
        }
      };
  
      const response = await fetch(`${this.PAYMONGO_API}/payment_intents/${paymentIntentId}/attach`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa(this.PAYMONGO_SECRET_KEY || '')}`
        },
        body: JSON.stringify(payload)
      });
      return this.handleResponse(response);
    }
    
  
}

  