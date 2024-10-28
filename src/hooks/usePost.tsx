import { useEffect, useState } from 'react';
import { db, auth } from '../config/firebase';
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
import dayjs from 'dayjs';
import { motion } from 'framer-motion';


import {containsBlacklistedWords} from '../components/utils/validationUtils';
import { Comment, Post } from './types';

const usePost = (postId: string) => {
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

    return {
       post,
       commentContent,
       setCommentContent,
       toggleHeart,
       handleAddComment,
       handleDeleteComment,
       handleEditComment,
       handleUpdateComment,
       editCommentId,
       editCommentContent,
       setEditCommentContent,
       showCommentForm,
       setShowCommentForm,
       creatingComment,
       showComments,
       setShowComments,
       anonymous,
       setAnonymous,
       loading,
       error,
       comments,
       hasReacted,
       
        
    };

};

export default usePost;