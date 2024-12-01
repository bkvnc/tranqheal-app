// Settings.tsx
import Breadcrumb from '../components/Breadcrumb';
import Alert from '../pages/UiElements/Alerts';
import { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";
import '../styles.css';
import { toast } from 'react-toastify';

type UserData = {
  adminName?: string;
  organizationName?: string;
  address?: string;
  phoneNumber?: string;
  email?: string;
  servicesOffered?: string[];
  timeStart?: string;
  timeEnd?: string;
  days?: string[];
  username?: string;
  userType?: string;
  facebookLink?: string;
};

const servicesList = [
  "Therapy",
  "Counseling",
  "Support Groups",
  "Crisis Intervention",
  "Other"
];

const daysList = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday"
];

const Settings = () => {
  const [userData, setUserData] = useState<UserData>({
    timeStart: "", // Default value to prevent undefined access
    timeEnd: "",   // Default value to prevent undefined access
    servicesOffered: [],
    days: []
  });
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
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
            toast.error( "No user data found." );
          }
        }
      } catch (error) {
        toast.error( "Error fetching user data." );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [auth, db]);

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    // Validate Phone Number
    if (!userData.phoneNumber) {
      newErrors.phoneNumber = "Phone number is required.";
    } else if (/[^0-9]/.test(userData.phoneNumber)) {
      newErrors.phoneNumber = "Phone number can only contain digits.";
    } else if (!/^\d{11}$/.test(userData.phoneNumber)) {
      newErrors.phoneNumber = "Phone number must be 11 digits.";
    }

    // Validate Address
    if (!userData.address) {
      newErrors.address = "Address is required.";
    } 
    // Validate Time
    if (!userData.timeStart) {
      newErrors.timeStart = "Start time is required.";
    }

    if (!userData.timeEnd) {
      newErrors.timeEnd = "End time is required.";
    } else if (userData.timeStart && userData.timeEnd) {
      const startDate = new Date(`1970-01-01T${userData.timeStart}`);
      const endDate = new Date(`1970-01-01T${userData.timeEnd}`);

      // Correctly compare the two times
      if (startDate >= endDate) {
        newErrors.timeEnd = "End time must be after start time.";
      }
    }

    // Validate Services Offered
    if (!userData.servicesOffered || userData.servicesOffered.length === 0) {
      newErrors.servicesOffered = "At least one service must be selected.";
    }

    // Validate Days Available
    if (!userData.days || userData.days.length === 0) {
      newErrors.days = "At least one day must be selected.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      const user = auth.currentUser;
      if (user) {
        const uid = user.uid;
        const userType = await getUserType(uid);

        const docRef = doc(db, userType === "organization" ? "organizations" : "admins", uid);
        await updateDoc(docRef, userData);

        toast.success("User data updated successfully." );
      }
    } catch (error) {
      toast.error("Error updating user data." );
    }
  };

  const getUserType = async (uid: string): Promise<string> => {
    const adminRef = doc(db, "admins", uid);
    const adminSnap = await getDoc(adminRef);
    return adminSnap.exists() ? "admin" : "organization";
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setUserData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error for the field being updated
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'servicesOffered' | 'days') => {
    const { value, checked } = e.target;
    setUserData((prev) => {
      const currentValues = prev[field] || [];
      if (checked) {
        return {
          ...prev,
          [field]: [...currentValues, value]
        };
      } else {
        return {
          ...prev,
          [field]: currentValues.filter(item => item !== value)
        };
      }
    });

    // Clear error for the field being updated
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  if (loading) return <div>Loading...</div>;

  return (
    <>
      <div className="mx-auto max-w-270">
        <Breadcrumb pageName="Settings" />

    

        <div className="grid grid-cols-5 gap-8">
          <div className="col-span-5 xl:col-span-3">
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
              <div className="border-b border-stroke py-4 px-7 dark:border-strokedark">
                <h3 className="font-medium text-black dark:text-white">Personal Information</h3>
              </div>
              <div className="p-7">
                <form onSubmit={handleUpdate}>
                  {/* Organization Fields */}
                  {userData.userType === 'organization' && (
                    <>
                      {/* Organization Name */}
                      <div className="mb-5.5 ">
                        <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                          Organization Name
                        </label>
                        <input
                          className={`w-full rounded border ${errors.organizationName ? 'border-red-500' : 'border-stroke'} bg-gray py-3 pl-11.5 pr-4.5 text-black focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary`}
                          type="text"
                          name="organizationName"
                          value={userData.organizationName || ""}
                          onChange={handleChange}
                          placeholder="Enter name of organization"
                        />
                        {errors.organizationName && <p className="text-red-500 text-sm">{errors.organizationName}</p>}
                      </div>
                        {/* Phone Number Field */}
                        <div className="mb-5.5">
                          <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor="phoneNumber">
                            Phone Number
                          </label>
                          <input
                            className={`input ${errors.phoneNumber ? 'error-input' : ''}`}
                            type="text"
                            name="phoneNumber"
                            id="phoneNumber"
                            placeholder="Enter phone number"
                            value={userData.phoneNumber || ""}
                            onChange={handleChange}
                          />
                          {errors.phoneNumber && <p className="error-message">{errors.phoneNumber}</p>}
                        </div>

                        {/* Address Field */}
                        <div className="mb-5.5">
                          <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor="address">
                            Address
                          </label>
                          <input
                            className={`input ${errors.address ? 'error-input' : ''}`}
                            type="text"
                            name="address"
                            id="address"
                            placeholder="Enter address of organization"
                            value={userData.address || ""}
                            onChange={handleChange}
                          />
                          {errors.address && <p className="error-message">{errors.address}</p>}
                        </div>
                      {/* Services Offered (Checkboxes) */}
                      <div className="mb-5.5">
                        <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                          Services Offered
                        </label>
                        {servicesList.map(service => (
                          <div key={service}>
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                value={service}
                                checked={userData.servicesOffered?.includes(service) || false}
                                onChange={(e) => handleCheckboxChange(e, 'servicesOffered')}
                                className="mr-2"
                              />
                              {service}
                            </label>
                          </div>
                        ))}
                        {errors.servicesOffered && <p className="text-red-500 text-sm">{errors.servicesOffered}</p>}
                      </div>

                     {/* Time Start Field */}
                        <div className="mb-5.5">
                          <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor="timeStart">
                            Start Time
                          </label>
                          <input
                            className={`input ${errors.timeStart ? 'error-input' : ''}`}
                            type="time"
                            name="timeStart"
                            id="timeStart"
                            value={userData.timeStart || ""}
                            onChange={handleChange}
                          />
                          {errors.timeStart && <p className="error-message">{errors.timeStart}</p>}
                        </div>

                        {/* Time End Field */}
                        <div className="mb-5.5">
                          <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor="timeEnd">
                            End Time
                          </label>
                          <input
                            className={`input ${errors.timeEnd ? 'error-input' : ''}`}
                            type="time"
                            name="timeEnd"
                            id="timeEnd"
                            value={userData.timeEnd || ""}
                            onChange={handleChange}
                          />
                          {errors.timeEnd && <p className="error-message">{errors.timeEnd}</p>}
                        </div>

                      {/* Days Available (Checkboxes) */}
                      <div className="mb-5.5">
                        <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                          Days Available
                        </label>
                        {daysList.map(day => (
                          <div key={day}>
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                value={day}
                                checked={userData.days?.includes(day) || false}
                                onChange={(e) => handleCheckboxChange(e, 'days')}
                                className="mr-2"
                              />
                              {day}
                            </label>
                          </div>
                        ))}
                        {errors.days && <p className="text-red-500 text-sm">{errors.days}</p>}
                      </div>
                    </>
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
                  <div className="mb-5.5 mt-5">
                    <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor="email">
                      Email Address
                    </label>
                    <div className="relative">
                      <input
                        className="w-full rounded border border-stroke bg-gray py-3 pl-11.5 pr-4.5 text-black focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                        type="email"
                        name="email"
                        id="email"
                        placeholder="Enter email address"
                        value={userData.email || ""}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  <div className="mb-5.5 mt-5">
                    <label className="mb-3 block text-sm font-medium text-black dark:text-white"  htmlFor="facebookLink" >
                      Facebook Link
                    </label>
                    <div className="relative">
                      <input
                        className="w-full rounded border border-stroke bg-gray py-3 pl-11.5 pr-4.5 text-black focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                        type="facebookLink"
                        name="facebookLink"
                        id="facebookLink"
                        placeholder="Enter facebook link"
                        value={userData.facebookLink || ""}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button type="submit" className="mt-3 rounded bg-primary py-2 px-5 text-white">
                    Update
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
