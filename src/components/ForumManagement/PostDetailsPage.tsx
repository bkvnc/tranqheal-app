// PostDetailsPage.tsx
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

const PostDetailsPage: React.FC = () => {
    const { postId } = useParams<{ postId: string }>();
    const [post, setPost] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [commentContent, setCommentContent] = useState<string>('');
    const [editCommentId, setEditCommentId] = useState<string | null>(null);
    const [editCommentContent, setEditCommentContent] = useState<string>('');
    const [showComments, setShowComments] = useState<boolean>(false);
    const [showCommentForm, setShowCommentForm] = useState<boolean>(false);
    const [hasReacted, setHasReacted] = useState<boolean>(false);

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
                    setPost({ id: postId, ...docSnap.data() });
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

        await updateDoc(doc(db, 'posts', postId), updatedPost);
        setPost(updatedPost);
        setHasReacted(!hasReacted);
    };

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (commentContent.trim() === '' || !auth.currentUser) return;

        const currentDate = new Date();
        const user = auth.currentUser;

        try {
            const commentRef = collection(db, 'comments');
            await addDoc(commentRef, {
                content: commentContent,
                dateCreated: currentDate,
                author: user.displayName || 'Anonymous',
                authorId: user.uid,
                postId: postId,
            });
            setCommentContent('');
            setShowCommentForm(false);
        } catch (error) {
            console.error('Failed to add comment:', error);
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

    if (loading) return <div className="text-center py-5">Loading...</div>;
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
                    className={`flex items-center px-3 py-2 rounded-md transition-all duration-200 ${hasReacted ? 'bg-red-100 text-red-500' : 'bg-gray-100 text-gray-400'} shadow-md hover:shadow-lg`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className="w-6 h-6"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                    <span className="ml-2 font-semibold">{post.reacts} {post.reacts === 1 ? 'Heart' : 'Hearts'}</span>
                </motion.button>
                <button
                onClick={() => setShowComments(!showComments)}
                className="mb-4 px-4 py-2 bg-blue-500 text-white rounded-md shadow hover:bg-blue-600 transition"
            >
                {showComments ? 'Hide Comments' : `Show Comments (${comments.length})`}
            </button>
            </div>

            {/* Comments Toggle Button */}
          

            {/* Comments Section */}
            {showComments && (
                <div className="mb-6">
                    <h2 className="text-lg font-semibold mb-2">Comments</h2>
                    <button
                        onClick={() => setShowCommentForm(!showCommentForm)}
                        className="mb-4 px-4 py-2 bg-green-500 text-white rounded-md shadow hover:bg-success transition"
                    >
                        {showCommentForm ? 'Cancel' : 'Write a Comment'}
                    </button>
                    {comments.length > 0 ? (
                        <ul className="space-y-4">
                            {comments.map(comment => (
                                <li key={comment.id} className="p-4 bg-gray-50 border border-gray-200 rounded-md shadow">
                                    <p className="text-gray-800">{comment.content}</p>
                                    <p className="text-sm text-gray-500">
                                        By <a href={`/profile/${comment.authorId}`} className="text-blue-500 hover:underline">{comment.author}</a> on {dayjs(comment.dateCreated.toDate()).format('MMM D, YYYY')}
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
                    <button type="submit" className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md transition hover:bg-blue-600">
                        Add Comment
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
