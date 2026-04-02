


export function getStatus ( delta: number | null) {
    if (delta === null) {
        return "No data";
    }

    if (delta > 0) {
        return "Improving";
    }

    if (delta < 0) {
        return "Needs attention";
    }

    return "Stalling";
}