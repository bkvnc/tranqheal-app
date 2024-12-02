import React, { useEffect, useState } from 'react';
import { db, auth } from '../../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import dayjs from 'dayjs';  // Import dayjs for date formatting

const MySubscription = () => {
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchSubscription = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          // Fetch the subscription data for the current user
          const subscriptionDocRef = doc(db, 'subscriptions', user.uid);
          const subscriptionDoc = await getDoc(subscriptionDocRef);

          if (subscriptionDoc.exists()) {
            setSubscriptionData(subscriptionDoc.data());
          } else {
            console.log('No subscription found for this user');
          }
        } catch (error) {
          console.error("Error fetching subscription: ", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchSubscription();
  }, []);

  // Handle loading state
  if (loading) {
    return <div className="text-center py-4">Loading...</div>;
  }

  if (!subscriptionData) {
    return <div className="text-center py-4">No subscription data available</div>;
  }

  // Format the dates using dayjs
  const startDate = dayjs(subscriptionData.startDate?.toDate()).format('MMMM D, YYYY [at] h:mm A');
  const endDate = dayjs(subscriptionData.endDate?.toDate()).format('MMMM D, YYYY [at] h:mm A');

  return (
    <>
      <div className="rounded-lg border border-stroke px-6 pt-6 pb-4  dark:border-strokedark dark:bg-boxdark sm:px-8 xl:pb-5 max-w-lg mx-auto space-y-4 bg-white  shadow-lg p-6">
        <h4 className="text-lg font-bold dark:text-white mb-4">My Subscription</h4>

        {/* Subscription Info */}
        <div className="space-y-4">


          {/* Plan Name */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-bodydark2 dark:text-bodydark1 font-medium">Plan Name:</span>
            <span className="text-sm text-bodydark2 dark:text-bodydark1">{subscriptionData.planName}</span>
          </div>

          {/* Price */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-bodydark2 dark:text-bodydark1 font-medium">Price:</span>
            <span className="text-sm text-bodydark2 dark:text-bodydark1">${subscriptionData.price}</span>
          </div>

          {/* Payment Method */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-bodydark2 dark:text-bodydark1 font-medium">Payment Method:</span>
            <span className="text-sm text-bodydark2 dark:text-bodydark1">{subscriptionData.paymentMethodId}</span>
          </div>

          {/* Plan Duration */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-bodydark2 dark:text-bodydark1 font-medium">Plan Duration:</span>
            <span className="text-sm text-bodydark2 dark:text-bodydark1">
              {subscriptionData.planId === 'semi-annual' ? 'Semi-Annual Plan' : 'Other'}
            </span>
          </div>

          {/* Status */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-bodydark2 dark:text-bodydark1 font-medium">Status:</span>
            <span className="inline-flex rounded-full bg-success bg-opacity-10 py-1 px-3 text-sm font-medium text-success">{subscriptionData.status}</span>
          </div>

          {/* Start Date */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-bodydark2 dark:text-bodydark1 font-medium">Start Date:</span>
            <span className="text-sm text-bodydark2 dark:text-bodydark1">{startDate}</span>
          </div>

          {/* End Date */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-bodydark2 dark:text-bodydark1 font-medium">End Date:</span>
            <span className="text-sm text-bodydark2 dark:text-bodydark1">{endDate}</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default MySubscription;
