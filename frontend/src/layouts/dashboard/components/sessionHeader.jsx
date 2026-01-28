

export default function sessionHeader() {

    // Session-header placed on top of the screen
    // Share-button on the right side
    return (
        <div className="h-16 border-b border-l border-white/10 rounded-l-xl flex items-center justify-end px-6 w-full ml-2">
            
            {/* Share TODO implement */}
            {/* <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <Upload size={20} className="text-white cursor-pointer hover:text-slate-300"/>
                    <span className="text-sm text-slate-300">Share</span>
                </div>
                
            </div> */}

        </div>
    );
}