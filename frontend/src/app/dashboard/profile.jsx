import GeneralProfile from "../../components/profile/general";
import LogOutButton from "../../components/profile/logOutButton";

export default function Profile() {
  return (
    <div className="relative w-full max-w-3xl mx-auto px-2 sm:px-4 mb-12">

      {/* Main content */}
      <div className="">
        <GeneralProfile />
        {/* <SubscriptionPlan /> */}
      </div>
    </div>
  );
}
