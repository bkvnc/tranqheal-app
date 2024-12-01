import React, { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc, query, where, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import dayjs from 'dayjs';
import { Link } from 'react-router-dom';
import { Post } from '../../hooks/types';
import { getAuth } from 'firebase/auth';
import { ToastContainer, toast } from 'react-toastify'; // Import ToastContainer and toast
import 'react-toastify/dist/ReactToastify.css';


const PendingPosts = () => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const pendingsPerPage = 5;
    const [searchTerm, setSearchTerm] = useState<string>("");
    

    useEffect(() => {
        const checkOrganizationAndFetchPosts = async () => {
            setLoading(true);
    
            const auth = getAuth();
            const user = auth.currentUser;
            
            try {
                if (user) {
                    console.log("User authenticated successfully:");
                    console.log("User UID:", user.uid);
                    console.log("User email:", user.email);
                } else {
                    console.error("User is not authenticated.");
                }
            } catch (error) {
                console.error("Authentication error:", error);
                console.error("Error code:", error.code);
                console.error("Error message:", error.message);
            }
    
            if (!user) {
                console.error("User is not authenticated");
                setLoading(false);
                return; 
            }
    
            try {
                console.log('Fetching pending posts from forums...');
                const forumsSnapshot = await getDocs(collection(db, 'forums'));
                const pendingPosts = [];
    
                for (const forumDoc of forumsSnapshot.docs) {
                    const forumId = forumDoc.id;
                    const postsCollectionRef = collection(db, 'forums', forumId, 'posts');
                    const postsQuery = query(postsCollectionRef, where('status', '==', 'pending'));
                    const postsSnapshot = await getDocs(postsQuery);
    
                    postsSnapshot.forEach(postDoc => {
                        const postData = postDoc.data();
                        pendingPosts.push({
                            id: postDoc.id,
                            forumId: forumId,
                            ...postData,
                            dateCreated: postData.dateCreated && postData.dateCreated.toDate
                            ? postData.dateCreated.toDate() // Convert Firestore Timestamp to Date
                            : new Date(),  
                        });
                    });
                }
    
                console.log('Pending posts found:', pendingPosts.length);
                console.log(pendingPosts);
                setPosts(pendingPosts); 
            } catch (error) {
                console.error('Error fetching pending posts:', error);
                toast.error(`Error: ${error.message}`);
            } finally {
                setLoading(false);
            }
        };
    
        checkOrganizationAndFetchPosts();
    }, []);
    

    const handleStatusUpdate = async (forumId: string, postId: string, newStatus: 'approved' | 'rejected') => {  
        setLoading(true);
        const auth = getAuth();
        const user = auth.currentUser;
    
        if (!user) {
            console.error("User is not authenticated");
            setLoading(false);
            return; 
        }
    
        try {
            const postRef = doc(db, 'forums', forumId, 'posts', postId);
            const postSnap = await getDoc(postRef);
    
            if (!postSnap.exists()) {
                throw new Error('Post not found');
            }
    
            const updateData = {
                status: newStatus,
                reviewedBy: user.uid,
                reviewedAt: new Date(),
            };
    
          
            await updateDoc(postRef, updateData);
            console.log(`Post status updated to ${newStatus}`);

            
        
    
            const notificationRef = doc(collection(db, `notifications/${postSnap.data().authorId}/messages`));
            await setDoc(notificationRef, {
                recipientId: postSnap.data().authorId,
                recipientType: postSnap.data().authorType,  
                message: `Your post has been ${newStatus}`,
                type: `post_${newStatus}`,
                createdAt: serverTimestamp(),
                isRead: false,
                additionalData: {
                  postId: postId,
                  forumId: forumId,
                },
              });
            const notificationDoc = await getDoc(notificationRef);
                const notificationData = notificationDoc.data();

                if (notificationData && notificationData.createdAt) {
                const createdAtDate = notificationData.createdAt.toDate();
                console.log("Notification createdAt:", createdAtDate); 
                }
                            console.log(`Notification created for post ${postId}`);
    
          
            setPosts((currentPosts) =>
                currentPosts.filter((post) => post.id !== postId || post.forumId !== forumId)
            );
    
            toast.success(`Post successfully ${newStatus}`);
        } catch (error: any) {
            console.error('Error updating post status:', error);
            toast.error(`Error ${newStatus} post: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };
   
    const handleApprove = (forumId: string, postId: string) => {
        const confirmed = window.confirm("Are you sure you want to approve this post?");
        if (confirmed) {
            handleStatusUpdate(forumId, postId, 'approved');
        }
    };
    
    const handleReject = (forumId: string, postId: string) => {
        const confirmed = window.confirm("Are you sure you want to reject this post?");
    
        if (confirmed) {
            handleStatusUpdate(forumId, postId, 'rejected');
        }
    };

    const filteredPending = posts.filter(post =>
        (post.authorName?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
        (post.title?.toLowerCase().includes(searchTerm.toLowerCase()) || '')
    );
    if (loading) return <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>;

    const indexOfLastPending = currentPage * pendingsPerPage;
    const indexOfFirstPending = indexOfLastPending - pendingsPerPage;
    const currentPending = filteredPending.slice(indexOfFirstPending, indexOfLastPending);
    const totalPages = Math.ceil(filteredPending.length / pendingsPerPage);

    return (
        <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
            <ToastContainer />
            {loading && <div className="text-center py-4">Loading...</div>}
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
                        className="h-12 w-40 mb-3 ml-4 inline-flex items-center justify-center rounded-md bg-[#9F4FDD]  hover:shadow-lg hover:shadow-[#9F4FDD]/50  py-4 px-10 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10"
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
                                <td colSpan={6} className="text-center">No pending posts</td>
                            </tr>
                        ) : (
                            currentPending.map(post => (
                                <tr key={post.id}>
                                    <td className="border-b border-[#eee] py-5 px-4 pl-9 dark:border-strokedark xl:pl-11">{post.id}</td>
                                    <td className="border-b border-[#eee] py-5 px-4 pl-9 dark:border-strokedark xl:pl-11">{post.author} {post.authorName}</td>
                                    <td className="border-b border-[#eee] py-5 px-4 pl-9 dark:border-strokedark xl:pl-11">{post.content}</td>
                                    <td className="border-b border-[#eee] py-5 px-4 pl-9 dark:border-strokedark xl:pl-11">
                                        {dayjs(post.dateCreated).format('MMM D, YYYY')}
                                    </td>
                                     <td className="bborder-b border-[#eee] py-5 px-4 pl-9 dark:border-strokedark xl:pl-11">
                                        <button
                                            onClick={() => handleApprove(post.forumId, post.id)}
                                            className="py-1 px-3  dark:text-white rounded-md hover:bg-success hover:text-white  hover:shadow-lg hover:shadow-success/50"
                                        >
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => handleReject(post.forumId, post.id)}
                                            className="ml-2 py-1 px-3 text-danger dark:text-white rounded-md hover:bg-danger hover:text-white  hover:shadow-lg hover:shadow-danger/50"
                                        >
                                            Reject
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
    );
};

export default PendingPosts;
