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
} from 'firebase/firestore';
import { Forum, Post } from './types'; // Adjust the import path for your types

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
        const postsQuery = query(collection(db, 'posts'), where('forumId', '==', forumId));
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
                setForum(forumData);
                const postData = await fetchPostsByForumId(forumId);
                setPosts(postData);

                const user = auth.currentUser;
                if (user) {
                    setIsAuthor(user.uid === forumData.authorId);
                    setIsMember(forumData.members?.includes(user.uid) || false);
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [forumId]);

    const handleJoinLeaveForum = async () => {
        const user = auth.currentUser;
        if (!user || !forum) return;

        try {
            const forumRef = doc(db, 'forums', forum.id);
            await updateDoc(forumRef, {
                members: isMember ? arrayRemove(user.uid) : arrayUnion(user.uid),
                totalMembers: isMember ? (forum.totalMembers || 0) - 1 : (forum.totalMembers || 0) + 1,
            });
            setIsMember(!isMember);
        } catch (error) {
            setError(`Failed to update membership: ${error?.message || 'An unknown error occurred'}`);
        }
    };

    const handleCreatePost = async (content: string, anonymous: boolean) => {
        const user = auth.currentUser;
        if (user && forum) {
            try {
                let authorName = 'Unknown User';
                const userRef = doc(db, 'users', user.uid);
                const userDoc = await getDoc(userRef);
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    authorName = `${userData.firstName} ${userData.lastName}`;
                }
    
                setCreatingPost(true); // Start post creation
                await addDoc(collection(db, 'posts'), {
                    content,
                    dateCreated: new Date(),
                    author: anonymous ? 'Anonymous' : authorName,
                    authorId: user.uid,
                    forumId: forum.id,
                });
                
                const updatedPosts = await fetchPostsByForumId(forum.id);
                setPosts(updatedPosts);
                setAlert({ type: 'success', message: 'Post created successfully!' });
            } catch (error) {
                setError(`Failed to create post: ${error?.message || 'An unknown error occurred'}`);
            } finally {
                setCreatingPost(false); // Reset after posting
            }
        }
    };

    const handleDeletePost = async (postId: string) => {
        try {
            await deleteDoc(doc(db, 'posts', postId));
            setPosts(posts.filter(post => post.id !== postId));
            setAlert({ type: 'success', message: 'Post deleted successfully!' });
        } catch (error) {
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
        creatingPost, // Return creatingPost state
        anonymous, // Return anonymous state
        setAnonymous, // Allow setting anonymous state
        handleJoinLeaveForum,
        handleCreatePost,
        handleDeletePost,
    };
};

export default useForum;
