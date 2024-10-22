import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import Alert from '../../pages/UiElements/Alerts';
import useForum from '../../hooks/useForum';
import dayjs from 'dayjs';
import { Link } from 'react-router-dom';

const ForumDetailsPage: React.FC = () => {
    const { forumId } = useParams<{ forumId: string }>();
    const [postContent, setPostContent] = useState<string>(''); 
    const [showPostForm, setShowPostForm] = useState<boolean>(false); 
    const { forum, posts, loading, error, alert, isMember, isAuthor, handleJoinLeaveForum, handleCreatePost, handleDeletePost } = useForum(forumId);
    const [anonymous, setAnonymous] = useState<boolean>(false); // Define state locally
    const [creatingPost, setCreatingPost] = useState<boolean>(false); // Define state locally

    const formattedDate = (date) => {
        if (!date) return 'Unknown date'; // Handle undefined date
        const createdDate = date instanceof Date ? dayjs(date) : dayjs(date?.toDate()); 
        const now = dayjs();
        const diffInSeconds = now.diff(createdDate, 'second');

        if (diffInSeconds < 60) {
            return `${diffInSeconds} second${diffInSeconds !== 1 ? 's' : ''} ago`;
        } else if (diffInSeconds < 3600) {
            const diffInMinutes = now.diff(createdDate, 'minute');
            return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
        } else if (diffInSeconds < 86400) {
            const diffInHours = now.diff(createdDate, 'hour');
            return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
        } else {
            return createdDate.format('MMM D, YYYY');
        }
    };

    if (loading) return <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>;
    if (error) return <div className="text-red-500">{error}</div>;

    return (
        <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
            {alert && <Alert type={alert.type} message={alert.message} />}
            <div className="flex items-center justify-between border-b pb-3 mb-4">
                <div>
                    <h1 className="text-4xl font-bold text-black dark:text-white">{forum?.title}</h1>
                    <p className="text-sm text-gray-500">Created: {formattedDate(forum?.dateCreated)}</p>
                    <p className="text-sm text-gray-500">Author: {forum?.authorName}</p>
                    <p className="text-sm text-gray-500">Tags: {forum?.tags.join(', ')}</p>
                </div>
                <div className="text-right">
                    <p className="text-gray-500 dark:text-white">Members: {forum?.totalMembers || 0}</p>
                    {(!isAuthor && !isMember) && (
                        <button
                            onClick={handleJoinLeaveForum}
                            className={`mt-2 px-4 py-2 ${isMember ? 'bg-red-600' : 'bg-blue-600'} text-white rounded-md hover:bg-opacity-90`}
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
                                            By {post.author || 'Unknown Author'} on {formattedDate(post.dateCreated)}
                                        </p>
                                        {(!isAuthor && isMember) && (
                                            <button onClick={() => handleDeletePost(post.id)} className="text-red-500 mt-2 hover:text-red-700 transition">
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

            {(isAuthor && !isMember) && (
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
                    <form
                        onSubmit={async (e) => {
                            e.preventDefault();
                            if (postContent.trim()) {
                                setCreatingPost(true); // Set creating post to true
                                await handleCreatePost(postContent, anonymous);
                                setCreatingPost(false); // Reset after posting
                            }
                        }}
                    >
                        <textarea
                            value={postContent}
                            onChange={(e) => setPostContent(e.target.value)}
                            placeholder="Write your post..."
                            rows={4}
                            className="w-full p-3 border rounded-md"
                            required
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
                                className="ml-auto px-6 py-2 bg-green-600 hover:bg-[#9F4FDD] hover:text-white dark:text-white rounded-md hover:bg-green-700 transition"
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
