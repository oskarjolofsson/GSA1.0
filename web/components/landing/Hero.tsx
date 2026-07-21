import { HERO } from "@/content/landing";
import { AppStoreButton } from "./AppStoreButton";
import { PhoneFrame } from "./PhoneFrame";

export function Hero() {
  return (
    <header className="mx-auto w-full max-w-5xl px-6 pt-20 pb-16 sm:pt-28">
      <div className="grid items-center gap-12 md:grid-cols-[1.1fr_1fr]">
        <div>
          {/*
            The only <h1> on the page, and it is the positioning line itself.
            Do not soften it into a feature description — the claim IS the pitch.
          */}
          <h1 className="font-display text-4xl leading-tight font-bold tracking-tight text-balance text-sand sm:text-5xl">
            {HERO.headline}
          </h1>

          <p className="mt-6 max-w-md text-lg text-sand-dim">{HERO.support}</p>

          <div className="mt-9">
            <AppStoreButton section="hero" />
          </div>
        </div>

        <PhoneFrame
          src="/screenshots/home.svg"
          alt={HERO.screenshotAlt}
          priority
        />
      </div>
    </header>
  );
}
