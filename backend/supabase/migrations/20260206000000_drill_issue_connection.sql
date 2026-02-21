

CREATE TABLE issue_drill (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    drill_id UUID NOT NULL REFERENCES drills(id) ON DELETE CASCADE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (issue_id, drill_id)
);

CREATE INDEX idx_issue_drill_issue_id ON issue_drill(issue_id);
CREATE INDEX idx_issue_drill_drill_id ON issue_drill(drill_id);