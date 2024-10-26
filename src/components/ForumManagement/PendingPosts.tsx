import React, { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../../config/firebase';
import dayjs from 'dayjs';
import Alert from '../../pages/UiElements/Alerts';
import { Link } from 'react-router-dom';
import {Post} from '../../hooks/types'



const PendingPosts = () => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const pendingsPerPage = 5;
    const [searchTerm, setSearchTerm] = useState<string>("");

    useEffect(() => {
        const fetchPendingPosts = async () => {
            const postsQuery = query(collection(db, 'posts'), where('status', '==', 'pending'));
            const postsSnapshot = await getDocs(postsQuery);
            
            console.log('Pending posts snapshot:', postsSnapshot); // Log the snapshot
            
            const pendingPosts = postsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                
                dateCreated: doc.data().dateCreated ? doc.data().dateCreated.toDate() : new Date(),
                
            })) as Post[];

            console.log('Mapped pending posts:', pendingPosts); // Log the mapped posts
            setPosts(pendingPosts);
            
        };

        fetchPendingPosts();
    }, []);

    const handleApprove = async (postId: string) => {
        const postDocRef = doc(db, 'posts', postId);
        try {
            await updateDoc(postDocRef, { status: 'approved' });
            setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
            setAlert({ type: 'success', message: 'Post approved successfully!' });
        } catch (error) {
            setAlert({ type: 'error', message: 'Error approving post.' });
            console.error('Error approving post:', error);
        }
    };

    const filteredPending = posts.filter(post =>
        (post.author?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
        (post.title?.toLowerCase().includes(searchTerm.toLowerCase()) || '')
    );

    const indexOfLastPending = currentPage * pendingsPerPage;
    const indexOfFirstPending = indexOfLastPending - pendingsPerPage;
    const currentPending = filteredPending.slice(indexOfFirstPending, indexOfLastPending);
    const totalPages = Math.ceil(filteredPending.length / pendingsPerPage);
    console.log('Current Pending after pagination:', currentPending);

    return (
        <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
            {alert && <Alert type={alert.type} message={alert.message} />}
            <h1 className="text-lg font-bold mb-4">Pending Posts</h1>
            <div className="max-w-full overflow-x-auto">
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
                            <th className="py-4 px-4 font-medium text-black dark:text-white">Post ID</th>
                            <th className="py-4 px-4 font-medium text-black dark:text-white">Author</th>
                            <th className="py-4 px-4 font-medium text-black dark:text-white">Post Content</th>
                            <th className="py-4 px-4 font-medium text-black dark:text-white">Date Created</th>
                            <th className="py-4 px-4 font-medium text-black dark:text-white">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                    {currentPending.length === 0 ? (
                        <tr>
                            <td colSpan={4} className="text-center">No pending posts</td>
                        </tr>
                    ) : (
                        currentPending.map(post => {
                            console.log('Rendering post:', post); // Log each post being rendered
                            return (
                                <tr key={post.id}>
                                    <td className="border-b py-5 px-4">{post.id}</td>
                                    <td className="border-b py-5 px-4">{post.author}</td>
                                    <td className="border-b py-5 px-4">{post.content}</td>
                                    <td className="border-b py-5 px-4">
                                        {dayjs(post.dateCreated).format('MMM D, YYYY')}
                                    </td>
                                    <td className="border-b py-5 px-4">
                                        <button
                                            onClick={() => handleApprove(post.id)}
                                            className="py-1 px-3 bg-green-500 dark:text-white rounded-md hover:bg-success"
                                        >
                                            Approve
                                        </button>
                                    </td>
                                </tr>
                            );
                        })
                    )}
                    </tbody>

                </table>
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

export default PendingPosts;
