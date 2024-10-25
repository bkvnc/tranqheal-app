import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { db } from "../../config/firebase";
import { collection, addDoc, getDocs } from "firebase/firestore";

const BlacklistedWordsTable = () => {
    const [blacklistedWords, setBlacklistedWords] = useState<{ id: string, word: string; description: string }[]>([]);
    const [newWord, setNewWord] = useState("");
    const [newDescription, setNewDescription] = useState("");
    const [searchQuery, setSearchQuery] = useState("")
    const [currentPage, setCurrentPage] = useState(1);
    const wordsPerPage = 5; // Items per page

 
    useEffect(() => {
        const fetchBlacklistedWords = async () => {
            const querySnapshot = await getDocs(collection(db, "blacklistedWords"));
            const words = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as { id: string, word: string; description: string }[];
            setBlacklistedWords(words);
        };

        fetchBlacklistedWords();
    }, []);

   
    const addWord = async () => {
        if (newWord.trim() && newDescription.trim()) {
            const docRef = await addDoc(collection(db, "blacklistedWords"), {
                word: newWord,
                description: newDescription
            });
            setBlacklistedWords([...blacklistedWords, { id: docRef.id, word: newWord, description: newDescription }]);
            setNewWord("");
            setNewDescription("");
        }
    };

    // Handler for search filtering
    const filteredWords = blacklistedWords.filter(({ word }) =>
        word.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const indexOfLastWord = currentPage * wordsPerPage;
    const indexOfFirstWord = indexOfLastWord - wordsPerPage;
    const currentWord = filteredWords.slice(indexOfFirstWord, indexOfLastWord);
    const totalPages = Math.ceil(filteredWords.length / wordsPerPage);

    return (
        <>
            <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
                <div className="max-w-full overflow-x-auto">
                    <div className="flex items-center">
                        <input
                            type="text"
                            placeholder="Search blacklisted word"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="mb-3 w-100 rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                        />
                        <Link
                            to="#"
                            className="h-12 w-40 mb-3 ml-4 inline-flex items-center justify-center rounded-md bg-[#9F4FDD] py-4 px-10 font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10"
                        >
                            Search
                        </Link>
                        <input
                            type="text"
                            placeholder="Add word to blacklist"
                            value={newWord}
                            onChange={(e) => setNewWord(e.target.value)}
                            className="mb-3 w-100 rounded-lg ml-4 border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                        />
                        <input
                            type="text"
                            placeholder="Add description"
                            value={newDescription}
                            onChange={(e) => setNewDescription(e.target.value)}
                            className="mb-3 w-100 rounded-lg ml-4 border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                        />
                        <button
                            onClick={addWord}
                            className="h-12 w-25 mb-3 ml-4 inline-flex items-center justify-center rounded-md bg-[#9F4FDD] py-4 px-10 font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10"
                        >
                            Add
                        </button>
                    </div>

                    <table className="w-full table-auto">
                        <thead>
                            <tr className="bg-gray-2 text-left dark:bg-meta-4">
                                <th className="min-w-[220px] py-4 px-4 font-medium text-black dark:text-white xl:pl-11">
                                    Blacklisted Word
                                </th>
                                <th className="min-w-[220px] py-4 px-4 font-medium text-black dark:text-white xl:pl-11">
                                    Description
                                </th>
                                <th className="min-w-[220px] py-4 px-4 font-medium text-black dark:text-white xl:pl-11">
                                    Action
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredWords.map((item, index) => (
                                <tr key={index}>
                                    <td className="border-b border-[#eee] py-5 px-4 pl-9 dark:border-strokedark xl:pl-11">
                                        <h5 className="font-medium text-black dark:text-white">{item.word}</h5>
                                    </td>
                                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                        <p className="text-black dark:text-white">{item.description}</p>
                                    </td>
                                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                        <div className="flex items-center space-x-3.5">
                                            {/* Action buttons go here */}
                                            <button className="hover:text-primary">Edit</button>
                                            <button className="hover:text-primary">Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="flex justify-between mt-4">
                        <button
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="py-2 px-4 bg-gray-300 rounded-md disabled:opacity-50"
                        >
                        Previous
                        </button>
                        <div className="flex items-center">
                        <span>Page {currentPage} of {totalPages}</span>
                        </div>
                        <button
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="py-2 px-4 bg-gray-300 rounded-md disabled:opacity-50"
                        >
                        Next
                        </button>
                </div>
                </div>
            </div>
        </>
    );
};

export default BlacklistedWordsTable;
