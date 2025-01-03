import React, { useEffect, useState } from 'react';
import { collection, doc, getDocs, updateDoc, arrayRemove, getDoc,setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase'; // Adjust the import based on your setup
import toast from 'react-hot-toast';

const ForumReports = () => {
  const [forums, setForums] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedForum, setSelectedForum] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const forumsPerPage = 5; // Items per page
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [userData, setUserData] = useState<any>({});

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const forumsRef = collection(db, 'forums');
        const forumDocs = await getDocs(forumsRef);

        const forumData = await Promise.all(
          forumDocs.docs.map(async (forumDoc) => {
            const forum = forumDoc.data();
            const forumId = forumDoc.id;

            // Fetch posts within each forum
            const postsRef = collection(db, `forums/${forumId}/posts`);
            const postsDocs = await getDocs(postsRef);

            let totalPostReports = 0;
            let totalCommentReports = 0;

            const postsData = await Promise.all(
              postsDocs.docs.map(async (postDoc) => {
                const post = postDoc.data();
                const postId = postDoc.id;

                // Fetch comments within each post
                const commentsRef = collection(db, `forums/${forumId}/posts/${postId}/comments`);
                const commentsDocs = await getDocs(commentsRef);

                // Calculate total comment reports for this post
                const commentReports = commentsDocs.docs.reduce(
                  (sum, commentDoc) => sum + (commentDoc.data().reportCount || 0),
                  0
                );

                totalCommentReports += commentReports;

                return {
                  ...post,
                  reportCount: post.reportCount || 0,
                  commentReports,
                };
              })
            );

            // Calculate total post reports for this forum
            totalPostReports = postsData.reduce((sum, post) => sum + post.reportCount, 0);

            return {
              ...forum,
              id: forumId,
              forumReportCount: forum.reportCount || 0,
              totalPostReports,
              totalCommentReports,
              posts: postsData,
            };
          })
        );

        setForums(forumData);
      } catch (error) {
        console.error('Error fetching forum reports:', error);
        toast.error('Failed to fetch forum reports.');
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  const handleKickUser = async (forumId: string, userId: string) => {
    const confirmKick = window.confirm(
      `Are you sure you want to kick the user with ID ${userId} from this forum?`
    );
  
    if (!confirmKick) {
      return; // Exit the function if the user cancels
    }
  
    try {
      const forumRef = doc(db, 'forums', forumId);
      await updateDoc(forumRef, {
        members: arrayRemove(userId),
      });
  
      toast.success(`User ${userId} has been kicked from the forum.`);
  
      // Update the selectedForum state to refresh the modal content
      setSelectedForum((prevForum: any) => ({
        ...prevForum,
        members: prevForum.members.filter((member: string) => member !== userId),
      }));

      
              const forumSnap = await getDoc(forumRef );

      const notificationRef = doc(collection(db, `notifications/${forumSnap.data().authorId}/messages`));
              await setDoc(notificationRef, {
                  recipientId: forumSnap.data().authorId,
                  recipientType: forumSnap.data().authorType,  
                  message: `You have been kicked from the " ${forumSnap.data().title} " forum .`,
                  type: `react_post`,
                  createdAt: serverTimestamp(), 
                  isRead: false,
                  additionalData: {
                      forumId: forumId,
                  },
              });

    } catch (error) {
      console.error('Error kicking user:', error);
      toast.error('Failed to kick the user. Please try again.');
    }
  };
  
  

  const openModal = (forum: any) => {
    setSelectedForum(forum);
    setIsModalOpen(true);
    fetchUserData(forum.members);  // Fetch user data when the modal is opened
  };

  const closeModal = () => {
    setSelectedForum(null);
    setIsModalOpen(false);
  };

  const fetchUserData = async (members: string[]) => {
    const usersRef = collection(db, 'users');
    const organizationsRef = collection(db, 'organizations');
    const professionalsRef = collection(db, 'professionals');
    
    const allUsers: any = {};
  
    for (const memberId of members) {
      let memberDoc;
      
    
      const userDocRef = doc(usersRef, memberId);
      memberDoc = await getDoc(userDocRef);
      if (memberDoc.exists()) {
        const memberData = memberDoc.data();
        allUsers[memberId] = {
          name: `${memberData.firstName} ${memberData.lastName}`,  
          type: 'user',  
        };
        continue; 
      }
      
    
      const orgDocRef = doc(organizationsRef, memberId);
      memberDoc = await getDoc(orgDocRef);
      if (memberDoc.exists()) {
        const memberData = memberDoc.data();
        allUsers[memberId] = {
          name: memberData.organizationName,  
          type: 'organization',  
        };
        continue; 
      }
      
      
      const professionalDocRef = doc(professionalsRef, memberId);
      memberDoc = await getDoc(professionalDocRef);
      if (memberDoc.exists()) {
        const memberData = memberDoc.data();
        allUsers[memberId] = {
          name: `${memberData.firstName} ${memberData.lastName}`,  
          type: 'professional',  
        };
        continue; 
      }
  
      
      allUsers[memberId] = {
        name: 'Unknown',  
        type: 'unknown',  
      };
    }
  
    setUserData(allUsers);  
  };

  if (loading) {
    return <div>Loading forum reports...</div>;
  }

  if (!forums || forums.length === 0) {
    return <div>No forums found.</div>;
  }

  const filteredForums = forums.filter(forum =>
    forum.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastForum = currentPage * forumsPerPage;
  const indexOfFirstForum = indexOfLastForum - forumsPerPage;
  const currentForums = filteredForums.slice(indexOfFirstForum, indexOfLastForum);
  const totalPages = Math.ceil(filteredForums.length / forumsPerPage);

  return (
    <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
      <div className="max-w-full overflow-x-auto">
      <h1 className="text-2xl font-bold mb-6">Forum Reports</h1>
      <table className="w-full table-auto">
        <thead>
          <tr className="bg-gray-2 text-left dark:bg-meta-4">
            <th className="min-w-[220px] py-4 px-4 font-medium text-black dark:text-white xl:pl-11">Forum Title</th>
            <th className="min-w-[220px] py-4 px-4 font-medium text-black dark:text-white xl:pl-11">Author</th>
            <th className="min-w-[220px] py-4 px-4 font-medium text-black dark:text-white xl:pl-5">Forum Reports</th>
            <th className="min-w-[220px] py-4 px-4 font-medium text-black dark:text-white xl:pl-4">Post Reports</th>
            <th className="min-w-[220px] py-4 px-4 font-medium text-black dark:text-white xl:pl-4">Comment Reports</th>
            {/* <th className="min-w-[220px] py-4 px-4 font-medium text-black dark:text-white xl:pl-14">Action</th> */}
          </tr>
        </thead>
        <tbody>
          {currentForums.map((forum) => (
            <tr key={forum.id} className="hover:bg-gray-100 dark:hover:bg-gray-800">
              <td className="min-w-[220px] py-4 px-4 font-medium text-black dark:text-white xl:pl-11">{forum.title}</td>
              <td className="min-w-[220px] py-4 px-4 font-medium text-black dark:text-white xl:pl-11">{forum.authorName || 'Unknown Author'}</td>
              <td className="min-w-[220px] py-4 px-4 font-medium text-black dark:text-white xl:pl-11">{forum.forumReportCount}</td>
              <td className="min-w-[220px] py-4 px-4 font-medium text-black dark:text-white xl:pl-11">{forum.totalPostReports}</td>
              <td className="min-w-[220px] py-4 px-4 font-medium text-black dark:text-white xl:pl-11">{forum.totalCommentReports}</td>
              {/* <td className="min-w-[220px] py-4 px-4 font-medium text-black dark:text-white xl:pl-11">
                <button onClick={() => openModal(forum)} className="text-primary rounded-md hover:bg-primary hover:text-white hover:shadow-md hover:shadow-primary/50 px-2">
                  Members
                </button>
              </td> */}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="flex justify-between mt-4">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="py-2 px-4 bg-gray-300 rounded-md disabled:opacity-50"
        >
          Prev
        </button>
        <span className="py-2 px-4">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="py-2 px-4 bg-gray-300 rounded-md disabled:opacity-50"
        >
          Next
        </button>
      </div>

      {/* Modal */}
          {isModalOpen && selectedForum && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg w-full max-w-md mx-4 sm:mx-0">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Forum Members</h2>
          <ul>
            {selectedForum.members && selectedForum.members.length > 0 ? (
              selectedForum.members.map((memberId: string) => (
                <li key={memberId} className="flex justify-between items-center p-3 ">
                  <span>{userData[memberId]?.name || 'Unknown User'}</span>
                  <button
                    onClick={() => handleKickUser(selectedForum.id, memberId)}
                    className="text-danger rounded-md hover:bg-danger hover:text-white transition-all hover:shadow-md hover:shadow-danger/50 duration-200 px-2"
                  >
                    Kick
                  </button>
                </li>
              ))
            ) : (
              <li>No members found.</li>
            )}
          </ul>
          <div className="mt-6 flex justify-end">
            <button
              onClick={closeModal}
              className="px-6 py-2 text-primary hover:bg-primary hover:text-white rounded-md hover:shadow-md hover:shadow-primary/50 focus:outline-none transition-all duration-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )}

      </div>
    </div>
  );
};

export default ForumReports;
