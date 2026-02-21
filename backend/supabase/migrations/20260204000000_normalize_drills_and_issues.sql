-- Create drills reference table
CREATE TABLE drills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    title TEXT NOT NULL,
    task TEXT NOT NULL,
    success_signal TEXT NOT NULL,
    fault_indicator TEXT NOT NULL,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create issues reference table
CREATE TABLE issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    title TEXT NOT NULL,
    
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
    
    severity TEXT CHECK (severity IN ('MINOR', 'MODERATE', 'MAJOR')),
    
    current_motion TEXT,
    expected_motion TEXT,
    swing_effect TEXT,
    shot_outcome TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add drill_id foreign key to analysis_drills
ALTER TABLE analysis_drills 
    ADD COLUMN drill_id UUID REFERENCES drills(id) ON DELETE CASCADE;

-- Add issue_id foreign key to analysis_issues
ALTER TABLE analysis_issues 
    ADD COLUMN issue_id UUID REFERENCES issues(id) ON DELETE CASCADE;

-- Drop old denormalized columns from analysis_drills
ALTER TABLE analysis_drills 
    DROP COLUMN title,
    DROP COLUMN task,
    DROP COLUMN success_signal,
    DROP COLUMN fault_indicator;

-- Drop old denormalized columns from analysis_issues
ALTER TABLE analysis_issues 
    DROP COLUMN issue_code,
    DROP COLUMN phase,
    DROP COLUMN severity,
    DROP COLUMN current_motion,
    DROP COLUMN expected_motion,
    DROP COLUMN swing_effect,
    DROP COLUMN shot_outcome;

-- Make foreign keys NOT NULL
ALTER TABLE analysis_drills 
    ALTER COLUMN drill_id SET NOT NULL;

ALTER TABLE analysis_issues 
    ALTER COLUMN issue_id SET NOT NULL;

-- Create indexes for better query performance
CREATE INDEX idx_drills_title ON drills(title);
CREATE INDEX idx_issues_title ON issues(title);
CREATE INDEX idx_issues_phase ON issues(phase);
CREATE INDEX idx_analysis_drills_drill_id ON analysis_drills(drill_id);
CREATE INDEX idx_analysis_issues_issue_id ON analysis_issues(issue_id);
