export default function sessionHeader() {

    // Session-header placed on top of the screen
    // Share-button on the right side
    return (
        <div className="h-16 bg-[#0e1428]/80 backdrop-blur-md border-b border-white/10 shadow-[0_2px_10px_-2px_rgba(0,0,0,0.6)] flex items-center justify-between px-6 w-full">
            <h1 className="text-lg font-semibold text-white">Dashboard Header</h1>
        </div>
    );
}