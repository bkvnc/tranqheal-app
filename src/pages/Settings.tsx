// Settings.tsx
import Breadcrumb from '../components/Breadcrumb';
import Alert from '../pages/UiElements/Alerts';
import { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";
import '../styles.css';

type UserData = {
  adminName?: string;
  organizationName?: string;
  address?: string;
  phoneNumber?: string;
  emailAddress?: string;
  username?: string;
  userType?: string;
};

const Settings = () => {
  const [userData, setUserData] = useState<UserData>({});
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null); // Updated alert state
  const auth = getAuth();
  const db = getFirestore();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const uid = user.uid;
          const userType = await getUserType(uid);

          const docRef = doc(db, userType === "organization" ? "organizations" : "admins", uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            setUserData(docSnap.data() as UserData);
          } else {
            setAlert({ type: "error", message: "No user data found." });
          }
        }
      } catch (error) {
        setAlert({ type: "error", message: "Error fetching user data." });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [auth, db]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const user = auth.currentUser;
      if (user) {
        const uid = user.uid;
        const userType = await getUserType(uid);

        const docRef = doc(db, userType === "organization" ? "organizations" : "admins", uid);
        await updateDoc(docRef, userData);

        setAlert({ type: "success", message: "User data updated successfully." });
      }
    } catch (error) {
      setAlert({ type: "error", message: "Error updating user data." });
    }
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const getUserType = async (uid: string): Promise<string> => {
    const adminRef = doc(db, "admins", uid);
    const adminSnap = await getDoc(adminRef);
    return adminSnap.exists() ? "admin" : "organization";
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  if (loading) return <div>Loading...</div>;

  return (
    <>
      <div className="mx-auto max-w-270">
        <Breadcrumb pageName="Settings" />

        {/* Alert section */}
        {alert && <Alert type={alert.type} message={alert.message} />} {/* Use Alert component */}

        <div className="grid grid-cols-5 gap-8">
          <div className="col-span-5 xl:col-span-3">
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
              <div className="border-b border-stroke py-4 px-7 dark:border-strokedark">
                <h3 className="font-medium text-black dark:text-white">Personal Information</h3>
              </div>
              <div className="p-7">
                <form onSubmit={handleUpdate}>
                  <div className="mb-5.5 flex flex-col gap-5.5 sm:flex-row">
                    {userData.userType === 'organization' && (
                      <div className="w-full sm:w-1/2">
                        <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                          Organization Name
                        </label>
                        <div className="relative">
                          <input
                            className="w-full rounded border border-stroke bg-gray py-3 pl-11.5 pr-4.5 text-black focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                            type="text"
                            name="organizationName"
                            id="organizationName"
                            placeholder="Enter name of organization"
                            value={userData.organizationName || ""}
                            onChange={handleChange}
                          />
                        </div>
                      </div>
                    )}
                    {userData.userType === 'admin' && (
                      <div className="w-full sm:w-1/2">
                        <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                          Admin Name
                        </label>
                        <div className="relative">
                          <input
                            className="w-full rounded border border-stroke bg-gray py-3 pl-11.5 pr-4.5 text-black focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                            type="text"
                            name="adminName"
                            id="adminName"
                            placeholder="Enter name of administrator"
                            value={userData.adminName || ""}
                            onChange={handleChange}
                          />
                        </div>
                      </div>
                    )}
                    {userData.userType === 'organization' && (
                      <div className="w-full sm:w-1/2">
                        <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor="address">
                          Address
                        </label>
                        <div className="relative">
                          <input
                            className="w-full rounded border border-stroke bg-gray py-3 pl-11.5 pr-4.5 text-black focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                            type="text"
                            name="address"
                            id="address"
                            placeholder="Enter address of organization"
                            value={userData.address || ""}
                            onChange={handleChange}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  {userData.userType === 'organization' && (
                    <div className="w-full sm:w-1/2">
                      <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor="phoneNumber">
                        Phone Number
                      </label>
                      <input
                        className="w-full rounded border border-stroke bg-gray py-3 px-4.5 text-black focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                        type="text"
                        name="phoneNumber"
                        id="phoneNumber"
                        placeholder="Enter phone number"
                        value={userData.phoneNumber || ""}
                        onChange={handleChange}
                      />
                    </div>
                  )}
                  <div className="mb-5.5 mt-5">
                    <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor="emailAddress">
                      Email Address
                    </label>
                    <div className="relative">
                      <input
                        className="w-full rounded border border-stroke bg-gray py-3 pl-11.5 pr-4.5 text-black focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                        type="email"
                        name="emailAddress"
                        id="emailAddress"
                        placeholder="Enter email address"
                        value={userData.emailAddress || ""}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="mt-5 w-full rounded bg-primary py-3 text-white dark:bg-primary dark:hover:bg-primary-dark"
                  >
                    Update Information
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Settings;
