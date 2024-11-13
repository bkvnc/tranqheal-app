import { db } from '../config';
import { collection, addDoc, doc, getDoc, setDoc, serverTimestamp, deleteDoc, getDocs, query ,where} from 'firebase/firestore';
import { useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface BanUserButtonProps {
  forumId: string;
  reportId: string;
  postId: string;
  commentId: string;
  adminId: string;
  onBan?: () => Promise<void>; 
}

const BanUserButton: React.FC<BanUserButtonProps> = ({ forumId,  reportId, adminId, onBan }) => {
  const [reason, setReason] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  
  const openModal = () => setIsModalOpen(true);


  const closeModal = () => setIsModalOpen(false);

  

  const deleteUserPostsAndData = async (authorName: string) => {
    
    const postsRef = collection(db, `forums/${forumId}/posts`);
    const postsQuery = query(postsRef, where("authorName", "==", authorName));
    const postsSnapshot = await getDocs(postsQuery);

    for (const postDoc of postsSnapshot.docs) {
      const postId = postDoc.id;

      // Delete all comments by the user in other posts
      const allCommentsRef = collection(db, `forums/${forumId}/posts/${postId}/comments`);
      const commentsSnapshot = await getDocs(allCommentsRef);
      
      for (const commentDoc of commentsSnapshot.docs) {
        if (commentDoc.data().authorName === authorName) {
         
          await deleteDoc(doc(db, `forums/${forumId}/posts/${postId}/comments/${commentDoc.id}`));
        }
      }

      // Delete all likes by the user
      const likesRef = collection(db, `forums/${forumId}/posts/${postId}/likes`);
      const likesSnapshot = await getDocs(likesRef);
      for (const likeDoc of likesSnapshot.docs) {
        if (likeDoc.data().authorName === authorName) {
          await deleteDoc(doc(db, `forums/${forumId}/posts/${postId}/likes/${likeDoc.id}`));
        }
      }

      // If the post belongs to the banned user, delete it
      if (postDoc.data().authorName === authorName) {
        await deleteDoc(doc(db, `forums/${forumId}/posts/${postId}`));
      }
    }
  };

  // New function to delete all user's reports
  const deleteUserReports = async (authorName: string) => {
    // Delete forum-level reports
    const forumReportsRef = collection(db, `forums/${forumId}/reports`);
    const forumReportsSnapshot = await getDocs(forumReportsRef);
    for (const reportDoc of forumReportsSnapshot.docs) {
      if (reportDoc.data().authorName === authorName) {
        await deleteDoc(doc(db, `forums/${forumId}/reports/${reportDoc.id}`));
      }
    }

    // Delete reports in posts and comments
    const postsRef = collection(db, `forums/${forumId}/posts`);
    const postsSnapshot = await getDocs(postsRef);

    for (const postDoc of postsSnapshot.docs) {
      const postId = postDoc.id;

      // Delete post-level reports
      const postReportsRef = collection(db, `forums/${forumId}/posts/${postId}/reports`);
      const postReportsSnapshot = await getDocs(postReportsRef);
      for (const reportDoc of postReportsSnapshot.docs) {
        if (reportDoc.data().authorName === authorName) {
          await deleteDoc(doc(db, `forums/${forumId}/posts/${postId}/reports/${reportDoc.id}`));
        }
      }

      // Delete comment-level reports
      const commentsRef = collection(db, `forums/${forumId}/posts/${postId}/comments`);
      const commentsSnapshot = await getDocs(commentsRef);
      
      for (const commentDoc of commentsSnapshot.docs) {
        const commentReportsRef = collection(db, `forums/${forumId}/posts/${postId}/comments/${commentDoc.id}/reports`);
        const commentReportsSnapshot = await getDocs(commentReportsRef);
        
        for (const reportDoc of commentReportsSnapshot.docs) {
          if (reportDoc.data().authorName === authorName) {
            await deleteDoc(doc(db, `forums/${forumId}/posts/${postId}/comments/${commentDoc.id}/reports/${reportDoc.id}`));
          }
        }
      }
    }
  };

  const handleBanUser = async () => {
    try {
      let authorName = '';
      let authorType = '';
      let reportSource = 'forum';

      // Get the report details
      const forumReportRef = doc(db, `forums/${forumId}/reports`, reportId);
      const forumReportSnap = await getDoc(forumReportRef);

      if (forumReportSnap.exists()) {
        const forumReportData = forumReportSnap.data();
        authorName = forumReportData?.authorName || 'Unknown';
        authorType = forumReportData?.authorType || 'Unknown';
      } else {
        // Search in posts and comments if not found at forum level
        const postsQuerySnapshot = await getDocs(collection(db, `forums/${forumId}/posts`));
        for (const postDoc of postsQuerySnapshot.docs) {
          const postId = postDoc.id;

          const postReportRef = doc(db, `forums/${forumId}/posts/${postId}/reports`, reportId);
          const postReportSnap = await getDoc(postReportRef);

          if (postReportSnap.exists()) {
            const postReportData = postReportSnap.data();
            authorName = postReportData?.authorName || 'Unknown';
            reportSource = 'post';
            authorType = postReportData?.authorType || 'Unknown';
            break;
          }

          const commentsQuerySnapshot = await getDocs(collection(db, `forums/${forumId}/posts/${postId}/comments`));
          for (const commentDoc of commentsQuerySnapshot.docs) {
            const commentId = commentDoc.id;

            const commentReportRef = doc(db, `forums/${forumId}/posts/${postId}/comments/${commentId}/reports`, reportId);
            const commentReportSnap = await getDoc(commentReportRef);

            if (commentReportSnap.exists()) {
              const commentReportData = commentReportSnap.data();
              authorName = commentReportData?.authorName || 'Unknown';
              authorType = commentReportData?.authorType || 'Unknown';
              reportSource = 'comment';
              break;
            }
          }

          if (reportSource === 'comment') break;
        }
      }

      // Add user to bannedUsers collection
      await addDoc(collection(db, `forums/${forumId}/bannedUsers`), {
        reportId,
        forumId,
        authorName,
        authorType,
        reportSource,
        bannedAt: serverTimestamp(),
        bannedBy: adminId,
        reason,
        status: 'banned',
      });

      
      await deleteUserPostsAndData(authorName);
      await deleteUserReports(authorName);

      closeModal();

      if (onBan) await onBan();
      toast.success('User banned successfully and all their data has been deleted!');
    } catch (error) {
      console.error('Error banning user and deleting data:', error);
      toast.error('Failed to ban user or delete data. Please try again.');
    }
  };
  

  return (
    <div>
      <ToastContainer />

      <button
        className="text-danger hover:bg-danger hover:text-white hover:shadow-lg hover:shadow-danger/50 rounded-md px-2 mt-2"
        onClick={openModal}
      >
        Ban User
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
          <div className="dark:border-strokedark dark:bg-boxdark bg-white p-5 rounded-lg w-96">
            <h2 className="text-xl font-semibold mb-3">Ban User</h2>

            <textarea
              className="border p-2 rounded w-full mb-3"
              placeholder="Reason for ban"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <div className="flex justify-end space-x-2">
              <button
                className="text-boxdark hover:bg-boxdark hover:text-white hover:shadow-lg hover:shadow-boxdark/50 dark:text-white p-2 rounded"
                onClick={closeModal}
              >
                Cancel
              </button>
              <button
                className="text-danger hover:bg-danger hover:text-white hover:shadow-lg hover:shadow-danger/50 p-2 rounded"
                onClick={handleBanUser}
              >
                Confirm Ban
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BanUserButton;
