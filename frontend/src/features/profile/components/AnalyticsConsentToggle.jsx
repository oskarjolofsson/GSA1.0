import { useConsentToggle } from '../hooks/useConsentToggle.js';
import Skeleton from './Skeleton.jsx';

export default function AnalyticsConsentToggle() {
    const {
        consent,
        effectiveConsent,
        hasChanges,
        isSaving,
        handleToggle,
        handleSave,
        handleCancel,
    } = useConsentToggle();

    return (
        <div className="">
            <div className="w-full">
                <h3 className="text-base font-semibold text-white mb-2">Improve your experience</h3>
                <p className="text-sm text-gray-400 mb-4">
                    Enable anonymous analytics to help us improve performance, accuracy, and features.
                    <br />
                    This is optional and can be disabled at any time.
                </p>

                {consent === null ? (
                    <Skeleton width="w-16" />
                ) : (
                    <>
                        <label className="inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="form-checkbox h-5 w-5 text-emerald-500"
                                checked={!!effectiveConsent}
                                onChange={handleToggle}
                                disabled={isSaving}
                            />
                            <span className="ml-2 text-white">
                                {effectiveConsent ? 'Enabled' : 'Disabled'}
                            </span>
                        </label>

                        {hasChanges && (
                            <div className="flex gap-2 mt-3">
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/50 text-white text-sm rounded-lg transition-colors"
                                >
                                    {isSaving ? 'Saving...' : 'Save'}
                                </button>
                                <button
                                    onClick={handleCancel}
                                    disabled={isSaving}
                                    className="px-4 py-2 bg-white/10 hover:bg-white/20 disabled:bg-white/10 text-white text-sm rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
