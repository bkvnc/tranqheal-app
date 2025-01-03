// import CardFour from '../../../components/CardFour.tsx';
// import CardOne from '../../../components/CardOne.tsx';
// import CardThree from '../../../components/CardThree.tsx';
// import CardTwo from '../../../components/CardTwo.tsx';


import ForumReports from "../../../components/ForumManagement/ForumReports";
import SuspendedUsers from "../../../components/Cards/BannedUserCards/SuspendedUsers";
import UserTable from "../../../components/UserManagement/UserTable";

const ViewForumReports = () => {
    return (
        <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4 2xl:gap-7.5">
                {/* <CardOne />
                <CardTwo />
                <CardThree />
                <CardFour /> */}
            </div>

            <div className="">
                {/* ALL RESOURCES TABLE */}
                
                <UserTable />
               

            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-2 2xl:gap-7.5 pt-2">
            <ForumReports  />
            <SuspendedUsers />
            </div>
        </>
    );
};

export default ViewForumReports;
