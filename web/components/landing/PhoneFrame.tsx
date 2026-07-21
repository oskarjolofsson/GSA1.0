import Image from "next/image";

/**
 * Device frame for app screenshots.
 *
 * PLACEHOLDER ASSETS: public/screenshots/* do not exist yet — see the plan's
 * open dependency #2 (real device captures of the contribution-graph home, a
 * program step, and a side-by-side re-test). The frame is built so dropping in
 * real captures needs no layout change.
 *
 * `unoptimized` is forced globally by next.config.ts (required under
 * `output: "export"`), so width/height are explicit to avoid layout shift.
 */
export function PhoneFrame({
  src,
  alt,
  priority = false,
}: {
  src: string;
  alt: string;
  priority?: boolean;
}) {
  return (
    <div className="relative mx-auto w-full max-w-[280px]">
      <div className="overflow-hidden rounded-[2.5rem] border-[6px] border-ink-raised bg-ink-raised shadow-2xl shadow-black/40">
        <Image
          src={src}
          alt={alt}
          width={280}
          height={606}
          priority={priority}
          className="h-auto w-full"
        />
      </div>
    </div>
  );
}
