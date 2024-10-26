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

import {containsBlacklistedWords} from '../components/utils/validationUtils';
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
            where('status', '==', 'approved') // Only fetch posts with 'approved' status
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
    const handlePostContentChange = (e, blacklistedWords: string[]) => {
        const content = e.target.value;
        setPostContent(content); // Update the state
        
        // Update highlighted content in real-time
        const highlighted = highlightBlacklistedWords(content, blacklistedWords);
        setHighlightedContent(highlighted);
    };

    const highlightBlacklistedWords = (content, blacklistedWords) => {
        // Implement your logic to highlight blacklisted words
        const regex = new RegExp(`\\b(${blacklistedWords.join('|')})\\b`, 'gi');
        return content.replace(regex, (match) => `<span style="color:red;">${match}</span>`);
    };

    useEffect(() => {
        if (alert) {
            const timer = setTimeout(() => {
                setAlert(null); // Clears the alert after 3 seconds
            }, 3000); // Set to 3000 ms (3 seconds)

            return () => clearTimeout(timer); // Cleanup the timeout if alert changes
        }
    }, [alert]);

    const handleSubmitPost = async (e) => {
        const currentDate = new Date();
        e.preventDefault(); // Prevent the default form submission
    
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
    
                console.log('Checking user document...');
                const userDoc = await getDoc(userRef);
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    authorName = `${userData.firstName} ${userData.lastName}`; // For users
                } else {
                    console.log('User document does not exist. Checking organization...');
                    const orgDoc = await getDoc(orgRef);
                    if (orgDoc.exists()) {
                        const orgData = orgDoc.data();
                        authorName = orgData.organizationName; // For organizations
                    } else {
                        console.log('Organization document does not exist. Checking professional...');
                        const profDoc = await getDoc(profRef);
                        if (profDoc.exists()) {
                            const profData = profDoc.data();
                            authorName = `${profData.firstName} ${profData.lastName}`; // For professionals
                        }
                    }
                }
    
                console.log('Author Name:', authorName); // Debugging output
    
                setCreatingPost(true); // Start post creation
                const postRef = collection(db, 'posts');
                // Add the new post to the posts collection
                await addDoc(postRef, {
                    content: postContent, 
                    dateCreated: currentDate,
                    author: anonymous ? 'Anonymous' : authorName,
                    authorId: user.uid,
                    forumId: forum.id,
                    status: 'pending', 
                });

                // Increment the totalPosts in the forum document
                const forumDocRef = doc(db, 'forums', forum.id);
                await updateDoc(forumDocRef, {
                    totalPosts: increment(1),
                });
    
                setPostContent(''); // Clear the post content
                setAlert({ type: 'success', message: 'Your post has been submitted for review and will be visible once approved.' });
            } catch (error) {
                console.error('Error creating post:', error);
                setError(`Failed to create post: ${error?.message || 'An unknown error occurred'}`);
            } finally {
                setCreatingPost(false); 
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
