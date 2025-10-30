import SubscriptionPlan from "../components/profile/plan";
import GeneralProfile from "../components/profile/general";
import LogOutButton from "../components/profile/logOutButton";

export default function Profile() {
    return (
        <div className="relative w-full max-w-3xl mx-auto px-2 sm:px-4 mt-20 space-y-12 mb-12">
            <GeneralProfile />
            <SubscriptionPlan />
            <LogOutButton />
        </div>
    );
}
