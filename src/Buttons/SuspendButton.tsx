import { useState } from 'react';
import { db } from '../config';
import { doc, updateDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; // Make sure to import the toast styles

interface SuspendUserButtonProps {
  userId: string;
  forumId: string;
}

const SuspendUserButton: React.FC<SuspendUserButtonProps> = ({ userId, forumId }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [days, setDays] = useState<number>(0);
  const [reason, setReason] = useState('');

  // Function to open the modal
  const openModal = () => {
    setIsModalOpen(true);
  };

  // Function to close the modal
  const closeModal = () => {
    setIsModalOpen(false);
  };

  // Function to handle suspending the user
  const handleSuspendUser = async () => {
    const suspendedUntil = new Date();
    suspendedUntil.setDate(suspendedUntil.getDate() + days);

    try {
      await updateDoc(doc(db, 'users', userId), {
        suspension: {
          forumId,
          suspendedUntil,
          reason,
        },
      });
      toast.success('User suspended successfully!'); // Toast notification
      closeModal(); // Close the modal after success
    } catch (error) {
      console.error('Error suspending user:', error);
      toast.error('Failed to suspend user.'); // Show error toast
    }
  };

  return (
    <div>
      {/* Button to open the modal */}
      <button className="text-warning hover:bg-warning hover:text-white hover:shadow-lg hover:shadow-warning/50 px-2 rounded-md mt-2" onClick={openModal}>
        Suspend User
      </button>

      {/* Modal for suspending the user */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg  dark:border-strokedark dark:bg-boxdark">
            <h2 className="text-xl font-semibold mb-4">Suspend User</h2>
            <textarea
              className="border p-2 rounded w-full"
              placeholder="Reason for suspension"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <input
              type="number"
              className="border p-2 rounded mt-2 w-full"
              placeholder="Days"
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value, 10))}
            />
            <div className="mt-4 flex justify-between">
              <button
                className="text-boxdark hover:bg-boxdark hover:text-white hover:shadow-lg hover:shadow-boxdark/50  dark:text-white p-2 rounded"
                onClick={closeModal}
              >
                Cancel
              </button>
              <button
                className="text-warning hover:bg-warning hover:text-white hover:shadow-lg hover:shadow-warning/50 p-2 rounded"
                onClick={handleSuspendUser}
              >
                Suspend
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuspendUserButton;
