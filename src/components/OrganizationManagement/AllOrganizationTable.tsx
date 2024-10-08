const AllOrganizationTable = () => {
    return (
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="py-6 px-4 md:px-6 xl:px-7.5">
                <h4 className="text-xl font-semibold text-black dark:text-white">
                    All Mental Health Organizations
                </h4>
            </div>

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

            <div className="grid grid-cols-6 border-    t border-stroke py-4.5 px-4 dark:border-strokedark sm:grid-cols-10 md:px-6 2xl:px-7.5">
                <div className="col-span-2 flex items-center">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        <p className="text-sm text-black dark:text-white">
                            ABC Mental Health Center
                        </p>
                    </div>
                </div>
                <div className="col-span-2 hidden items-center sm:flex">
                        <p className="text-sm text-black dark:text-white">
                             Nonprofit Mental Health Organizations
                        </p>
                </div>
                <div className="col-span-2 flex items-center">
                    <p className="text-sm text-black dark:text-white">Skinanna, NY</p>
                </div>
                <div className="col-span-2 flex items-center">
                    <p className="text-sm text-black dark:text-white">ABCmental@gmail.com</p>
                </div>
                <div className="col-span-2 flex items-center">
                    <p className="text-sm text-black dark:text-white">Annual</p>
                </div>
            </div>
        </div>
    );
};

export default AllOrganizationTable;
