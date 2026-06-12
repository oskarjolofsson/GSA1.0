import { createContext, useContext } from "react";
import type { ReactNode } from "react";

import type { HomeAnalysisController } from "features/home/hooks/useHomeAnalysisController";

type HomeAnalysisContextValue = HomeAnalysisController;

const HomeAnalysisContext = createContext<HomeAnalysisContextValue | null>(null);

export function HomeAnalysisProvider({
    value,
    children,
}: {
    value: HomeAnalysisContextValue;
    children: ReactNode;
}) {
    return <HomeAnalysisContext.Provider value={value}>{children}</HomeAnalysisContext.Provider>;
}

export function useHomeAnalysis() {
    const context = useContext(HomeAnalysisContext);
    if (!context) {
        throw new Error("useHomeAnalysis must be used within HomeAnalysisProvider");
    }

    return context;
}
