// import Breadcrumb from '../../components/Breadcrumb';
// import CheckboxFive from '../../components/CheckboxFive';
// import CheckboxFour from '../../components/CheckboxFour';
// import CheckboxOne from '../../components/CheckboxOne';
// import CheckboxThree from '../../components/CheckboxThree';
// import CheckboxTwo from '../../components/CheckboxTwo';
// import SwitcherFour from '../../components/SwitcherFour';
// import SwitcherOne from '../../components/SwitcherOne';
// import SwitcherThree from '../../components/SwitcherThree';
// import SwitcherTwo from '../../components/SwitcherTwo';

import { Link } from "react-router-dom";

const FormElements = () => {
    return (
        <>
            {/* <!-- Input Fields --> */}
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark">
                    <h3 className="font-medium text-black dark:text-white">
                        New Educational Resource Form
                    </h3>
                </div>
                <div className="flex flex-col gap-5.5 p-6.5">
                    <div>
                        <label className="mb-3 block text-black dark:text-white">
                            Educational Resource Title
                        </label>
                        <input
                            type="text"
                            placeholder="Default Input"
                            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                        />
                    </div>

                    <div>
                        <label className="mb-3 block text-black dark:text-white">
                            Educational Resource Description
                        </label>
                        <textarea
                            rows={3}
                            placeholder="Default textarea"
                            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                        ></textarea>
                    </div>

                    <div>
                        <label className="mb-3 block font-medium text-black dark:text-white">
                            Upload file or video
                        </label>
                        <input
                            type="file"
                            className="w-full cursor-pointer rounded-lg border-[1.5px] border-stroke bg-transparent font-medium outline-none transition file:mr-5 file:border-collapse file:cursor-pointer file:border-0 file:border-r file:border-solid file:border-stroke file:bg-whiter file:py-3 file:px-5 file:hover:bg-primary file:hover:bg-opacity-10 focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:file:border-form-strokedark dark:file:bg-white/30 dark:file:text-white dark:focus:border-primary"
                        />
                        <label className="mt-3 mb-3 block font-medium text-black dark:text-white">
                            Or enter resource link
                        </label>
                        <input
                            type="text"
                            placeholder="Link to resource"
                            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                        />
                    </div>
                    <label className="mt-3 block font-medium text-black dark:text-white">
                        Select Category
                    </label>
                    <div className="relative z-20 w-full rounded border border-stroke p-1.5 pr-8 font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input">
                        <div className="flex flex-wrap items-center">
                            <span className="m-1.5 flex items-center justify-center rounded border-[.5px] border-stroke bg-gray py-1.5 px-2.5 text-sm font-medium dark:border-strokedark dark:bg-white/30">
                                General Mental Health
                                <span className="cursor-pointer pl-2 hover:text-danger">
                                    <svg
                                        width="12"
                                        height="12"
                                        viewBox="0 0 12 12"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            clipRule="evenodd"
                                            d="M9.35355 3.35355C9.54882 3.15829 9.54882 2.84171 9.35355 2.64645C9.15829 2.45118 8.84171 2.45118 8.64645 2.64645L6 5.29289L3.35355 2.64645C3.15829 2.45118 2.84171 2.45118 2.64645 2.64645C2.45118 2.84171 2.45118 3.15829 2.64645 3.35355L5.29289 6L2.64645 8.64645C2.45118 8.84171 2.45118 9.15829 2.64645 9.35355C2.84171 9.54882 3.15829 9.54882 3.35355 9.35355L6 6.70711L8.64645 9.35355C8.84171 9.54882 9.15829 9.54882 9.35355 9.35355C9.54882 9.15829 9.54882 8.84171 9.35355 8.64645L6.70711 6L9.35355 3.35355Z"
                                            fill="currentColor"
                                        ></path>
                                    </svg>
                                </span>
                            </span>
                            <span className="m-1.5 flex items-center justify-center rounded border-[.5px] border-stroke bg-gray py-1.5 px-2.5 text-sm font-medium dark:border-strokedark dark:bg-white/30">
                                Research and Studies
                                <span className="cursor-pointer pl-2 hover:text-danger">
                                    <svg
                                        width="12"
                                        height="12"
                                        viewBox="0 0 12 12"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            clipRule="evenodd"
                                            d="M9.35355 3.35355C9.54882 3.15829 9.54882 2.84171 9.35355 2.64645C9.15829 2.45118 8.84171 2.45118 8.64645 2.64645L6 5.29289L3.35355 2.64645C3.15829 2.45118 2.84171 2.45118 2.64645 2.64645C2.45118 2.84171 2.45118 3.15829 2.64645 3.35355L5.29289 6L2.64645 8.64645C2.45118 8.84171 2.45118 9.15829 2.64645 9.35355C2.84171 9.54882 3.15829 9.54882 3.35355 9.35355L6 6.70711L8.64645 9.35355C8.84171 9.54882 9.15829 9.54882 9.35355 9.35355C9.54882 9.15829 9.54882 8.84171 9.35355 8.64645L6.70711 6L9.35355 3.35355Z"
                                            fill="currentColor"
                                        ></path>
                                    </svg>
                                </span>
                            </span>
                        </div>
                        <select
                            name=""
                            id=""
                            className="absolute top-0 left-0 z-20 h-full w-full bg-transparent opacity-0"
                        >
                            <option>General Mental Health</option>
                            <option>Anxiety and Stress</option>
                            <option>Depression and Mood Disorders</option>
                            <option>Therapeutic Approaches</option>
                            <option>Self-Care and Wellness</option>
                            <option>Mindfulness and Meditation</option>
                            <option>Relationships and Communication</option>
                            <option>Trauma and PTSD</option>
                            <option>Crisis Intervention and Hotlines</option>
                            <option>Mental Health Advocacy</option>
                            <option>Cultural and Diversity Perspectives</option>
                            <option>Substance Abuse and Addiction</option>
                            <option>Eating Disorders</option>
                            <option>Sleep Disorders</option>
                            <option>Parenting and Family Mental Health</option>
                            <option>Positive Psychology</option>
                            <option>Mind-Body Connection</option>
                            <option>Educational Workshops and Webinars</option>
                            <option>Books and Literature</option>
                            <option>Research and Studies</option>

                        </select>
                        <span className="absolute top-1/2 right-4 z-10 -translate-y-1/2">
                            <svg
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <g opacity="0.8">
                                    <path
                                        fillRule="evenodd"
                                        clipRule="evenodd"
                                        d="M5.29289 8.29289C5.68342 7.90237 6.31658 7.90237 6.70711 8.29289L12 13.5858L17.2929 8.29289C17.6834 7.90237 18.3166 7.90237 18.7071 8.29289C19.0976 8.68342 19.0976 9.31658 18.7071 9.70711L12.7071 15.7071C12.3166 16.0976 11.6834 16.0976 11.2929 15.7071L5.29289 9.70711C4.90237 9.31658 4.90237 8.68342 5.29289 8.29289Z"
                                        fill="#637381"
                                    ></path>
                                </g>
                            </svg>
                        </span>
                    </div>
                    <Link
                        to="#"
                        className="inline-flex items-center justify-center rounded-md bg-meta-3 py-4 px-10 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10"
                    >
                        Publish New Resource
                    </Link>
                </div>
            </div>
        </>
    );
};

export default FormElements;
