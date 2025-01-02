
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
        setBlacklistedWords,
        isMember, 
    } = useForum(forumId);

    const isPostAuthor = post?.authorId === auth.currentUser?.uid;
    const isCommentAuthor = (comment: Comment) => comment.authorId === auth.currentUser?.uid;

    

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
                    const postData = { id: postId, ...docSnap.data() } as Post;
                    
                 
                    if (postData.status === 'pending') {
                        console.log('Post is pending:', postData);
                    }
    
                    setPost(postData);
    
    
                    const userId = auth.currentUser?.uid;
                    if (userId) {
                        setHasReacted(postData.reactedBy?.includes(userId) || false);
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
    
        const newReactions = new Set(post.reactedBy || []);
       
        
        
        if (hasReacted) {
            newReactions.delete(userId);
        } else {
            newReactions.add(userId); 
        }
    
       
        const updatedPost = {
            ...post,
            reactedBy: Array.from(newReactions),
            reacted: newReactions.size,
        };
        await setDoc(doc(db, 'forums', forumId, 'posts', postId), updatedPost);

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
        const newReactions = new Set(comment.reactedBy || []);
    
        if (newReactions.has(userId)) {
            newReactions.delete(userId);
        } else {
            newReactions.add(userId);
        }
    
        const updatedComment = {
            ...comment,
            reactedBy: Array.from(newReactions),
            reacted: newReactions.size,
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
        if (!isMember) {
            toast.error('You must join the forum to comment. please navigate the the forum page.');
            setCreatingComment(false);
            return;
        }
    

        if (containsBlacklistedWords(commentContent, blacklistedWords)) {
            toast.error('Your post contains inappropriate language.');
            return;
        }
    
        try {
            
            const commentRef = collection(db, 'forums', forumId, 'posts', postId, 'comments');
            
            let authorName = 'Unknown User';
    
        
            const userRef = doc(db, 'users', user.uid);
            const orgRef = doc(db, 'organizations', user.uid);
            const profRef = doc(db, 'professionals', user.uid);
    
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
    
            // Add the comment to the comments subcollection within the post
            await addDoc(commentRef, {
                content: commentContent,
                dateCreated: currentDate,
                authorName: anonymous ? 'Anonymous' : authorName,
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

        const confirmDelete = window.confirm("Are you sure you want to delete this comment?");
        if (!confirmDelete) {
            return; 
        }
    
  
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

    const handleReportPost = async (postId) => {
        if (!auth.currentUser) return; 
       
        const reporterName = await getUserName();
        const postDocRef = doc(db, `forums/${forumId}/posts`, postId);
        const postDoc = await getDoc(postDocRef);
        const confirmed = window.confirm('Are you sure you want to report this post?');
        
    
        
        if(confirmed){
        try {
           
            if (postDoc.exists()) {
                const postData = postDoc.data();
                const authorType = postData.authorType;
                const authorName = postData.authorName;
                const authorId = postData.authorId;
                const currentReportCount = postData.reportCount || 0;
                const title = postData.title;
                const content = postData.content;
    
               
    
                
                const reportsCollectionRef = collection(postDocRef, "reports");
                await addDoc(reportsCollectionRef, {
                    title: title,
                    content: content,
                    authorName: authorName,
                    reporterName: reporterName,
                    authorType: authorType,
                    authorId: authorId,
                    reportedBy: auth.currentUser.uid,
                    reason: 'Inappropriate content',
                    timestamp: new Date(),
                });

                
                await updateDoc(postDocRef, {
                    reportCount: currentReportCount + 1,
                });
    
                toast.success('Post reported successfully.');
            } else {
                toast.error('Post not found.');
            }
        } catch (error) {
            console.error('Error reporting post:', error);
            toast.error('Failed to report the post.');
        }
    }
    };
    
    
    const handleReportComment = async (commentId) => {
        if (!auth.currentUser) return;
        const reporterName = await getUserName();
        const commentDocRef = doc(db, `forums/${forumId}/posts/${postId}/comments`, commentId);
        const commentDoc = await getDoc(commentDocRef);
        const confirmed = window.confirm('Are you sure you want to report this comment?');
        if (confirmed) {
          try {
            if (commentDoc.exists()) {
              const commentData = commentDoc.data();
              const authorType = commentData.authorType;
              const authorName = commentData.authorName;
              const authorId = commentData.authorId;
              const currentReportCount = commentData.reportCount || 0;
              const title = commentData.title;
              const content = commentData.content;
      
              const reportsCollectionRef = collection(commentDocRef, "reports");
              await addDoc(reportsCollectionRef, {
                content: content,
                authorName: authorName,
                reporterName: reporterName,
                authorType: authorType,
                title: title,
                authorId: authorId,
                reportedBy: auth.currentUser.uid,
                reason: 'Inappropriate content',
                timestamp: new Date(),
              });
      
              await updateDoc(commentDocRef, {
                reportCount: currentReportCount + 1,
              });
      
              toast.success('Comment reported successfully.');
            } else {
              toast.error('Comment not found.');
            }
          } catch (error) {
            console.error('Error reporting comment:', error); // Ensure "error" is defined here
            toast.error('Failed to report the comment.');
          }
        }
      };
      
    const getUserName = async () => {
        const currentUserId = auth.currentUser?.uid;
      
        if (!currentUserId) return null;
      
        // Function to fetch document from a collection
        const fetchUserData = async (collectionName) => {
          const docRef = doc(db, collectionName, currentUserId);
          const docSnap = await getDoc(docRef);
          return docSnap.exists() ? docSnap.data() : null;
        };
      
        // Try each collection in order
        const collections = ['users', 'organizations', 'admins', 'professionals'];
        for (const collection of collections) {
          const userData = await fetchUserData(collection);
          if (userData) {
            // Extract the name based on the collection's field structure
            switch (collection) {
              case 'users':
              case 'professionals':
                return `${userData.firstName} ${userData.lastName}`;
              case 'organizations':
                return userData.organizationName;
              case 'admins':
                return `${userData.firstName} ${userData.lastName}`;
              default:
                return null;
            }
          }
        }
      
        // If not found in any collection
        return null;
        };
    
    
  

    if (loading) return <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>;
    if (error) return <div className="text-red-500">{error}</div>;

   

    return (
        <div className="container mx-auto bg-white rounded-lg p-6 shadow-lg dark:bg-boxdark relative">
                <div className="mb-6"><p><a href={`/forums/${post.forumId}`} className="text-primary hover:underline mb-2 font-bold">Go Back to Forum</a></p></div>
               
            <div className="mb-6">
                
                <h1 className="text-4xl font-bold mb-2">{post.title}</h1>
                <p className="text-sm text-gray-500">
                    By <a href={`/profile/${post.authorId}`} className="text-blue-500 hover:underline">{post.authorName}</a> on {dayjs(post.dateCreated.toDate()).format('MMM D, YYYY')}
                </p>
                
                <p className="text-gray-700">{post.content}</p>
            </div>
                
              {/* Add image display */}
                {post.imageUrl && (
                    <div className="mt-4 mb-4">
                        <img
                            src={post.imageUrl}
                            alt="Post content"
                            className="rounded-lg max-h-96 object-contain w-full cursor-pointer"
                            onClick={() => window.open(post.imageUrl, '_blank')}
                        />
                    </div>
                )}
            

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
                        {post.reacted} {post.reacted === 1 ? 'react' : 'reactions'}
                    </span>
                </motion.button>
               
                
                <button
                    onClick={() => setShowComments(!showComments)}
                    className=" px-4 py-2 text-[#9F4FDD] hover:text-white hover:shadow-lg hover:shadow-[#9F4FDD]/50 rounded-md dark:text-white hover:bg-[#9F4FDD] transition"
                >
                    {showComments ? 'Hide Comments' : `Show Comments (${comments.length})`}
                </button>
                {!isPostAuthor && (
                    <motion.button
                    onClick={() => handleReportPost(post.id)}
                    className={`flex items-center px-3 py-2 rounded-md transition-all duration-200 text-danger dark:text-white `}
                   whileHover={{ scale: 1.05 }}
                   whileTap={{ scale: 0.95 }}>
               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none">
                   <path d="M4 7L4 21" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                   <path d="M11.7576 3.90865C8.45236 2.22497 5.85125 3.21144 4.55426 4.2192C4.32048 4.40085 4.20358 4.49167 4.10179 4.69967C4 4.90767 4 5.10138 4 5.4888V14.7319C4.9697 13.6342 7.87879 11.9328 11.7576 13.9086C15.224 15.6744 18.1741 14.9424 19.5697 14.1795C19.7633 14.0737 19.8601 14.0207 19.9301 13.9028C20 13.7849 20 13.6569 20 13.4009V5.87389C20 5.04538 20 4.63113 19.8027 4.48106C19.6053 4.33099 19.1436 4.459 18.2202 4.71504C16.64 5.15319 14.3423 5.22532 11.7576 3.90865Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
               </svg>

               <span className="ml-2 font-semibold">
                        {post.reportCount} {post.reportCount === 1 ? 'report' : 'reports'}
                    </span>
               </motion.button>
                )}


                
            </div>



                            {/* Comments Section */}
                            {showComments && (
                                <div className="mb-6">
                                    <h2 className="text-lg font-semibold  mb-2">Comments</h2>
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
                                                className=" mt-4 ml-auto px-6 py-2 text-[#9F4FDD] hover:text-white hover:shadow-lg hover:shadow-[#9F4FDD]/50 rounded-md dark:text-white hover:bg-[#9F4FDD] transition"
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
                                        handleUpdateComment(e, forumId, postId); 
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
                                        <button type="submit" className="px-4 py-2 bg-green-500 text-[#9F4FDD] hover:bg-[#9F4FDD] hover:text-white hover:shadow-lg hover:shadow-[#9F4FDD]/50 rounded-md transition hover:bg-green-600">
                                            Update Comment
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setEditCommentId(null)}
                                            className="px-4 py-2 text-danger hover:bg-danger hover:text-white hover:shadow-lg hover:shadow-danger/50 rounded-md transition hover:bg-red-600"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                    
                                </form>
                            )}
                        
                    <button
                        onClick={() => setShowCommentForm(!showCommentForm)}
                        className="mt-4 px-4 py-2 text-[#9F4FDD] hover:text-white hover:shadow-lg hover:shadow-[#9F4FDD]/50 rounded-md dark:text-white hover:bg-[#9F4FDD] transition"
                    >
                        {showCommentForm ? 'Cancel' : 'Write a Comment'}
                    </button>
                    <div
                            className="mt-2 bg-gray-100 p-2 rounded"
                            dangerouslySetInnerHTML={{ __html: highlightText(commentContent, blacklistedWords) }}
                        />
                        
                        {comments.length > 0 ? (
    <ul className="space-y-4">
        {comments
            .sort((a, b) => b.dateCreated - a.dateCreated) // Sort by dateCreated in descending order
            .map((comment) => (
                <li key={comment.id} className="p-6 bg-white shadow-md rounded-lg border border-gray-200 transition-transform transform hover:scale-105">
                    {/* <p className="absolute top-4 right-4 text-black text-sm">
                        {comment.reportCount} {comment.reportCount === 1 ? 'Report' : 'Reports'}
                    </p> */}
                    <p className="text-gray-800">{comment.content}</p>
                    <p className="text-sm text-black">
                        By <a>{comment.authorName}</a> on {formattedDate(comment.dateCreated)}
                    </p>
                    <div className='flex align-middle'>
                    <motion.button
                        onClick={() => toggleCommentReaction(comment.id)}
                        className={`flex items-center mt-2 px-2 py-1 rounded-md transition-all duration-200 ${
                            comment.reactedBy?.includes(auth.currentUser?.uid || '') ? 'text-danger' : 'text-gray-400'
                        }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="ionicon" viewBox="0 0 512 512" width={16} height={16}>
                            <path
                                d="M352.92 80C288 80 256 144 256 144s-32-64-96.92-64c-52.76 0-94.54 44.14-95.08 96.81-1.1 109.33 86.73 187.08 183 252.42a16 16 0 0018 0c96.26-65.34 184.09-143.09 183-252.42-.54-52.67-42.32-96.81-95.08-96.81z"
                                fill={comment.reactedBy?.includes(auth.currentUser?.uid || '') ? 'currentColor' : 'none'}
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="32"
                            />
                        </svg>
                        <span className="ml-1 text-sm">
                            {comment.reacted || 0}
                        </span>
                    </motion.button>

                    
                       {!isCommentAuthor(comment) && (
                            <motion.button
                            onClick={() => handleReportComment(comment.id)}
                            className={`flex items-center mt-2 px-2 py-1  rounded-md transition-all duration-200 text-danger`}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none">
                                <path d="M4 7L4 21" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                                <path d="M11.7576 3.90865C8.45236 2.22497 5.85125 3.21144 4.55426 4.2192C4.32048 4.40085 4.20358 4.49167 4.10179 4.69967C4 4.90767 4 5.10138 4 5.4888V14.7319C4.9697 13.6342 7.87879 11.9328 11.7576 13.9086C15.224 15.6744 18.1741 14.9424 19.5697 14.1795C19.7633 14.0737 19.8601 14.0207 19.9301 13.9028C20 13.7849 20 13.6569 20 13.4009V5.87389C20 5.04538 20 4.63113 19.8027 4.48106C19.6053 4.33099 19.1436 4.459 18.2202 4.71504C16.64 5.15319 14.3423 5.22532 11.7576 3.90865Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                            </svg>
                            <span className="ml-1 text-sm">
                            {comment.reportCount || 0}
                        </span>
                        </motion.button>
                       )}
                       </div>
                
                    
                    {comment.authorId === auth.currentUser?.uid && (
                        <div className="flex space-x-2 mt-2 ">
                            <button
                                onClick={() => handleDeleteComment(forumId, postId, comment.id)}
                                className="mt-2 text-danger hover:text-white hover:bg-danger hover:bg-opacity-90 px-4 py-2 rounded-md hover:shadow-lg hover:shadow-danger/50 transition"
                            >
                                Delete
                            </button>
                            <button
                                onClick={() => handleEditComment(comment.id, comment.content)}
                                className="mt-2 text-primary hover:text-white hover:bg-primary hover:bg-opacity-90 px-4 py-2 rounded-md hover:shadow-lg hover:shadow-primary/50 transition"
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
            

           

            

            
        </div>
    );
};

export default PostDetailsPage;
