import RNFS from "react-native-fs";

export const CACHE_ROOT = `${RNFS.CachesDirectoryPath}/analysis-videos`;
const ORIG_DIR = `${CACHE_ROOT}/orig`;
const SCRUB_DIR = `${CACHE_ROOT}/scrub`;

export function scrubCachePath(analysisId: string): string {
    return `${SCRUB_DIR}/${analysisId}.mp4`;
}

export function originalCachePath(analysisId: string): string {
    return `${ORIG_DIR}/${analysisId}.mp4`;
}

export async function ensureCacheDirs(): Promise<void> {
    await RNFS.mkdir(ORIG_DIR);
    await RNFS.mkdir(SCRUB_DIR);
}

export async function fileExists(path: string): Promise<boolean> {
    try {
        return await RNFS.exists(path);
    } catch {
        return false;
    }
}

export type DownloadHandle = {
    jobId: number;
    promise: Promise<void>;
};

export function startDownload(url: string, dest: string): DownloadHandle {
    const job = RNFS.downloadFile({ fromUrl: url, toFile: dest });
    const promise = job.promise.then((res) => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
            throw new Error(`Download failed: HTTP ${res.statusCode}`);
        }
    });
    return { jobId: job.jobId, promise };
}

export function cancelDownload(jobId: number): void {
    try {
        RNFS.stopDownload(jobId);
    } catch {
        // best-effort
    }
}

export async function safeUnlink(path: string): Promise<void> {
    try {
        if (await RNFS.exists(path)) {
            await RNFS.unlink(path);
        }
    } catch {
        // best-effort
    }
}

export async function evictOldest(maxBytes: number): Promise<void> {
    try {
        const items = await RNFS.readDir(SCRUB_DIR);
        let total = items.reduce((acc, it) => acc + (it.size ?? 0), 0);
        if (total <= maxBytes) return;
        const byOldest = items
            .filter((it) => it.isFile())
            .sort((a, b) => {
                const am = a.mtime ? a.mtime.getTime() : 0;
                const bm = b.mtime ? b.mtime.getTime() : 0;
                return am - bm;
            });
        for (const it of byOldest) {
            if (total <= maxBytes) break;
            await safeUnlink(it.path);
            total -= it.size ?? 0;
        }
    } catch {
        // best-effort cache GC
    }
}
