import { Image, type ImageProps } from "expo-image";

// Thin wrapper around expo-image's Image that disk-caches remote images by
// default, so avatars and analysis thumbnails are downloaded once and served
// from disk thereafter (instead of re-fetching on every mount with the RN
// Image component). Use this for any remote `uri` source. One place to tune
// caching for the whole app.
export default function CachedImage(props: ImageProps) {
    return (
        <Image
            cachePolicy="memory-disk"
            transition={150}
            {...props}
        />
    );
}
