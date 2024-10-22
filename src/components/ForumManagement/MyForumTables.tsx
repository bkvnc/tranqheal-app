import React, { useEffect, useState } from 'react';
import { collection, getDocs, doc, getDoc, addDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db, auth } from '../../config/firebase';
import dayjs from 'dayjs'; 
import Alert from '../../pages/UiElements/Alerts';
import { NavLink } from 'react-router-dom';

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
    tags: string[];
    status: string;
    description: string;
    authorName: string;
    authorType: string;
    authorId: string;
    totalPosts: number | null;
    
}

const MyForumTable: React.FC = () => {
    const [userData, setUserData] = useState<UserData | null>(null);
    const [forums, setForums] = useState<Forum[]>([]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    
    
    const [currentPage, setCurrentPage] = useState(1);
    const [forumsPerPage] = useState(5); 
    useEffect(() => {
        const fetchUserData = async () => {
            const user = auth.currentUser;
            if (user) {
                const userDocRef = doc(db, 'organizations', user.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    setUserData(userDoc.data() as UserData);
                } else {
                    console.log('No such document!');
                }
            }
        };
        fetchUserData();
    }, []);

    const handleCreateForumClick = () => {
        setIsCreateModalOpen(true);
    };

    const handleModalClose = () => {
        setIsCreateModalOpen(false);
        setTitle('');
        setDescription('');
        setTags([]);
    };

    const handleTagChange = (tag: string, isChecked: boolean) => {
        if (isChecked) {
            setTags([...tags, tag]);
        } else {
            setTags(tags.filter((t) => t !== tag));
        }
    };

    useEffect(() => {
        const fetchForums = async () => {
            const user = auth.currentUser;
            if (user && userData) {
                const forumsCollectionRef = collection(db, 'forums');
                const forumsQuery = query(forumsCollectionRef, where("authorName", "==", userData.organizationName));
                const forumsSnapshot = await getDocs(forumsQuery);
                const forumsData = forumsSnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                    dateCreated: doc.data().dateCreated?.toDate(), // Ensure dateCreated exists
                } as Forum));
                setForums(forumsData);
            }
        };

        if (userData) {
            fetchForums();
        }
    }, [userData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const currentDate = new Date();

        try {
            const forumRef = collection(db, 'forums');
            const user = auth.currentUser; // Get the current user

            if (!user) {
                throw new Error('User not authenticated');
            }

            await addDoc(forumRef, {
                title,
                description,
                dateCreated: currentDate,
                totalComments: 0,
                status: 'pending',
                tags,
                totalMembers: 0,
                totalUpvotes: 0,
                authorId: user.uid, // Store authorId here
                authorName: userData?.organizationName || 'Anonymous',
                authorType: userData?.userType || 'user',
            });
            setAlert({ type: 'success', message: 'Forum created successfully!' });
            setTimeout(() => {
                setAlert(null);
                window.location.reload(); 
            }, 1000);

            handleModalClose(); // Close modal and reset form
        } catch (error) {
            console.error('Error creating forum: ', error);
            setAlert({ type: 'error', message: 'Failed to create forum.' });
        }
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

    // Pagination logic
    const indexOfLastForum = currentPage * forumsPerPage;
    const indexOfFirstForum = indexOfLastForum - forumsPerPage;
    const currentForums = forums.slice(indexOfFirstForum, indexOfLastForum);
    const totalPages = Math.ceil(forums.length / forumsPerPage);

    return (
        <>
            <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
                <div className="max-w-full overflow-x-auto">
                    <div className="flex items-center">
                        <input
                            type="text"
                            placeholder="Search responder by name or email"
                            className="mb-3 w-100 rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                        />
                        <button
                            onClick={handleCreateForumClick}
                            className="h-12 w-50 mb-3 ml-4 inline-flex items-center justify-center rounded-md bg-[#9F4FDD] py-4 px-10 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10"
                        >
                            Create Forum
                        </button>
                    </div>
                    {/* Forum Table */}
                    <table className="w-full table-auto">
                        <thead>
                            <tr className="bg-gray-2 text-left dark:bg-meta-4">
                                <th className="min-w-[220px] py-4 px-4 font-medium text-black dark:text-white xl:pl-11">ID</th>
                                <th className="min-w-[150px] py-4 px-4 font-medium text-black dark:text-white">Title</th>
                                <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">Date Posted</th>
                                <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">Members</th>
                                <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">Total Posts</th>
                                <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">Status</th>
                                <th className="py-4 px-4 font-medium text-black dark:text-white">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentForums.map((forum) => (
                                <tr key={forum.id}>
                                    <td className="border-b border-[#eee] py-5 px-4 pl-9 dark:border-strokedark xl:pl-11">
                                        <h5 className="font-medium text-black dark:text-white">{forum.id}</h5>
                                    </td>
                                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                        <p className="text-black dark:text-white">{forum.title}</p>
                                    </td>
                                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                        <p className="text-black dark:text-white">{dayjs(forum.dateCreated).format('MMM D, YYYY')}</p> 
                                    </td>
                                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                        <p className="text-black dark:text-white">{forum.totalMembers || 0}</p>
                                    </td>
                                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                        <p className="text-black dark:text-white">{forum.totalPosts|| 0}</p>
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
                </div>
                {/* Pagination Controls */}
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
            {/* Create Forum Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center z-50 dark:bg">
                    <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full dark:bg-boxdark">
                        <h2 className="text-xl font-bold mb-4">Create a New Forum</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">Title</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">Description</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">Tags</label>
                                <div className="space-x-2">
                                    {['Mental Health', 'Wellness', 'Self-Care', 'Therapy', 'Anxiety', 'Mindfulness'].map((tag) => (
                                        <label key={tag}>
                                            <input
                                                type="checkbox"
                                                value={tag}
                                                checked={tags.includes(tag)}
                                                onChange={(e) => handleTagChange(tag, e.target.checked)}
                                            />
                                            {tag}
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={handleModalClose}
                                    className="mr-2 px-4 py-2 bg-gray-300 rounded-md"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-[#9F4FDD] text-white rounded-md"
                                >
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {alert && <Alert type={alert.type} message={alert.message} />}
        </>
    );
};

export default MyForumTable;
