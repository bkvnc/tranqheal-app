import { db } from '../config';
import { 
  collection, 
  addDoc, 
  doc, 
  getDoc, 
  serverTimestamp, 
  deleteDoc,
  setDoc,
  getDocs, 
  query, 
  where, 
  writeBatch,
  DocumentReference,
  DocumentData
} from 'firebase/firestore';
import { useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface BanUserButtonProps {
  forumId: string;
  postId: string;
  commentId: string;
  reportId: string;
  adminId: string;
  onBan: (reportId: string) => Promise<void>;
}

interface ReportData {
  authorId: string;
  authorName: string;
  authorType: string;
  reportedUserId: string;
}

const BanUserButton: React.FC<BanUserButtonProps> = ({ 
  forumId, 
  postId,
  commentId,
  reportId, 
  adminId, 
  onBan 
}) => {
  const [reason, setReason] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const getReportRef = (): DocumentReference<DocumentData> => {
    if (commentId) {
      return doc(db, `forums/${forumId}/posts/${postId}/comments/${commentId}/reports`, reportId);
    }
    if (postId) {
      return doc(db, `forums/${forumId}/posts/${postId}/reports`, reportId);
    }
    return doc(db, `forums/${forumId}/reports`, reportId);
  };

  const findReport = async (): Promise<{ 
    data: ReportData | null, 
    source: 'forum' | 'post' | 'comment' 
  }> => {
    try {
      const reportRef = getReportRef();
      const reportSnap = await getDoc(reportRef);

      if (reportSnap.exists()) {
        return {
          data: reportSnap.data() as ReportData,
          source: commentId ? 'comment' : postId ? 'post' : 'forum'
        };
      }

      throw new Error('Report not found');
    } catch (error) {
      console.error('Error finding report:', error);
      throw new Error('Failed to find report');
    }
  };

  const deleteUserContent = async (batch: any, authorId: string) => {
    // Delete user's posts and their comments
    const postsRef = collection(db, `forums/${forumId}/posts`);
    const postsQuery = query(postsRef, where("authorId", "==", authorId));
    const postsSnapshot = await getDocs(postsQuery);

    for (const postDoc of postsSnapshot.docs) {
      const postId = postDoc.id;

      // Get all comments in the post
      const commentsRef = collection(db, `forums/${forumId}/posts/${postId}/comments`);
      const commentsSnapshot = await getDocs(commentsRef);
      
      // Delete comments by the banned user
      commentsSnapshot.docs.forEach(commentDoc => {
        if (commentDoc.data().authorId === authorId) {
          batch.delete(doc(db, `forums/${forumId}/posts/${postId}/comments/${commentDoc.id}`));
        }
      });

      // Delete the post if it belongs to the banned user
      if (postDoc.data().authorId === authorId) {
        batch.delete(doc(db, `forums/${forumId}/posts/${postId}`));
      }
    }
  };

  const deleteUserReports = async (batch: any, authorId: string) => {
    // Delete forum-level reports
    const forumReportsRef = collection(db, `forums/${forumId}/reports`);
    const forumReportsSnapshot = await getDocs(forumReportsRef);
    
    forumReportsSnapshot.docs.forEach(reportDoc => {
      const reportData = reportDoc.data();
      if (reportData.authorId === authorId || reportData.reportedUserId === authorId) {
        batch.delete(doc(db, `forums/${forumId}/reports/${reportDoc.id}`));
      }
    });

    // Delete reports in posts and comments
    const postsRef = collection(db, `forums/${forumId}/posts`);
    const postsSnapshot = await getDocs(postsRef);

    for (const postDoc of postsSnapshot.docs) {
      const postId = postDoc.id;

      // Delete post reports
      const postReportsRef = collection(db, `forums/${forumId}/posts/${postId}/reports`);
      const postReportsSnapshot = await getDocs(postReportsRef);
      
      postReportsSnapshot.docs.forEach(reportDoc => {
        const reportData = reportDoc.data();
        if (reportData.authorId === authorId || reportData.reportedUserId === authorId) {
          batch.delete(doc(db, `forums/${forumId}/posts/${postId}/reports/${reportDoc.id}`));
        }
      });

      // Delete comment reports
      const commentsRef = collection(db, `forums/${forumId}/posts/${postId}/comments`);
      const commentsSnapshot = await getDocs(commentsRef);
      
      for (const commentDoc of commentsSnapshot.docs) {
        const commentId = commentDoc.id;
        const commentReportsRef = collection(db, `forums/${forumId}/posts/${postId}/comments/${commentId}/reports`);
        const commentReportsSnapshot = await getDocs(commentReportsRef);
        
        commentReportsSnapshot.docs.forEach(reportDoc => {
          const reportData = reportDoc.data();
          if (reportData.authorId === authorId || reportData.reportedUserId === authorId) {
            batch.delete(doc(db, `forums/${forumId}/posts/${postId}/comments/${commentId}/reports/${reportDoc.id}`));
          }
        });
      }
    }
  };

  const handleBanUser = async () => {
    if (!reason.trim()) {
      toast.error('Please provide a reason for the ban');
      return;
    }

    if (!adminId) {
      toast.error('Admin ID is required');
      return;
    }

    setIsLoading(true);

    try {
      // Find the report and get user details
      const { data: reportData, source } = await findReport();
      
      if (!reportData || !reportData.authorId) {
        throw new Error('Report not found or invalid data');
      }

      const batch = writeBatch(db);
        try{
        // Add to bannedUsers collection
        const bannedUserRef = doc(collection(db, `forums/${forumId}/bannedUsers`));
        batch.set(bannedUserRef, {
          userId: reportData.authorId,
          forumId,
          authorName: reportData.authorName,
          authorType: reportData.authorType,
          reportSource: source,
          bannedAt: serverTimestamp(),
          bannedBy: adminId,
          reason: reason.trim(),
          status: 'banned',
        });
        console.log(reportData.authorId);
      } catch (error) {
        console.error('Error adding to bannedUsers collection:', error);
        throw new Error('Failed to add to bannedUsers collection. Please try again.');
      }

      try{
        const notificationRef = doc(
          collection(db, `notifications/${reportData.authorId}/messages`)
        );
        await setDoc(notificationRef, {
          recipientId: reportData.authorId,
          recipientType: reportData.authorType,
          message: `Your account has been banned for the following reason: ${reason.trim()}`,
          type: `user_suspended`,
          createdAt: serverTimestamp(),
          isRead: false,
        });
  } catch (error) {
    console.error('Error adding notification:', error);
    throw new Error('Failed to add notification. Please try again.');
  }

    try{
      await deleteUserContent(batch, reportData.authorId);
      await deleteUserReports(batch, reportData.authorId);
    } catch (error) {
      console.error('Error deleting user content:', error);
      throw new Error('Failed to delete user content. Please try again.');
    }
     

    try{
      await batch.commit();
    } catch (error) {
      console.error('Error committing batch:', error);
      throw new Error('Failed to commit batch. Please try again.');
    }
     
      closeModal();
      try{
      await onBan(reportId);
      } catch (error) {
        console.error('Error banning user:', error);
        throw new Error('Failed to ban user. Please try again.');
      }
      toast.success('User banned successfully and all their data has been deleted');
    } catch (error) {
      console.error('Error banning user:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to ban user. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <ToastContainer />
      
      <button
        className="text-danger hover:bg-danger hover:text-white hover:shadow-lg hover:shadow-danger/50 rounded-md px-2 mt-2"
        onClick={openModal}
        disabled={isLoading}
      >
        Ban User
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50 border-stroke">
          <div className=" border-stroke dark:border-strokedark dark:bg-boxdark bg-white p-5 rounded-lg w-96">
            <h2 className="text-xl font-semibold mb-3">Ban User</h2>

            <textarea
              className="border p-2 rounded w-full mb-3 dark:bg-boxdark dark:border-strokedark"
              placeholder="Reason for ban"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isLoading}
            />

            <div className="flex justify-end space-x-2">
              <button
                className="text-boxdark hover:bg-boxdark hover:text-white hover:shadow-lg hover:shadow-boxdark/50 dark:text-white p-2 rounded"
                onClick={closeModal}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                className={`text-danger hover:bg-danger hover:text-white hover:shadow-lg hover:shadow-danger/50 p-2 rounded flex items-center ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                onClick={handleBanUser}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing...
                  </>
                ) : (
                  'Confirm Ban'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BanUserButton;