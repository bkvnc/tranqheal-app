import React, { useEffect, useState } from 'react';
import { db } from '../../config/firebase';
import { collection, getDocs } from 'firebase/firestore';

interface Forum {
  id: string;
  title: string;
  totalMembers: number;
  totalPosts: number;
  joinerPercentage: number; // Renamed field to represent joiner percentage
  dateCreated: { seconds: number }; // Firestore timestamp
}

const TopForumsTable = () => {
  const [forums, setForums] = useState<Forum[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [ForumsPerPage] = useState(5);

  // Calculate Joiner Percentage
  const calculateJoinerPercentage = (data: any): number => {
    const currentMembers = data.totalMembers || 0; // Total current members
    const targetMembers = 100; // Hypothetical maximum capacity (adjustable)

    // Calculate joiner percentage
    const joinerPercentage = (currentMembers / targetMembers) * 100;

    // Ensure percentage does not exceed 100%
    return Math.min(joinerPercentage, 100);
  };

  useEffect(() => {
    const fetchForums = async () => {
      try {
        const forumsSnapshot = await getDocs(collection(db, 'forums'));
        const fetchedForums: Forum[] = forumsSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title,
            totalMembers: data.totalMembers || 0,
            totalPosts: data.totalPosts || 0,
            dateCreated: data.dateCreated,
            joinerPercentage: calculateJoinerPercentage(data), // Calculate joiner percentage
          };
        });

        // Sort forums by total members and posts (descending order)
        fetchedForums.sort((a, b) => b.totalMembers - a.totalMembers || b.totalPosts - a.totalPosts);
        setForums(fetchedForums);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching forums:', error);
      }
    };

    fetchForums();
  }, []);

  // Pagination logic
  const indexOfLastForum = currentPage * ForumsPerPage;
  const indexOfFirstForum = indexOfLastForum - ForumsPerPage;
  const currentForums = forums.slice(indexOfFirstForum, indexOfLastForum);
  const totalPages = Math.ceil(forums.length / ForumsPerPage);

  // Loading spinner
  if (loading) return <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>;

  return (
    <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
      <h4 className="mb-6 text-xl font-semibold text-black dark:text-white">
        Top Forums
      </h4>

      <div className="flex flex-col">
        <div className="grid grid-cols-3 rounded-sm bg-gray-2 dark:bg-meta-4 sm:grid-cols-4">
          <div className="p-2.5 xl:p-5">
            <h5 className="text-sm font-medium uppercase xsm:text-base">Name</h5>
          </div>
          <div className="p-2.5 text-center xl:p-5">
            <h5 className="text-sm font-medium uppercase xsm:text-base">Members</h5>
          </div>
          <div className="hidden p-2.5 text-center sm:block xl:p-5">
            <h5 className="text-sm font-medium uppercase xsm:text-base">Posts</h5>
          </div>
          <div className="hidden p-2.5 text-center sm:block xl:p-5">
            <h5 className="text-sm font-medium uppercase xsm:text-base">Joiners (%)</h5>
          </div>
        </div>

        {currentForums.map((forum) => (
          <div key={forum.id} className="grid grid-cols-3 border-b border-stroke dark:border-strokedark sm:grid-cols-4">
            <div className="flex items-center gap-3 p-2.5 xl:p-5">
              <p className="hidden text-black dark:text-white sm:block">{forum.title}</p>
            </div>

            <div className="flex items-center justify-center p-2.5 xl:p-5">
              <p className="text-black dark:text-white">{forum.totalMembers}</p>
            </div>

            <div className="hidden items-center justify-center p-2.5 sm:flex xl:p-5">
              <p className="text-black dark:text-white">{forum.totalPosts}</p>
            </div>

            <div className="hidden items-center justify-center p-2.5 sm:flex xl:p-5">
              <p className="text-meta-5">{forum.joinerPercentage.toFixed(1)}%</p>
            </div>
          </div>
        ))}
      </div>

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

export default TopForumsTable;
