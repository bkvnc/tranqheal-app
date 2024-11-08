import { useState, useEffect } from 'react';
import { collection, getDocs, getDoc, doc } from 'firebase/firestore';
import { db, auth } from '../../config/firebase';
import { NavLink } from 'react-router-dom';
import dayjs from 'dayjs';
import { UserData } from '../../hooks/types';

import BanUserButton from '../../Buttons/BanUserButton';
import SuspendUserButton from '../../Buttons/SuspendButton';

interface Report {
  id: string;
  authorName: string;
  contentType: 'Forum' | 'Post' | 'Comment';
  forumId: string;
  postId?: string;
  commentId?: string;
  reason: string; 
  reportedBy: string; 
  timestamp: Date;
}

const UserTable = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [reportsPerPage] = useState(5);
  const [reports, setReports] = useState<Report[]>([]);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userType, setUserType] = useState<string | null>(null); // State for userType
  const user = auth.currentUser;

  if (user) {
    console.log('User authenticated successfully');
  }

  useEffect(() => {
    const checkPermissionsAndFetch = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (!user?.uid) {
          setError('User not authenticated');
          return;
        }

        // Fetch user data from the respective collections
        const userDocPromise = getDoc(doc(db, 'users', user.uid));
        const profDocPromise = getDoc(doc(db, 'professionals', user.uid));
        const orgDocPromise = getDoc(doc(db, 'organizations', user.uid));
        const adminDocPromise = getDoc(doc(db, 'admins', user.uid));

        try {
          // Wait for all promises to resolve
          const [userDoc, profDoc, orgDoc, adminDoc] = await Promise.all([
            userDocPromise,
            profDocPromise,
            orgDocPromise,
            adminDocPromise,
          ]);

          let userData = null;

          // Check which document exists and assign user data accordingly
          if (userDoc.exists()) {
            userData = { ...userDoc.data(), userType: 'user' };
          } else if (profDoc.exists()) {
            userData = { ...profDoc.data(), userType: 'professional' };
          } else if (orgDoc.exists()) {
            userData = { ...orgDoc.data(), userType: 'organization' };
          } else if (adminDoc.exists()) {
            userData = { ...adminDoc.data(), userType: 'admin' };
          }

          if (!userData) {
            setError('User data not found');
            return;
          }

          setUserData(userData); // Store user data
          setUserType(userData.userType); // Set the userType
          console.log(userData.userType)

        } catch (error) {
          setError('An error occurred while fetching user data');
          console.error(error);
        }

        // Only allow admin and organization to view reports
        if (userType !== 'admin') {
          setError('Insufficient permissions - Admin or Organization access required');
          return;
        }

        // Fetch reports if user has appropriate permissions
        const allReports = await fetchAllReports();
        setReports(allReports);
        console.log(allReports);

      } catch (error) {
        setError(error instanceof Error ? error.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    checkPermissionsAndFetch();
  }, [user?.uid, userType]); // Added userType as a dependency

  const renderActions = (report: Report) => {
    return (
      <div className="flex items-center space-x-3.5">
        <NavLink to={`/reports/${report.id}`} className="mr-2 text-sm dark:text-white">
          View Details
        </NavLink>

        {/* Only show suspend button to admin and organization */}
        {userData?.userType === 'admin'&& (
          <SuspendUserButton userId={report.id} forumId={report.forumId} />
        )}

        {/* Only show ban button to admins */}
        {userData?.userType === 'admin' && (
          <BanUserButton
            forumId={report.forumId}
            reportId={report.id}
            adminId={user?.uid || ''}
          />
        )}
      </div>
    );
  };

  const fetchAllReports = async () => {
    try {
      const forumsSnapshot = await getDocs(collection(db, 'forums'));
      let allReports: Report[] = [];

      // 1. Fetch forum-level reports
      for (const forumDoc of forumsSnapshot.docs) {
        const forumId = forumDoc.id;
        
        // Get forum reports
        const forumReportsSnapshot = await getDocs(collection(db, `forums/${forumId}/reports`));
        const forumReports: Report[] = forumReportsSnapshot.docs.map((doc) => ({
          id: doc.id,
          authorName: doc.data().authorName || '',
          contentType: 'Forum' as const,
          forumId,
          reason: doc.data().reason || '',
          reportedBy: doc.data().reportedBy || '',
          timestamp: doc.data().timestamp?.toDate() || new Date(),
        }));
        allReports = [...allReports, ...forumReports];

        // 2. Fetch post-level reports
        const postsSnapshot = await getDocs(collection(db, `forums/${forumId}/posts`));
        for (const postDoc of postsSnapshot.docs) {
          const postId = postDoc.id;

          const postReportsSnapshot = await getDocs(
            collection(db, `forums/${forumId}/posts/${postId}/reports`)
          );
          const postReports: Report[] = postReportsSnapshot.docs.map((doc) => ({
            id: doc.id,
            authorName: doc.data().authorName || '',
            contentType: 'Post' as const,
            forumId,
            postId,
            reason: doc.data().reason || '',
            reportedBy: doc.data().reportedBy || '',
            timestamp: doc.data().timestamp?.toDate() || new Date(),
          }));
          allReports = [...allReports, ...postReports];

          // 3. Fetch comment-level reports
          const commentsSnapshot = await getDocs(
            collection(db, `forums/${forumId}/posts/${postId}/comments`)
          );
          for (const commentDoc of commentsSnapshot.docs) {
            const commentId = commentDoc.id;
            const commentReportsSnapshot = await getDocs(
              collection(db, `forums/${forumId}/posts/${postId}/comments/${commentId}/reports`)
            );
            const commentReports: Report[] = commentReportsSnapshot.docs.map((doc) => ({
              id: doc.id,
              authorName: doc.data().authorName,
              authorId: doc.data().authorId ,
              contentType: 'Comment' as const,
              forumId,
              postId,
              commentId,
              reason: doc.data().reason || '',
              reportedBy: doc.data().reportedBy || '',
              timestamp: doc.data().timestamp?.toDate() || new Date(),
            }));
            allReports = [...allReports, ...commentReports];
          }
        }
      }
      return allReports;
    } catch (error) {
      console.error('Error fetching reports:', error);
      throw error;
    }
  };
  

  const indexOfLastReport = currentPage * reportsPerPage;
  const indexOfFirstReport = indexOfLastReport - reportsPerPage;
  const currentReports = reports.slice(indexOfFirstReport, indexOfLastReport);
  const totalPages = Math.ceil(reports.length / reportsPerPage);

  

  if (error) {
    return (
      <div className="rounded-sm border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }
  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
      <div className="max-w-full overflow-x-auto">
        
        <table className="w-full table-auto">
          <thead>
            <tr className="h-14 border-b dark:border-strokedark">
              <th className="px-4 text-black dark:text-white">Author Name</th>
              <th className="px-4 text-black dark:text-white">Reported At</th>
              <th className="px-4 text-black dark:text-white">Content Type</th>
              <th className="px-4 text-black dark:text-white">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentReports.map((report) => (
              <tr key={report.id}>
                <td className="whitespace-nowrap px-4 py-3.5 dark:text-white">
                  {report.authorName}
                </td>
                <td className="whitespace-nowrap px-4 py-3.5 dark:text-white">
                  {dayjs(report.timestamp).format('YYYY-MM-DD HH:mm:ss')}
                </td>
                <td className="whitespace-nowrap px-4 py-3.5 dark:text-white">
                  {report.contentType}
                </td>
                <td className="whitespace-nowrap px-4 py-3.5">{renderActions(report)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
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
  );
};

export default UserTable;
