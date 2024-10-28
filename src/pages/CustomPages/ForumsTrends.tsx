
import TopForumsTable from '../../components/ForumDataVisual/TopForumsTable';
import TotalForumsCard from '../../components/Cards/TopForumCards/TotalForums';
import TotalPostsCard from '../../components/Cards/TopForumCards/TotalPost';
import TotalPostWeekCard from '../../components/Cards/TopForumCards/TotalPostWeek';
import TotalPostMonthCard from '../../components/Cards/TopForumCards/TotalPostMonth';


// import FeedbackChart from '../../components/FeedbackChart.tsx';


const CallerFeedback = () => {
    return (
        <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4 2xl:gap-7.5">
                <TotalForumsCard />
                <TotalPostsCard />
                <TotalPostWeekCard />
                <TotalPostMonthCard />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 md:mt-6 md:gap-6 2xl:mt-7.5 2xl:gap-7.5">
                {/* FEEDBACK CHART */}
                {/* <FeedbackChart /> */}
                <TopForumsTable />
            </div>
        </>
    );
};

export default CallerFeedback;
 