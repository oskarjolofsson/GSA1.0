import AsyncStorage from "@react-native-async-storage/async-storage";

import { apiClient } from "lib/apiClient";
import { routes } from "lib/api/routes";
import type { Schemas } from "lib/api/types";

// The vocabulary the library navigates. Nothing here is hardcoded in the app --
// a local copy is what silently desynced shipped builds from admin edits.
export type Taxonomy = Schemas["TaxonomyResponse"];
export type TaxonomyTerm = Schemas["TaxonomyTermSchema"];
export type TaxonomyMiss = Schemas["TaxonomyMissSchema"];

/** Bump when the response shape changes. A blob written by an older binary is
 *  then discarded rather than rendered, which is the only way to avoid
 *  `undefined` labels (or a throw inside render) on the offline path -- the one
 *  path where that failure is hardest to reproduce and debug. */
export const TAXONOMY_CACHE_VERSION = 1;
export const TAXONOMY_CACHE_KEY = `taxonomy.v${TAXONOMY_CACHE_VERSION}`;

type CacheEnvelope = { version: number; data: Taxonomy };

function isTerm(value: unknown): boolean {
    if (!value || typeof value !== "object") return false;
    const term = value as Record<string, unknown>;
    return typeof term.key === "string" && typeof term.golfer_label === "string";
}

/** Shape guard, not a full validator: it checks the fields the screens actually
 *  read, so a partial or foreign blob is treated as no cache at all. */
function isTaxonomy(value: unknown): value is Taxonomy {
    if (!value || typeof value !== "object") return false;
    const tax = value as Record<string, unknown>;
    if (!Array.isArray(tax.areas) || !tax.areas.every(isTerm)) return false;
    if (!Array.isArray(tax.goals) || !tax.goals.every(isTerm)) return false;
    if (!tax.misses_by_area || typeof tax.misses_by_area !== "object") return false;
    return Object.values(tax.misses_by_area as Record<string, unknown>).every(
        (misses) => Array.isArray(misses) && misses.every(isTerm)
    );
}

/** The cached copy, or null when there isn't a usable one. Never throws: a
 *  storage or parse failure has to degrade to "no cache", because this is the
 *  fallback path and it cannot itself be the thing that breaks the screen. */
export async function readCachedTaxonomy(): Promise<Taxonomy | null> {
    try {
        const raw = await AsyncStorage.getItem(TAXONOMY_CACHE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as Partial<CacheEnvelope>;
        if (parsed?.version !== TAXONOMY_CACHE_VERSION) return null;
        return isTaxonomy(parsed.data) ? parsed.data : null;
    } catch {
        return null;
    }
}

/** Fetch and write through to the cache. The write is best-effort -- a full disk
 *  should cost the offline win, not the request the golfer is waiting on. */
export async function fetchTaxonomy(): Promise<Taxonomy> {
    const data = await apiClient.get<Taxonomy>(routes.taxonomy.root);
    try {
        const envelope: CacheEnvelope = { version: TAXONOMY_CACHE_VERSION, data };
        await AsyncStorage.setItem(TAXONOMY_CACHE_KEY, JSON.stringify(envelope));
    } catch {
        // Cache is an optimisation; the response is already in hand.
    }
    return data;
}
