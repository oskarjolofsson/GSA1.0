// Mirrors the backend program schemas (app/api/v1/schemas/program.py).

export type SessionType = "range" | "play" | "retest";

export type DrillGradeValue = "rough" | "ok" | "dialed";

// Prescription shape varies by session_type; all fields optional here.
//   range:  { drill_ids, num_blocks, cue }
//   play:   { holes, focus }
//   retest: { instruction }
export interface Prescription {
    drill_ids?: string[];
    num_blocks?: number;
    cue?: string | null;
    holes?: number;
    focus?: string;
    instruction?: string;
}

export interface StepDrill {
    id: string;
    title: string;
}

export interface ProgramStep {
    id: string;
    program_id: string;
    order_index: number;
    session_type: SessionType;
    prescription: Prescription;
    status: "pending" | "completed" | "skipped";
    practice_session_id: string | null;
    // Range steps: drill ids resolved to {id, title} for display.
    drills: StepDrill[];
}

export interface Program {
    id: string;
    user_id: string;
    analysis_issue_id: string | null;
    // The issue this program grooves. Set for AI, coach, and browse seeded
    // programs; analysis_issue_id is only present for the AI path.
    issue_id: string | null;
    title: string;
    status: "active" | "completed" | "abandoned";
    created_at: string;
    grooved_count: number;
    total_drills: number;
    steps: ProgramStep[];
}

export interface DrillGrade {
    drill_id: string;
    grade: DrillGradeValue;
}

export interface CompleteStepBody {
    practice_session_id?: string | null;
    grades?: DrillGrade[];
}

export interface StepAdvance {
    completed_step: ProgramStep;
    next_step: ProgramStep | null;
    program_status: string;
    grooved_count: number;
    total_drills: number;
}

// Program context threaded into the practice flow when a range session is
// launched from a program (vs. the legacy issue-driven reel path).
export interface ProgramContext {
    programId: string;
    stepId: string;
    drillIds: string[];
}
