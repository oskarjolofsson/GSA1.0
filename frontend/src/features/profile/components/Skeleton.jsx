export default function Skeleton({ width = 'w-20', height = 'h-4' }) {
    return (
        <span className={`inline-block ${width} ${height} rounded bg-white/20 animate-pulse align-middle`} />
    );
}
