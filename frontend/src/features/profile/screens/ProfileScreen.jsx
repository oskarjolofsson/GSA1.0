import { useAuth } from '../../../auth/authContext';
import InfoRow from '../components/InfoRow.jsx';
import AnalyticsConsentToggle from '../components/AnalyticsConsentToggle.jsx';

export default function ProfileScreen() {
    const { user, loading } = useAuth();

    return (
        <div className="relative w-full max-w-3xl mx-auto px-2 sm:px-4 mb-12">
            <div className="">
                <section className="relative w-full max-w-4xl mx-auto px-4 mt-[14vh] mb-12">
                    <div className="max-w-xl rounded-3xl bg-[#0e1428]/80 backdrop-blur-md border border-white/10 p-6 sm:p-10 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.6)] mx-auto">
                        <h2 className="text-lg font-semibold text-white mb-4">General Information</h2>

                        {/* Name */}
                        <InfoRow
                            label="Name"
                            isLoading={loading}
                            value={user?.displayName || '—'}
                        />

                        {/* Email */}
                        <InfoRow
                            label="Email address"
                            isLoading={loading}
                            value={user?.email || '—'}
                            className="mb-2"
                        />

                        {/* Helper text */}
                        <p className="text-sm text-gray-400 mb-4">
                            For any questions regarding your account, please contact support at{' '}
                            <a href="mailto:trueswing25@gmail.com">trueswing25@gmail.com</a>.
                        </p>

                        {/* Line */}
                        <hr className="border-white/10 my-6" />

                        <AnalyticsConsentToggle />
                    </div>
                </section>
            </div>
        </div>
    );
}
