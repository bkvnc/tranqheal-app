import ProductOne from '../images/product/product-01.png';
import ProductTwo from '../images/product/product-02.png';
import ProductThree from '../images/product/product-03.png';
import ProductFour from '../images/product/product-04.png';

const ResponderPerformanceTable = () => {
    return (
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="py-6 px-4 md:px-6 xl:px-7.5">
                <h4 className="text-xl font-semibold text-black dark:text-white">
                    Responder Performance
                </h4>
            </div>
            <div className="grid grid-cols-6 border-t border-stroke py-4.5 px-4 dark:border-strokedark sm:grid-cols-9 md:px-6 2xl:px-7.5">
                <div className="col-span-2 flex items-center">
                    <p className="font-medium">Responder Name</p>
                </div>
                <div className="col-span-2 hidden items-center sm:flex">
                    <p className="font-medium">Responder Overall Calls</p>
                </div>
                <div className="col-span-2 flex items-center">
                    <p className="font-medium">Present Month Calls</p>
                </div>
                <div className="col-span-2 flex items-center">
                    <p className="font-medium">Average Call Duration</p>
                </div>
                <div className="col-span-1 flex items-center">
                    <p className="font-medium">Average Rating</p>
                </div>
            </div>

            <div className="grid grid-cols-6 border-t border-stroke py-4.5 px-4 dark:border-strokedark sm:grid-cols-9 md:px-6 2xl:px-7.5">
                <div className="col-span-2 flex items-center">
                    <div className="flex flex-col gap-1">
                        <p className="text-lg font-bold text-black dark:text-white">Miguel Trinidad</p>
                        <p className="text-sm text-black dark:text-white">migueltrinidad@gmail.com</p>
                    </div>
                </div>
                <div className="col-span-2 hidden items-center sm:flex">
                    <p className="text-sm text-black dark:text-white">364</p>
                </div>
                <div className="col-span-2 flex items-center">
                    <p className="text-sm text-black dark:text-white">47</p>
                </div>
                <div className="col-span-2 flex items-center">
                    <p className="text-sm text-black dark:text-white">08:56</p>
                </div>
                <div className="col-span-1 flex items-center">
                    <p className="text-sm text-meta-3">4.8</p>
                </div>
            </div>

            <div className="grid grid-cols-6 border-t border-stroke py-4.5 px-4 dark:border-strokedark sm:grid-cols-9 md:px-6 2xl:px-7.5">
                <div className="col-span-2 flex items-center">
                    <div className="flex flex-col gap-1">
                        <p className="text-lg font-bold text-black dark:text-white">Mikko Minoza</p>
                        <p className="text-sm text-black dark:text-white">alanmikko@gmail.com</p>
                    </div>
                </div>
                <div className="col-span-2 hidden items-center sm:flex">
                    <p className="text-sm text-black dark:text-white">345</p>
                </div>
                <div className="col-span-2 flex items-center">
                    <p className="text-sm text-black dark:text-white">46</p>
                </div>
                <div className="col-span-2 flex items-center">
                    <p className="text-sm text-black dark:text-white">05:42</p>
                </div>
                <div className="col-span-1 flex items-center">
                    <p className="text-sm text-meta-3">4.7</p>
                </div>
            </div>
            <div className="grid grid-cols-6 border-t border-stroke py-4.5 px-4 dark:border-strokedark sm:grid-cols-9 md:px-6 2xl:px-7.5">
                <div className="col-span-2 flex items-center">
                    <div className="flex flex-col gap-1">
                        <p className="text-lg font-bold text-black dark:text-white">Fritz Sasing</p>
                        <p className="text-sm text-black dark:text-white">fritsasing@gmail.com</p>
                    </div>
                </div>
                <div className="col-span-2 hidden items-center sm:flex">
                    <p className="text-sm text-black dark:text-white">256</p>
                </div>
                <div className="col-span-2 flex items-center">
                    <p className="text-sm text-black dark:text-white">39</p>
                </div>
                <div className="col-span-2 flex items-center">
                    <p className="text-sm text-black dark:text-white">06:26</p>
                </div>
                <div className="col-span-1 flex items-center">
                    <p className="text-sm text-meta-3">4.7</p>
                </div>
            </div>
            <div className="grid grid-cols-6 border-t border-stroke py-4.5 px-4 dark:border-strokedark sm:grid-cols-9 md:px-6 2xl:px-7.5">
                <div className="col-span-2 flex items-center">
                    <div className="flex flex-col gap-1">
                        <p className="text-lg font-bold text-black dark:text-white">Ian Wendel Flores</p>
                        <p className="text-sm text-black dark:text-white">ianflores@gmail.com</p>
                    </div>
                </div>
                <div className="col-span-2 hidden items-center sm:flex">
                    <p className="text-sm text-black dark:text-white">244</p>
                </div>
                <div className="col-span-2 flex items-center">
                    <p className="text-sm text-black dark:text-white">36</p>
                </div>
                <div className="col-span-2 flex items-center">
                    <p className="text-sm text-black dark:text-white">07:15</p>
                </div>
                <div className="col-span-1 flex items-center">
                    <p className="text-sm text-meta-3">4.4</p>
                </div>
            </div>
            <div className="flex justify-center mt-4">
                <button className="bg-blue-500 text-black py-2 px-4 rounded mr-2 dark:text-white">Previous</button>
                <button className="bg-blue-500 text-black py-2 px-4 rounded dark:text-white">Next</button>
            </div>
        </div>
    );
};

export default ResponderPerformanceTable;
