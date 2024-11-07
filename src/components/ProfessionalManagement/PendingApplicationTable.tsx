import { useState, useEffect } from 'react';
import { db, auth } from '../../config/firebase';
import { collection, getDocs, query, where, doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { Application, Notification } from '../../hooks/types';
import dayjs from 'dayjs';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; // Import Toastify styles
import { Link } from 'react-router-dom';



const PendingApplicationTable = () => {
    const [applicants, setApplicants] = useState<Application[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const pendingsPerPage = 5;

    useEffect(() => {
        const fetchPendingApplications = async () => {
            const currentUser = auth.currentUser;
            if (!currentUser) return;

            

            try {

                if (currentUser) {
                    console.log("User authenticated successfully:");
                    console.log("User UID:", currentUser.uid);
                    console.log("User email:", currentUser.email);
        
                   
                    const orgDocRef = doc(db, 'organizations', currentUser.uid);
                    const adminDocRef = doc(db, 'admins', currentUser.uid);
        
                    const orgDoc = await getDoc(orgDocRef);
                    const adminDoc = await getDoc(adminDocRef);
        
                    const userType = orgDoc.exists()
                        ? orgDoc.data()?.userType
                        : adminDoc.exists()
                        ? adminDoc.data()?.userType
                        : null;
        
                    if (!userType) {
                        console.error("User type not found for this user.");
                        return;
                    }
                    console.log("User type:", userType);
                }



                const organizationRef = collection(db,  `organizations/${currentUser.uid}/applications`,);
                const applicationQuery = query(
                    organizationRef,
                    where('status', '==', 'Pending')
                );
                const applicationSnapshot = await getDocs(applicationQuery);
                const pendingApplications = applicationSnapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        ...data,
                        applicantName: `${data.firstName} ${data.lastName}`,
                        createdAt: data. createdAt ? data.createdAt.toDate() : new Date(),
                        
                    };
                }) as Application[];
                setApplicants(pendingApplications);
           console.log(pendingApplications);
               
            } catch (error) {
                console.error("Error fetching applications:", error);
            }
        };

        fetchPendingApplications();
    }, []);

   

    // Function to handle application approval
    const handleApprove = async (applicationId: string, professionalId: string) => {
        const currentUser = auth.currentUser;
        if (!currentUser) return;
    
        const professionalDocRef = doc(db, 'professionals', professionalId);
        const applicationDocRef = doc(db, `organizations/${currentUser.uid}/applications`, applicationId);
    
        const confirmed = window.confirm("Are you sure you want to approve this Application?");
        if (!confirmed) return;
    
        try {
            // Update application and professional status
            await updateDoc(applicationDocRef, { status: 'Approved', approvedAt: new Date(), approvedBy: currentUser.uid, professionalStatus: 'Verified' });
            await updateDoc(professionalDocRef, { status: 'Verified', underOrg: currentUser.uid});
             
            const professionalSnapshot = await getDoc(professionalDocRef);
            if (!professionalSnapshot.exists()) {
                throw new Error('Professional not found');
            }
            const professionalData = professionalSnapshot.data();
    
         
            const updateData = {
                reviewedBy: currentUser.uid, 
                reviewedAt: new Date(),
            };
    
            await updateDoc(professionalDocRef, updateData);
            
            await setDoc(doc(collection(db, `notifications/${professionalSnapshot.data().profesionalId}/messages`), `${applicationId}_verified`), {
                recipientId:  professionalSnapshot.data().profesionalId,
                recipientType:  professionalSnapshot.data().userType,
                type: "application_approved",
                message: `Your application has been approved!`,
                isRead: false,
                approvedAt: new Date(),
                additionalData: {
                    organizationId: currentUser.uid,
                    applicationId: applicationId,
                },
            });
    
           

        
    
        
            


        
    
            try{
            const organizationProfessionalRef = doc(db, `organizations/${currentUser.uid}/professionals`, professionalId);
            await setDoc(organizationProfessionalRef, {
                ...professionalData,
                dateApproved: new Date(),
                status: 'Verified',
            });
            console.log('Organization professional document set successfully');
        }catch(error){
            console.error('Error setting organization professional document:', error);
        }
            
            setApplicants(prevApplications =>
                prevApplications.filter(application => application.id !== applicationId)
            );
    
            toast.success('Application approved successfully!');
        } catch (error) {
            toast.error('Error approving application.');
            console.error('Error approving application:', error);
        }
    };
    

    const handleReject = async (applicationId: string) => {
        const currentUser = auth.currentUser;
        if (!currentUser) return;

        const applicationDocRef = doc(db, `organizations/${currentUser.uid}/applications`, applicationId);
        const confirmed = window.confirm("Are you sure you want to reject this Application?");
        if (!confirmed) return;

        try {
            await updateDoc(applicationDocRef, { status: 'rejected' });

            // Notify the applicant
            await setDoc(doc(collection(db, 'notifications'), `${applicationId}_rejected`), {
                message: `Your application has been rejected.`,
                recipientId: applicationId,
                recipientType: "user",
                timestamp: new Date(),
                isRead: false,
                rejectedAt: new Date(),
                
            });

            setApplicants(prevApplications =>
                prevApplications.filter(application => application.id !== applicationId)
            );
            toast.success('Application rejected successfully!');

        } catch (error) {
            toast.error('Error rejecting application.');
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

                    {/* Search Input */}
                    <div className="flex items-center mb-3">
                        <input
                            type="text"
                            placeholder="Search post by title or author"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-100 rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                        />
                        <Link
                            to="#"
                            className="h-12 w-40 ml-4 inline-flex items-center justify-center rounded-md bg-[#9F4FDD] py-4 px-10 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10"
                        >
                            Search
                        </Link>
                    </div>

                    
                    <table className="w-full table-auto">
                        <thead>
                            <tr className="bg-gray-2 text-left dark:bg-meta-4">
                                <th className="py-4 px-4 font-medium text-black dark:text-white">Applicant Name</th>
                                <th className="py-4 px-4 font-medium text-black dark:text-white">Date Created</th>
                                <th className="py-4 px-4 font-medium text-black dark:text-white">View Application File</th>
                                <th className="py-4 px-4 font-medium text-black dark:text-white">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                        {currentPending.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="text-center">No professionals found</td>
                            </tr>
                        ) : (
                            currentPending.map((applicant) => (
                                <tr key={applicant.id}>
                                    <td className="border-b py-5 px-4">{applicant.firstName}</td>
                                    <td className="border-b py-5 px-4">{dayjs(applicant.createdAt).format('MMM D, YYYY')}</td>
                                    <td className="border-b py-5 px-10"> 
                                        <a href={applicant.fileUrl} target="_blank" rel="noopener noreferrer" 
                                        className="py-1 px-3 text-primary rounded-md hover:text-white hover:bg-primary dark:text-white dark:hover:bg-primary dark:hover:text-white hover:shadow-lg hover:shadow-primary/50"
                                        >
                                            View File
                                        </a>
                                    </td>
                                    <td className="border-b py-5 px-3">
                                        <button
                                            className="py-1 px-3  dark:text-white rounded-md hover:bg-success hover:text-white  hover:shadow-lg hover:shadow-success/50"
                                            onClick={() => handleApprove(applicant.id, applicant.professionalId)}
                                        >
                                            Approve
                                        </button>
                                        <button
                                            className="ml-2 py-1 px-3  text-danger dark:text-white rounded-md hover:bg-danger hover:text-white  hover:shadow-lg hover:shadow-danger/50"
                                            onClick={() => handleReject(applicant.id)}
                                        >
                                            Reject
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}  
                        </tbody>
                    </table>

                    {/* Pagination Controls */}
                    <div className="flex justify-between items-center mt-4">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(currentPage - 1)}
                            className="bg-gray-300 px-4 py-2 rounded"
                        >
                            Previous
                        </button>
                        <span>Page {currentPage} of {totalPages}</span>
                        <button
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(currentPage + 1)}
                            className="bg-gray-300 px-4 py-2 rounded"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>

            <ToastContainer /> 
        </>
    );
};

export default PendingApplicationTable;
