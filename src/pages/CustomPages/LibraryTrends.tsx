import MostAccessResourceCategoryChart from '../../components/LibraryDataVisual/MostAccessResourceCategory.tsx';
import MostAccessSpecificResourceChart from '../../components/LibraryDataVisual/MostAccessResourceSpecific.tsx';
import TotalResourcesCard from '../../components/Cards/ResourceCards/TotalResourcesCard.tsx';
import PublishedResourcesMonthCard from '../../components/Cards/ResourceCards/PublishedThisMonthCard.tsx';

const CallerFeedback = () => {
    return (
        <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-2 2xl:gap-7.5">
                <TotalResourcesCard />
                <PublishedResourcesMonthCard />
            </div>

            <div className="grid grid-cols-12 gap-4 md:gap-6 2xl:gap-7.5 mt-5">
                <div className="col-span-6 xl:grid-cols-2">
                    <MostAccessSpecificResourceChart />
                </div>
                <div className="col-span-6 xl:grid-cols-2">
                    <MostAccessResourceCategoryChart />
                </div>
            </div>
        </>
    );
};

export default CallerFeedback;
