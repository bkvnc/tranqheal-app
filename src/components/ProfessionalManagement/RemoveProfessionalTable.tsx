import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { db } from "../../config/firebase";
import { collection, getDocs } from "firebase/firestore";
import dayjs from 'dayjs';

interface Professional {
    id: string;
    firstName: string;
    lastName: string;
    middleName: string;
    email: string;
    organizationName: string;
    userType: string;
    createdAt: any;
    lastLogin: any;
    dateApproved: any;
    status: string;
}

const RemoveProfessionalTable = () => {
    const [professionals, setProfessionals] = useState<Professional[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchProfessionals = async () => {
            try {
                const professionalsCollection = collection(db, "professionals"); // Replace "professionals" with your collection name
                const professionalSnapshot = await getDocs(professionalsCollection);
                const professionalList = professionalSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                })) as Professional[];
                setProfessionals(professionalList);
            } catch (error) {
                console.error("Error fetching professionals: ", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfessionals();
    }, []);

    if (loading) {
        return <div>Loading...</div>; // Display a loading state
    }

    return (
        <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
            <div className="max-w-full overflow-x-auto">
                <div className="flex items-center">
                    <input
                        type="text"
                        placeholder="Search responder by name or email"
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
                            <th className="min-w-[220px] py-4 px-4 font-medium text-black dark:text-white xl:pl-11">Name</th>
                            <th className="min-w-[150px] py-4 px-4 font-medium text-black dark:text-white">Date Joined</th>
                            <th className="min-w-[150px] py-4 px-4 font-medium text-black dark:text-white">Last Login</th>
                            <th className="min-w-[150px] py-4 px-4 font-medium text-black dark:text-white">Date Approved</th>
                            <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">Status</th>
                            <th className="py-4 px-4 font-medium text-black dark:text-white">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {professionals.map((professional) => (
                            <tr key={professional.id}>
                                <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                {professional.firstName ? `${professional.firstName} ${professional.lastName}'s` : 'N/A'}
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
                                <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">{professional.status}</td>
                                <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                    <button className="hover:text-primary">Edit</button>
                                    <button className="hover:text-primary">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default RemoveProfessionalTable;
