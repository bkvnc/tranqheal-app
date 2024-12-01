import { db } from "../../../config/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import dayjs from "dayjs";

const TotalPostWeekCard = () => {
  const [postCount, setPostCount] = useState<number>(0);

  const fetchWeeklyPostsCount = async () => {
    const startOfWeek = dayjs().startOf("week").toDate();
    
    const forumsCollectionRef = collection(db, "forums"); 
    const forumsSnapshot = await getDocs(forumsCollectionRef);

    let totalPosts = 0;

    
    for (const forumDoc of forumsSnapshot.docs) {
      const postsCollectionRef = collection(forumDoc.ref, "posts");

      const weeklyQuery = query(postsCollectionRef, where("dateCreated", ">=", startOfWeek));
      const postsSnapshot = await getDocs(weeklyQuery);

      totalPosts += postsSnapshot.size; 
    }

    setPostCount(totalPosts); 
  };

  useEffect(() => {
    fetchWeeklyPostsCount();
  }, []);

  return (
    <div className="rounded-sm border border-stroke bg-white py-6 px-7.5 shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-meta-2 dark:bg-meta-4">
        <svg
          className="w-6 h-6 text-gray-800 dark:text-white"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
          viewBox="0 0 20 18"
        >
          <path d="M14 2a3.963 3.963 0 0 0-1.4.267 6.439 6.439 0 0 1-1.331 6.638A4 4 0 1 0 14 2Zm1 9h-1.264A6.957 6.957 0 0 1 15 15v2a2.97 2.97 0 0 1-.184 1H19a1 1 0 0 0 1-1v-1a5.006 5.006 0 0 0-5-5ZM6.5 9a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9ZM8 10H5a5.006 5.006 0 0 0-5 5v2a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-2a5.006 5.006 0 0 0-5-5Z" />
        </svg>
      </div>

      <div className="mt-4 flex items-end justify-between">
        <div>
          <h4 className="text-title-md font-bold text-black dark:text-white">
            {postCount}
          </h4>
          <span className="text-sm font-medium">Total Posts This Week</span>
        </div>
      </div>
    </div>
  );
};

export default TotalPostWeekCard;
