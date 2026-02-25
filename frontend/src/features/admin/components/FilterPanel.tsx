import { ReactNode } from 'react';

export interface FilterPanelProps {
    show: boolean;
    children: ReactNode;
}

export default function FilterPanel({ show, children }: FilterPanelProps) {
    if (!show) {
        return null;
    }

    return (
        <div className="mb-4 p-4 bg-[#0b1020] border border-white/10 rounded-lg">
            <div className="flex flex-wrap gap-4">
                {children}
            </div>
        </div>
    );
}
