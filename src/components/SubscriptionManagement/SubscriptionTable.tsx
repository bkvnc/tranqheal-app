import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs'; // Import Day.js
import { db } from '../../config/firebase';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

const SubscriptionTable = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const [subscriptionsPerPage] = useState(5);
    const [subscriptions, setSubscriptions] = useState([]);

    useEffect(() => {
        const fetchSubscriptions = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, 'subscriptions'));
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

    // Function to handle deleting a subscription
    const handleDelete = async (subscriptionId: string) => {
        const confirmed = window.confirm('Are you sure you want to delete this subscription?');
        if (confirmed) {
            try {
                await deleteDoc(doc(db, 'subscriptions', subscriptionId)); // Delete from Firestore
                setSubscriptions(subscriptions.filter((sub) => sub.id !== subscriptionId)); // Remove from state
                alert('Subscription deleted successfully!');
            } catch (error) {
                console.error('Error deleting subscription:', error);
                alert('Failed to delete the subscription.');
            }
        }
    };

    const indexOfLastSubscription = currentPage * subscriptionsPerPage;
    const indexOfFirstSubscription = indexOfLastSubscription - subscriptionsPerPage;
    const currentSubscriptions = subscriptions.slice(indexOfFirstSubscription, indexOfLastSubscription);
    const totalPages = Math.ceil(subscriptions.length / subscriptionsPerPage);

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
                            {currentSubscriptions.map((subscription) => (
                                <tr key={subscription.id}>
                                    <td className="border-b border-[#eee] py-5 px-4 pl-9 dark:border-strokedark xl:pl-11">
                                        <h5 className="font-medium text-black dark:text-white">{subscription.organizationName}</h5>
                                        <p className="text-sm">{subscription.contactEmail}</p>
                                    </td>
                                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                        <p className="text-black dark:text-white">{subscription.planName}</p>
                                    </td>
                                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                        <p className="text-black dark:text-white">
                                            {subscription.startDate ? dayjs(subscription.startDate.toDate()).format('MMM DD, YYYY') : 'N/A'}
                                        </p>
                                    </td>
                                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                        <p className="text-black dark:text-white">
                                            {subscription.endDate ? dayjs(subscription.endDate.toDate()).format('MMM DD, YYYY') : 'N/A'}
                                        </p>
                                    </td>
                                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                        <p className={`inline-flex rounded-full ${subscription.status === 'active' ? 'bg-success' : 'bg-danger'} bg-opacity-10 py-1 px-3 text-sm font-medium text-${subscription.status === 'active' ? 'success' : 'danger'}`}>
                                            {subscription.status}
                                        </p>
                                    </td>
                                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                        <div className="flex items-center space-x-3.5">
                                            <button 
                                                className="text-danger hover:text-white hover:bg-danger hover:shadow-lg hover:shadow-danger/50 rounded-md py-1 px-3  transition flex items-center" 
                                                onClick={() => handleDelete(subscription.id)} // Delete button
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {/* PAGINATION */}
                    <div className="flex justify-between mt-4">
                        <button
                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="py-2 px-4 bg-gray-300 rounded-md disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <div className="flex items-center">
                            <span>Page {currentPage} of {totalPages}</span>
                        </div>
                        <button
                            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="py-2 px-4 bg-gray-300 rounded-md disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default SubscriptionTable;
