import React, { useEffect, useState } from 'react';
import { getDocs, collection, query, where, getFirestore } from 'firebase/firestore'; 
import { FirebaseApp } from 'firebase/app'; // Import your Firebase app config
import dayjs from 'dayjs';

const SuspendedUsers = () => {
  const [suspendedUsers, setSuspendedUsers] = useState<any[]>([]);
  const db = getFirestore(); // Get Firestore instance

  useEffect(() => {
    // Function to fetch suspended users from the subcollection under forums
    const fetchSuspendedUsers = async () => {
      const forumRef = collection(db, 'forums'); // Reference to the 'forums' collection
      const forumSnapshot = await getDocs(forumRef); // Get all forum documents

      const users: any[] = [];
      for (const forumDoc of forumSnapshot.docs) {
        const suspendedRef = collection(forumDoc.ref, 'suspendedUsers'); // Subcollection under each forum
        const suspendedSnapshot = await getDocs(suspendedRef);

        suspendedSnapshot.forEach((doc) => {
          // Assuming suspended users have a 'name', 'status', and 'until' field
          users.push({
            id: doc.id,
            ...doc.data(),
          });
        });
      }

      setSuspendedUsers(users); // Update state with the suspended users
    };

    fetchSuspendedUsers();
  }, [db]);

  return (
    <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
      <div className="flex">
        <h1 className="text-lg font-bold mb-4">Suspended Users</h1>
      </div>

      <div className="max-w-full overflow-x-auto">
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-gray-2 text-left dark:bg-meta-4">
              <th className="px-4 text-black dark:text-white">Suspended Users</th>
              <th className="px-4 text-black dark:text-white">Status</th>
              <th className="px-4 text-black dark:text-white">Until</th>
            </tr>
          </thead>
          <tbody>
            {suspendedUsers.map((user) => (
              <tr key={user.id}>
                <td className="whitespace-nowrap px-4 py-3.5 dark:text-white">
                  {user.name}
                </td>
                <td className="whitespace-nowrap px-4 py-3.5 dark:text-white">
                  {user.status}
                </td>
                <td className="whitespace-nowrap px-4 py-3.5 dark:text-white">
                  {dayjs(user.until.seconds * 1000).format('YYYY-MM-DD HH:mm:ss')}
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
