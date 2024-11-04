import { db } from '../config/firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  getDoc, 
  query, 
  where, 
  getDocs 
} from 'firebase/firestore';
import type { Subscription, Notification } from '../hooks/types';

interface PlanDetails {
  type: 'annual' | 'semi-annual';
  amount: number;
}

export class SubscriptionService {
  static async createSubscription(
    organizationId: string,
    planDetails: PlanDetails
  ): Promise<string> {
    const subscriptionData: Omit<Subscription, 'id'> = {
      organizationId,
      planType: planDetails.type,
      startDate: new Date(),
      endDate: this.calculateEndDate(planDetails.type),
      status: 'active',
      amount: planDetails.amount,
      createdAt: new Date()
    };

    try {
      const docRef = await addDoc(collection(db, 'subscriptions'), subscriptionData);
      await this.createNotification({
        type: 'subscription_created',
        organizationId,
        message: `New subscription created for ${planDetails.type} plan`,
        adminNotification: true
      });
      return docRef.id;
    } catch (error) {
      throw new Error('Failed to create subscription');
    }
  }

  private static calculateEndDate(planType: 'annual' | 'semi-annual'): Date {
    const date = new Date();
    if (planType === 'annual') {
      date.setFullYear(date.getFullYear() + 1);
    } else {
      date.setMonth(date.getMonth() + 6);
    }
    return date;
  }

  private static async createNotification(
    notificationData: Pick<Notification, 'type' | 'organizationId' | 'message' | 'adminNotification'>
  ): Promise<void> {
    try {
      await addDoc(collection(db, 'notifications'), {
        ...notificationData,
        createdAt: new Date(),
        read: false
      });
    } catch (error) {
      throw new Error('Failed to create notification');
    }
  }
}