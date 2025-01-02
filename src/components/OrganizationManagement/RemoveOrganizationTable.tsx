import { Link } from "react-router-dom";
import {
  collection,
  getDocs,
  getDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "../../config/firebase";
import { useEffect, useState } from "react";
import { toast } from "react-toastify"; // Import toast
import dayjs from 'dayjs';

interface Organization {
  orgId: string;
  email: string;
  organizationName: string;
  createdAt: any | null;
  lastLogin: any | null;
  status: string;
}

const RemoveOrganizationTable = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [orgsPerPage] = useState(5);

  const [searchTerm, setSearchTerm] = useState<string>(""); // For storing search term

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const orgSnapshot = await getDocs(collection(db, "organizations"));

      if (!orgSnapshot.empty) {
        const orgList: Organization[] = orgSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            orgId: doc.id,
            email: data.email || "", // Default to empty string or handle undefined
            organizationName: data.organizationName || "", // Default value
            status: data.status || "inactive", // Default value if status is missing
            createdAt: data.createdAt?.toDate() || null, // Convert Firestore timestamp to Date
            lastLogin: data.lastLogin?.toDate() || null, // Convert Firestore timestamp to Date
          };
        });

        setOrganizations(orgList);
      } else {
        setOrganizations([]); // Clear the list if there are no documents
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching organizations: ", error);
      toast.error("Error fetching organizations. Please try again later."); // Use toast for error
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const handleDeleteOrganization = async (orgId: string) => {
    try {
      const orgRef = doc(db, "organizations", orgId);
      const orgSnapshot = await getDoc(orgRef);

      if (!orgSnapshot.exists()) {
        toast.error("Organization not found."); // Use toast for error
        return;
      }

      await deleteDoc(orgRef);
      setOrganizations((prev) => prev.filter((org) => org.orgId !== orgId));
      toast.success("Organization deleted successfully"); // Use toast for success
    } catch (error) {
      console.error("Error deleting organization: ", error);
      toast.error("Error deleting organization. Please try again."); // Use toast for error
    }
  };

  const filteredOrganizations = organizations.filter(
    (org) =>
      org.organizationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastOrg = currentPage * orgsPerPage;
  const indexOfFirstOrg = indexOfLastOrg - orgsPerPage;
  const currentUsers = organizations.slice(indexOfFirstOrg, indexOfLastOrg);
  const totalPages = Math.ceil(organizations.length / orgsPerPage);

  if (loading) return <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>;

  return (
    <>
      <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
        <div className="max-w-full overflow-x-auto">
          <div className="flex items-center">
            <input
              type="text"
              placeholder="Search organization by name or email"
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
                      {org.status === "Verified" ? (
                        <p className="inline-flex rounded-full bg-success bg-opacity-10 py-1 px-3 text-sm font-medium text-success">
                          Verified
                        </p>
                      ) : (
                        <p className="inline-flex rounded-full bg-danger bg-opacity-10 py-1 px-3 text-sm font-medium text-danger">
                          Unverified
                        </p>
                      )}
                    </td>
                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                      <button className="text-danger hover:bg-danger hover:text-white rounded-md px-2 hover:shadow-lg hover:shadow-danger/50 ml-2" onClick={() => handleDeleteOrganization(org.orgId)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
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
      </div>
    </>
  );
};

export default RemoveOrganizationTable;
