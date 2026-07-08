import { Directory, File, Paths } from "expo-file-system";

const CACHE_DIR = new Directory(Paths.cache, "analysis-videos");
const ORIG_DIR = new Directory(CACHE_DIR, "orig");
const SCRUB_DIR = new Directory(CACHE_DIR, "scrub");

export const CACHE_ROOT = CACHE_DIR.uri;

export function scrubCachePath(analysisId: string): string {
    return new File(SCRUB_DIR, `${analysisId}.mp4`).uri;
}

export function originalCachePath(analysisId: string): string {
    return new File(ORIG_DIR, `${analysisId}.mp4`).uri;
}

export async function ensureCacheDirs(): Promise<void> {
    ORIG_DIR.create({ intermediates: true, idempotent: true });
    SCRUB_DIR.create({ intermediates: true, idempotent: true });
}

export async function fileExists(path: string): Promise<boolean> {
    try {
        return new File(path).exists;
    } catch {
        return false;
    }
}

export type DownloadHandle = {
    cancel: () => void;
    promise: Promise<void>;
};

export function startDownload(url: string, dest: string): DownloadHandle {
    // expo-file-system (SDK 55) has no cancellable download task; the transfer
    // runs to completion. Callers signal intent to cancel via their own flag and
    // clean up the orphaned file (see safeUnlink in the consumer's cleanup).
    const promise = File.downloadFileAsync(url, new File(dest)).then(() => {});
    return {
        cancel: () => {
            // best-effort: no native abort available in this API
        },
        promise,
    };
}

export async function safeUnlink(path: string): Promise<void> {
    try {
        const file = new File(path);
        if (file.exists) {
            file.delete();
        }
    } catch {
        // best-effort
    }
}

export async function evictOldest(maxBytes: number): Promise<void> {
    try {
        const files = SCRUB_DIR.list().filter(
            (it): it is File => it instanceof File,
        );
        let total = files.reduce((acc, f) => acc + (f.size ?? 0), 0);
        if (total <= maxBytes) return;
        const byOldest = files.sort((a, b) => {
            const am = a.modificationTime ?? 0;
            const bm = b.modificationTime ?? 0;
            return am - bm;
        });
        for (const f of byOldest) {
            if (total <= maxBytes) break;
            const size = f.size ?? 0;
            await safeUnlink(f.uri);
            total -= size;
        }
    } catch {
        // best-effort cache GC
    }
}
