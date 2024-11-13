import { useState } from 'react';
import { db } from '../config';
import { doc, setDoc, getDoc, addDoc, collection, serverTimestamp, getDocs, query, where } from 'firebase/firestore';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface SuspendUserButtonProps {
  forumId: string;
  reportId: string;
  adminId: string;
  onSuspend?: () => Promise<void>;
}

const SuspendUserButton: React.FC<SuspendUserButtonProps> = ({ adminId, forumId, reportId, onSuspend }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [days, setDays] = useState<number>(0);
  const [reason, setReason] = useState('');

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const findReportDetails = async () => {
    let authorName = '';
    let authorType = '';
    let reportSource = 'forum';

    // Check forum-level reports
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
          authorType = postReportData?.authorType || 'Unknown';
          reportSource = 'post';
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

    return { authorName, authorType, reportSource };
  };

  const handleSuspendUser = async () => {
    if (!days || days <= 0) {
      toast.error('Please enter a valid number of days');
      return;
    }

    if (!reason.trim()) {
      toast.error('Please provide a reason for suspension');
      return;
    }

    const suspendedUntil = new Date();
    suspendedUntil.setDate(suspendedUntil.getDate() + days);

    try {
      const { authorName, authorType, reportSource } = await findReportDetails();

      // Add to suspendedUsers collection
      await addDoc(collection(db, `forums/${forumId}/suspendedUsers`), {
        reportId,
        forumId,
        authorName,
        authorType,
        reportSource,
        suspendedUntil,
        suspendedAt: serverTimestamp(),
        suspendedBy: adminId,
        reason,
        status: 'suspended',
      });

      // Create notification
      const notificationRef = doc(collection(db, 'notifications'));
      await setDoc(notificationRef, {
        recipientId: authorName, // Using authorName as recipientId
        recipientType: authorType,
        message: `You have been suspended from forum ${forumId} for ${days} days due to: ${reason}`,
        type: 'suspend_user',
        createdAt: serverTimestamp(),
        isRead: false,
      });

      if (onSuspend) await onSuspend();
      toast.success('User suspended successfully!');
      closeModal();
    } catch (error) {
      console.error('Error suspending user:', error);
      toast.error('Failed to suspend user. Please try again.');
    }
  };

  return (
    <div>
      <ToastContainer />
      
      <button 
        className="text-warning hover:bg-warning hover:text-white hover:shadow-lg hover:shadow-warning/50 px-2 rounded-md mt-2" 
        onClick={openModal}
      >
        Suspend User
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
          <div className="dark:border-strokedark dark:bg-boxdark bg-white p-5 rounded-lg w-96">
            <h2 className="text-xl font-semibold mb-3">Suspend User</h2>
            
            <textarea
              className="border p-2 rounded w-full mb-3"
              placeholder="Reason for suspension"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            
            <input
              type="number"
              className="border p-2 rounded w-full mb-3"
              placeholder="Number of days"
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value, 10))}
              min="1"
            />
            
            <div className="flex justify-end space-x-2">
              <button
                className="text-boxdark hover:bg-boxdark hover:text-white hover:shadow-lg hover:shadow-boxdark/50 dark:text-white p-2 rounded"
                onClick={closeModal}
              >
                Cancel
              </button>
              <button
                className="text-warning hover:bg-warning hover:text-white hover:shadow-lg hover:shadow-warning/50 p-2 rounded"
                onClick={handleSuspendUser}
              >
                Confirm Suspension
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuspendUserButton;