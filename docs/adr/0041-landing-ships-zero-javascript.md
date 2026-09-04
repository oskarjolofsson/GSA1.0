# The landing page ships zero JavaScript

Every section is server-rendered and no component is a client component. The site is one
scrolling page plus two legal routes, so interactivity that would normally justify JS is
done in CSS instead.

## Consequences

`ScrollCue` is a plain anchor, not a button with a scroll handler: an on-page anchor gets
smooth scrolling free from `scroll-behavior: smooth` on `<html>`, works with JS disabled,
and is a real focusable link for keyboard and screen-reader users. Its visually-hidden
destination text is what makes the accessible name "Scroll to the problem" rather than a
bare, repeated "Scroll".

`Nav` is `position: fixed` with a gradient and backdrop-blur rather than scroll state.
The separator is a hairline *plus* a downward scrim: over a photo a bare line washes out
wherever the image brightens and the links lose contrast with it. This matters more than
it looks, because the hero image is intended to become video, whose brightness changes
shot to shot.

Adding a client component to this page is a decision to reverse, not a detail.
