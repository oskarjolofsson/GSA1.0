// Derives display initials for an avatar fallback.
// Prefers the name (first + last word), falls back to the email's first
// alphanumeric character, then to "?".
export function getInitials(
    name?: string | null,
    email?: string | null
): string {
    const trimmedName = name?.trim();
    if (trimmedName) {
        const words = trimmedName.split(/\s+/).filter(Boolean);
        const first = words[0]?.[0] ?? "";
        const last = words.length > 1 ? (words[words.length - 1]?.[0] ?? "") : "";
        const initials = (first + last).toUpperCase();
        if (initials) return initials;
    }

    const trimmedEmail = email?.trim();
    if (trimmedEmail) {
        const firstAlnum = trimmedEmail.match(/[a-z0-9]/i)?.[0];
        if (firstAlnum) return firstAlnum.toUpperCase();
    }

    return "?";
}
