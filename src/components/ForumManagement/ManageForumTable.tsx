import { Link, NavLink } from "react-router-dom";
import React, { useEffect, useState } from 'react';
import { collection, getDocs, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../../config/firebase';
import Alert from '../../pages/UiElements/Alerts';
import dayjs from 'dayjs'; 
import {UserData, Forum} from '../../hooks/types';


const ManageForumTable = () => {
    const [userData, setUserData] = useState<UserData | null>(null);
    const [forums, setForums] = useState<Forum[]>([]);
    const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const forumsPerPage = 5; // Items per page
    const [searchTerm, setSearchTerm] = useState<string>("");

    useEffect(() => {
        const fetchUserData = async () => {
            const user = auth.currentUser;
            if (user) {
                let userDocRef = doc(db, 'organizations', user.uid);
                let userDoc = await getDoc(userDocRef);

                if (!userDoc.exists()) {
                    userDocRef = doc(db, 'professionals', user.uid);
                    userDoc = await getDoc(userDocRef);
                }

                if (!userDoc.exists()) {
                    userDocRef = doc(db, 'users', user.uid);
                    userDoc = await getDoc(userDocRef);
                }

                if (!userDoc.exists()) {
                    userDocRef = doc(db, 'admins', user.uid);
                    userDoc = await getDoc(userDocRef);
                }

                if (userDoc.exists()) {
                    setUserData(userDoc.data() as UserData);
                    fetchForums(); // Fetch forums after setting user data
                } else {
                    console.log('No such document!');
                }
            }
        };

        fetchUserData();
    }, []);

    const fetchForums = async () => {
        const forumsCollectionRef = collection(db, 'forums');
        const forumsSnapshot = await getDocs(forumsCollectionRef);
        const forumsData = forumsSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            dateCreated: doc.data().dateCreated instanceof Date ? doc.data().dateCreated : new Date(doc.data().dateCreated),
        } as Forum));
        setForums(forumsData);
    };

    const handleDelete = async (forumId: string) => {
        const forumDocRef = doc(db, 'forums', forumId);

        try {
            await deleteDoc(forumDocRef);
            setForums((prevForums) => prevForums.filter((forum) => forum.id !== forumId));
            setAlert({ type: 'success', message: 'Forum deleted successfully!' });
        } catch (error) {
            console.error('Error deleting forum: ', error);
        }
    };

    
          
            const filteredForums = forums.filter(forum =>
                forum.authorName && forum.authorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                forum.title && forum.title.toLowerCase().includes(searchTerm.toLowerCase())
            );


    // Pagination logic
    const indexOfLastForum = currentPage * forumsPerPage;
    const indexOfFirstForum = indexOfLastForum - forumsPerPage;
    const currentForums = filteredForums.slice(indexOfFirstForum, indexOfLastForum);
    const totalPages = Math.ceil(filteredForums.length / forumsPerPage);

    return (
        <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
            {alert && <Alert type={alert.type} message={alert.message} />}
            <div className="max-w-full overflow-x-auto">
                <div className="flex items-center">
                    <input
                        type="text"
                        placeholder="Search forum by title or author"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="mb-3 w-100 rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                    />
                    <Link
                        to="#"
                        className="h-12 w-40 mb-3 ml-4 inline-flex items-center justify-center rounded-md bg-[#9F4FDD]   hover:shadow-lg hover:shadow-[#9F4FDD]/50 py-4 px-10 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10"
                    >
                        Search
                    </Link>
                </div>
                <table className="w-full table-auto">
                    <thead>
                        <tr className="bg-gray-2 text-left dark:bg-meta-4">
                            <th className="min-w-[220px] py-4 px-4 font-medium text-black dark:text-white xl:pl-11">
                                Author
                            </th>
                            <th className="min-w-[150px] py-4 px-4 font-medium text-black dark:text-white">
                                Title
                            </th>
                            <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">
                                Date Posted
                            </th>
                            <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">
                                Members
                            </th>
                            <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">
                                Posts
                            </th>
                            <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">
                                Reports
                            </th>
                            <th className="py-4 px-4 font-medium text-black dark:text-white">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredForums.length === 0 && currentForums.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="text-center">No forums found</td>
                            </tr>
                        ) : (
                            currentForums.map((forum) => (
                                <tr key={forum.id}>
                                    <td className="border-b border-[#eee] py-5 px-4 pl-9 dark:border-strokedark xl:pl-11">
                                        <h5 className="font-medium text-black dark:text-white">
                                            {forum.authorName} ({forum.authorType})
                                        </h5>
                                    </td>
                                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                        <p className="text-black dark:text-white">{forum.title}</p>
                                    </td>
                                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                        <p className="text-black dark:text-white">{dayjs(forum.dateCreated).format('MMM D, YYYY')}</p>
                                    </td>
                                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                        <p className="text-black dark:text-white">{forum.totalMembers}</p>
                                    </td>
                                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                        <p className="text-black dark:text-white">{forum.totalPosts}</p>
                                    </td>
                                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                        <p className="text-black dark:text-white">{forum.reports}</p>
                                    </td>
                                   
                                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                        <button className="mr-2 text-sm dark:text-white">
                                            <NavLink to={`/forums/${forum.id}`} className="flex items-center justify-center hover:shadow-lg hover:bg-success hover:text-white rounded-md py-1 px-5">
                                                View
                                            </NavLink>
                                        </button>
                                        <button
                                            onClick={() => handleDelete(forum.id)}
                                            className="
                                            text-sm rounded-md hover:bg-danger hover:text-white text-danger hover:shadow-lg hover:shadow-danger/50  py-1 px-5"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                {/* Pagination */}
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
    );
};

export default ManageForumTable;
