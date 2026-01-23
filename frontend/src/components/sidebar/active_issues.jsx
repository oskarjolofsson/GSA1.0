

import ActiveIssueButton from "./active_issue_button";

export default function ActiveIssues() {

    const active_issues = [
        { id: 1, title: "Over The Top", progress: 70 },
        { id: 2, title: "Early Extension", progress: 45 },
        { id: 3, title: "Swaying", progress: 30 },
        { id: 3, title: "Swaying", progress: 30 },
        { id: 3, title: "Swaying", progress: 30 },

    ]

    return (
        <div className="w-full h-full flex flex-col gap-2 overflow-auto p-4">
            {active_issues.map((issue) => (
                <ActiveIssueButton
                    key={issue.id}
                    Title={issue.title}
                    progress={issue.progress}
                    onClick={() => console.log(`Clicked: ${issue.title}`)}
                />
            ))}
        </div>
    )
}