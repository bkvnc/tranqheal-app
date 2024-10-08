import TotalResponderCard from '../../components/Cards/ResponderPerformance/TotalResponderCard.tsx';
import PendingResponderCard from '../../components/Cards/ResponderPerformance/PendingResponderCard.tsx';

import ResponderPerformanceTable from '../../components/ResponderPerformance/ResponderPerformanceTable.tsx';

const CallerFeedback = () => {
    return (
        <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-2 2xl:gap-7.5">
                <TotalResponderCard />
                <PendingResponderCard />
            </div>

            <div className="mt-4">
                {/* FEEDBACK CHART */}
                {/* <FeedbassckChart /> */}
                < ResponderPerformanceTable />
            </div>
        </>
    );
};

export default CallerFeedback;
 