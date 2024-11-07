import { useEffect, useState } from 'react';
import {db} from '../config/firebase';
import { collection, getDocs } from 'firebase/firestore';
import type { Plan } from './types'; // Adjust path based on your project

export const useSubscriptionPlans = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        console.log('Fetching subscription plans...');
        const querySnapshot = await getDocs(collection(db, 'subscriptionPlan'));
        console.log('Fetched plans:', querySnapshot.docs.map(doc => doc.data())); // Log fetched documents
        const fetchedPlans = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Plan[];
        setPlans(fetchedPlans);
      } catch (error) {
        console.error('Error fetching subscription plans: ', error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchPlans();
  }, []);

  return { plans, loading };
};
