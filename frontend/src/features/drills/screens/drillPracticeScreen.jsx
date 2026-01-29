import ProgressBar from '../components/progressbar.jsx';
import MediaPlaceholder from '../components/media_placeholder.jsx';
import DrillExplainer from '../components/drill_explainer.jsx';
import Indicator from '../components/indicator.jsx';

// Libraries
import { useState } from 'react';

export default function DrillsPracticeScreen() {

    const total = 15;
    const [succeeded, setSucceeded] = useState(0);
    const [failed, setFailed] = useState(0);

    const handleFailure = () => {
        if (succeeded + failed < total) {
            setFailed(failed + 1);
        }
    };

    const handleSuccess = () => {
        if (succeeded + failed < total) {
            setSucceeded(succeeded + 1);
        }
    };

    return (
        <div className="h-screen text-slate-100 reminder flex flex-col overflow-hidden">
            <div className="w-full max-w-4xl mx-auto px-4 py-4 md:py-6 flex flex-col gap-4 md:gap-6 h-full animate-fade-in">

                <ProgressBar succeeded={succeeded} failed={failed} total={total} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 items-center flex-1 min-h-0">
                    <MediaPlaceholder />
                    <DrillExplainer />
                </div>

                <div className="grid grid-cols-2 gap-3 md:gap-6 w-full flex-shrink-0">
                    <Indicator
                        type="success"
                        title="Mark as Successful"
                        description="Indicate that you performed this drill successfully."
                        onClick={() => handleSuccess()}
                    />
                    <Indicator
                        type="failure"
                        title="Mark as Unsuccessful"
                        description="Indicate that you need more practice with this drill."
                        onClick={() => handleFailure()}
                    />

                </div>

            </div>
        </div>
    )
}