import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { db } from "../../config/firebase";
import { collection, addDoc, getDocs, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const BlacklistedWordsTable = () => {
    const [blacklistedWords, setBlacklistedWords] = useState<{ id: string, word: string; description: string }[]>([]);
    const [newWord, setNewWord] = useState("");
    const [newDescription, setNewDescription] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const wordsPerPage = 5; // Items per page
    const [editWordId, setEditWordId] = useState<string | null>(null);
    const [editWord, setEditWord] = useState("");
    const [editDescription, setEditDescription] = useState("");
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [wordToDelete, setWordToDelete] = useState<string | null>(null);

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
            toast.success("Word added to blacklist");
        } else {
            toast.error("Please fill in both fields");
        }
    };

    const handleEdit = (word: { id: string, word: string, description: string }) => {
        setEditWordId(word.id);
        setEditWord(word.word);
        setEditDescription(word.description);
    };

    const updateWord = async () => {
        if (editWordId) {
            const wordRef = doc(db, "blacklistedWords", editWordId);
            await updateDoc(wordRef, {
                word: editWord,
                description: editDescription
            });
            setBlacklistedWords(prev =>
                prev.map(item =>
                    item.id === editWordId ? { ...item, word: editWord, description: editDescription } : item
                )
            );
            setEditWordId(null);
            setEditWord("");
            setEditDescription("");
            toast.success("Word updated successfully");
        } else {
            toast.error("Failed to update word");
        }
    };

    const deleteWord = async (id: string) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this word?");
        if (!confirmDelete) {
            return; // Exit the function if the user cancels
        }

        const wordRef = doc(db, "blacklistedWords", id);
        await deleteDoc(wordRef);
        setBlacklistedWords(prev => prev.filter(item => item.id !== id));
        toast.success("Word deleted successfully");
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
            <ToastContainer />
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
                            className="h-12 w-40 mb-3 ml-4 inline-flex items-center justify-center rounded-md bg-[#9F4FDD] hover:shadow-lg hover:shadow-[#9F4FDD]/50 py-4 px-10 font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10"
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
                            className="h-12 w-25 mb-3 ml-4 inline-flex items-center justify-center rounded-md bg-[#9F4FDD]  hover:shadow-lg hover:shadow-[#9F4FDD]/50  py-4 px-10 font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10"
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
                                            <button className="dark:text-white rounded-md hover:bg-success hover:text-white  hover:shadow-lg hover:shadow-success/50 py-1 px-3 " onClick={() => handleEdit(item)}>Edit</button>
                                            <button className="dark:text-white text-danger rounded-md hover:bg-danger hover:text-white  hover:shadow-lg hover:shadow-danger/50 py-1 px-3" onClick={() => deleteWord(item.id)}>Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {editWordId && (
                        <div className="mt-4">
                            <h4>Edit Blacklisted Word</h4>
                            <input
                                type="text"
                                value={editWord}
                                onChange={(e) => setEditWord(e.target.value)}
                                placeholder="Edit word"
                                className="mb-2 w-full border-[1.5px] border-stroke py-3 px-5"
                            />
                            <input
                                type="text"
                                value={editDescription}
                                onChange={(e) => setEditDescription(e.target.value)}
                                placeholder="Edit description"
                                className="mb-2 w-full border-[1.5px] border-stroke py-3 px-5"
                            />
                            <button onClick={updateWord} className="mt-2 rounded-md bg-primary px-4 py-2 text-white">Save</button>
                        </div>
                    )}

                    <div className="mt-4 flex justify-between">
                        <button
                            onClick={() => setCurrentPage(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="py-2 px-4 bg-gray-300 rounded-md disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <span>Page {currentPage} of {totalPages}</span>
                        <button
                            onClick={() => setCurrentPage(currentPage + 1)}
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
