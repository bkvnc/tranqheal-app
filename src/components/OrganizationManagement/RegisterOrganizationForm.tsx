import React, { useState, ChangeEvent, FormEvent } from 'react';
import { getAuth, createUserWithEmailAndPassword, UserCredential } from 'firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const auth = getAuth();
const db = getFirestore();

// Define a default profile picture URL
const DEFAULT_PROFILE_PICTURE = 'src/images/user/user-01.png'; // Replace with your default image URL
const DEFAULT_BACKGROUD_PICTURE = 'src/images/cover/cover-01.png';

type UserType = 'organization' | 'admin';

interface FormData {
    adminName: string;
    organizationName: string;
    email: string;
    password: string;
    confirmPassword: string;
    userType: UserType;
}

interface UserData {
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
    adminName?: string;
    profilePicture?: string;
    backgroundPicture?: string;
    createdAt?: any;
    lastLogin?: any;
    status?: string;
    subscriptionPlan?: string;
}

const Register: React.FC = () => {
    const [formData, setFormData] = useState<FormData>({
        organizationName: '',
        adminName: '',
        email: '',
        password: '',
        confirmPassword: '',
        userType: 'organization',
    });

    const [loading, setLoading] = useState<boolean>(false);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        // Validation checks
        if (formData.password !== formData.confirmPassword) {
            toast.error("Passwords don't match");
            setLoading(false);
            return;
        }

        if (formData.password.length < 6) {
            toast.error('Password should be at least 6 characters long');
            setLoading(false);
            return;
        }

        if (formData.userType === 'organization' && !formData.organizationName) {
            toast.error('Organization name is required');
            setLoading(false);
            return;
        }

        if (formData.userType === 'admin' && !formData.adminName) {
            toast.error('Admin name is required');
            setLoading(false);
            return;
        }

        try {
            // Create a new user in Firebase Authentication
            const userCredential: UserCredential = await createUserWithEmailAndPassword(
                auth,
                formData.email,
                formData.password
            );
            const user = userCredential.user;

            // User data to be stored in Firestore
            const userData: UserData = {
                email: formData.email,
                userType: formData.userType,
                createdAt: serverTimestamp(),
                profilePicture: DEFAULT_PROFILE_PICTURE,
                backgroundPicture: DEFAULT_BACKGROUD_PICTURE,
            };

            if (formData.userType === 'organization') {
                userData.organizationName = formData.organizationName;
            } else if (formData.userType === 'admin') {
                userData.adminName = formData.adminName;
            }

            // Determine the collection name based on user type
            const collectionName: 'organizations' | 'admins' =
                formData.userType === 'organization' ? 'organizations' : 'admins';

            // Save the user data to Firestore
            await setDoc(doc(db, collectionName, user.uid), userData);

            // Show success toast
            toast.success('Registration successful! You can now log in.');
        } catch (error: any) {
            let errorMessage = 'An unknown error occurred';

            // Handle different error cases
            switch (error.code) {
                case 'auth/email-already-in-use':
                    errorMessage = 'The email address is already in use. Please use a different email.';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'The email address is invalid. Please provide a valid email.';
                    break;
                case 'auth/weak-password':
                    errorMessage = 'Password should be at least 6 characters long.';
                    break;
                default:
                    errorMessage = error.message || 'An error occurred during registration.';
                    break;
            }

            toast.error(errorMessage);
        }

        setLoading(false);
    };

    return (
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <ToastContainer />
            <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark">
                <h1 className="font-medium text-black dark:text-white">Registration Form</h1>
            </div>
            <form onSubmit={handleSubmit}>
                <div className="p-6.5">
                    <div className="mb-4.5">
                        <label className="mb-2.5 block text-black dark:text-white">User Type</label>
                        <select
                            name="userType"
                            value={formData.userType}
                            onChange={handleChange}
                            className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                            required
                        >
                            <option value="organization">Organization</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    {formData.userType === 'organization' && (
                        <div className="mb-4.5">
                            <label className="mb-2.5 block text-black dark:text-white">
                                Organization Name
                            </label>
                            <input
                                type="text"
                                name="organizationName"
                                placeholder="Enter name of organization"
                                value={formData.organizationName}
                                onChange={handleChange}
                                className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-strokedark dark:bg-form-input dark:focus:border-primary"
                                required
                            />
                        </div>
                    )}
                    {formData.userType === 'admin' && (
                        <div className="mb-4.5">
                            <label className="mb-2.5 block text-black dark:text-white">
                                Name of Administrator
                            </label>
                            <input
                                type="text"
                                name="adminName"
                                placeholder="Enter name of administrator"
                                value={formData.adminName}
                                onChange={handleChange}
                                className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-strokedark dark:bg-form-input dark:focus:border-primary"
                                required
                            />
                        </div>
                    )}
                    <div className="mb-4.5">
                        <label className="mb-2.5 block text-black dark:text-white">Email</label>
                        <input
                            type="email"
                            name="email"
                            placeholder="Enter email address"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-strokedark dark:bg-form-input dark:focus:border-primary"
                            required
                            pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
                        />
                    </div>
                    <div className="mb-4.5">
                        <label className="mb-2.5 block text-black dark:text-white">Password</label>
                        <input
                            type="password"
                            name="password"
                            placeholder="Enter password"
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-strokedark dark:bg-form-input dark:focus:border-primary"
                            required
                            minLength={6}
                        />
                    </div>
                    <div className="mb-4.5">
                        <label className="mb-2.5 block text-black dark:text-white">Confirm Password</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            placeholder="Confirm password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-strokedark dark:bg-form-input dark:focus:border-primary"
                            required
                        />
                    </div>
                    <div className="flex justify-center gap-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-block w-full rounded bg-[#9F4FDD] hover:shadow-lg hover:shadow-[#9F4FDD]/50  py-3 px-5 text-center text-base font-semibold text-white transition hover:bg-opacity-90"
                        >
                            {loading ? 'Processing...' : 'Register'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default Register;
