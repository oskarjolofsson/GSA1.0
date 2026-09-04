# The hero photo is the LCP element and is tuned around that

The full-viewport hero photo is the Largest Contentful Paint element on the page built to
rank in Google, which constrains how it may be loaded and animated.

## Consequences

It animates from 0.55 opacity, never from 0. Fading in from invisible defers when the
browser records the image as painted; the motion anyone actually notices is the staggered
text, which is not what gets measured.

`priority` plus explicit dimensions: it must not be lazy-loaded, and the reserved box
prevents layout shift.

`object-position` shifts per breakpoint. The crop that frames the phone at 1440 pushes it
off-screen at 375, so mobile pulls focus right — at 72% it showed only the dark bezel and
read as an abstract shape rather than an app. Verified at 375px; do not tune one
breakpoint without the other.
