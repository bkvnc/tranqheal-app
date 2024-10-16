import React, { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy, limit, startAfter, startAt } from "firebase/firestore";
import { db } from "../../config/firebase"; // Ensure you have Firebase initialized properly

interface Organization {
  orgId: string;
  organizationName: string;
  servicesOffered: string;
  address: string;
  email: string;
  subscriptionPlan: string;
  timeAvailability: string[];
  timeEnd: string;
  timeStart: string;

}

const AllOrganizationTable: React.FC = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastVisible, setLastVisible] = useState<any>(null); // Tracks the last document of the current set
  const [firstVisible, setFirstVisible] = useState<any>(null); // Tracks the first document for previous navigation
  const [isNextDisabled, setIsNextDisabled] = useState(false); // Disable next button when no more docs
  const [isPrevDisabled, setIsPrevDisabled] = useState(true);  // Disable previous button when no earlier docs


  
  const ITEMS_PER_PAGE = 10;
  

  // Fetch the first set of organizations
  const fetchOrganizations = async (isNextPage = true) => {
    try {
      setLoading(true);
      let orgQuery;

      // If going to the next page, start after the last visible doc, otherwise start at the first doc
      if (isNextPage) {
        orgQuery = lastVisible
          ? query(collection(db, "organizations"), orderBy("organizationName"), startAfter(lastVisible), limit(ITEMS_PER_PAGE))
          : query(collection(db, "organizations"), orderBy("organizationName"), limit(ITEMS_PER_PAGE));
      } else {
        orgQuery = query(collection(db, "organizations"), orderBy("organizationName"), startAt(firstVisible), limit(ITEMS_PER_PAGE));
      }

      const orgSnapshot = await getDocs(orgQuery);

      if (!orgSnapshot.empty) {
        const firstDoc = orgSnapshot.docs[0];
        const lastDoc = orgSnapshot.docs[orgSnapshot.docs.length - 1];

        const orgList = orgSnapshot.docs.map((doc) => ({
          ...(doc.data() as Organization),
          id: doc.id,
        }));

        setOrganizations(orgList);
        setLastVisible(lastDoc); // Update the last visible document for pagination
        setFirstVisible(firstDoc); // Update the first visible document for reverse pagination
        setIsPrevDisabled(!firstVisible); // Enable/Disable previous button based on first doc
        setIsNextDisabled(orgSnapshot.docs.length < ITEMS_PER_PAGE); // Disable next if fewer than 10 docs
      } else {
        setIsNextDisabled(true);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching organizations: ", error);
      setLoading(false);
    }
  };

  // Fetch the first page on component mount
  useEffect(() => {
    fetchOrganizations(true);
  }, []);

  // Fetch the next set of organizations
  const handleNextPage = () => {
    fetchOrganizations(true);
  };

  // Fetch the previous set of organizations
  const handlePreviousPage = () => {
    fetchOrganizations(false);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="py-6 px-4 md:px-6 xl:px-7.5">
        <h4 className="text-xl font-semibold text-black dark:text-white">All Mental Health Organizations</h4>
      </div>

      {/* Organization Table Header */}
      <div className="grid grid-cols-6 border-t border-stroke py-4.5 px-4 dark:border-strokedark sm:grid-cols-10 md:px-6 2xl:px-7.5">
        <div className="col-span-2 flex items-center">
          <p className="font-medium">Name</p>
        </div>
        <div className="col-span-2 hidden items-center sm:flex">
          <p className="font-medium">Services</p>
        </div>
        <div className="col-span-2 hidden items-center sm:flex">
          <p className="font-medium">Address</p>
        </div>
        <div className="col-span-2 flex items-center">
          <p className="font-medium">Email</p>
        </div>
        <div className="col-span-2 flex items-center">
          <p className="font-medium">Subscription Plan</p>
        </div>
      </div>

      {/* Organization Data Rows */}
      {organizations.map((org) => (
        <div key={org.orgId} className="grid grid-cols-6 border-t border-stroke py-4.5 px-4 dark:border-strokedark sm:grid-cols-10 md:px-6 2xl:px-7.5">
          <div className="col-span-2 flex items-center">
            <p className="text-sm text-black dark:text-white">{org.organizationName}</p>
          </div>
          <div className="col-span-2 hidden items-center sm:flex">
          <p className="text-sm text-black dark:text-white">
                {Array.isArray(org.servicesOffered) ? org.servicesOffered.join(", ") : org.servicesOffered}
          </p>
          </div>
          <div className="col-span-2 flex items-center">
            <p className="text-sm text-black dark:text-white">{org.address}</p>
          </div>
          <div className="col-span-2 flex items-center">
            <p className="text-sm text-black dark:text-white">{org.email}</p>
          </div>
          <div className="col-span-2 flex items-center">
            <p className="text-sm text-black dark:text-white">{org.subscriptionPlan}</p>
          </div>
        </div>
      ))}

      {/* Pagination Controls */}
      <div className="flex justify-between p-4">
        <button
          onClick={handlePreviousPage}
          disabled={isPrevDisabled}
          className={`py-2 px-4 rounded bg-primary text-white ${isPrevDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          Previous
        </button>
        <button
          onClick={handleNextPage}
          disabled={isNextDisabled}
          className={`py-2 px-4 rounded bg-primary text-white ${isNextDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default AllOrganizationTable;