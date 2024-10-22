import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { doc, getDoc, collection, query, where, getDocs, addDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../../config/firebase';
import Alert from '../../pages/UiElements/Alerts';
import { Link } from 'react-router-dom';

interface Forum {
    id: string;
    title: string;
    dateCreated: any;
    totalMembers: number | null;
    totalComments: number | null;
    tags: string[];
    status: string;
    totalUpvotes: number | null;
    description: string;
    authorName: string;
    authorType: string;
}

interface Post {
    id: string;
    content: string;
    dateCreated: any;
    author: string; // Display name
    authorId: string; // User ID
    reacts: number;
    forumId: string;
}

const ForumDetailsPage: React.FC = () => {
    const { forumId } = useParams<{ forumId: string }>();
    const [forum, setForum] = useState<Forum | null>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [postContent, setPostContent] = useState<string>(''); // State for post content
    const [creatingPost, setCreatingPost] = useState<boolean>(false); // State for post creation loading
    const [showPostForm, setShowPostForm] = useState<boolean>(false); // State for post form visibility

    const fetchForumById = async (forumId: string): Promise<Forum> => {
        const docRef = doc(db, 'forums', forumId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: forumId, ...docSnap.data() } as Forum;
        } else {
            throw new Error('Forum not found');
        }
    };

    const fetchPostsByForumId = async (forumId: string): Promise<Post[]> => {
        const postsQuery = query(collection(db, 'posts'), where('forumId', '==', forumId));
        const querySnapshot = await getDocs(postsQuery);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
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
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [forumId]);

    const handleCreatePost = async (content: string) => {
        const currentDate = new Date();
        const user = auth.currentUser;

        if (user && forum) {
            setCreatingPost(true); // Start loading state
            try {
                const postRef = collection(db, 'posts');
                await addDoc(postRef, {
                    content,
                    dateCreated: currentDate,
                    author: user.displayName || 'Anonymous',
                    authorId: user.uid,
                    forumId: forum.id,
                });
                setAlert({ type: 'success', message: 'Post created successfully!' });
                setPostContent(''); // Clear the input after successful creation
                setShowPostForm(false); // Hide the post form after creation
                // Fetch posts again to refresh the list
                const updatedPosts = await fetchPostsByForumId(forum.id);
                setPosts(updatedPosts);
            } catch (error) {
                setAlert({ type: 'error', message: 'Failed to create post: ' + error.message });
            } finally {
                setCreatingPost(false); // End loading state
            }
        }
    };

    useEffect(() => {
        // Auto-dismiss alert after 3 seconds
        if (alert) {
            const timeoutId = setTimeout(() => {
                setAlert(null);
            }, 3000);

            return () => clearTimeout(timeoutId); // Cleanup timeout on component unmount
        }
    }, [alert]);

    const handleDeletePost = async (postId: string) => {
        const postDocRef = doc(db, 'posts', postId);
        try {
            await deleteDoc(postDocRef);
            setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId));
            setAlert({ type: 'success', message: 'Post deleted successfully!' });
        } catch (error) {
            setAlert({ type: 'error', message: 'Failed to delete post: ' + error.message });
        }
    };

    if (loading) return <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>;
    if (error) return <div className="text-center text-red-500">{error}</div>;

    return (

        <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
            {alert && <Alert type={alert.type} message={alert.message} />}
            <div className="flex items-center justify-between border-b pb-3 mb-4">
                <div>
                    <h1 className="text-4xl font-bold text-black dark:text-white    ">{forum.title}</h1>
                    <p className="text-sm text-gray-500">Created on: {dayjs(forum.dateCreated.toDate()).format('MMM D, YYYY')}</p>
                    <p className="text-sm text-gray-500">Author: {forum.authorName}</p>
                    <p className="text-sm text-gray-500">Tags: {forum.tags.join(', ')}</p>
                </div>
                <div className="text-right">
                    <p className="text-gray-500  dark:text-white">Members: {forum.totalMembers || 0}</p>
                </div>
            </div>

            <div className="mt-4">
                <p className="text-lg text-gray-700">{forum.description}</p>
                <div className="mt-2">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        forum.status === 'inactive' ? 'bg-red-100 text-red-800' :
                        forum.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        forum.status === 'active' ? 'bg-green-100 text-green-800' : ''
                    }`}>
                        {forum.status.charAt(0).toUpperCase() + forum.status.slice(1)}
                    </span>
                </div>
            </div>

            <div className="mt-8">
                <h2 className="text-2xl font-semibold mb-4 text-black dark:text-white">Posts</h2>
                {posts.length > 0 ? (
                   <ul className="space-y-6">
                   {posts.map(post => (
                       <li key={post.id} className="p-6 bg-white shadow-md rounded-lg border border-gray-200 transition-transform transform hover:scale-105">
                           <div className="flex items-start space-x-4">
                               <img
                                   src={`https://ui-avatars.com/api/?name=${encodeURIComponent(post.author)}&background=random`}
                                   alt={post.author}
                                   className="w-10 h-10 rounded-full"
                               />
                               <div className="flex-1">
                                   <Link to={`/posts/${post.id}`} className="text-gray-800 hover:underline">
                                       {post.content}
                                   </Link>
                                   <p className="text-sm text-gray-500 mt-2">
                                       By {post.author} on {dayjs(post.dateCreated.toDate()).format('MMM D, YYYY')}
                                   </p>
                                   <button onClick={() => handleDeletePost(post.id)} className="text-red-500 mt-2 hover:text-red-700 transition">
                                       Delete
                                   </button>
                               </div>
                           </div>
                       </li>
                   ))}
               </ul>
                ) : (
                    <p className="text-gray-600">No posts available.</p>
                )}
            </div>

            {/* Add Post Button */}
            <div className="mt-8">
                <button
                    onClick={() => setShowPostForm(prev => !prev)} // Toggle form visibility
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                >
                    {showPostForm ? 'Cancel' : 'Add Post'}
                </button>
            </div>

            {/* Create Post Section */}
            {showPostForm && (
                <div className="mt-4 p-4 border border-gray-300 rounded-lg shadow-sm bg-gray-50">
                    <h2 className="text-xl font-semibold mb-4">Create a New Post</h2>
                    <form onSubmit={(e) => { e.preventDefault(); handleCreatePost(postContent); }}>
                        <textarea
                            value={postContent} // Controlled component
                            onChange={(e) => setPostContent(e.target.value)} // Update state on change
                            rows={4}
                            placeholder="Write your post here..."
                            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                        <button type="submit" disabled={creatingPost} className={`mt-2 px-6 py-2 rounded-md ${creatingPost ? 'bg-gray-500' : 'bg-blue-600 text-white hover:bg-blue-700 transition'}`}>
                            {creatingPost ? 'Creating...' : 'Create Post'}
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default ForumDetailsPage;
