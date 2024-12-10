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
    Timestamp,
    serverTimestamp,
} from 'firebase/firestore';
import { containsBlacklistedWords } from '../components/utils/validationUtils';
import { Forum, Post, UserData } from './types';
import { toast } from 'react-toastify'; 
import {getAuth} from 'firebase/auth';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

const useForum = (forumId: string) => {
    const [forum, setForum] = useState<Forum | null>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isMember, setIsMember] = useState<boolean>(false);
    const [isAuthor, setIsAuthor] = useState<boolean>(false);
    const [creatingPost, setCreatingPost] = useState<boolean>(false);
    const [anonymous, setAnonymous] = useState<boolean>(false); 
    const [highlightedContent, setHighlightedContent] = useState<string>('');
    const [highlightedTitle, setHighlightedTitle] = useState<string>('');
    const [blacklistedWords, setBlacklistedWords] = useState<string[]>([]); 
    const [postContent, setPostContent] = useState<string>(''); 
    const [postTitle, setPostTitle] = useState<string>('');
    const [authorName, setAuthorName] = useState<string>('');
    const [authorType, setAuthorType] = useState<string>('');
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [hasImage, setHasImage] = useState<boolean>(false);
    const [editingPostId, setEditingPostId] = useState<string | null>(null);
    const [editedTitle, setEditedTitle] = useState<string>('');
    const [editedContent, setEditedContent] = useState<string>('');
    const [editedImage, setEditedImage] = useState<File | null>(null);
  

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
                    
                    return querySnapshot.docs.map(doc => {
                        const data = doc.data();
                        
                        return {
                            id: doc.id,
                            ...data,
                            dateCreated: data.dateCreated instanceof Date
                                ? data.dateCreated
                                : data.dateCreated?.toDate?.() ?? data.dateCreated, 
                            forumId: forumId
                        };
                    }) as Post[];
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
        } 
            if (!user) {
                console.error("User is not authenticated");
                setError("User is not authenticated");
                setLoading(false);
                return; 
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
        if (user && forum) {
            const authorCheck = posts.some(post => post.authorId === user.uid);
       
            const forumAuthorCheck = forum.authorId === user.uid;
    
         
            setIsAuthor(authorCheck || forumAuthorCheck);
        } else {
            setIsAuthor(false); 
        }
    }, [posts, forum]);
    
    
    const handleJoinLeaveForum = async () => {
        const user = auth.currentUser; 
        if (!user || !forum || isAuthor) return; 

        if(isMember){
            console.log("User is already a member of the forum.");
        }else{
            console.log("User is not a member of the forum.");
        }
      
        try {
          const membershipRef = doc(db, 'memberships', `${user.uid}_${forum.id}`);
          const forumRef = doc(db, 'forums', forum.id);
          const forumSnap = await getDoc(forumRef);
          const organizationRef = doc(db, 'organizations', user.uid);
          const organizationSnap = await getDoc(organizationRef);
          const organizationName = organizationSnap.data()?.organizationName;
      
          if (isMember) {
            // Leave forum
            await deleteDoc(membershipRef); 
            await updateDoc(forumRef, {
              members: arrayRemove(user.uid),
              totalMembers: increment(-1),
            });
            toast.success(`You have left the forum ${forum.title}`);
          } else {
            // Join forum
            await setDoc(membershipRef, { userId: user.uid, forumId: forum.id, joinedAt: new Date() }); 
            await updateDoc(forumRef, {
              members: arrayUnion(user.uid),
              totalMembers: increment(1),
            });
      
            // Send notification to forum author
            const notificationRef = doc(collection(db, `notifications/${forumSnap.data().authorId}/messages`));
            await setDoc(notificationRef, {
              recipientId: forumSnap.data().authorId,
              recipientType: forumSnap.data().authorType,  
              message: `${organizationName} has joined the forum ${forum.title}`,
              type: `post_join`,
              createdAt: serverTimestamp(),
              isRead: false,
              additionalData: {
                forumId: forum.id,
                userId: user.uid,
              },
            });
      
            // Debugging notification creation
            const notificationDoc = await getDoc(notificationRef);
            const notificationData = notificationDoc.data();
            if (notificationData?.createdAt) {
              console.log("Notification createdAt:", notificationData.createdAt.toDate());
            }
      
            toast.success(`You have joined the forum ${forum.title}`);
          }
      
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

    const handleEditPost = async (
        postId: string,
        updatedTitle: string,
        updatedContent: string,
        updatedImage: string | null // Corrected type
    ) => {
        if (!auth.currentUser) {
            toast.error('Please log in to edit the post.');
            return;
        }
    
        if (!forum) {
            toast.error('Forum data not found.');
            return;
        }
    
        if (containsBlacklistedWords(updatedContent, blacklistedWords)) {
            toast.error('Your post contains inappropriate language.');
            return;
        }
    
        try {
            const user = auth.currentUser;
            const postRef = doc(db, 'forums', forum.id, 'posts', postId);
            const postDoc = await getDoc(postRef);
    
            // Check if the post exists
            if (!postDoc.exists()) {
                toast.error('Post not found.');
                return;
            }
    
            const postData = postDoc.data();
    
            // Ensure the user is the author of the post
            if (!postData.authorId || postData.authorId !== user.uid) {
                toast.error('You are not authorized to edit this post.');
                return;
            }
    
            // Use the updated image URL if it exists
            let imageUrl = postData.imageUrl || null;
            if (updatedImage) {
                imageUrl = updatedImage; // This will be the new image URL from Firebase
            }
    
            // Update the post in Firestore
            await updateDoc(postRef, {
                title: updatedTitle,
                content: updatedContent,
                imageUrl: imageUrl,
                lastUpdated: serverTimestamp(),
            });
    
            // Update the local posts state
            setPosts((prevPosts) =>
                prevPosts.map((post) =>
                    post.id === postId
                        ? { ...post, title: updatedTitle, content: updatedContent, imageUrl, lastUpdated: new Date() }
                        : post
                )
            );
    
            toast.success('Post updated successfully.');
        } catch (error: any) {
            console.error('Error editing post:', error);
            toast.error(`Failed to edit post: ${error.message || 'An unknown error occurred.'}`);
        }
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

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedImage(file);
            
            // Create preview URL
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    

    const handleSubmitPost = async (e: React.FormEvent) => {
        e.preventDefault();
        
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
                authorName = `${userData.firstName} ${userData.lastName}`;
                authorType = userData.userType;
            } else if (orgData) {
                authorName = orgData.organizationName;
                authorType = 'organization';
            } else if (profData) {
                authorName = `${profData.firstName} ${profData.lastName}`;
                authorType = 'professional';
            }
    
           
            let imageUrl = null;
            if (selectedImage) {
                const storage = getStorage();
                const imageRef = storageRef(storage, `forums/posts/${forum.id}/${Date.now()}_${selectedImage.name}`);
                setHasImage(true);

                await uploadBytes(imageRef, selectedImage);
                imageUrl = await getDownloadURL(imageRef);
            }
        
            const newPost = {
                content: postContent,
                dateCreated: Timestamp.fromDate(new Date()),
                authorId: user.uid,
                forumId: forum.id,
                status: 'pending',
                title: postTitle,
                hasImage: hasImage,
                reacted: 0,
                reactedBy: [],
                authorName: anonymous ? 'Anonymous' : authorName,
                authorType: authorType,
                imageUrl: imageUrl, 
            };
    
            const postsRef = collection(doc(db, 'forums', forum.id), 'posts');
            const newPostRef = await addDoc(postsRef, newPost);
    
            await updateDoc(newPostRef, {
                postId: newPostRef.id 
            });
    
            // Update forum stats
            await updateDoc(doc(db, 'forums', forum.id), {
                totalPosts: increment(1)
            });
    
            const forumRef = doc(db, 'forums', forum.id);
            const postSnap = await getDoc(forumRef);
    
            const notificationRef = doc(collection(db, `notifications/${postSnap.data().authorId}/messages`));
            await setDoc(notificationRef, {
                recipientId: postSnap.data().authorId,
                recipientType: postSnap.data().authorType,
                message: `${authorName} has submitted a new post for review.`,
                type: `post_review`,
                createdAt: serverTimestamp(),
                isRead: false,
                additionalData: {
                    postId: newPostRef.id,
                    forumId: forumId,
                },
            });
    
            const notificationDoc = await getDoc(notificationRef);
            const notificationData = notificationDoc.data();
    
            if (notificationData && notificationData.createdAt) {
                const createdAtDate = notificationData.createdAt.toDate();
                console.log("Notification createdAt:", createdAtDate);
            }
    
            setPostContent('');
            setPostTitle('');
            setSelectedImage(null);
            setImagePreview(null);
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

    const startEditingPost = (post: { id: string; title: string; content: string }) => {
        const confirmDelete = window.confirm("Are you sure you want to edit this post?");
        if (!confirmDelete) return;
    
        try {
            setEditingPostId(post.id);
            setEditedTitle(post.title);
            setEditedContent(post.content);
        } catch (error) {
            console.error("Error starting post editing:", error);
            toast.error("Failed to start editing post");
        }
    };
    

    const cancelEditingPost = () => {
        setEditingPostId(null);
        setEditedTitle('');
        setEditedContent('');
    };

    const submitEditPost = async (e: React.FormEvent) => {
        e.preventDefault();
    
        // If an image is selected, upload it to Firebase and get the URL
        let imageUrl: string | null = null;
        if (selectedImage) {
            try {
                const storage = getStorage();
                const imageRef = storageRef(
                    storage,
                    `forums/posts/${forum.id}/${Date.now()}_${selectedImage.name}`
                );
                await uploadBytes(imageRef, selectedImage); // Upload the selected image
                imageUrl = await getDownloadURL(imageRef); // Get the image URL from Firebase Storage
            } catch (error) {
                toast.error('Failed to upload image.');
                return;
            }
        }
    
        // Now call handleEditPost and pass imageUrl (a string)
        await handleEditPost(editingPostId, editedTitle, editedContent, imageUrl);
    
        // Close the edit form by setting editingPostId to null
        setEditingPostId(null); // This will close the edit form
    };
    

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files ? e.target.files[0] : null;
        if (file) {
            setSelectedImage(file);
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
        handleDeletePost, 
        setImagePreview,
        handleImageChange,
        imagePreview,
        setSelectedImage,
        handleEditPost,
        editingPostId,
        selectedImage,
        editedTitle,
        editedContent,
        startEditingPost,
        cancelEditingPost,
        submitEditPost,
        setEditingPostId,
        setEditedTitle,
        setEditedContent,
        handleImageUpload,

    };
};

export default useForum;
