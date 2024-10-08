import CardFour from '../../components/CardFour.tsx';
import CardOne from '../../components/CardOne.tsx';
import CardThree from '../../components/CardThree.tsx';
import CardTwo from '../../components/CardTwo.tsx';
import ChartOne from '../../components/ChartOne.tsx';
import DailyVolume from '../../components/CustomComponents/DailyVolumeCalls.tsx';
import ChartOnes from '../../components/ChartTwo.tsx';

// import ChartThree from '../../components/ChartThree.tsx';
// import ChartTwo from '../../components/ChartTwo.tsx';
// import ChatCard from '../../components/ChatCard.tsx';
// import MapOne from '../../components/MapOne.tsx';
// import TableOne from '../../components/TableOne.tsx';
// import FeedbackChart from '../../components/FeedbackChart.tsx';
// import RatingChart from '../../components/RatingChart.tsx';

import AverageDuration from '../../components/Cards/AverageDuration.tsx';

const Dasboard = () => {
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
        {/* MONTHLY VOLUME */}
        <ChartOne />

        {/* WEEKLY VOLUME */}
        <ChartOnes />
        <DailyVolume />

        {/* REASONS ANALYSIS */}
        {/* <ChartThree /> */}

        {/* FEEDBACK CHART */}
        {/* <FeedbackChart /> */}

        {/* RATING CHART */}
        {/* <RatingChart /> */}

        {/* MAP USA */}
        {/* <MapOne /> */}


        <div className="col-span-12 xl:col-span-12">
          {/* TOP CHANNELS */}
          {/* TO TRANSFER ANOTHER PAGE */}
          {/* <TableOne /> */}
        </div>

        {/* CHATS */}
        {/* <ChatCard /> */}

      </div>
    </>
  );
};

export default Dasboard;
