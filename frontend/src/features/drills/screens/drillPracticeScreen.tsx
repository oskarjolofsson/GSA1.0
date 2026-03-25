import ProgressBar from '../components/practicePage/progressbar.jsx';
import DrillExplainer from '../components/practicePage/drill_explainer.js';
import Indicator from '../components/practicePage/indicator.jsx';
import { ErrorState, } from '@/shared/components/cards/error.js';
import { LoadingState } from '@/shared/components/cards/loading.js';
import { usePracticeScreenState } from '../hooks/usePracticeScreenState.js';
import { useSearchParams } from 'react-router-dom';


export default function DrillsPracticeScreen() {
    const [searchParams] = useSearchParams();
    const issueId = searchParams.get('issueId');
    const { activeDrill, remainingDrillsCount, practiceReady, progress, handleSuccess, handleFailure, loading, error } =
        usePracticeScreenState(issueId || '');

    if (!issueId) {
        return <ErrorState title="Issue Not Found" error={new Error('Issue ID is required to load drills')} onRetry={() => window.location.reload()} />;
    }

    if (loading) {
        return (
            <LoadingState title="Loading Drills" message="Fetching drills for this issue..." />
        );
    }

    if (error) {
        return <ErrorState title="Failed to Load Drills" error={new Error(error)} onRetry={() => window.location.reload()} />;
    }

    if (!activeDrill) {
        return <ErrorState title="No Drills Found" error={new Error('No drills are available for this issue.')} onRetry={() => window.location.reload()} />;
    }

    return (
        <div className="h-screen text-slate-100 reminder flex flex-col overflow-hidden">
            <div className="w-full max-w-4xl mx-auto px-4 py-3 xs:py-4 md:py-6 flex flex-col gap-2 xs:gap-3 md:gap-6 h-full animate-fade-in">

                <div className='mt-12 md:mt-2'>
                    <ProgressBar succeeded={progress.succeeded} failed={progress.failed} total={progress.total} />
                </div>
                

                <div className="grid grid-cols-1 items-center flex-1 min-h-0 mx-auto ">
                    {/* <div className="hidden 4xl:block">
                        <MediaPlaceholder />
                    </div> */}

                    <DrillExplainer
                        title={activeDrill.title}
                        description={activeDrill.task}
                    />
                </div>

                <div className="grid grid-cols-2 gap-2 xs:gap-3 md:gap-6 w-full flex-shrink-0">
                    <Indicator
                        type="success"
                        title="Mark as Successful"
                        description={activeDrill.success_signal}
                        onClick={handleSuccess}
                        disabled={!practiceReady}
                    />
                    <Indicator
                        type="failure"
                        title="Mark as Unsuccessful"
                        description={activeDrill.fault_indicator}
                        onClick={handleFailure}
                        disabled={!practiceReady}
                    />

                </div>

            </div>
        </div>
    )
}