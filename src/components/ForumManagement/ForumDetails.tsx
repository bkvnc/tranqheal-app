import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify'; // Import toast
import useForum from '../../hooks/useForum';
import dayjs from 'dayjs';
import { Timestamp } from 'firebase/firestore';
import { highlightText } from '../../hooks/hightlightText';
import { getBlacklistedWords } from '../../hooks/getBlacklistedWords';
import { getAuth } from 'firebase/auth';

import '../../styles.css';





/**
 * ForumDetailsPage component displays detailed information about a specific forum
 * including its description, posts, and allows the user to join/leave the forum
 * or add/delete posts if authorized.
 *
 * Features:
 * - Displays forum title, creation date, author name, tags, and total members.
 * - Lists approved posts with their content, author, and creation date.
 * - Allows authors or members to add new posts and optionally post anonymously.
 * - Enables authors to delete posts.
 * - Provides user authentication check and error handling.
 * - Highlights blacklisted words in post titles and content.
 * - Utilizes Firebase for data fetching and React hooks for state management.
 */

const ForumDetailsPage: React.FC = () => {
    const { forumId } = useParams<{ forumId: string }>();
    const [showPostForm, setShowPostForm] = useState<boolean>(false);
    const { 
        forum, posts, error, anonymous, isMember, isAuthor, postContent, postTitle,creatingPost,
        setBlacklistedWords, handleJoinLeaveForum, blacklistedWords,  
        handleSubmitPost, handleDeletePost, handlePostContentChange, setAnonymous, handlePostTitleChange, setError, setLoading,
    } = useForum(forumId);
   
   

    const userStatus = {
        canJoin: isAuthor && !isMember,   
        canAddPosts: isAuthor || isMember,
        canDeletePosts: isAuthor,
        canJoinOrLeave: !isAuthor && !isMember, // Change to show button if not author and not a member
    };
    

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


    const formattedDate = (date: Date | Timestamp | null): string => {
        if (!date) return 'Unknown date';
        
        const createdDate = dayjs(date instanceof Timestamp ? date.toDate() : date);
        const now = dayjs();
        const diffInSeconds = now.diff(createdDate, 'second');
    
        if (diffInSeconds < 60) return `${diffInSeconds} second${diffInSeconds !== 1 ? 's' : ''} ago`;
        if (diffInSeconds < 3600) return `${now.diff(createdDate, 'minute')} minute${now.diff(createdDate, 'minute') !== 1 ? 's' : ''} ago`;
        if (diffInSeconds < 86400) return `${now.diff(createdDate, 'hour')} hour${now.diff(createdDate, 'hour') !== 1 ? 's' : ''} ago`;
    
        return createdDate.format('MMM D, YYYY');
    };

    useEffect(() => {
        const fetchBlacklistedWords = async () => {
            const words = await getBlacklistedWords(); 
            setBlacklistedWords(words || []);
        };
        fetchBlacklistedWords();
    }, []);

    useEffect(() => {
        if (error) {
            toast.error(error); // Show error toast
        }
    }, [error]);


    return (
        <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">

            <div className="flex items-center justify-between border-b pb-3 mb-4">
                <div>
                    <h1 className="text-4xl font-bold text-black dark:text-white">{forum?.title}</h1>
                    <p className="text-sm text-gray-500">Created: {formattedDate(forum?.dateCreated)}</p>
                    <p className="text-sm text-gray-500">Author: {forum?.authorName}</p>
                    <p className="text-sm text-gray-500">Tags: {forum?.tags.join(', ')}</p>
                </div>
                <div className="text-right">
                    <p className="text-gray-500 dark:text-white">Members: {forum?.totalMembers || 0}</p>
                    { userStatus.canJoinOrLeave && !isAuthor && (
                        <button
                            onClick={handleJoinLeaveForum}
                            aria-label={isMember ? 'Leave Forum' : 'Join Forum'}
                            className={`mt-2 px-4 py-2 ${isMember ? 'bg-[#9F4FDD] hover:bg-danger' : 'bg-[#9F4FDD]'}  hover:bg-[#9F4FDD] text-white hover:text-white rounded-md hover:bg-opacity-90`}
                        >
                            {isMember ? 'Leave Forum' : 'Join Forum'}
                        </button>
                    )}

                </div>
            </div>

            <div className="mt-4">
                <p className="text-lg text-gray-700">{forum?.description}</p>
            </div>

            <div className="mt-8">
                <h2 className="text-2xl font-semibold mb-4 text-black dark:text-white">Posts</h2>
                {posts.length > 0 ? (
                    <ul className="space-y-6">
                        {posts.filter(post => post.status === 'approved').map(post => (
                                <li key={post.id} className="p-6 bg-white shadow-md rounded-lg border border-gray-200 transition-transform transform hover:scale-105">
                                    <div className="flex items-start space-x-4">
                                        <img
                                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(post.authorName || 'Anonymous')}&background=random`}
                                            alt={post.authorName || 'Anonymous'}
                                            className="w-10 h-10 rounded-full"
                                        />
                                        <div className="flex-1">
                                            <Link to={`/forums/${forumId}/posts/${post.id}`} className="text-gray-800 hover:underline">
                                                {post.title}
                                            </Link>
                                            <p className="text-sm text-gray-500 mt-2">
                                                {post.content}
                                            </p>
                                            <p className="text-sm text-gray-500 mt-2">
                                                By <a href={`/profile/${post.authorId}`} className="text-primary hover:underline">{post.authorName}</a> on {formattedDate(post.dateCreated)}
                                            </p>

                                            {userStatus.canDeletePosts && (
                                                <button onClick={() => handleDeletePost(post.id)} className="text-black mt-2 hover:text-red-700 transition">
                                                    Delete
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </li>
                            ))}
                    </ul>
                ) : (
                    <p className="text-gray-600">No posts available.</p>
                )}
            </div>

            {userStatus.canAddPosts && (
                <div className="mt-8">
                    <button
                        onClick={() => setShowPostForm(prev => !prev)}
                        className="px-6 py-2 bg-blue-600 dark:text-white hover:bg-[#9F4FDD] hover:text-white rounded-md hover:bg-blue-700 transition"
                    >
                        {showPostForm ? 'Cancel' : 'Add a Post'}
                    </button>
                </div>
            )}

            {showPostForm && (
                <div className="mt-6">
                    <form onSubmit={handleSubmitPost}>
                        <input
                            type="text"
                            value={postTitle}
                            onChange={handlePostTitleChange}
                            placeholder="Write your title..."
                            className="w-full p-3 border rounded-md py-2 mb-2"
                            required
                        />
                        <div
                            className="mt-2 bg-gray-100 p-2 rounded"
                            dangerouslySetInnerHTML={{ __html: highlightText(postTitle, blacklistedWords) }}
                        />
                        <textarea
                            value={postContent}
                            onChange={handlePostContentChange}
                            placeholder="Write your post..."
                            rows={4}
                            className="w-full p-3 border rounded-md"
                            required
                        />
                        <div
                            className="mt-2 bg-gray-100 p-2 rounded"
                            dangerouslySetInnerHTML={{ __html: highlightText(postContent, blacklistedWords) }}
                        />
                        <div className="flex items-center mt-3">
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
                                disabled={creatingPost}
                                className="ml-auto px-6 py-2 bg-green-600 hover:bg-green-700 rounded-md"
                            >
                                {creatingPost ? 'Posting...' : 'Post'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default ForumDetailsPage;
