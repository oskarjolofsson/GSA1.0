import type { FaqItem } from "./types";

/**
 * Questions ported from frontend/src/features/landing/components/faq.jsx.
 * ANSWERS REWRITTEN — the originals predate the "not an AI coach" pivot and
 * led with "advanced AI analyses your swing", promised a "personal coach
 * available 24/7", pitched beginners, and claimed desktop support.
 *
 * Rules for editing this file:
 *   - Never lead with AI. It stays backstage: diagnosis and plan generation.
 *   - The promise is adherence, not accuracy. No claim about how correct the
 *     analysis is, and no video-derived score.
 *   - Audience is the 15-5 handicap golfer who already knows their fault.
 *     Not beginners, not coaches.
 *
 * This array is the single source for the rendered FAQ and the FAQPage JSON-LD.
 * Changing it changes both.
 */
export const FAQ: readonly FaqItem[] = [
  {
    id: "what-does-trueswing-do",
    q: "What does TrueSwing do?",
    a: "It turns one swing fault into a practice program you can follow. You start from a swing video, your coach's notes, or the drill library, and TrueSwing builds an ordered sequence of sessions that tells you what to work on each time you practise.",
  },
  {
    id: "how-is-this-different",
    q: "How is this different from other golf apps?",
    a: "Most apps analyse your swing and hand you a list of drills. TrueSwing gives you a program that also sends you to the course, with prescribed on-course sessions between range sessions. Grooving a move on the range is not the same as owning it on the first tee, and the program treats that gap as part of the work.",
  },
  {
    id: "do-i-need-to-know-my-swing-fault",
    q: "Do I need to already know what's wrong with my swing?",
    a: "No, but it helps. Most people who use TrueSwing have been told their fault years ago and have never fixed it. If you do know, paste your coach's notes or pick it from the library and start immediately. If you don't, upload a swing and TrueSwing will suggest one thing to work on.",
  },
  {
    id: "is-this-an-ai-coach",
    q: "Is this an AI coach?",
    a: "No. AI is used backstage to help identify an issue and build the plan, and that's where it stops. There's no AI score on your swing and nothing grading each shot, because single-video scoring isn't reliable enough to build a habit on. What the app measures is whether you showed up and did the block.",
  },
  {
    id: "how-do-i-know-its-working",
    q: "How do I know it's working?",
    a: "Two ways. A contribution graph and streak show you the sessions you've actually completed, which is the honest measure of whether you're practising. Then every few sessions the program asks for a fresh video of the same swing, so you can watch your swing now against your swing then, side by side.",
  },
  {
    id: "can-i-use-my-coachs-feedback",
    q: "Can I use feedback from my own coach?",
    a: "Yes. Paste your lesson notes and TrueSwing structures them into an issue and drills you can run as a program. It formats your coach's wording, it doesn't reinterpret or overrule it, and you review and confirm everything before it becomes a program.",
  },
  {
    id: "how-much-time-does-it-take",
    q: "How much time does a session take?",
    a: "A range session is a focused block on one thing, not a full bucket of mixed practice. The point is that it's small enough to actually do on a weekday evening. On-course sessions are a normal round or nine holes with one specific focus.",
  },
  {
    id: "what-videos-can-i-upload",
    q: "What kind of video can I upload?",
    a: "A short clip of a single swing, filmed on your phone, vertical or horizontal. Common formats like MP4 and MOV work. You don't need a launch monitor or any special setup.",
  },
  {
    id: "is-my-data-safe",
    q: "Is my data safe?",
    a: "Your videos and account data are encrypted and never shared without your consent. Issues and drills you create yourself are private to your account by default and are not added to the shared library.",
  },
  {
    id: "what-if-i-need-help",
    q: "What if I need help?",
    a: "Email team@trueswing.se and a real person will answer. There's also a Discord where you can ask questions and see what other golfers are working on.",
  },
];
