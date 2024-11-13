
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
    setDoc,
    serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from '../../config/firebase';
import dayjs from 'dayjs';
import { motion } from 'framer-motion';
import {toast} from 'react-toastify';
import {Post} from '../../hooks/types';
import { getBlacklistedWords } from '../../hooks/getBlacklistedWords';
import {Comment} from '../../hooks/types';
import useForum from '../../hooks/useForum';
import { highlightText } from '../../hooks/hightlightText';
import {containsBlacklistedWords} from '../utils/validationUtils';





const PostDetailsPage: React.FC = () => {
    const { postId } = useParams<{ postId: string }>();
    const { forumId } = useParams<{ forumId: string }>();
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
    // const [replyContent, setReplyContent] = useState<string>('');
    // const [replyToCommentId, setReplyToCommentId] = useState<string | null>(null);
    // const [showReplyForms, setShowReplyForms] = useState<boolean>(false);
    
    const { 
        blacklistedWords,
        setBlacklistedWords
    } = useForum(forumId);

    useEffect(() => {
        const fetchBlacklistedWords = async () => {
            const words = await getBlacklistedWords(); 
            setBlacklistedWords(words || []);
        };
        fetchBlacklistedWords();
    }, []);

    

    useEffect(() => {
        const fetchPostById = async () => {
            if (!forumId || !postId) {
                setError('Forum ID and Post ID are required');
                setLoading(false);
                return;
            }
    
            try {
                const docRef = doc(db, 'forums', forumId, 'posts', postId);
                const docSnap = await getDoc(docRef);
    
                if (docSnap.exists()) {
                    const postData = { id: postId, ...docSnap.data() } as Post; // Cast the fetched data to Post
                    
                    // Check if post is pending
                    if (postData.status === 'pending') {
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
    
        const unsubscribeComments = onSnapshot(
            collection(db, 'forums', forumId, 'posts', postId, 'comments'), 
            (snapshot) => {
                const commentsData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Comment[];
                setComments(commentsData);
            }
        );
    
        fetchPostById();
    
        return () => {
            unsubscribeComments();
        };
    }, [forumId, postId]);
    const toggleHeart = async () => {
        
        const userId = auth.currentUser?.uid;
        const user = auth.currentUser;

        let authorName = 'Unknown User';
    
            // Retrieve user information based on user type
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
        if (!post || !userId) return;
    
        const newReactions = new Set(post.userReactions || []);
       
        
        
        if (hasReacted) {
            newReactions.delete(userId);
        } else {
            newReactions.add(userId); 
        }
    
       
        const updatedPost = {
            ...post,
            userReactions: Array.from(newReactions),
            reacts: newReactions.size,
        };
        await updateDoc(doc(db, 'forums', forumId, 'posts', postId), updatedPost);

        const postDocRef = doc(db, 'forums', forumId, 'posts', postId,);
        const reactSnap = await getDoc(postDocRef );


        const notificationRef = doc(collection(db, `notifications/${reactSnap.data().authorId}/messages`));
        await setDoc(notificationRef, {
            recipientId: reactSnap.data().authorId,
            recipientType: reactSnap.data().authorType,  
            message: `${authorName}  reacted on your post.`,
            type: `react_post`,
            createdAt: serverTimestamp(), 
            isRead: false,
            additionalData: {
                forumId: forumId,
            },
        });

        const notificationDoc = await getDoc(notificationRef);
            const notificationData = notificationDoc.data();

            if (notificationData && notificationData.createdAt) {
            const createdAtDate = notificationData.createdAt.toDate();
            console.log("Notification createdAt:", createdAtDate); // For debugging
            }
        
        // Update local state
        setPost(updatedPost);
        setHasReacted(!hasReacted); // Toggle the local reaction state
    };

    const toggleCommentReaction = async (commentId: string) => {
        const userId = auth.currentUser?.uid;
        const user = auth.currentUser;

        let authorName = 'Unknown User';
    
            // Retrieve user information based on user type
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
        if (!userId) return;
    
        const commentIndex = comments.findIndex(comment => comment.id === commentId);
        if (commentIndex === -1) return;
    
        const comment = comments[commentIndex];
        const newReactions = new Set(comment.userReactions || []);
    
        if (newReactions.has(userId)) {
            newReactions.delete(userId);
        } else {
            newReactions.add(userId);
        }
    
        const updatedComment = {
            ...comment,
            userReactions: Array.from(newReactions),
            reacts: newReactions.size,
        };

        const commentDocRef = doc(db, 'forums', forumId, 'posts', postId, 'comments', commentId);
        const reactSnap = await getDoc(commentDocRef );


        const notificationRef = doc(collection(db, `notifications/${reactSnap.data().authorId}/messages`));
        await setDoc(notificationRef, {
            recipientId: reactSnap.data().authorId,
            recipientType: reactSnap.data().authorType,  
            message: `${authorName}  reacted on your comment.`,
            type: `react_comment`,
            createdAt: serverTimestamp(), 
            isRead: false,
            additionalData: {
                forumId: forumId,
            },
        });

        const notificationDoc = await getDoc(notificationRef);
            const notificationData = notificationDoc.data();

            if (notificationData && notificationData.createdAt) {
            const createdAtDate = notificationData.createdAt.toDate();
            console.log("Notification createdAt:", createdAtDate); 
            }
    
        try {
            await updateDoc(doc(db, 'forums', forumId, 'posts', postId, 'comments', commentId), updatedComment);
            
            const updatedComments = [...comments];
            updatedComments[commentIndex] = updatedComment;
            setComments(updatedComments);
        } catch (error) {
            console.error("Error updating comment reaction:", error);
        }
    };

    useEffect(() => {
        if (!forumId || !postId) return;

        const unsubscribeComments = onSnapshot(
            collection(db, 'forums', forumId, 'posts', postId, 'comments'), 
            (snapshot) => {
                const commentsData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                })) as Comment[];
                setComments(commentsData);
            }
        );

        return () => unsubscribeComments();
    }, [forumId, postId]);

    
    
    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreatingComment(true);
    
        if (commentContent.trim() === '' || !auth.currentUser) return;
    
        const currentDate = new Date();
        const user = auth.currentUser;

        if (containsBlacklistedWords(commentContent, blacklistedWords)) {
            toast.error('Your post contains inappropriate language.');
            return;
        }
    
        try {
            // Set the path to the comments subcollection within the post
            const commentRef = collection(db, 'forums', forumId, 'posts', postId, 'comments');
            
            let authorName = 'Unknown User';
    
            // Retrieve user information based on user type
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
    
            // Add the comment to the comments subcollection within the post
            await addDoc(commentRef, {
                content: commentContent,
                dateCreated: currentDate,
                author: anonymous ? 'Anonymous' : authorName,
                forumId: forumId,
                authorId: user.uid,
                postId: postId,
                reports: 0,
            });

            const postDocRef = doc(db, 'forums', forumId, 'posts', postId,);
            const commentSnap = await getDoc(postDocRef );

    
            const notificationRef = doc(collection(db, `notifications/${commentSnap.data().authorId}/messages`));
            await setDoc(notificationRef, {
                recipientId: commentSnap.data().authorId,
                recipientType: commentSnap.data().authorType,  
                message: `${authorName}  commented on your post.`,
                type: `post_comment`,
                createdAt: serverTimestamp(), 
                isRead: false,
                additionalData: {
                    postId: commentRef.id,
                    forumId: forumId,
                },
            });

            const notificationDoc = await getDoc(notificationRef);
                const notificationData = notificationDoc.data();

                if (notificationData && notificationData.createdAt) {
                const createdAtDate = notificationData.createdAt.toDate();
                console.log("Notification createdAt:", createdAtDate); // For debugging
                }

    
            setCommentContent('');
            setShowCommentForm(false);
        } catch (error) {
            console.error('Failed to add comment:', error);
        } finally {
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
    

    const handleDeleteComment = async (forumId: string, postId: string, commentId: string) => {
        // Confirm if the user really wants to delete the comment
        const confirmDelete = window.confirm("Are you sure you want to delete this comment?");
        if (!confirmDelete) {
            return; // Exit the function if the user cancels
        }
    
        // Set the path to the specific comment document in the nested structure
        const commentDocRef = doc(db, 'forums', forumId, 'posts', postId, 'comments', commentId);
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
    
    const handleUpdateComment = async (e: React.FormEvent, forumId: string, postId: string) => {
        e.preventDefault();
        if (editCommentContent.trim() === '' || !editCommentId) return;
    
        // Set the path to the specific comment document in the nested structure
        const commentDocRef = doc(db, 'forums', forumId, 'posts', postId, 'comments', editCommentId);
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
                    By <a href={`/profile/${post.authorId}`} className="text-blue-500 hover:underline">{post.authorName}</a> on {dayjs(post.dateCreated.toDate()).format('MMM D, YYYY')}
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
                    <div
                            className="mt-2 bg-gray-100 p-2 rounded"
                            dangerouslySetInnerHTML={{ __html: highlightText(commentContent, blacklistedWords) }}
                        />
                        
                    {comments.length > 0 ? (
                        <ul className="space-y-4">
                            {comments.map(comment => (
                                <li key={comment.id} className="p-6 bg-white shadow-md rounded-lg border border-gray-200 transition-transform transform hover:scale-105">
                                    <p className="text-gray-800">{comment.content}</p>
                                    <p className="text-sm text-black">
                                        By <a href={`/profile/${comment.authorId}`} className="text-blue-500 hover:underline">{comment.author}</a> on {formattedDate(comment.dateCreated)}
                                    </p>
                                    <motion.button
                                        onClick={() => toggleCommentReaction(comment.id)}
                                        className={`flex items-center mt-2 px-2 py-1 rounded-md transition-all duration-200 ${
                                            comment.userReactions?.includes(auth.currentUser?.uid || '') ? 'text-danger' : 'text-gray-400'
                                        }`}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="ionicon" viewBox="0 0 512 512" width={16} height={16}>
                                            <path
                                                d="M352.92 80C288 80 256 144 256 144s-32-64-96.92-64c-52.76 0-94.54 44.14-95.08 96.81-1.1 109.33 86.73 187.08 183 252.42a16 16 0 0018 0c96.26-65.34 184.09-143.09 183-252.42-.54-52.67-42.32-96.81-95.08-96.81z"
                                                fill={comment.userReactions?.includes(auth.currentUser?.uid || '') ? 'currentColor' : 'none'}
                                                stroke="currentColor"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="32"
                                            />
                                        </svg>
                                        <span className="ml-1 text-sm">
                                            {comment.reacts || 0}
                                        </span>
                                    </motion.button>
                                    {/* <div key={comment.id} className="comment-item">
                                        <button
                                            onClick={() => setReplyToCommentId(comment.id)}
                                            className="text-blue-500"
                                        >
                                            Reply
                                        </button>

                                        
                                        {comment.replies?.map((reply) => (
                                            <div key={reply.id} className="reply-item ml-4">
                                                <p>{reply.content} - <span className="text-gray-500">{reply.author}</span></p>
                                            </div>
                                        ))}

                                       
                                        {replyToCommentId === comment.id && (
                                            <form onSubmit={(e) => handleAddReply(e, comment.id)}>
                                                <input
                                                    type="text"
                                                    value={replyContent}
                                                    onChange={(e) => setReplyContent(e.target.value)}
                                                    placeholder="Write a reply..."
                                                    className="border rounded p-2 mt-2 w-full"
                                                />
                                                <button type="submit" className="btn-primary mt-2">Submit Reply</button>
                                            </form>
                                        )}
                                    </div> */}
                                    {comment.authorId === auth.currentUser?.uid && (
                                        <div className="flex space-x-2 mt-2 ">
                                            <button
                                                onClick={() => handleDeleteComment(forumId, postId, comment.id)}
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
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleUpdateComment(e, forumId, postId); // Call with additional parameters
                    }}
                    className="mt-4"
                >
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
