
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
    doc,
    getDoc,
    collection,
    addDoc,
    deleteDoc,
    onSnapshot,
    updateDoc,
} from 'firebase/firestore';
import { db, auth } from '../../config/firebase';
import dayjs from 'dayjs';
import { motion } from 'framer-motion';

interface Comment {
    id: string;
    content: string;
    dateCreated: any;
    author: string;
    authorId: string;
    postId: string;
}

interface Post {
    id: string;
    content: string;
    dateCreated: any; // Use an appropriate type for the date
    author: string;
    authorId: string;
    userReactions: string[]; // Array of user IDs who reacted
    reacts: number; // Count of total reactions
    status: string;
}


const PostDetailsPage: React.FC = () => {
    const { postId } = useParams<{ postId: string }>();
    const [post, setPost] = useState<Post | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [commentContent, setCommentContent] = useState<string>('');
    const [editCommentId, setEditCommentId] = useState<string | null>(null);
    const [editCommentContent, setEditCommentContent] = useState<string>('');
    const [showComments, setShowComments] = useState<boolean>(false);
    const [showCommentForm, setShowCommentForm] = useState<boolean>(false);
    const [hasReacted, setHasReacted] = useState<boolean>(false);
    const [anonymous, setAnonymous] = useState<boolean>(false);
    const [creatingComment, setCreatingComment] = useState<boolean>(false); 

    useEffect(() => {
        const fetchPostById = async () => {
            if (!postId) {
                setError('Post ID is required');
                setLoading(false);
                return;
            }
            try {
                const docRef = doc(db, 'posts', postId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const postData = { id: postId, ...docSnap.data() } as Post; // Cast the fetched data to Post
                    
                    // Check if post is pending
                    if (postData.status === 'pending') {
                        // You can decide what to do with pending posts here
                        console.log('Post is pending:', postData);
                    }
        
                    setPost(postData);
        
                    // Check if the current user has reacted
                    const userId = auth.currentUser?.uid;
                    if (userId) {
                        setHasReacted(postData.userReactions?.includes(userId) || false);
                    }
                } else {
                    setError('Post not found');
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
    
        const unsubscribeComments = onSnapshot(collection(db, 'comments'), (snapshot) => {
            const commentsData = snapshot.docs
                .filter(doc => doc.data().postId === postId)
                .map(doc => ({ id: doc.id, ...doc.data() })) as Comment[];
            setComments(commentsData);
        });
    
        fetchPostById();
    
        return () => {
            unsubscribeComments();
        };
    }, [postId]);

    const toggleHeart = async () => {
        const userId = auth.currentUser?.uid;
        if (!post || !userId) return;
    
        const newReactions = new Set(post.userReactions || []);
        
        // Toggle the user's reaction
        if (hasReacted) {
            newReactions.delete(userId); // Remove reaction
        } else {
            newReactions.add(userId); // Add reaction
        }
    
        // Create the updated post object
        const updatedPost = {
            ...post,
            userReactions: Array.from(newReactions),
            reacts: newReactions.size,
        };
    
        // Update Firestore document
        await updateDoc(doc(db, 'posts', postId), updatedPost);
        
        // Update local state
        setPost(updatedPost);
        setHasReacted(!hasReacted); // Toggle the local reaction state
    };
    
    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreatingComment(true);
        if (commentContent.trim() === '' || !auth.currentUser) return;

        const currentDate = new Date();
        const user = auth.currentUser;

        try {
            const commentRef = collection(db, 'comments');
            let authorName = 'Unknown User';
    
                // Assuming you have user types stored in separate collections
                const userRef = doc(db, 'users', user.uid);
                const orgRef = doc(db, 'organizations', user.uid);
                const profRef = doc(db, 'professionals', user.uid);

                const userDoc = await getDoc(userRef);
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    authorName = `${userData.firstName} ${userData.lastName}`; // For users
                } else {
                    const orgDoc = await getDoc(orgRef);
                    if (orgDoc.exists()) {
                        const orgData = orgDoc.data();
                        authorName = orgData.organizationName; // For organizations
                    } else {
                        const profDoc = await getDoc(profRef);
                        if (profDoc.exists()) {
                            const profData = profDoc.data();
                            authorName = `${profData.firstName} ${profData.lastName}`; // For professionals
                        }
                    }
                }

            await addDoc(commentRef, {
                content: commentContent,
                dateCreated: currentDate,
                author: anonymous ? 'Anonymous' : authorName,
                authorId: user.uid,
                postId: postId,
            });

            
            setCommentContent('');
            setShowCommentForm(false);
        } catch (error) {
            console.error('Failed to add comment:', error);
        }finally {
            setCreatingComment(false);
        }
    };

    const formattedDate = (date) => {
        const now = dayjs();
        const createdDate = dayjs(date.toDate());
        const diffInSeconds = now.diff(createdDate, 'second');
        const diffInMinutes = now.diff(createdDate, 'minute');
        const diffInHours = now.diff(createdDate, 'hour');
        const diffInDays = now.diff(createdDate, 'day');
    
        if (diffInSeconds < 60) {
            return `${diffInSeconds} second${diffInSeconds !== 1 ? 's' : ''} ago`;
        } else if (diffInMinutes < 60) {
            return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
        } else if (diffInHours < 24) {
            return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
        } else {
            return createdDate.format('MMM D, YYYY'); // Format for older posts
        }
    };
    

    const handleDeleteComment = async (commentId: string) => {
        const commentDocRef = doc(db, 'comments', commentId);
        try {
            await deleteDoc(commentDocRef);
        } catch (error) {
            console.error('Failed to delete comment:', error);
        }
    };

    const handleEditComment = (commentId: string, content: string) => {
        setEditCommentId(commentId);
        setEditCommentContent(content);
    };

    const handleUpdateComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editCommentContent.trim() === '' || !editCommentId) return;

        const commentDocRef = doc(db, 'comments', editCommentId);
        try {
            await updateDoc(commentDocRef, {
                content: editCommentContent,
            });
            setEditCommentId(null);
            setEditCommentContent('');
        } catch (error) {
            console.error('Failed to update comment:', error);
        }
    };

    if (loading) return <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>;
    if (error) return <div className="text-red-500">{error}</div>;

   

    return (
        <div className="container mx-auto bg-white rounded-lg p-6 shadow-lg dark:bg-boxdark">
            <div className="mb-6">
                <h1 className="text-4xl font-bold mb-2">{post.content}</h1>
                <p className="text-sm text-gray-500">
                    By <a href={`/profile/${post.authorId}`} className="text-blue-500 hover:underline">{post.author}</a> on {dayjs(post.dateCreated.toDate()).format('MMM D, YYYY')}
                </p>
            </div>

            {/* Reaction Section */}
            <div className="flex items-center mb-6">
            <motion.button
                onClick={toggleHeart}
                className={`flex items-center px-3 py-2 rounded-md transition-all duration-200 ${hasReacted ? 'text-danger' : 'bg-gray-100 text-gray-400'}`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="ionicon" viewBox="0 0 512 512" width={20} height={20}>
                    <path
                        d="M352.92 80C288 80 256 144 256 144s-32-64-96.92-64c-52.76 0-94.54 44.14-95.08 96.81-1.1 109.33 86.73 187.08 183 252.42a16 16 0 0018 0c96.26-65.34 184.09-143.09 183-252.42-.54-52.67-42.32-96.81-95.08-96.81z"
                        fill={hasReacted ? 'currentColor' : 'none'}
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="32"
                    />
                </svg>
                <span className="ml-2 font-semibold">
                    {post.reacts} {post.reacts === 1 ? 'react' : 'reactions'}
                </span>
            </motion.button>
            
            <button
                onClick={() => setShowComments(!showComments)}
                className=" px-4 py-2 font-semibold rounded-md dark:text-white hover:text-white hover:bg-[#9F4FDD] transition"
            >
                {showComments ? 'Hide Comments' : `Show Comments (${comments.length})`}
            </button>
        </div>


          
          

            {/* Comments Section */}
            {showComments && (
                <div className="mb-6">
                    <h2 className="text-lg font-semibold  mb-2">Comments</h2>
                    <button
                        onClick={() => setShowCommentForm(!showCommentForm)}
                        className="mb-4 px-4 py-2 bg-green-500 font-semibold rounded-md dark:text-white hover:text-white hover:bg-[#9F4FDD] transition"
                    >
                        {showCommentForm ? 'Cancel' : 'Write a Comment'}
                    </button>
                    {comments.length > 0 ? (
                        <ul className="space-y-4">
                            {comments.map(comment => (
                                <li key={comment.id} className="p-4 bg-gray-50 border border-gray-200 rounded-md shadow">
                                    <p className="text-gray-800">{comment.content}</p>
                                    <p className="text-sm text-gray-500">
                                        By <a href={`/profile/${comment.authorId}`} className="text-blue-500 hover:underline">{comment.author}</a> on {formattedDate(comment.dateCreated)}
                                    </p>
                                    {comment.authorId === auth.currentUser?.uid && (
                                        <div className="flex space-x-2 mt-2">
                                            <button
                                                onClick={() => handleDeleteComment(comment.id)}
                                                className="text-red-500 hover:underline"
                                            >
                                                Delete
                                            </button>
                                            <button
                                                onClick={() => handleEditComment(comment.id, comment.content)}
                                                className="text-blue-500 hover:underline"
                                            >
                                                Edit
                                            </button>
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-600">No comments yet.</p>
                    )}
                   
                </div>
            )}

            {/* Write a Comment Button */}
            

            {/* Add Comment Form */}
            {showCommentForm && (
                <form onSubmit={handleAddComment} className="mt-4">
                    <textarea
                        value={commentContent}
                        onChange={(e) => setCommentContent(e.target.value)}
                        rows={4}
                        placeholder="Add a comment..."
                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                    <label className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    checked={anonymous}
                                    onChange={(e) => setAnonymous(e.target.checked)}
                                    className="w-4 h-4"
                                />
                                <span className="text-sm">Post anonymously</span>
                            </label>
                            <button
                                type="submit"
                                disabled={creatingComment}
                                className="ml-auto px-6 py-2 bg-green-600 hover:bg-[#9F4FDD] hover:text-white dark:text-white rounded-md hover:bg-green-700 transition"
                            >
                                {creatingComment ? 'Posting...' : 'Post'}
                            </button>   
                </form>
            )}

            {/* Edit Comment Form */}
            {editCommentId && (
                <form onSubmit={handleUpdateComment} className="mt-4">
                    <textarea
                        value={editCommentContent}
                        onChange={(e) => setEditCommentContent(e.target.value)}
                        rows={4}
                        placeholder="Edit your comment..."
                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                    <div className="flex space-x-2 mt-2">
                        <button type="submit" className="px-4 py-2 bg-green-500 text-white rounded-md transition hover:bg-green-600">
                            Update Comment
                        </button>
                        <button
                            type="button"
                            onClick={() => setEditCommentId(null)}
                            className="px-4 py-2 bg-red-500 text-white rounded-md transition hover:bg-red-600"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            )}
            
        </div>
    );
};

export default PostDetailsPage;
