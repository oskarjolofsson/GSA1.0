CREATE TABLE mandatory_consent (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    video_key TEXT NOT NULL,
    start_time INTERVAL,
    end_time INTERVAL,

    camera_view TEXT CHECK (camera_view IN ('unknown', 'face_on', 'down_the_line')),
    club_type TEXT CHECK (club_type IN ('unknown', 'iron', 'driver')),

    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    video_id UUID REFERENCES videos(id) ON DELETE SET NULL,

    model_version TEXT NOT NULL,

    status TEXT NOT NULL CHECK (
        status IN (
            'awaiting_upload',
            'processing',
            'completed',
            'failed'
        )
    ) DEFAULT 'awaiting_upload',

    success BOOLEAN,

    raw_output_json JSONB,

    error_message TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

CREATE TABLE analysis_issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id UUID NOT NULL REFERENCES analysis(id) ON DELETE CASCADE,

    issue_code TEXT NOT NULL,
    phase TEXT CHECK (
        phase IN (
            'SETUP',
            'BACKSWING',
            'TRANSITION',
            'DOWNSWING',
            'IMPACT',
            'FOLLOW_THROUGH'
        )
    ),

    impact_rank INTEGER NOT NULL CHECK (impact_rank >= 1),
    severity TEXT CHECK (severity IN ('MINOR', 'MODERATE', 'MAJOR')),
    confidence REAL CHECK (confidence >= 0.0 AND confidence <= 1.0),

    current_motion TEXT,
    expected_motion TEXT,
    swing_effect TEXT,
    shot_outcome TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (analysis_id, impact_rank)
);

CREATE TABLE analysis_drills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_issue_id UUID NOT NULL REFERENCES analysis_issues(id) ON DELETE CASCADE,

    title TEXT NOT NULL,
    task TEXT NOT NULL,
    success_signal TEXT NOT NULL,
    fault_indicator TEXT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE user_consent (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    mandatory_consent_id UUID NOT NULL REFERENCES mandatory_consent(id),

    granted BOOLEAN NOT NULL,
    granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    ip_address INET,
    user_agent TEXT,

    PRIMARY KEY (user_id, mandatory_consent_id)
);

CREATE INDEX idx_videos_user_id ON videos(user_id);
CREATE INDEX idx_analysis_video_id ON analysis(video_id);
CREATE INDEX idx_analysis_issues_issue_code ON analysis_issues(issue_code);
CREATE INDEX idx_analysis_issues_confidence ON analysis_issues(confidence);
CREATE INDEX idx_analysis_issues_created_at ON analysis_issues(created_at);
