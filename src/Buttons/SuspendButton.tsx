import { db } from '../config';
import { 
  collection, 
  doc, 
  getDoc, 
  deleteDoc,
  setDoc,
  serverTimestamp, 
  writeBatch,
  DocumentReference,
  DocumentData
} from 'firebase/firestore';
import { useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface SuspendButtonProps {
  forumId: string;
  postId: string;
  commentId: string;
  reportId: string;
  adminId: string;
  onSuspend: (reportId: string) => Promise<void>;
}

interface ReportData {
  authorId: string;
  authorName: string;
  authorType: string;
  reportedUserId: string;
}

const SuspendButton: React.FC<SuspendButtonProps> = ({ 
  forumId, 
  postId,
  commentId,
  reportId, 
  adminId, 
  onSuspend 
}) => {
  const [reason, setReason] = useState('');
  const [suspensionDays, setSuspensionDays] = useState(7); // Default suspension period
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



const handleSuspendUser = async () => {
  if (!reason.trim()) {
    toast.error('Please provide a reason for the suspension');
    return;
  }

  if (!adminId) {
    toast.error('Admin ID is required');
    return;
  }

  if (suspensionDays <= 0) {
    toast.error('Please specify a valid suspension period');
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

    // Calculate suspension end time
    const suspendedUntil = new Date();
    suspendedUntil.setDate(suspendedUntil.getDate() + suspensionDays);

    // Add to suspendedUsers collection
    const suspendedUserRef = doc(collection(db, `forums/${forumId}/suspendedUsers`));
    batch.set(suspendedUserRef, {
      userId: reportData.authorId,
      forumId,
      authorName: reportData.authorName,
      authorType: reportData.authorType,
      reportSource: source,
      suspendedAt: serverTimestamp(),
      suspendedBy: adminId,
      reason: reason.trim(),
      suspendedUntil,
      status: 'suspended',
    });


    const notificationRef = doc(
      collection(db, `notifications/${reportData.authorId}/messages`)
    );
    await setDoc(notificationRef, {
      recipientId: reportData.authorId,
      recipientType: reportData.authorType,
      message: `Your account has been suspended for ${suspensionDays} days for the following reason: ${reason.trim()}`,
      type: `user_suspended`,
      createdAt: serverTimestamp(),
      isRead: false,
    });


    const reportRef = getReportRef();
    batch.delete(reportRef); 

    
    await batch.commit();

    // Success
    closeModal();
    await onSuspend(reportId);
    toast.success('User suspended and report removed successfully');
  } catch (error) {
    console.error('Error suspending user:', error);
    toast.error(error instanceof Error ? error.message : 'Failed to suspend user. Please try again.');
  } finally {
    setIsLoading(false);
  }
};

  

  return (
    <div>
      <ToastContainer />
      
      <button
        className="text-warning hover:bg-warning hover:text-white hover:shadow-lg hover:shadow-warning/50 rounded-md px-2 mt-2"
        onClick={openModal}
        disabled={isLoading}
      >
        Suspend User
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50 border-stroke">
          <div className=" border-stroke dark:border-strokedark dark:bg-boxdark bg-white p-5 rounded-lg w-96">
            <h2 className="text-xl font-semibold mb-3">Suspend User</h2>

            <textarea
              className="border p-2 rounded w-full mb-3 dark:bg-boxdark dark:border-strokedark"
              placeholder="Reason for suspension"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isLoading}
            />
            <h1 className="text-lg font-semibold mb-3">Suspension Period (in Days)</h1>
            <input
              type="number"
              min="1"
              className="border p-2 rounded w-full mb-3 dark:bg-boxdark dark:border-strokedark"
              placeholder="Suspension days (e.g., 7)"
              value={suspensionDays}
              onChange={(e) => setSuspensionDays(Number(e.target.value))}
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
                className={`text-warning hover:bg-warning hover:text-white hover:shadow-lg hover:shadow-warning/50 p-2 rounded flex items-center ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={handleSuspendUser}
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
                  'Confirm Suspension'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuspendButton;
