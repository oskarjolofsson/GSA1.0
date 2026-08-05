import type { ImageSourcePropType } from 'react-native';

/**
 * The photographs that can head the home screen.
 *
 * Add to this list and nothing else changes — the screen picks one at random on
 * every mount. Two forms are accepted:
 *
 *   require("../../../assets/hero/name.jpg")   bundled with the app
 *   { uri: "https://…/name.jpg" }              fetched at runtime
 *
 * Bundled images have to be `require`d with a literal path (Metro resolves them
 * at build time, so a variable will not work); remote ones can be added freely.
 *
 * WHAT MAKES A GOOD ONE
 * A wide landscape with a calm region in the upper third, because the greeting
 * and the avatar sit on top of it and body text has to clear 4.5:1 against
 * whatever is behind it. Avoid a bright hotspot in the top-right: that is where
 * the avatar lands. The scrim in HomeHero fades the base into `ink`, so the
 * bottom of the picture is free to be busy.
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
 * One of `HERO_IMAGES`, picked uniformly at random.
 *
 * Called once per mount rather than per render, so the picture is stable while
 * the golfer is on the screen and changes when they come back to it. Returns
 * null for an empty list, which HomeHero renders as plain `ink` — a missing
 * photograph must never take the greeting down with it.
 */
export function pickHeroImage(): ImageSourcePropType | null {
  if (HERO_IMAGES.length === 0) return null;
  return HERO_IMAGES[Math.floor(Math.random() * HERO_IMAGES.length)];
}
