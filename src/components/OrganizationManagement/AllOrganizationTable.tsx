import React, { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy, limit, startAfter, endBefore, QueryDocumentSnapshot } from "firebase/firestore";
import { db } from "../../config/firebase";

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
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot | null>(null); // Tracks the last document of the current set
  const [firstVisible, setFirstVisible] = useState<QueryDocumentSnapshot | null>(null); // Tracks the first document for previous navigation
  const [pageStack, setPageStack] = useState<QueryDocumentSnapshot[]>([]); // Stores pages to help navigate backwards
  const [isNextDisabled, setIsNextDisabled] = useState(false); // Disable next button when no more docs
  const [isPrevDisabled, setIsPrevDisabled] = useState(true);  // Disable previous button when no earlier docs

  const ITEMS_PER_PAGE = 10;

  // Fetch the organizations based on page direction
  const fetchOrganizations = async (isNextPage: boolean) => {
    try {
      setLoading(true);
      let orgQuery;

      if (isNextPage) {
        // Fetch next page: Use startAfter for forward pagination
        orgQuery = lastVisible
          ? query(collection(db, "organizations"), orderBy("organizationName"), startAfter(lastVisible), limit(ITEMS_PER_PAGE))
          : query(collection(db, "organizations"), orderBy("organizationName"), limit(ITEMS_PER_PAGE));
      } else {
        // Fetch previous page: Use endBefore for backward pagination
        if (firstVisible) {
          orgQuery = query(collection(db, "organizations"), orderBy("organizationName"), endBefore(firstVisible), limit(ITEMS_PER_PAGE));
        } else {
          setLoading(false);
          return;
        }
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
        setLastVisible(lastDoc); // Update last document for next page

        // For backward pagination, push to pageStack
        if (isNextPage) {
          setPageStack((prev) => [...prev, firstVisible!]);
        } else {
          setPageStack((prev) => prev.slice(0, -1));
        }

        setFirstVisible(firstDoc); // Update first document for previous page

        // Update button states
        setIsPrevDisabled(pageStack.length === 0); // Disable previous if no pages in stack
        setIsNextDisabled(orgSnapshot.docs.length < ITEMS_PER_PAGE); // Disable next if fewer than ITEMS_PER_PAGE docs
      } else {
        setIsNextDisabled(true); // No more documents
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
    if (!isPrevDisabled) {
      fetchOrganizations(false);
    }
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
      
      {organizations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center">No organizations found</td>
                </tr>
              ) : (
                        organizations.map((org) => (
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
      ))
    )}

      {/* Pagination Controls */}
      <div className="flex justify-center mt-4">
       
        <button 
            onClick={handlePreviousPage}
            disabled={isPrevDisabled}
            className={`bg-blue-500 text-black py-2 px-4 rounded mr-2 dark:text-white${isPrevDisabled ? "opacity-50 cursor-not-allowed" : ""}`}>Previous</button>
        <button 
            onClick={handleNextPage}
            disabled={isNextDisabled}
            className={`bg-blue-500 text-black py-2 px-4 rounded dark:text-white${isNextDisabled ? "opacity-50 cursor-not-allowed" : ""}`}>Next</button>
        
      </div>
    </div>
  );
};

export default AllOrganizationTable;
