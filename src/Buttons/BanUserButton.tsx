import { db } from '../config';
import { collection, addDoc, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface BanUserButtonProps {
  forumId: string;
  reportId: string;
  adminId: string;
}

const BanUserButton: React.FC<BanUserButtonProps> = ({ forumId, reportId, adminId}) => {
  const [reason, setReason] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ban, setBan] = useState<BanUserButtonProps | null>(null);

  // Function to open the modal
  const openModal = () => setIsModalOpen(true);

  // Function to close the modal
  const closeModal = () => setIsModalOpen(false);

  const handleBanUser = async () => {
    try {
      await addDoc(collection(db, `forums/${forumId}/bannedUsers`), {
        reportId,
        bannedAt: new Date(),
        bannedBy: adminId,
        reason,
        status: "banned",
      });

        const bannedUserRef = doc(db, `'forums', forum.id, 'bannedUsers', reportId`);
        const bannedUserSnap = await getDoc(bannedUserRef);


        const notificationRef = doc(collection(db, `notifications/${ bannedUserSnap.data().authorId}/messages`));
        await setDoc(notificationRef, {
            recipientId:  bannedUserSnap.data().authorId,
            recipientType:  bannedUserSnap.data().authorType,  
            message: `You have been banned from forum ${forumId}. due to ${reason}`,
            type: `ban_user`,
            createdAt: serverTimestamp(), 
            isRead: false,
        });

        const notificationDoc = await getDoc(notificationRef);
            const notificationData = notificationDoc.data();

            if (notificationData && notificationData.createdAt) {
            const createdAtDate = notificationData.createdAt.toDate();
            console.log("Notification createdAt:", createdAtDate); // For debugging
        }
      toast.success('User banned successfully!');
      closeModal();
    } catch (error) {
      console.error('Error banning user:', error);
      toast.error('Error banning user. Please try again.');
    }
  };

  return (
    <div>
      {/* Toast Container */}
      <ToastContainer />

      {/* Button to trigger the modal */}
      <button className="text-danger hover:bg-danger hover:text-white hover:shadow-lg hover:shadow-danger/50 rounded-md px-2 mt-2" onClick={openModal}>
        Ban User
      </button>

      {/* Modal */}
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
                className="text-boxdark hover:bg-boxdark hover:text-white hover:shadow-lg hover:shadow-boxdark/50  dark:text-white p-2 rounded"
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
