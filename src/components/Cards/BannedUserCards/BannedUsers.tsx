import { collection, onSnapshot, getDocs } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { db } from '../../../config/firebase';
import dayjs from 'dayjs';

interface BannedUser {
  id: string;
  forumId: string;
  bannedAt: Date;
  bannedBy: string;
  authorName: string;
  reason: string;
  reportId: string;
  status: 'banned';
}

const AllBannedUsers: React.FC = () => {
  const [bannedUsers, setBannedUsers] = useState<BannedUser[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribes: (() => void)[] = [];

    const fetchBannedUsers = async () => {
      try {
        const forumsSnapshot = await getDocs(collection(db, 'forums'));

        forumsSnapshot.forEach((forumDoc) => {
          const forumId = forumDoc.id;

          const bannedUsersRef = collection(db, `forums/${forumId}/bannedUsers`);
          const unsubscribe = onSnapshot(bannedUsersRef, (bannedUsersSnapshot) => {
            setBannedUsers((prevBannedUsers) => {
              const updatedBannedUsers: BannedUser[] = bannedUsersSnapshot.docs.map((doc) => {
                const data = doc.data();
                const bannedAt = data.bannedAt ? data.bannedAt.toDate() : null;
                return {
                  id: doc.id,
                  forumId,
                  bannedAt,
                  bannedBy: data.bannedBy,
                  reason: data.reason,
                  reportId: data.reportId,
                  authorName: data.authorName,
                  status: 'banned' as const,  // Explicitly set as 'banned' literal type
                };
              });

              // Remove previous banned users from this forum and replace with updated data
              const filteredPrevBannedUsers = prevBannedUsers.filter(
                (user) => user.forumId !== forumId
              );

              return [...filteredPrevBannedUsers, ...updatedBannedUsers];
            });
          });

          unsubscribes.push(unsubscribe);
        });

        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching banned users:', error);
        setError('Failed to fetch banned users.');
        setIsLoading(false);
      }
    };

    fetchBannedUsers();

    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }, []);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
      <div className="flex">
        <h1 className="text-lg font-bold mb-4">All Banned Users</h1>
      </div>

      <div className="max-w-full overflow-x-auto">
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-gray-2 text-left dark:bg-meta-4">
              <th className="px-4 text-black dark:text-white">Banned User</th>
              <th className="px-4 text-black dark:text-white">Reason</th>
              <th className="px-4 text-black dark:text-white">Banned At</th>
            </tr>
          </thead>
          <tbody>
            {bannedUsers.map((user) => (
              <tr key={user.id}>
                <td className="whitespace-nowrap px-4 py-3.5 dark:text-white">{user.authorName}</td>
                <td className="whitespace-nowrap px-4 py-3.5 dark:text-white">{user.reason}</td>
                <td className="whitespace-nowrap px-4 py-3.5 dark:text-white">
                 {user.bannedAt ? dayjs(user.bannedAt).format('YYYY-MM-DD HH:mm:ss') : 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AllBannedUsers;
