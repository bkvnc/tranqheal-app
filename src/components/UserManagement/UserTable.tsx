import { useState, useEffect } from 'react';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { NavLink } from 'react-router-dom';
import dayjs from 'dayjs';
import Alert from '../../pages/UiElements/Alerts';

interface UserData {
  id: string;
  userType: string;
  organizationName?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
  profileImage?: string;
  createdAt?: Date;
  status: string; // Adding the status field
}

const UserTable = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(5);
  const [users, setUsers] = useState<UserData[]>([]);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchUsers = async () => {
    const usersCollectionRef = collection(db, 'users');
    const professionalsCollectionRef = collection(db, 'professionals');

    try {
      const [usersSnapshot, professionalsSnapshot] = await Promise.all([
        getDocs(usersCollectionRef),
        getDocs(professionalsCollectionRef),
      ]);

      const usersData = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(), 
        status: doc.data().status || 'pending', 
      })) as UserData[];

      const professionalsData = professionalsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        status: doc.data().status || 'pending',
      })) as UserData[];

      const mergedData = [...usersData, ...professionalsData].sort(
        (a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)
      );
      
      setUsers(mergedData);
    } catch (error) {
      console.error('Error fetching users or professionals:', error);
    }
  };

  // New delete function
  const handleDeleteUser = async (id: string) => {
    const userDocRef = doc(db, 'users', id); // Reference to the user's document
    const professionalDocRef = doc(db, 'professionals', id); // Reference to the professional's document

    try {
      await deleteDoc(userDocRef); // Delete user document
      await deleteDoc(professionalDocRef); // Delete professional document if exists
      setAlert({ type: 'success', message: 'User deleted successfully' });
      fetchUsers(); // Refresh the list after deletion
    } catch (error) {
      console.error('Error deleting document:', error);
      setAlert({ type: 'error', message: 'Error deleting user. Please try again.' });
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = users.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(users.length / usersPerPage);

  return (
    <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
        {alert && <Alert type={alert.type} message={alert.message} />}
      <div className="max-w-full overflow-x-auto">
        <div className="mb-3">
          <h4 className="text-xl font-semibold text-black dark:text-white">
            Users and Professionals
          </h4>
        </div>
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-gray-2 text-left dark:bg-meta-4">
              <th className="min-w-[220px] py-4 px-4 font-medium text-black dark:text-white xl:pl-11">
                Name
              </th>
              <th className="min-w-[150px] py-4 px-4 font-medium text-black dark:text-white">
                Date of Registration
              </th>
              <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">
                Status
              </th>
              <th className="py-4 px-4 font-medium text-black dark:text-white">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {currentUsers.map((user) => (
              <tr key={user.id}>
                <td className="border-b border-[#eee] py-5 px-4 pl-9 dark:border-strokedark xl:pl-11">
                  <h5 className="font-medium text-black dark:text-white">
                    {user.firstName ? `${user.firstName} ${user.lastName}` : user.organizationName}
                  </h5>
                  <p className="text-sm">{user.email}</p>
                </td>
                <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                  <p className="text-black dark:text-white">
                    {user.createdAt ? dayjs(user.createdAt).format('MMM D, YYYY') : 'N/A'}
                  </p>
                </td>
                <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                  <p className={`inline-flex rounded-full py-1 px-3 text-sm font-medium ${
                    user.status === 'active' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                  }`}>
                    {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                  </p>
                </td>
                <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                  <div className="flex items-center space-x-3.5">
                    <NavLink to={`/users/${user.id}`}  className="mr-2 text-sm dark:text-white">
                      View
                    </NavLink>
                    <button className="hover:text-primary ml-2" onClick={() => handleDeleteUser(user.id)}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* PAGINATION */}
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

export default UserTable;
