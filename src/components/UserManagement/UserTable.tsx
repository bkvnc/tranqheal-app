import { useState, useEffect } from 'react';
import { collection, getDoc, doc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../../config/firebase';
import dayjs from 'dayjs';
import { UserData, Report } from '../../hooks/types';
import BanUserButton from '../../Buttons/BanUserButton';
import SuspendUserButton from '../../Buttons/SuspendButton';
import { CSSTransition } from 'react-transition-group';

interface ReportDetailsModalProps {
  report: Report | null;
  onClose: () => void;
}

const ReportDetailsModal: React.FC<ReportDetailsModalProps> = ({ report, onClose }) => (
  <CSSTransition in={!!report} timeout={300} classNames="modal" unmountOnExit>
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
      <div
        className="bg-white dark:bg-boxdark rounded-lg shadow-lg p-6 w-full max-w-md relative animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-center border-b dark:border-strokedark pb-4 mb-4">Report Details</h2>
        {report ? (
          <div className="space-y-4">
            <p><strong>Author of the {report.contentType}:</strong> {report.authorName}</p>
            <p><strong>Reason:</strong> {report.reason}</p>
            <p><strong>Type:</strong> {report.contentType}</p>
            <p><strong>Report Count:</strong> {report.reportCount}</p>
            <p><strong> {report.contentType} ID: {report.forumId || report.postId || report.commentId}</strong></p>
            <p><strong>Reported By:</strong> {report.reportedBy}</p>
            <p><strong>Timestamp:</strong> {report.timestamp.toLocaleString()}</p>
          </div>
        ) : (
          <p className="text-center">Report not found</p>
        )}
        <button
          onClick={onClose}
          className="mt-6 w-full py-2 bg-blue-500 bg-[#9F4FDD] hover:shadow-lg hover:shadow-[#9F4FDD]/50 shadow text-white rounded-lg font-semibold transition duration-150"
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
  const [error, setError] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const user = auth.currentUser;

  useEffect(() => {
    const fetchUserDataAndReports = async () => {
      if (!user?.uid) {
        setError('User not authenticated');
        return;
      }

      try {
        const [userDoc, profDoc, orgDoc, adminDoc] = await Promise.all([
          getDoc(doc(db, 'users', user.uid)),
          getDoc(doc(db, 'professionals', user.uid)),
          getDoc(doc(db, 'organizations', user.uid)),
          getDoc(doc(db, 'admins', user.uid)),
        ]);

        let userData = null;

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

        setUserData(userData);
        subscribeToReports();
      } catch (error) {
        setError('An error occurred while fetching user data');
      }
    };

    const subscribeToReports = () => {
      const forumsCollection = collection(db, 'forums');
      let unsubscribers: (() => void)[] = [];
    
      const mainUnsubscriber = onSnapshot(forumsCollection, (forumsSnapshot) => {
        // Clear existing reports when getting new snapshot
        setReports([]);
        
        forumsSnapshot.docs.forEach((forumDoc) => {
          const forumId = forumDoc.id;
          const forumData = forumDoc.data();
          const forumReportCount = forumData.reportCount || 0;
    
          // Forum reports
          unsubscribers.push(
            onSnapshot(collection(db, `forums/${forumId}/reports`), (forumReportsSnapshot) => {
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
              
              setReports(prev => {
                const newReports = [...prev];
                forumReports.forEach(report => {
                  const existingIndex = newReports.findIndex(r => 
                    r.id === report.id && r.forumId === report.forumId
                  );
                  if (existingIndex === -1) {
                    newReports.push(report);
                  }
                });
                return newReports;
              });
            })
          );
    
          // Posts and their reports
          unsubscribers.push(
            onSnapshot(collection(db, `forums/${forumId}/posts`), (postsSnapshot) => {
              postsSnapshot.docs.forEach((postDoc) => {
                const postId = postDoc.id;
                const postData = postDoc.data();
                const postReportCount = postData.reportCount || 0;
    
                unsubscribers.push(
                  onSnapshot(collection(db, `forums/${forumId}/posts/${postId}/reports`), (postReportsSnapshot) => {
                    const postReports: Report[] = postReportsSnapshot.docs.map((doc) => ({
                      id: doc.id,
                      authorName: doc.data().authorName || '',
                      contentType: 'Post' as const,
                      forumId,
                      postId,
                      reason: doc.data().reason || '',
                      reportedBy: doc.data().reportedBy || '',
                      timestamp: doc.data().timestamp?.toDate() || new Date(),
                      reportCount: postReportCount,
                    }));
                    
                    setReports(prev => {
                      const newReports = [...prev];
                      postReports.forEach(report => {
                        const existingIndex = newReports.findIndex(r => 
                          r.id === report.id && r.forumId === report.forumId && r.postId === report.postId
                        );
                        if (existingIndex === -1) {
                          newReports.push(report);
                        }
                      });
                      return newReports;
                    });
                  })
                );
    
                // Comments and their reports
                unsubscribers.push(
                  onSnapshot(collection(db, `forums/${forumId}/posts/${postId}/comments`), (commentsSnapshot) => {
                    commentsSnapshot.docs.forEach((commentDoc) => {
                      const commentId = commentDoc.id;
                      const commentData = commentDoc.data();
                      const commentReportCount = commentData.reportCount || 0;
    
                      unsubscribers.push(
                        onSnapshot(collection(db, `forums/${forumId}/posts/${postId}/comments/${commentId}/reports`), (commentReportsSnapshot) => {
                          const commentReports: Report[] = commentReportsSnapshot.docs.map((doc) => ({
                            id: doc.id,
                            authorName: doc.data().authorName || '',
                            contentType: 'Comment' as const,
                            forumId,
                            postId,
                            commentId,
                            reason: doc.data().reason || '',
                            reportedBy: doc.data().reportedBy || '',
                            timestamp: doc.data().timestamp?.toDate() || new Date(),
                            reportCount: commentReportCount,
                          }));
                          
                          setReports(prev => {
                            const newReports = [...prev];
                            commentReports.forEach(report => {
                              const existingIndex = newReports.findIndex(r => 
                                r.id === report.id && 
                                r.forumId === report.forumId && 
                                r.postId === report.postId && 
                                r.commentId === report.commentId
                              );
                              if (existingIndex === -1) {
                                newReports.push(report);
                              }
                            });
                            return newReports;
                          });
                        })
                      );
                    });
                  })
                );
              });
            })
          );
        });
      });
      
      unsubscribers.push(mainUnsubscriber);
      
      // Cleanup function to unsubscribe from all listeners
      return () => {
        unsubscribers.forEach(unsubscribe => unsubscribe());
      };
    };
    
    fetchUserDataAndReports();
  }, [user?.uid]);

  const handleBanUser = async (reportId: string) => {
    setReports((prevReports) => prevReports.filter((report) => report.id !== reportId));
  };

  const handleRemoveForum = async (forumId: string) => {
    await deleteDoc(doc(db, 'forums', forumId));
    setReports((prevReports) => prevReports.filter((report) => report.forumId !== forumId));
  };

  const renderActions = (report: Report) => (
    <div className="flex items-center space-x-3.5">
      <button onClick={() => setSelectedReport(report)}>View Details</button>
      {selectedReport && <ReportDetailsModal report={selectedReport} onClose={() => setSelectedReport(null)} />}
      {userData?.userType === 'admin' && (
        report.contentType === 'Forum' ? (
          <button onClick={() => handleRemoveForum(report.forumId)} className="text-danger hover:bg-danger hover:text-white px-3 py-1 rounded-md">
            Remove Forum
          </button>
        ) : (
          <>
            <SuspendUserButton
             forumId={report.forumId}
             postId={report.postId || ''}
             commentId={report.commentId || ''}
             reportId={report.id}
             adminId={user?.uid || ''}
             onSuspend={() => handleBanUser(report.id)}/>
            <BanUserButton 
              forumId={report.forumId}
              postId={report.postId || ''}
              commentId={report.commentId || ''}
              reportId={report.id}
              adminId={user?.uid || ''}
              onBan={() => handleBanUser(report.id)}
            />
          </>
        )
      )}
    </div>
  );

  const indexOfLastReport = currentPage * reportsPerPage;
  const indexOfFirstReport = indexOfLastReport - reportsPerPage;
  const currentReports = reports.slice(indexOfFirstReport, indexOfLastReport);
  const totalPages = Math.ceil(reports.length / reportsPerPage);

  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="rounded-sm border border-stroke bg-white px-5 pt-7.5 pb-5 shadow-default dark:border-strokedark dark:bg-boxdark">
      <h1 className="text-2xl font-semibold mb-5">Reports</h1>
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-2 text-left dark:bg-meta-4">
            <th>Author</th>
            <th>Reported By</th>
            <th>Reason</th>
            <th>Type</th>
            <th>Timestamp</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {currentReports.map((report) => {
           
            const uniqueKey = `${report.contentType}-${report.id}-${report.forumId}${report.postId ? `-${report.postId}` : ''}${report.commentId ? `-${report.commentId}` : ''}`;
            
            return (
              <tr key={uniqueKey} >
                <td>{report.authorName}</td>
                <td>{report.reportedBy}</td>
                <td>{report.reason}</td>
                <td>{report.contentType}</td>
                <td>{dayjs(report.timestamp).format('MM-DD-YYYY ')}</td>
                <td>{renderActions(report)}</td>
              </tr>
            );
          })}
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
  );
};

export default UserTable;