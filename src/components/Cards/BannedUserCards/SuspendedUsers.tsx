import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import dayjs from 'dayjs';

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

  if (isLoading) return <div>Loading...</div>;
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
            </tr>
          </thead>
          <tbody>
            {suspendedUsers.map((user) => (
              <tr key={user.id}>
                <td className="whitespace-nowrap px-4 py-3.5 dark:text-white">{user.authorName}</td>
                <td className="whitespace-nowrap px-4 py-3.5 dark:text-white">{user.reason}</td>
                <td className="whitespace-nowrap px-4 py-3.5 dark:text-white">
                  {user.suspendedAt ? dayjs(user.suspendedAt).format('YYYY-MM-DD HH:mm:ss') : 'N/A'}
                </td>
                <td className="whitespace-nowrap px-4 py-3.5 dark:text-white">
                  {user.suspendedUntil ? dayjs(user.suspendedUntil).format('YYYY-MM-DD HH:mm:ss') : 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SuspendedUsers;
