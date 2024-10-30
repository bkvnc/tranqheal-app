import { useState, useEffect } from 'react';
import { db, auth } from '../../config/firebase';
import { collection, getDocs, query, where, doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { Application } from '../../hooks/types';

import dayjs from 'dayjs';
import Alert from '../../pages/UiElements/Alerts';
import { Link } from 'react-router-dom';


const ConfirmationModal = ({ isOpen, onConfirm, onCancel, message }: { 
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    message: string;
}) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded shadow-lg">
                <p>{message}</p>
                <div className="flex justify-end mt-4">
                    <button onClick={onCancel} className="mr-4 px-4 py-2 bg-gray-300 rounded">Cancel</button>
                    <button onClick={onConfirm} className="px-4 py-2 bg-blue-500 text-white rounded">Confirm</button>
                </div>
            </div>
        </div>
    );
};

const PendingApplicationTable = () => {
    const [applicants, setApplicants] = useState<Application[]>([]);
    const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const pendingsPerPage = 5;

    useEffect(() => {
        const fetchPendingApplications = async () => {
            const applicationQuery = query(
                collection(db, 'applications'),
                where('status', '==', 'pending')
            );
            const applicationSnapshot = await getDocs(applicationQuery);
    
            const pendingApplications = applicationSnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    applicantName: `${data.firstName} ${data.lastName}`,
                    dateCreated: data.dateCreated ? data.dateCreated.toDate() : new Date(),
                };
            }) as Application[];
    
            setApplicants(pendingApplications);
        };
        fetchPendingApplications();
    }, []);

    

    const handleApprove = async (applicationId: string) => {
        const applicationDocRef = doc(db, 'applications', applicationId);
        const confirmed = window.confirm("Are you sure you want to approve this Application?");
        if (!confirmed) return;

        try {
            const currentUser = auth.currentUser;
            if (!currentUser) throw new Error("User not authenticated");

            const orgDocRef = doc(db, 'organizations', currentUser.uid);
            const orgDoc = await getDoc(orgDocRef);
            if (!orgDoc.exists()) throw new Error("Organization not found");

            const organizationData = orgDoc.data();

            await updateDoc(applicationDocRef, {
                status: 'approved',
                organizationId: currentUser.uid,
                organizationName: organizationData?.name,
            });

            const notificationData = {
                message: `Your application has been approved!`,
                userId: applicationId,
                timestamp: new Date(),
                isRead: false,
            };

            await setDoc(doc(collection(db, 'notifications'), `${applicationId}_approved`), notificationData);

            setApplicants(prevApplications =>
                prevApplications.filter(application => application.id !== applicationId)
            );
            setAlert({ type: 'success', message: 'Application approved successfully!' });

        } catch (error) {
            setAlert({ type: 'error', message: 'Error approving application.' });
            console.error('Error approving application:', error);
        }
    };

    const handleReject = async (applicationId: string) => {
        const applicationDocRef = doc(db, 'applications', applicationId);
        const confirmed = window.confirm("Are you sure you want to reject this Application?");
        if (!confirmed) return;

        try {
            const applicationDoc = await getDoc(applicationDocRef);
            if (!applicationDoc.exists()) throw new Error("Application does not exist");

            await updateDoc(applicationDocRef, { status: 'rejected' });

            const notificationData = {
                message: `Your application has been rejected.`,
                userId: applicationId,
                timestamp: new Date(),
                isRead: false,
            };

            await setDoc(doc(collection(db, 'notifications'), `${applicationId}_rejected`), notificationData);

            setApplicants(prevApplications =>
                prevApplications.filter(application => application.id !== applicationId)
            );
            setAlert({ type: 'success', message: 'Application rejected successfully!' });

        } catch (error) {
            setAlert({ type: 'error', message: 'Error rejecting application.' });
            console.error('Error rejecting application:', error);
        }
    };

    const filteredPending = applicants.filter(application =>
        application.applicantName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const indexOfLastPending = currentPage * pendingsPerPage;
    const indexOfFirstPending = indexOfLastPending - pendingsPerPage;
    const currentPending = filteredPending.slice(indexOfFirstPending, indexOfLastPending);
    const totalPages = Math.ceil(filteredPending.length / pendingsPerPage);

    return (
        <>
            <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
                <div className="max-w-full overflow-x-auto">
                    <div className="mb-3">
                        <h4 className="text-xl font-semibold text-black dark:text-white">
                            Mental Health Professional Applicants
                        </h4>
                    </div>
                    <div className="flex items-center">
                    <input
                        type="text"
                        placeholder="Search post by title or author"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="mb-3 w-100 rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                    />
                    <Link
                        to="#"
                        className="h-12 w-40 mb-3 ml-4 inline-flex items-center justify-center rounded-md bg-[#9F4FDD] py-4 px-10 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10"
                    >
                        Search
                    </Link>
                </div>
                    <table className="w-full table-auto">
                        <thead>
                            <tr className="bg-gray-2 text-left dark:bg-meta-4">
                                <th className="min-w-[220px] py-4 px-4 font-medium text-black dark:text-white xl:pl-11">
                                    Applicant Name
                                </th>
                                <th className="min-w-[150px] py-4 px-4 font-medium text-black dark:text-white">
                                    Submission Date
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
                            {currentPending.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="text-center">No pending applications</td>
                                </tr>
                            ) : (
                                currentPending.map(application => (
                                    <tr key={application.id}>
                                        <td className="border-b py-5 px-4">{application.applicantName}</td>
                                        <td className="border-b py-5 px-4">
                                            {dayjs(application.dateCreated).format('MMM D, YYYY')}
                                        </td>
                                        <td className="border-b py-5 px-4">{application.status}</td>
                                        <td className="border-b py-5 px-4">
                                            <button
                                                onClick={() => handleApprove(application.id)}
                                                className="py-1 px-3 bg-green-500 text-white rounded-md  hover:bg-success hover:text-white"
                                            >
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => handleReject(application.id)}
                                                className="ml-2 py-1 px-3 bg-red-500 text-white rounded-md  hover:bg-danger hover:text-white"
                                            >
                                                Reject
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                    <div className="flex justify-between mt-4">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="py-2 px-4 bg-gray-300 rounded-md disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <div className="flex items-center">
                            <span>Page {currentPage} of {totalPages}</span>
                        </div>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
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

export default PendingApplicationTable;
