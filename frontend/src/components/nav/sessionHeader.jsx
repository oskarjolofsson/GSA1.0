import { Upload } from "lucide-react";
import DropDown from "./DropDown.jsx";

export default function sessionHeader() {

    // Session-header placed on top of the screen
    // Share-button on the right side
    return (
        <div className="h-16  flex items-center justify-end px-6 w-full">
            
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <Upload size={20} className="text-white cursor-pointer hover:text-slate-300"/>
                    <span className="text-sm text-slate-300">Share</span>
                </div>
                
                <DropDown />
            </div>

        </div>
    );
}