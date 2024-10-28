import React, { useEffect, useState } from 'react';
import { db } from '../../config/firebase'; 
import { collection, getDocs } from 'firebase/firestore';

// Define the interface for forum data
interface Forum {
  id: string;
  title: string; // Ensure you're using 'title' consistently
  totalMembers: number;
  totalPosts: number;
  growthRate: number; // Use growthRate in calculations and rendering
}

const TopForumsTable = () => {
  const [forums, setForums] = useState<Forum[]>([]);

  useEffect(() => {
    const fetchForums = async () => {
      try {
        const forumsSnapshot = await getDocs(collection(db, 'forums'));
        const fetchedForums: Forum[] = forumsSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title, // Ensure your Firestore has this field
            totalMembers: data.totalMembers || 0, // Default to 0 if not defined
            totalPosts: data.totalPosts || 0, // Default to 0 if not defined
            growthRate: calculateGrowthRate(data), // A function to calculate growth rate if necessary
          };
        });

        // Sort forums by member count and post count
        fetchedForums.sort((a, b) => b.totalMembers - a.totalMembers || b.totalPosts - a.totalPosts);
        setForums(fetchedForums);
      } catch (error) {
        console.error('Error fetching forums:', error);
      }
    };

    fetchForums();
  }, []);

  const calculateGrowthRate = (data: any): number => {
    return data.previousCount && data.currentCount
      ? ((data.currentCount - data.previousCount) / data.previousCount) * 100
      : 0;
  };

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
            <h5 className="text-sm font-medium uppercase xsm:text-base">Growth</h5>
          </div>
        </div>

        {forums.map((forum) => (
          <div key={forum.id} className="grid grid-cols-3 border-b border-stroke dark:border-strokedark sm:grid-cols-4">
            <div className="flex items-center gap-3 p-2.5 xl:p-5">
              <p className="hidden text-black dark:text-white sm:block">{forum.title}</p> {/* Use 'title' instead of 'name' */}
            </div>

            <div className="flex items-center justify-center p-2.5 xl:p-5">
              <p className="text-black dark:text-white">{forum.totalMembers}</p>
            </div>

            <div className="hidden items-center justify-center p-2.5 sm:flex xl:p-5">
              <p className="text-black dark:text-white">{forum.totalPosts}</p>
            </div>

            <div className="hidden items-center justify-center p-2.5 sm:flex xl:p-5">
              <p className="text-meta-5">{forum.growthRate.toFixed(1)}%</p> {/* Use 'growthRate' */}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center mt-4">
        <button className="bg-blue-500 text-black py-2 px-4 rounded mr-2 dark:text-white">Previous</button>
        <button className="bg-blue-500 text-black py-2 px-4 rounded dark:text-white">Next</button>
      </div>
    </div>
  );
};

export default TopForumsTable;
