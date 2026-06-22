// Shared animation tokens for the home screen, so motion stays consistent
// across the logo, card, streak, and issue switcher.

export const HOME_ANIM = {
    // Entrance timings (ms).
    logoFade: 400,
    cardDelay: 120,
    countUp: 700,
    countUpDelay: 80,

    // Grid stagger.
    gridCellStep: 40, // delay between cells (ms)

    // Issue switch.
    issueSlide: 18, // px the title slides in from
    swipeThreshold: 50, // px before a pan counts as a swipe

    // Button press.
    pressScale: 0.97,
} as const;

// Spring used for the card slide-up — soft, premium, no overshoot wobble.
export const CARD_SPRING = {
    type: "spring",
    damping: 18,
    stiffness: 180,
    mass: 0.9,
} as const;
