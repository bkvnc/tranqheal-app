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
    setDoc,
} from 'firebase/firestore';
import { sendNotification } from './useNotification';
import { NotificationTypes } from './notificationTypes';
import { containsBlacklistedWords } from '../components/utils/validationUtils';
import { Forum, Post, UserData } from './types';
import { toast } from 'react-toastify'; 
import {getAuth} from 'firebase/auth';

const useForum = (forumId: string) => {
    const [forum, setForum] = useState<Forum | null>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isMember, setIsMember] = useState<boolean>(false);
    const [isAuthor, setIsAuthor] = useState<boolean>(false);
    const [creatingPost, setCreatingPost] = useState<boolean>(false); // State to track post creation
    const [anonymous, setAnonymous] = useState<boolean>(false); // State for anonymous posts
    const [highlightedContent, setHighlightedContent] = useState<string>('');
    const [highlightedTitle, setHighlightedTitle] = useState<string>('');
    const [blacklistedWords, setBlacklistedWords] = useState<string[]>([]); 
    const [postContent, setPostContent] = useState<string>(''); 
    const [postTitle, setPostTitle] = useState<string>('');
    const [authorName, setAuthorName] = useState<string>('');
    const [authorType, setAuthorType] = useState<string>('');
  

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
        const auth = getAuth();
        const user = auth.currentUser;
    
        try {
            if (user) {
                console.log("User authenticated successfully:");
                console.log("User UID:", user.uid);
                console.log("User email:", user.email);
    
               
                const orgDocRef = doc(db, 'organizations', user.uid);
                const adminDocRef = doc(db, 'admins', user.uid);
    
                const orgDoc = await getDoc(orgDocRef);
                const adminDoc = await getDoc(adminDocRef);
    
                const userType = orgDoc.exists()
                    ? orgDoc.data()?.userType
                    : adminDoc.exists()
                    ? adminDoc.data()?.userType
                    : null;
    
                if (!userType) {
                    console.error("User type not found for this user.");
                    return;
                }
    
                console.log("userType:", userType);
    
                
                if (userType === 'organization') {
                    const postsCollectionRef = collection(db, 'forums', forumId, 'posts');
                    
                    const postsQuery = query(
                        postsCollectionRef,
                        where('status', '==', 'approved')
                    );
            
                    const querySnapshot = await getDocs(postsQuery);
                    
                    return querySnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data(),
                        dateCreated: doc.data().dateCreated instanceof Date 
                            ? doc.data().dateCreated 
                            : doc.data().dateCreated?.toDate(),
                        forumId: forumId
                    })) as Post[];
                } else {
                    console.error("Access denied: Only organizations can fetch posts.");
                }
            } else {
                console.error("User is not authenticated.");
            }
        } catch (error: any) {
            console.error("Error fetching user type or posts:", error);
            throw new Error('Failed to fetch posts from forum');
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            const auth = getAuth();
        const user = auth.currentUser;
        try{
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
        } // Check if the user is authenticated
            if (!user) {
                console.error("User is not authenticated");
                setError("User is not authenticated");
                setLoading(false);
                return; // Exit early if user is not authenticated
            }

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

               
                setIsAuthor(user.uid === forumData.authorId);
                setIsMember(forumData.members?.includes(user.uid) || false);
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
        const user = auth.currentUser; // Check if the user is authenticated
        if (!user || !forum || isAuthor) return; // Prevent authors from joining/leaving
    
        try {
            const membershipRef = doc(db, 'memberships', `${user.uid}_${forum.id}`);
            
            if (isMember) {
                // Leave forum logic
                await deleteDoc(membershipRef); // Optionally, remove the membership document
                await updateDoc(doc(db, 'forums', forum.id), {
                    members: arrayRemove(user.uid),
                    totalMembers: increment(-1),
                });
                toast.success(`You have left the forum ${forum.title}`);
            } else {
                // Join forum logic
                await setDoc(membershipRef, { userId: user.uid, forumId: forum.id }); // Create membership document
                await updateDoc(doc(db, 'forums', forum.id), {
                    members: arrayUnion(user.uid),
                    totalMembers: increment(1),
                });
                toast.success(`You have joined the forum ${forum.title}`);
            }
    
            const action = isMember ? 'left' : 'joined';
            const notificationType = isMember ? NotificationTypes.LEAVE : NotificationTypes.JOIN;
            
            await sendNotification(user.uid, `You have ${action} the forum ${forum.title}`, notificationType);
            
            setIsMember(!isMember);
        } catch (error: any) {
            console.error('Error updating membership:', error);
            toast.error(`Failed to update membership: ${error?.message || 'An unknown error occurred'}`);
        }
    };

    const highlightBlacklistedWords = (content: string, blacklistedWords: string[]): string => {
        const regex = new RegExp(`\\b(${blacklistedWords.join('|')})\\b`, 'gi');
        return content.replace(regex, (match) => `<span style="color:red;">${match}</span>`);
    };
    
    // Function to handle changes in the post title
    const handlePostTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const title = e.target.value;
        setPostTitle(title);
        const highlighted = highlightBlacklistedWords(title, blacklistedWords);
        setHighlightedTitle(highlighted);
    };
    
    // Function to handle changes in the post content
    const handlePostContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const content = e.target.value;
        setPostContent(content);
        const highlighted = highlightBlacklistedWords(content, blacklistedWords);
        setHighlightedContent(highlighted);
    };
    

    const handleSubmitPost = async (e: React.FormEvent) => {
        e.preventDefault();
        const currentDate = new Date();
        
        if (!auth.currentUser) {
            toast.error('Please log in to create a post.');
            return;
        }
    
        if (!forum) {
            toast.error('Forum data not found.');
            return;
        }
    
        if (containsBlacklistedWords(postContent, blacklistedWords)) {
            toast.error('Your post contains inappropriate language.');
            return;
        }
    
        try {
            setCreatingPost(true);
            const user = auth.currentUser;
            
            // Verify forum membership
            const membershipRef = doc(db, 'memberships', `${user.uid}_${forum.id}`);
            const membershipDoc = await getDoc(membershipRef);
            
            if (!membershipDoc.exists() && user.uid !== forum.authorId) {
                toast.error('You must be a member of this forum to post.');
                setCreatingPost(false);
                return;
            }
    
            // Get user data
            
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            const organizationDoc = await getDoc(doc(db, 'organizations', user.uid));
            const professionalDoc = await getDoc(doc(db, 'professionals', user.uid));
            
            const userData = userDoc.data();
            const orgData = organizationDoc.data();
            const profData = professionalDoc.data();
            
            let authorName = '';
            let authorType = '';
            
            if (userData) {
                authorName = `${userData.firstName} ${userData.lastName}`; // Regular user name
                authorType = userData.userType; // Store userType for the regular user
            } else if (orgData) {
                authorName = orgData.organizationName; // Organization name
                authorType = 'organization'; // Set type as organization
            } else if (profData) {
                authorName = `${profData.firstName} ${profData.lastName}`; // Professional name
                authorType = 'professional'; // Set type as professional
            }
            
        
            const newPost = {
                content: postContent,
                dateCreated: currentDate,
                authorId: user.uid,
                forumId: forum.id,
                status: 'pending',
                title: postTitle,
                authorName: anonymous ? 'Anonymous' : authorName, 
                authorType: authorType, 
            };
    
            // Reference to the `posts` subcollection inside the specific forum document
            const postsRef = collection(doc(db, 'forums', forum.id), 'posts');
            const newPostRef = await addDoc(postsRef, newPost);
    
            
            await updateDoc(newPostRef, {
                postId: newPostRef.id 
            });
    
            // Update forum stats
            await updateDoc(doc(db, 'forums', forum.id), {
                totalPosts: increment(1)
            });
    
            // Send notification
            await sendNotification(
                forum.authorId,
                `${anonymous ? 'Anonymous' : authorName} submitted a post in ${forum.title}`,
                NotificationTypes.POST_SUBMISSION
            );
    
            setPostContent('');
            toast.success('Post submitted for review successfully.');
            
        } catch (error: any) {
            console.error('Post creation error:', error);
            toast.error(`Failed creating post: ${error.message}`);
        } finally {
            setCreatingPost(false);
        }
    };
    const handleDeletePost = async (postId: string) => {
        const user = auth.currentUser; // Check if the user is authenticated
        if (!user) {
            toast.error('User not authenticated.'); // Notify user if not authenticated
            return;
        }
        const confirmDelete = window.confirm("Are you sure you want to delete this comment?");
        if (!confirmDelete) {
            return; // Exit the function if the user cancels
        }
    
        try {
            const postRef = doc(db, 'forums', forumId, 'posts', postId);
            const postSnapshot = await getDoc(postRef);
            if (!postSnapshot.exists()) {
                toast.error('Post does not exist.'); // Notify user if post doesn't exist
                return;
            }
    
            const postData = postSnapshot.data();
            if (postData.authorId !== user.uid) {
                toast.error('You can only delete your own posts.'); // Notify user if they try to delete someone else's post
                return;
            }
    
            await deleteDoc(postRef);
            toast.success('Post deleted successfully.'); // Notify user of successful deletion
    
            // Optionally, decrement totalPosts in the forum document
            const forumDocRef = doc(db, 'forums', forum.id);
            await updateDoc(forumDocRef, {
                totalPosts: increment(-1),
            });
        } catch (error: any) {
            toast.error(`Failed to delete post: ${error.message || 'An unknown error occurred'}`); // Change alert to toast
        }
    };

    return {
        forum,
        posts,
        userData,
        loading,
        error,
        isMember,
        creatingPost,
        postContent,
        isAuthor,
        anonymous,
        authorName,
        authorType,
        postTitle,
        handleJoinLeaveForum,
        handleSubmitPost,
        highlightedContent,
        handlePostContentChange,
        handlePostTitleChange,
        setAnonymous,
        setPostContent,
        setLoading,
        setError,
        blacklistedWords,
        setBlacklistedWords,
        handleDeletePost, // Ensure handleDeletePost is included
    };
};

export default useForum;
