-- Create prompts table to store analysis prompts
CREATE TABLE prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id UUID NOT NULL REFERENCES analysis(id) ON DELETE CASCADE,

    prompt_shape TEXT,
    prompt_height TEXT,
    prompt_misses TEXT,
    prompt_extra TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (analysis_id)
);

CREATE INDEX idx_prompts_analysis_id ON prompts(analysis_id);

-- Add comment for documentation
COMMENT ON TABLE prompts IS 'Stores user-provided prompts for video analysis';
COMMENT ON COLUMN prompts.analysis_id IS 'Foreign key to analysis table';
COMMENT ON COLUMN prompts.prompt_shape IS 'User prompt about swing shape';
COMMENT ON COLUMN prompts.prompt_height IS 'User prompt about swing height';
COMMENT ON COLUMN prompts.prompt_misses IS 'User prompt about misses';
COMMENT ON COLUMN prompts.prompt_extra IS 'Additional user prompt';