import { useState, useEffect } from 'react';
import { collection, getDocs, getDoc, doc } from 'firebase/firestore';
import { db, auth } from '../../config/firebase';
import dayjs from 'dayjs';
import { UserData } from '../../hooks/types';
import BanUserButton from '../../Buttons/BanUserButton';
import SuspendUserButton from '../../Buttons/SuspendButton';

import { CSSTransition } from 'react-transition-group'; 

interface ReportDetailsModalProps {
  report: Report | null;
  onClose: () => void;
}

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
  reportCount: number;
}

const ReportDetailsModal: React.FC<ReportDetailsModalProps> = ({ report, onClose }) => (
  <CSSTransition
    in={!!report}
    timeout={300}
    classNames="modal"
    unmountOnExit
  >
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 "
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-boxdark rounded-lg shadow-lg p-6 w-full max-w-md relative animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-center border-b dark:border-strokedark pb-4 mb-4 ">Report Details</h2>
        {report ? (
          <div className="space-y-4">
            <p><strong>Author of the {report.contentType}:</strong> {report.authorName}</p>
            <p><strong>Reason:</strong> {report.reason}</p>
            <p><strong>Reported By:</strong> {report.reportedBy}</p>
            <p><strong>Timestamp:</strong> {report.timestamp.toLocaleString()}</p>
          </div>
        ) : (
          <p className="text-center">Report not found</p>
        )}
        <button
          onClick={onClose}
          className="mt-6 w-full py-2 bg-blue-500 bg-[#9F4FDD] hover:shadow-lg hover:shadow-[#9F4FDD]/50 shadow text-white  rounded-lg font-semibold transition duration-150"
        >
          Close
        </button>
      </div>
    </div>
  </CSSTransition>
);



const UserTable = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [reportsPerPage] = useState(5);
  const [reports, setReports] = useState<Report[]>([]);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userType, setUserType] = useState<string | null>(null); // State for userType
  const user = auth.currentUser;
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  


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
        <button onClick={() => setSelectedReport(report)}>View Details</button>

      {/* Conditionally render ReportDetailsModal */}
      {selectedReport && (
        <ReportDetailsModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
        />
      )}

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
        const forumData = forumDoc.data();
        const forumReportCount = forumData.reportCount || 0;
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
          reportCount: forumReportCount,

        }));
        allReports = [...allReports, ...forumReports];

        // 2. Fetch post-level reports
        const postsSnapshot = await getDocs(collection(db, `forums/${forumId}/posts`));
        for (const postDoc of postsSnapshot.docs) {
          const postId = postDoc.id;
          const postData = postDoc.data();
           const postReportCount = postData.reportCount || 0;

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
            reportCount: postReportCount
          }));
          allReports = [...allReports, ...postReports];

          // 3. Fetch comment-level reports
          const commentsSnapshot = await getDocs(
            collection(db, `forums/${forumId}/posts/${postId}/comments`)
          );
          for (const commentDoc of commentsSnapshot.docs) {
            const commentId = commentDoc.id;
            const commentData = commentDoc.data();
            const commentReportCount = commentData.reportCount || 0;
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
              reportCount: commentReportCount
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
      <h1 className="text-lg font-bold mb-4">Reported Users</h1>
      <div className="max-w-full overflow-x-auto">
      
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-gray-2 text-left dark:bg-meta-4">
              <th className="px-4 text-black dark:text-white">Author Name</th>
              <th className="px-4 text-black dark:text-white">Reported At</th>
              <th className="px-4 text-black dark:text-white">Content Type</th>
              <th className="px-4 text-black dark:text-white">Report Count</th>
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
                <td className="whitespace-nowrap px-4 py-3.5 dark:text-white">
                  {report.reportCount}
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
