import { db } from "../../../config/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import dayjs from "dayjs";





const TotalPostWeekCard = () => {
  const [postCount, setPostCount] = useState<number>(0);

 const fetchWeeklyPostsCount = async () => {
    const startOfWeek = dayjs().startOf("week").toDate();
    const postsCollectionRef = collection(db, "posts");

    
    const weeklyQuery = query(postsCollectionRef, where("dateCreated", ">=", startOfWeek));
    const postsSnapshot = await getDocs(weeklyQuery);

    setPostCount(postsSnapshot.size); // Only count posts from this week
  };

  useEffect(() => {
    fetchWeeklyPostsCount();
  }, []);
    return (
      <div className="rounded-sm border border-stroke bg-white py-6 px-7.5 shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-meta-2 dark:bg-meta-4">
          <svg className="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 18">
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
  
          {/* UP PERCENT */}
          {/* <span className="flex items-center gap-1 text-sm font-medium text-meta-3">
            1.1%
            <svg
              className="fill-meta-3"
              width="10"
              height="11"
              viewBox="0 0 10 11"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4.35716 2.47737L0.908974 5.82987L5.0443e-07 4.94612L5 0.0848689L10 4.94612L9.09103 5.82987L5.64284 2.47737L5.64284 10.0849L4.35716 10.0849L4.35716 2.47737Z"
                fill=""
              />
            </svg>
          </span> */}
          {/* DOWN PERCENT */}
          {/* <span className="flex items-center gap-1 text-sm font-medium text-meta-5">
            0.95%
            <svg
              className="fill-meta-5"
              width="10"
              height="11"
              viewBox="0 0 10 11"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M5.64284 7.69237L9.09102 4.33987L10 5.22362L5 10.0849L-8.98488e-07 5.22362L0.908973 4.33987L4.35716 7.69237L4.35716 0.0848701L5.64284 0.0848704L5.64284 7.69237Z"
                fill=""
              />
            </svg>
          </span> */}
        </div>
      </div>
    );
  };
  
  export default TotalPostWeekCard;
  