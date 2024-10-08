const RegisterResponder = () => {
    return (
        <>
            {/* <!-- Sign Up Form --> */}
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark">
                    <h1 className="font-medium text-black dark:text-white">
                        Register Mental Health Organization Form
                    </h1>
                </div>
                <form action="#">
                    <div className="p-6.5">
                        <div className="mb-4.5">
                            <label className="mb-2.5 block text-black dark:text-white">
                                Organization Name
                            </label>
                            <input
                                type="text"
                                placeholder="Enter name of organization"
                                className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                            />
                        </div>
                        <div className="mb-4.5">
                            <label className="mb-2.5 block text-black dark:text-white">
                                Email
                            </label>
                            <input
                                type="email"
                                placeholder="Enter email address"
                                className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                            />
                        </div>

                        <div className="mb-4.5">
                            <label className="mb-2.5 block text-black dark:text-white">
                                Password
                            </label>
                            <input
                                type="password"
                                placeholder="Enter password"
                                className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                            />
                        </div>

                        <div className="mb-5.5">
                            <label className="mb-2.5 block text-black dark:text-white">
                                Re-type Password
                            </label>
                            <input
                                type="password"
                                placeholder="Re-enter password"
                                className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                            />
                        </div>

                        <button className="flex w-full justify-center rounded bg-[#9F4FDD] p-3 font-medium text-gray">
                            Register Responder
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
};

export default RegisterResponder;
