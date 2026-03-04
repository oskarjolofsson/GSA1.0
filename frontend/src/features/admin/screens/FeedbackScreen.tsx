import { useFeedback } from "@/features/feedback/hooks/useFeedback";

export default function FeedbackScreen() {
    const { getAll } = useFeedback();
    console.log(getAll());

    return (
        <></>
    )
}