import { Link } from "react-router-dom";
import React, { useEffect, useState } from 'react';
import { collection, getDocs, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../../config/firebase';
import Alert from '../../pages/UiElements/Alerts';
import dayjs from 'dayjs'; 
import { NavLink } from "react-router-dom";

interface UserData {
    userType: string;
    organizationName?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    profilePicture?: string;
    profileImage?: string;
}

interface Forum {
    id: string;
    title: string;
    dateCreated: any;
    totalMembers: number | null;
    totalComments: number | null;
    totalPosts: number | null;
    tags: string[];
    status: string;
    description: string;
    authorName: string;
    authorType: string;
}

const ManageForumTable = () => {
    const [userData, setUserData] = useState<UserData | null>(null);
    const [forums, setForums] = useState<Forum[]>([]);
    const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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
                    fetchForums(); // Call fetchForums after setting userData
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
            dateCreated: doc.data().dateCreated?.toDate(), // Ensure dateCreated is a Firestore timestamp
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
                                Status
                            </th>
                            <th className="py-4 px-4 font-medium text-black dark:text-white">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {forums.map((forum) => (
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
                                <p className={`inline-flex rounded-full bg-opacity-10 py-1 px-3 text-sm font-medium 
                                            ${forum.status === 'inactive' ? 'bg-danger text-danger' : 
                                            forum.status === 'pending' ? 'bg-warning text-warning' : 
                                            forum.status === 'active' ? 'bg-success text-success' : ''}`}>
                                            {forum.status}
                                        </p>
                                </td>
                                <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                        <button className="mr-2 text-sm dark:text-white">
                                            <NavLink to={`/forums/${forum.id}`} className="flex items-center justify-center">
                                                View
                                            </NavLink>
                                        </button>
                                        <button
                                            onClick={() => handleDelete(forum.id)}
                                            className="text-sm text-danger"
                                        >
                                            Delete
                                        </button>
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
    );
};

export default ManageForumTable;
