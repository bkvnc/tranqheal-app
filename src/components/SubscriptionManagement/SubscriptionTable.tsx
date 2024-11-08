import React, { useEffect, useState } from 'react';
import { db } from '../../config/firebase';
import { collection, getDocs } from 'firebase/firestore';

const SubscriptionTable = () => {
    const [subscriptions, setSubscriptions] = useState([]);


    useEffect(() => {
        const fetchSubscriptions = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, 'subscriptions')); // Change 'subscriptions' to your collection name
                const subs = [];
                querySnapshot.forEach((doc) => {
                    subs.push({ id: doc.id, ...doc.data() });
                });
                setSubscriptions(subs);
            } catch (error) {
                console.error('Error fetching subscriptions:', error);
            }
        };

        fetchSubscriptions();
    }, []);

    return (
        <>
            <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
                <div className="max-w-full overflow-x-auto">
                    <div className="mb-3">
                        <h4 className="text-xl font-semibold text-black dark:text-white">Subscriptions</h4>
                    </div>
                    <table className="w-full table-auto">
                        <thead>
                            <tr className="bg-gray-2 text-left dark:bg-meta-4">
                                <th className="min-w-[220px] py-4 px-4 font-medium text-black dark:text-white xl:pl-11">
                                    Mental Health Organizations
                                </th>
                                <th className="min-w-[150px] py-4 px-4 font-medium text-black dark:text-white">
                                    Subscription Plan
                                </th>
                                <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">
                                    Start Date
                                </th>
                                <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">
                                    End Date
                                </th>
                                <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">
                                    Status
                                </th>
                                <th className="py-4 px-4 font-medium text-black dark:text-white">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {subscriptions.map((subscription) => (
                                <tr key={subscription.id}>
                                    <td className="border-b border-[#eee] py-5 px-4 pl-9 dark:border-strokedark xl:pl-11">
                                        <h5 className="font-medium text-black dark:text-white">{subscription.organizationName}</h5>
                                        <p className="text-sm">{subscription.contactEmail}</p>
                                    </td>
                                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                        <p className="text-black dark:text-white">{subscription.planName}</p>
                                    </td>
                                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                        <p className="text-black dark:text-white">{new Date(subscription.startDate).toLocaleDateString()}</p>
                                    </td>
                                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                        <p className="text-black dark:text-white">{new Date(subscription.endDate).toLocaleDateString()}</p>
                                    </td>
                                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                        <p className={`inline-flex rounded-full ${subscription.status === 'Active' ? 'bg-success' : 'bg-danger'} bg-opacity-10 py-1 px-3 text-sm font-medium text-danger`}>
                                            {subscription.status}
                                        </p>
                                    </td>
                                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                        <div className="flex items-center space-x-3.5">
                                            <button className="hover:text-primary">Edit</button>
                                            <button className="hover:text-primary">Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {/* PAGINATION */}
                    <div className="flex justify-center mt-4">
                        <button className="bg-blue-500 text-black py-2 px-4 rounded mr-2 dark:text-white">Previous</button>
                        <button className="bg-blue-500 text-black py-2 px-4 rounded dark:text-white">Next</button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default SubscriptionTable;
