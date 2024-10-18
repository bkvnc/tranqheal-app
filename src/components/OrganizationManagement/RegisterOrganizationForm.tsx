import React, { useState, ChangeEvent, FormEvent } from 'react';
import { getAuth, createUserWithEmailAndPassword, UserCredential } from 'firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import Alert from '../../pages/UiElements/Alerts';

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

    const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
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
        setAlert(null);
        setLoading(true);
        
        if (formData.password !== formData.confirmPassword) {
            setAlert({ type: 'error', message: "Passwords don't match" });
            setLoading(false);
            return;
        }

        if (formData.password.length < 6) {
            setAlert({ type: 'error', message: 'Password should be at least 6 characters long' });
            setLoading(false);
            return;
        }

        if (formData.userType === 'organization' && !formData.organizationName) {
            setAlert({ type: 'error', message: 'Organization name is required' });
            setLoading(false);
            return;
        }

        if (formData.userType === 'admin' && !formData.adminName) {
            setAlert({ type: 'error', message: 'Admin name is required' });
            setLoading(false);
            return;
        }

        try {
            const userCredential: UserCredential = await createUserWithEmailAndPassword(
                auth,
                formData.email,
                formData.password
            );
            const user = userCredential.user;

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

            const collectionName: 'organizations' | 'admins' =
                formData.userType === 'organization' ? 'organizations' : 'admins';
            
            await setDoc(doc(db, collectionName, user.uid), userData);

            setAlert({ type: 'success', message: 'Registration successful. You can now log in.' });
        } catch (error: any) {
            let errorMessage = 'An unknown error occurred';
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = 'The email address is already in use.';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Invalid email address.';
            } else if (error.code === 'auth/weak-password') {
                errorMessage = 'Password should be at least 6 characters.';
            }
            setAlert({ type: 'error', message: errorMessage });
        }

        setLoading(false);
    };

    return (
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            {alert && <Alert type={alert.type} message={alert.message} />}
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
                        />
                    </div>
                    <div className="mb-5.5">
                        <label className="mb-2.5 block text-black dark:text-white">Re-type Password</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            placeholder="Re-enter password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-strokedark dark:bg-form-input dark:focus:border-primary"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className={`flex w-full justify-center rounded bg-[#9F4FDD] p-3 font-medium text-gray ${loading ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                        disabled={loading}
                    >
                        {loading ? 'Registering...' : `Register ${formData.userType === 'organization' ? 'Organization' : 'Admin'}`}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Register;
