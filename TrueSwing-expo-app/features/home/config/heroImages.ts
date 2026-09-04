import type { ImageSourcePropType } from 'react-native';

/**
 * The photographs that can head the home screen.
 *
 * Add to this list and nothing else changes. A bundled image must be `require`d with a
 * literal path (Metro resolves at build time, so a variable will not work); a remote one is
 * `{ uri }`.
 *
 * Wanted: a wide landscape with a calm upper third -- the greeting and avatar sit there and
 * must clear 4.5:1 -- and no bright hotspot top-right, where the avatar lands. The scrim
 * fades the base into `ink`, so the bottom is free to be busy.
 */
export const HERO_IMAGES: ImageSourcePropType[] = [
  require('../../../assets/hero/klittor.webp'),
  require('../../../assets/hero/hero3.webp'),
  require('../../../assets/hero/hero4.webp'),
  require('../../../assets/hero/hero5.webp'),
  require('../../../assets/hero/hero6.webp'),
  require('../../../assets/hero/hero7.webp'),
  require('../../../assets/hero/hero8.webp')
];

/**
 * One of `HERO_IMAGES`, picked uniformly at random. Call once per mount, not per render.
 * Returns null for an empty list, which HomeHero renders as plain `ink`.
 */
export function pickHeroImage(): ImageSourcePropType | null {
  if (HERO_IMAGES.length === 0) return null;
  return HERO_IMAGES[Math.floor(Math.random() * HERO_IMAGES.length)];
}
