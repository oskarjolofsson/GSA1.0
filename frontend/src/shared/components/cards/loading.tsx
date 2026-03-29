import { useState, CSSProperties } from "react";
import { ClipLoader } from "react-spinners";

const override: CSSProperties = {
  display: "block",
  margin: "0 auto",
  borderColor: "white",
};

interface LoadingStateProps {
    title: string;
    message?: string;
}

/**
 * Reusable loading state component for admin screens
 */
export function LoadingState({ title, message }: LoadingStateProps) {
    const [color, setColor] = useState<string>("#ffffff");

    return (
        <div className="p-10 text-center">
    <div className="text-3xl font-bold mb-6 text-white ml-6">{title}</div>

    <div className="w-full flex justify-center mt-8">
      <div className="flex flex-col items-center justify-center gap-4">
        <ClipLoader
          color={color}
          size={25}
          aria-label="Loading Spinner"
          data-testid="loader"
        />
        <p className="text-white/60">{message || "Loading..."}</p>
      </div>
    </div>
  </div>
    );
}