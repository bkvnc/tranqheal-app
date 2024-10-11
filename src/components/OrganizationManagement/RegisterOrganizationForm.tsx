import { useState, ChangeEvent, FormEvent } from 'react';
import { getAuth, createUserWithEmailAndPassword, UserCredential } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { serverTimestamp } from 'firebase/firestore';

const auth = getAuth();
const db = getFirestore();

interface FormData {
    organizationName: string;
    email: string;
    password: string;
    confirmPassword: string;
    
}

const RegisterOrganization = () => {
    const [formData, setFormData] = useState<FormData>({
        organizationName: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [error, setError] = useState<string>('');

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: value
        }));
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords don't match");
            return;
        }

        try {
            // Create user with email and password
            const userCredential: UserCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            const user = userCredential.user;

            // Add organization data to Firestore with userType as 'organization'
            await setDoc(doc(db, 'organizations', user.uid), {
                organizationName: formData.organizationName,
                email: formData.email,
                userType: 'organization',
                createdAt: serverTimestamp(),
            });

            // Redirect or show success message
            console.log('Organization registered successfully');
            // You might want to redirect the user or show a success message here
        } catch (error) {
            setError(error instanceof Error ? error.message : 'An unknown error occurred');
        }
    };

    return (
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark">
                <h1 className="font-medium text-black dark:text-white">
                    Register Mental Health Organization Form
                </h1>
            </div>
            <form onSubmit={handleSubmit}>
                <div className="p-6.5">
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
                            className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                            required
                        />
                    </div>
                    <div className="mb-4.5">
                        <label className="mb-2.5 block text-black dark:text-white">
                            Email
                        </label>
                        <input
                            type="email"
                            name="email"
                            placeholder="Enter email address"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                            required
                        />
                    </div>
                    <div className="mb-4.5">
                        <label className="mb-2.5 block text-black dark:text-white">
                            Password
                        </label>
                        <input
                            type="password"
                            name="password"
                            placeholder="Enter password"
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                            required
                        />
                    </div>
                    <div className="mb-5.5">
                        <label className="mb-2.5 block text-black dark:text-white">
                            Re-type Password
                        </label>
                        <input
                            type="password"
                            name="confirmPassword"
                            placeholder="Re-enter password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                            required
                        />
                    </div>
                    {error && <p className="text-danger mb-4">{error}</p>}
                    <button type="submit" className="flex w-full justify-center rounded bg-[#9F4FDD] p-3 font-medium text-gray">
                        Register Organization
                    </button>
                </div>
            </form>
        </div>
    );
};

export default RegisterOrganization;
