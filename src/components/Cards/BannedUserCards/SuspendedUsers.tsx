import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';

interface SuspendedUser {
  id: string;
  forumId: string;
  suspendedAt: Date | null;
  suspendedBy: string;
  authorName: string;
  reason: string;
  suspendedUntil: Date | null;
  status: 'suspended';
}

const SuspendedUsers: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [suspendedPerPage] = useState(5);
  const [suspendedUsers, setSuspendedUsers] = useState<SuspendedUser[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribes: (() => void)[] = [];

    const fetchSuspendedUsers = async () => {
      try {
        const forumsSnapshot = await getDocs(collection(db, 'forums'));

        forumsSnapshot.forEach((forumDoc) => {
          const forumId = forumDoc.id;

          const suspendedUsersRef = collection(db, `forums/${forumId}/suspendedUsers`);
          const unsubscribe = onSnapshot(suspendedUsersRef, (suspendedUsersSnapshot) => {
            setSuspendedUsers((prevSuspendedUsers) => {
              const updatedSuspendedUsers: SuspendedUser[] = suspendedUsersSnapshot.docs.map((doc) => {
                const data = doc.data();
                const suspendedAt = data.suspendedAt ? data.suspendedAt.toDate() : null;
                const suspendedUntil = data.suspendedUntil ? data.suspendedUntil.toDate() : null;
                return {
                  id: doc.id,
                  forumId,
                  suspendedAt,
                  suspendedBy: data.suspendedBy,
                  authorName: data.authorName,
                  reason: data.reason,
                  suspendedUntil,
                  status: 'suspended',
                };
              });

              // Remove previous suspended users from this forum and replace with updated data
              const filteredPrevSuspendedUsers = prevSuspendedUsers.filter(
                (user) => user.forumId !== forumId
              );

              return [...filteredPrevSuspendedUsers, ...updatedSuspendedUsers];
            });
          });

          unsubscribes.push(unsubscribe);
        });

        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching suspended users:', error);
        setError('Failed to fetch suspended users.');
        setIsLoading(false);
      }
    };

    fetchSuspendedUsers();

    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }, []);

  const handleUnsuspend = async (userId: string) => {
    try {
      const user = suspendedUsers.find((user) => user.id === userId);
      if (!user) {
        toast.error("User not found.");
        return;
      }
  
      const forumId = user.forumId;
      if (!forumId) {
        toast.error("Forum ID not found.");
        return;
      }
  
      // Check if suspension period has expired
      if (user.suspendedUntil && new Date() < user.suspendedUntil) {
        toast.warning("User's suspension period has not yet expired.");
        return;
      }
  
      const suspendedUserDoc = doc(db, `forums/${forumId}/suspendedUsers`, userId);
  
      await deleteDoc(suspendedUserDoc);
  
      // Notify success
      toast.success(`User "${user.authorName}" has been unsuspended.`);
    } catch (error) {
      console.error('Error unsuspending user:', error);
      toast.error('Failed to unsuspend user. Please try again.');
    }
  };
  
  

  const indexOfLastSuspended = currentPage * suspendedPerPage;
  const indexOfFirstSuspended = indexOfLastSuspended - suspendedPerPage;
  const currentBan = suspendedUsers.slice(indexOfFirstSuspended,indexOfLastSuspended);
  const totalPages = Math.ceil(suspendedUsers.length / suspendedPerPage);

  if (isLoading) return <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>;


  if (error) return <div>{error}</div>;

  return (
    <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
      <div className="flex">
        <h1 className="text-lg font-bold mb-4">Suspended Users</h1>
      </div>

      <div className="max-w-full overflow-x-auto">
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-gray-2 text-left dark:bg-meta-4">
              <th className="px-4 text-black dark:text-white">Suspended User</th>
              <th className="px-4 text-black dark:text-white">Reason</th>
              <th className="px-4 text-black dark:text-white">Suspended At</th>
              <th className="px-4 text-black dark:text-white">Until</th>
              <th className="px-4 text-black dark:text-white">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentBan.map((user) => (
              <tr key={user.id}>
                <td className="whitespace-nowrap px-4 py-3.5 dark:text-white">{user.authorName}</td>
                <td className="whitespace-nowrap px-4 py-3.5 dark:text-white">{user.reason}</td>
                <td className="whitespace-nowrap px-4 py-3.5 dark:text-white">
                  {user.suspendedAt ? dayjs(user.suspendedAt).format('YYYY-MM-DD HH:mm:ss') : 'N/A'}
                </td>
                <td className="whitespace-nowrap px-4 py-3.5 dark:text-white">
                  {user.suspendedUntil ? dayjs(user.suspendedUntil).format('YYYY-MM-DD HH:mm:ss') : 'N/A'}
                </td>
                <button
                  onClick={() => handleUnsuspend(user.id)}
                  className="py-2 px-4 text-success hover:bg-success hover:text-white hover:shadow-lg hover:shadow-success/50 rounded-md"
                >
                  Unsuspend
                </button>


              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex justify-between mt-4">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="py-2 px-4 bg-gray-300 rounded-md disabled:opacity-50"
          >
            Previous
          </button>
          <div className="flex items-center">
            <span>Page {currentPage} of {totalPages}</span>
          </div>
          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="py-2 px-4 bg-gray-300 rounded-md disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuspendedUsers;
