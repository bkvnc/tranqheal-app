import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { db, auth } from "../../config/firebase";
import { collection, getDocs, doc, query, where, getDoc, deleteDoc } from "firebase/firestore";
import dayjs from 'dayjs';
import { Professional } from "../../hooks/types";

const RemoveProfessionalTable = () => {
    const [professionals, setProfessionals] = useState<Professional[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [currentPage, setCurrentPage] = useState(1);
    const professionalsPerPage = 5;
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null); // State for selected professional
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false); // State to manage modal visibility

    useEffect(() => {
        const fetchVerifiedProfessionals = async () => {
            const currentUser = auth.currentUser;
            if (!currentUser) return;

            try {
                const organizationsCollection = collection(db, "organizations");
                const organizationSnapshot = await getDocs(organizationsCollection);

                const verifiedProfessionals: Professional[] = [];

                for (const orgDoc of organizationSnapshot.docs) {
                    const professionalsCollectionRef = collection(db, `organizations/${currentUser.uid}/professionals`);
                    const verifiedProfessionalsQuery = query(professionalsCollectionRef, where('status', '==', 'Verified'));

                    const professionalsSnapshot = await getDocs(verifiedProfessionalsQuery);

                    professionalsSnapshot.forEach(doc => {
                        if (!verifiedProfessionals.find(pro => pro.id === doc.id)) {
                            verifiedProfessionals.push({
                                id: doc.id,
                                ...doc.data(),
                            } as Professional);
                        }
                    });
                }

                setProfessionals(verifiedProfessionals);
            } catch (error) {
                console.error("Error fetching verified professionals: ", error);
            } finally {
                setLoading(false);
            }
        };

        fetchVerifiedProfessionals();
    }, []);

    const handleDelete = async (id: string) => {
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) return;

            const professionalDocRef = doc(db, `organizations/${currentUser.uid}/professionals`, id);
            await deleteDoc(professionalDocRef);

            setProfessionals(prevProfessionals =>
                prevProfessionals.filter(professional => professional.id !== id)
            );
            console.log("Professional deleted successfully");
        } catch (error) {
            console.error("Error deleting professional: ", error);
        }
    };

    const handleViewDetails = async (id: string) => {
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) return;

            const professionalDocRef = doc(db, `organizations/${currentUser.uid}/professionals`, id);
            const professionalSnap = await getDoc(professionalDocRef);

            if (professionalSnap.exists()) {
                setSelectedProfessional(professionalSnap.data() as Professional);
                setIsModalOpen(true);
            } else {
                console.error("Professional not found.");
            }
        } catch (error) {
            console.error("Error fetching professional details: ", error);
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedProfessional(null);
    };

    

    const filteredProfessionals = professionals.filter(professional => {
        const lowerCaseSearch = searchTerm.trim().toLowerCase();
        return (
            professional.firstName?.toLowerCase().includes(lowerCaseSearch) || 
            professional.lastName?.toLowerCase().includes(lowerCaseSearch) ||
            professional.email?.toLowerCase().includes(lowerCaseSearch)
        );
    });

    const indexOfLastProfessional = currentPage * professionalsPerPage;
    const indexOfFirstProfessional = indexOfLastProfessional - professionalsPerPage;
    const currentProfessionals = filteredProfessionals.slice(indexOfFirstProfessional, indexOfLastProfessional);
    const totalPages = Math.ceil(filteredProfessionals.length / professionalsPerPage);

    if (loading) return <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>;

    return (
        <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
            <div className="max-w-full overflow-x-auto">
                <div className="flex items-center">
                    <input
                        type="text"
                        placeholder="Search professional by name or email"
                        className="mb-3 w-100 rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
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
                            <th className="min-w-[220px] py-4 px-4 font-medium text-black dark:text-white xl:pl-11">Name</th>
                            <th className="min-w-[150px] py-4 px-4 font-medium text-black dark:text-white">Date Joined</th>
                            <th className="min-w-[150px] py-4 px-4 font-medium text-black dark:text-white">Last Login</th>
                            <th className="min-w-[150px] py-4 px-4 font-medium text-black dark:text-white">Date Approved</th>
                            <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">Status</th>
                            <th className="py-4 px-4 font-medium text-black dark:text-white">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentProfessionals.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="text-center">No professionals found</td>
                            </tr>
                        ) : (
                            currentProfessionals.map(professional => (
                                <tr key={professional.id}>
                                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                        {professional.firstName ? `${professional.firstName} ${professional.lastName}` : 'N/A'}
                                    </td>
                                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                        {professional.createdAt?.toDate ? dayjs(professional.createdAt.toDate()).format("YYYY-MM-DD HH:mm") : "N/A"}
                                    </td>
                                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                        {professional.lastLogin?.toDate ? dayjs(professional.lastLogin.toDate()).format("YYYY-MM-DD HH:mm") : "N/A"}
                                    </td>
                                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                        {professional.dateApproved?.toDate ? dayjs(professional.dateApproved.toDate()).format("YYYY-MM-DD HH:mm") : "N/A"}
                                    </td>
                                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                        <p className={`inline-flex rounded-full bg-opacity-10 py-1 px-3 text-sm font-medium 
                                            ${ 
                                                professional.status === 'Unverified' ? 'bg-warning text-warning' : 
                                                professional.status === 'Verified' ? 'bg-success text-success' : ''}`}>
                                            {professional.status}
                                        </p>
                                    </td>
                                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                        <button
                                            className="ml-2 py-1 px-3 text-success hover:text-white rounded-md hover:bg-success hover:shadow-lg hover:shadow-success/50"
                                            onClick={() => handleViewDetails(professional.id)}
                                        >
                                            View Details
                                        </button>
                                        <button
                                            className="ml-2 py-1 px-3 text-danger dark:text-white rounded-md hover:bg-danger hover:text-white hover:shadow-lg hover:shadow-danger/50"
                                            onClick={() => handleDelete(professional.id)}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                <div className="flex justify-between items-center mt-4">
                    <button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(currentPage - 1)}
                        className="bg-gray-300 px-4 py-2 rounded"
                    >
                        Previous
                    </button>
                    <span>{`Page ${currentPage} of ${totalPages}`}</span>
                    <button
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(currentPage + 1)}
                        className="bg-gray-300 px-4 py-2 rounded"
                    >
                        Next
                    </button>
                </div>
            </div>
            {isModalOpen && selectedProfessional && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-lg w-full">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Professional Details</h2>
            
            <div className="space-y-4">
                <div>
                    <p className="text-gray-600"><strong>Name: </strong> {selectedProfessional.firstName} {selectedProfessional.middleName} {selectedProfessional.lastName}</p>
                </div>
                
                <div>
                    <p className="text-gray-600"><strong>Email: </strong> {selectedProfessional.email}</p>
                </div>

                <div>
                    <p className="text-gray-600"><strong>Status: </strong>
                        <span className={`inline-flex rounded-full py-1 px-3 text-sm font-medium
                                            ${selectedProfessional.status === 'Unverified' ? 'bg-danger/20 text-danger  ' : 
                                            selectedProfessional.status === 'Verified' ? 'bg-success/20 text-success' : ''}`}>
                            {selectedProfessional.status}
                        </span>
                    </p>
                </div>

                <div>
                    <p className="text-gray-600"><strong>Mobile Number: </strong> {selectedProfessional.mobileNumber}</p>
                </div>
                
                <div>
                    <p className="text-gray-600"><strong>Facebook Link: </strong> <a href={selectedProfessional.facebookLink} className="text-primary hover:underline">{selectedProfessional.facebookLink}</a></p>
                </div>

                <div>
                    <p><strong>Availability: </strong></p>
                    <ul className="list-inside pl-4 space-y-2">
                        {Object.entries(selectedProfessional.availability).map(([time, isAvailable]) => (
                            <li key={time} className="text-gray-600">
                                <strong>{time.charAt(0).toUpperCase() + time.slice(1)}:</strong> 
                                <span className={`text-${isAvailable ? 'success' : 'danger'}-500`}>
                                    {isAvailable ? 'Available' : 'Not Available'}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>

            </div>
            
            <div className="mt-6 flex justify-end">
                <button
                    className="bg-[#9F4FDD] text-white px-6 py-3 rounded-lg shadow-md hover:bg-primary focus:outline-none"
                    onClick={closeModal}
                >
                    Close
                </button>
            </div>
        </div>
    </div>
)}

        </div>
    );
};

export default RemoveProfessionalTable;
