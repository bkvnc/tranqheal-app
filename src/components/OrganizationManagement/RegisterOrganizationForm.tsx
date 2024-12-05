import React, { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import { getAuth, createUserWithEmailAndPassword, UserCredential, sendEmailVerification } from 'firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { toast, ToastContainer } from 'react-toastify';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import 'react-toastify/dist/ReactToastify.css';

const auth = getAuth();
const db = getFirestore();
const storage = getStorage();

const DEFAULT_PROFILE_PICTURE_PATH = '/defaultImages/defaultAva.png'; // Path in Firestore storage
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
    const [profilePictureUrl, setProfilePictureUrl] = useState<string>('');


    useEffect(() => {
        const fetchDefaultProfilePicture = async () => {
            try {
                const profilePictureRef = ref(storage, DEFAULT_PROFILE_PICTURE_PATH);
                const url = await getDownloadURL(profilePictureRef);
                setProfilePictureUrl(url); 
            } catch (error) {
                console.error('Error fetching profile picture:', error);
                toast.error('Error fetching default profile picture.');
            }
        };

        fetchDefaultProfilePicture();
    }, []);

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
            const userCredential: UserCredential = await createUserWithEmailAndPassword(
                auth,
                formData.email,
                formData.password
            );
            const user = userCredential.user;

            
            await sendEmailVerification(user);

            
            const userData: UserData = {
                email: formData.email,
                userType: formData.userType,
                createdAt: serverTimestamp(),
                profilePicture: profilePictureUrl || '', 
                backgroundPicture: DEFAULT_BACKGROUD_PICTURE,
                status: 'Unverified',
            };

            if (formData.userType === 'organization') {
                userData.organizationName = formData.organizationName;
            } else if (formData.userType === 'admin') {
                userData.adminName = formData.adminName;
            }

       
            const collectionName: 'organizations' | 'admins' =
                formData.userType === 'organization' ? 'organizations' : 'admins';

         
            await setDoc(doc(db, collectionName, user.uid), userData);

           
            toast.success('Registration successful! Please check your email to verify your account.');

         
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

                    <div className="flex items-center justify-center">
                        <button
                            type="submit"
                            className="btn btn-primary w-full max-w-[250px]"
                            disabled={loading}
                        >
                            {loading ? 'Registering...' : 'Register'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default Register;
