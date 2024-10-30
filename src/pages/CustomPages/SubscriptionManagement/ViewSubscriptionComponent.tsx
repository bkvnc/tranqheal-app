


import SubscriptionComponent from '../../../components/SubscriptionManagement/SubscriptionComponent';

const Subscriptions = () => {
    return (
        <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4 2xl:gap-7.5">
                {/* <CardOne />
                <CardTwo />
                <CardThree />
                <CardFour /> */}
            </div>

            <div className="">
                <SubscriptionComponent/>
            </div>
        </>
    );
};

export default Subscriptions;
