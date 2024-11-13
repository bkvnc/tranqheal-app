

import BannedUsers from '../../components/Cards/BannedUserCards/BannedUsers';
import SuspendedUsers from '../../components/Cards/BannedUserCards/SuspendedUsers';
import UserTable from '../../components/UserManagement/UserTable';




const BannedSuspendedUsers = () => {
    return (
        <>
          
            <div className="mt-4 grid grid-cols-1 gap-4 md:mt-6 md:gap-6 2xl:mt-7.5 2xl:gap-7.5">
                <UserTable />
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-2 2xl:gap-7.5 pt-2">
                <BannedUsers />
                <SuspendedUsers />
            </div>

        </>
    );
};

export default BannedSuspendedUsers;
 