// src/hooks/useForum.ts
import { useEffect, useState } from 'react';
import { db, auth } from '../config/firebase';
import {
    doc,
    getDoc,
    collection,
    query,
    where,
    getDocs,
    addDoc,
    deleteDoc,
    updateDoc,
    arrayRemove,
    arrayUnion,
    increment,
} from 'firebase/firestore';
import { sendNotification } from './useNotification';
import {NotificationTypes} from './notificationTypes';
import { containsBlacklistedWords } from '../components/utils/validationUtils';
import { Forum, Post } from './types';

const useForum = (forumId: string) => {
    const [forum, setForum] = useState<Forum | null>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [isMember, setIsMember] = useState<boolean>(false);
    const [isAuthor, setIsAuthor] = useState<boolean>(false);
    const [creatingPost, setCreatingPost] = useState<boolean>(false); // State to track post creation
    const [anonymous, setAnonymous] = useState<boolean>(false); // State for anonymous posts
    const [highlightedContent, setHighlightedContent] = useState<string>(''); 
    const [blacklistedWords, setBlacklistedWords] = useState<string[]>([]);
    const [postContent, setPostContent] = useState<string>(''); 

    const fetchForumById = async (forumId: string) => {
        const docRef = doc(db, 'forums', forumId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: forumId, ...docSnap.data() } as Forum;
        } else {
            throw new Error('Forum not found');
        }
    };

    const fetchPostsByForumId = async (forumId: string) => {
        const postsQuery = query(
            collection(db, 'posts'),
            where('forumId', '==', forumId),
            where('status', '==', 'approved') 
        );
    
        const querySnapshot = await getDocs(postsQuery);
    
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            dateCreated: doc.data().dateCreated instanceof Date ? doc.data().dateCreated : doc.data().dateCreated?.toDate(),
        })) as Post[];
    };
   

    useEffect(() => {
        const fetchData = async () => {
            if (!forumId) {
                setError('Forum ID is required');
                setLoading(false);
                return;
            }
            try {
                const forumData = await fetchForumById(forumId);
                if (!forumData) {
                    throw new Error('Forum data not found');
                }
    
                setForum(forumData);
    
                const postData = await fetchPostsByForumId(forumId);
                setPosts(postData);
    
                const user = auth.currentUser;
                if (user) {
                    setIsAuthor(user.uid === forumData.authorId);
                    setIsMember(forumData.members?.includes(user.uid) || false);
                }
            } catch (err: any) {
                console.error("Error fetching forum or posts:", err);
                setError(`Error: ${err.message || 'Failed to load data'}`);
            } finally {
                setLoading(false);
            }
        };
    
        fetchData();
    }, [forumId]);

    useEffect(() => {
        const user = auth.currentUser;
        if (user) {
            const authorCheck = posts.some(post => post.authorId === user.uid);
            setIsAuthor(authorCheck);
        }
    }, [posts]); 
    

    const handleJoinLeaveForum = async () => {
        const user = auth.currentUser;
        if (!user || !forum || isAuthor) return; // Prevent authors from joining/leaving
    
        try {
            const forumRef = doc(db, 'forums', forum.id);
            
            await updateDoc(forumRef, {
                members: isMember ? arrayRemove(user.uid) : arrayUnion(user.uid),
                totalMembers: increment(isMember ? -1 : 1),
            });
    
            const action = isMember ? 'left' : 'joined';
            const notificationType = isMember ? NotificationTypes.LEAVE : NotificationTypes.JOIN;
            
            await sendNotification(user.uid, `You have ${action} the forum ${forum.title}`, notificationType);
            
            setAlert({ type: 'success', message: `You have ${action} the forum ${forum.title}` });
            setIsMember(!isMember);
        } catch (error: any) {
            console.error('Error updating membership:', error);
            setError(`Failed to update membership: ${error?.message || 'An unknown error occurred'}`);
        }
    };
    
    

    const handlePostContentChange = (e, blacklistedWords: string[]) => {
        const content = e.target.value;
        setPostContent(content); 
        
        const highlighted = highlightBlacklistedWords(content, blacklistedWords);
        setHighlightedContent(highlighted);
    };

    const highlightBlacklistedWords = (content, blacklistedWords) => {
        const regex = new RegExp(`\\b(${blacklistedWords.join('|')})\\b`, 'gi');
        return content.replace(regex, (match) => `<span style="color:red;">${match}</span>`);
    };

    useEffect(() => {
        if (alert) {
            const timer = setTimeout(() => {
                setAlert(null);
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, [alert]);

    const handleSubmitPost = async (e: React.FormEvent) => {
        e.preventDefault();
        const currentDate = new Date();
    
        if (containsBlacklistedWords(postContent, blacklistedWords)) {
            setAlert({ type: 'error', message: 'Your post contains inappropriate language and cannot be submitted.' });
            return;
        }
    
        const user = auth.currentUser;
        if (user && forum) {
            try {
                let authorName = 'Unknown User';
                const userRef = doc(db, 'users', user.uid);
                const orgRef = doc(db, 'organizations', user.uid);
                const profRef = doc(db, 'professionals', user.uid);
    
                // Fetch the user's name or organization name
                const userDoc = await getDoc(userRef);
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    authorName = `${userData.firstName} ${userData.lastName}`;
                } else {
                    const orgDoc = await getDoc(orgRef);
                    if (orgDoc.exists()) {
                        const orgData = orgDoc.data();
                        authorName = orgData.organizationName;
                    } else {
                        const profDoc = await getDoc(profRef);
                        if (profDoc.exists()) {
                            const profData = profDoc.data();
                            authorName = `${profData.firstName} ${profData.lastName}`;
                        }
                    }
                }
    
                setCreatingPost(true);
    
                // Add the post to the 'posts' collection
                const postRef = collection(db, 'posts');
                const newPostRef = await addDoc(postRef, {
                    content: postContent,
                    dateCreated: currentDate,
                    author: anonymous ? 'Anonymous' : authorName,
                    authorId: user.uid,
                    forumId: forum.id,
                    status: 'pending', // For admin review
                });
    
                // Update the post document to include its own ID as `postId`
                await updateDoc(newPostRef, { postId: newPostRef.id });
    
                // Increment totalPosts in the forum document
                const forumDocRef = doc(db, 'forums', forum.id);
                await updateDoc(forumDocRef, {
                    totalPosts: increment(1),
                });
    
                // Send notification
                await sendNotification(
                    forum.authorId,
                    `${anonymous ? 'Anonymous' : authorName} submitted a post in ${forum.title}`,
                    NotificationTypes.POST_SUBMISSION
                );
    
                setPostContent('');
                setAlert({ type: 'success', message: 'Your post has been submitted for review and will be visible once approved.' });
            } catch (error: any) {
                setError(`Failed to create post: ${error.message || 'An unknown error occurred'}`);
            } finally {
                setCreatingPost(false);
            }
        }
    };
    
    
    
    const handleDeletePost = async (postId: string) => {
        const user = auth.currentUser;
        if (!user || !isAuthor) {
            setError('Only the author can delete this post');
            return;
        }
        try {
            // Delete the post document
            await deleteDoc(doc(db, 'posts', postId));
            
            // Update local state to remove the deleted post
            setPosts(posts.filter(post => post.id !== postId));
            
            // Decrement totalPosts in the forum document
            const forumDocRef = doc(db, 'forums', forum.id);
            await updateDoc(forumDocRef, {
                totalPosts: increment(-1),
            });
            
            // Send notification of post deletion
            await sendNotification(auth.currentUser.uid, 'Post deleted successfully.', NotificationTypes.POST_DELETION);
            
            setAlert({ type: 'success', message: 'Post deleted successfully!' });
        } catch (error: any) {
            console.error('Error deleting post:', error);
            setError(`Failed to delete post: ${error?.message || 'An unknown error occurred'}`);
        }
    };
    
    
    

    return {
        forum,
        posts,
        loading,
        error,
        alert,
        isMember,
        isAuthor,
        creatingPost, 
        anonymous,
        highlightedContent,
        postContent,
        blacklistedWords,
        setAnonymous,
        handleJoinLeaveForum,
        setPostContent,
        handleDeletePost,
        handleSubmitPost,
        handlePostContentChange,
        setBlacklistedWords,
    };
};

export default useForum;
