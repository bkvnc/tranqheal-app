import CardFour from '../../components/CardFour.tsx';
import CardOne from '../../components/CardOne.tsx';
import CardThree from '../../components/CardThree.tsx';
import CardTwo from '../../components/CardTwo.tsx';
import AverageDuration from '../../components/Cards/AverageDuration.tsx';


import RatingChart from '../../components/RatingChart.tsx';

const CallerFeedback = () => {
    return (
        <>
            {/* CARDS */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4 md:gap-6 xl:grid-cols-4 2xl:gap-7.5">
                <CardOne />
                <CardTwo />
                <AverageDuration />
                <CardFour />
            </div>

            <div className="mt-4 grid grid-cols-12 gap-4 md:mt-6 md:gap-6 2xl:mt-7.5 2xl:gap-7.5">
                {/* FEEDBACK CHART */}
                <RatingChart />
            </div>
        </>
    );
};

export default CallerFeedback;
