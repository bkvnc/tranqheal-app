import { Link } from "react-router-dom";
import {
  collection,
  getDocs,
  getDoc,
  query,
  orderBy,
  limit,
  startAfter,
  endBefore,
  QueryDocumentSnapshot,
  deleteDoc,
  doc,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../config/firebase";
import React, { useEffect, useState } from "react";
import Alert from "../../pages/UiElements/Alerts";
import dayjs from 'dayjs';

interface Organization {
  orgId: string;
  email: string;
  organizationName: string;
  createdAt: any | null;
  lastLogin: any | null; 
  status: string;
}

const RemoveOrganizationTable: React.FC = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot | null>(null);
  const [firstVisible, setFirstVisible] = useState<QueryDocumentSnapshot | null>(null);
  const [pageStack, setPageStack] = useState<QueryDocumentSnapshot[]>([]);
  const [isNextDisabled, setIsNextDisabled] = useState<boolean>(false);
  const [isPrevDisabled, setIsPrevDisabled] = useState<boolean>(true);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>(""); // For storing search term

  const ITEMS_PER_PAGE = 10;

  const fetchOrganizations = async (isNextPage: boolean) => {
    try {
      setLoading(true);
      let orgQuery;

      if (isNextPage) {
        orgQuery = lastVisible
          ? query(collection(db, "organizations"), orderBy("organizationName"), startAfter(lastVisible), limit(ITEMS_PER_PAGE))
          : query(collection(db, "organizations"), orderBy("organizationName"), limit(ITEMS_PER_PAGE));
      } else {
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

        const orgList = orgSnapshot.docs.map((doc) => {
          const data = doc.data() as Organization;

          return {
            ...data,
            orgId: doc.id,
            createdAt: (data.createdAt instanceof Timestamp) ? data.createdAt.toDate() : null,
            lastLogin: (data.lastLogin instanceof Timestamp) ? data.lastLogin.toDate() : null,
          };
        });

        setOrganizations(orgList);
        setLastVisible(lastDoc);
        
        if (isNextPage) {
          setPageStack((prev) => [...prev, firstVisible!]);
        } else {
          setPageStack((prev) => prev.slice(0, -1));
        }

        setFirstVisible(firstDoc);
        setIsPrevDisabled(pageStack.length === 0);
        setIsNextDisabled(orgSnapshot.docs.length < ITEMS_PER_PAGE);
      } else {
        setIsNextDisabled(true);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching organizations: ", error);
      setAlert({ type: "error", message: "Error fetching organizations. Please try again later." });
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations(true);
  }, []);

  const handleNextPage = () => {
    fetchOrganizations(true);
  };

  const handlePreviousPage = () => {
    if (!isPrevDisabled) {
      fetchOrganizations(false);
    }
  };

  const handleDeleteOrganization = async (orgId: string) => {
    try {
      const orgRef = doc(db, "organizations", orgId);
      const orgSnapshot = await getDoc(orgRef); 
      
      if (!orgSnapshot.exists()) {
        setAlert({ type: "error", message: "Organization not found." });
        return;
      }
      
      await deleteDoc(orgRef); 
      setOrganizations((prev) => prev.filter((org) => org.orgId !== orgId));
      setAlert({ type: "success", message: "Organization deleted successfully" });
    } catch (error) {
      console.error("Error deleting organization: ", error);
      setAlert({ type: "error", message: "Error deleting organization. Please try again." });
    }
    setTimeout(() => {
      setAlert(null);
    }, 1000);
  };

  // Filter organizations based on search term
  const filteredOrganizations = organizations.filter(org =>
    org.organizationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div>Loading...</div>;

  return (
    <>
      {alert && <Alert type={alert.type} message={alert.message} />}
      <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
        <div className="max-w-full overflow-x-auto">
          <div className="flex items-center">
            <input
              type="text"
              placeholder="Search responder by name or email"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-3 w-100 rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
            />
            <Link
              to="#"
              className="h-12 w-40 mb-3 ml-4 inline-flex items-center justify-center rounded-md bg-[#9F4FDD] py-4 px-10 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10"
            >
              Search
            </Link>
          </div>
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-2 text-left dark:bg-meta-4">
                <th className="min-w-[220px] py-4 px-4 font-medium text-black dark:text-white xl:pl-11 cursor-pointer">
                  Organization Name
                </th>
                <th className="min-w-[150px] py-4 px-4 font-medium text-black dark:text-white cursor-pointer">
                  Join Date
                </th>
                <th className="min-w-[150px] py-4 px-4 font-medium text-black dark:text-white cursor-pointer">
                  Last Logged In
                </th>
                <th className="min-w-[150px] py-4 px-4 font-medium text-black dark:text-white cursor-pointer">
                  Status
                </th>
                <th className="py-4 px-4 font-medium text-black dark:text-white">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrganizations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center">No organizations found</td>
                </tr>
              ) : (
                filteredOrganizations.map((org) => (
                  <tr
                    key={org.orgId}
                    className="border-t border-stroke py-4.5 px-4 dark:border-strokedark"
                  >
                    <td className="border-b border-[#eee] py-5 px-4 pl-9 dark:border-strokedark xl:pl-11">
                      <h5 className="font-medium text-black dark:text-white">{org.organizationName}</h5>
                      <p className="text-sm">{org.email}</p>
                    </td>
                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                      <p className="text-black dark:text-white">
                        {org.createdAt ? dayjs(org.createdAt).format("DD/MM/YYYY HH:mm") : "N/A"}
                      </p>
                    </td>
                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                      <p className="text-black dark:text-white">
                        {org.lastLogin ? dayjs(org.lastLogin).format("DD/MM/YYYY HH:mm") : "N/A"}
                      </p>
                    </td>
                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                      <p className="text-sm text-black dark:text-white">{org.status}</p>
                    </td>
                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                      <button className="hover:text-primary">
                        {/* Action Icons */}
                      </button>
                      <button className="hover:text-primary ml-2" onClick={() => handleDeleteOrganization(org.orgId)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div className="flex justify-center mt-4">
            <button
              onClick={handlePreviousPage}
              disabled={isPrevDisabled}
              className={`bg-blue-500 text-black py-2 px-4 rounded mr-2 dark:text-white ${isPrevDisabled ? 'bg-gray-200' : 'bg-gray-400 hover:bg-gray-500 text-white'}`}
            >
              Previous
            </button>
            <button
              onClick={handleNextPage}
              disabled={isNextDisabled}
              className={`bg-blue-500 text-black py-2 px-4 rounded dark:text-white ${isNextDisabled ? 'bg-gray-200' : 'bg-gray-400 hover:bg-gray-500 text-white'}`}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default RemoveOrganizationTable;
