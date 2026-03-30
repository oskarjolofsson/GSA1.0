import { useNavigate } from "react-router-dom";

type EmotionalHookSectionProps = {
    imageUrl?: string | null;
};

export default function EmotionalHookSection({
    imageUrl = "/media/klittor.jpg",
}: EmotionalHookSectionProps) {
    const navigate = useNavigate();

    const emotionalLines = [
        "Straighter shots that hold their line.",
        "Cleaner contact you can feel instantly.",
        "More confidence every time you stand over the ball.",
    ];

    return (
        <section className="relative px-5 py-16 text-white sm:px-8 sm:py-20 lg:px-12">
            <div className="mx-auto max-w-7xl">
                <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 shadow-[0_20px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:rounded-[2.5rem]">
                    <div className="relative min-h-[440px] sm:min-h-[520px] lg:min-h-[620px]">
                        {imageUrl ? (
                            <div className="absolute inset-0 overflow-hidden">
                                <img
                                    src={imageUrl}
                                    alt="Golfer hitting a clean shot at golden hour"
                                    className="h-full w-full object-cover scale-[1.04] motion-safe:animate-[slowZoom_14s_ease-in-out_infinite_alternate]"
                                />
                            </div>
                        ) : (
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_25%,rgba(251,191,36,0.22),transparent_18%),radial-gradient(circle_at_62%_36%,rgba(251,191,36,0.12),transparent_26%),linear-gradient(180deg,rgba(2,6,23,0.55),rgba(2,6,23,0.12)_35%,rgba(2,6,23,0.5)_70%,rgba(2,6,23,0.88)),linear-gradient(135deg,rgba(15,23,42,1),rgba(30,41,59,0.88),rgba(6,10,20,1))]" />
                        )}

                        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(2,6,23,0.88),rgba(2,6,23,0.35)_34%,rgba(2,6,23,0.45)_60%,rgba(2,6,23,0.78))]" />
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,rgba(2,6,23,0.18)_70%,rgba(2,6,23,0.3)_100%)]" />
                        <div className="absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(to_top,rgba(2,6,23,0.5),transparent)]" />

                        {!imageUrl && (
                            <>
                                <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-slate-950/85 to-transparent" />
                                <div className="absolute bottom-[18%] left-[52%] h-[34%] w-[16%] -translate-x-1/2 rounded-t-[999px] rounded-b-[28%] bg-white/10 blur-[2px]" />
                                <div className="absolute bottom-[38%] left-[55%] h-[12%] w-[26%] -translate-x-1/2 -rotate-[24deg] rounded-full bg-white/10 blur-[2px]" />
                                <div className="absolute bottom-[43%] left-[51%] h-[10%] w-[10%] -translate-x-1/2 rounded-full bg-white/12 blur-[1px]" />
                                <div className="absolute bottom-[7%] left-[48%] h-[18%] w-[4%] rotate-[7deg] rounded-full bg-white/8 blur-[1px]" />
                                <div className="absolute bottom-[7%] left-[53%] h-[20%] w-[4%] -rotate-[8deg] rounded-full bg-white/8 blur-[1px]" />
                            </>
                        )}

                        <div className="relative flex min-h-[440px] items-center justify-center px-6 py-14 sm:min-h-[520px] sm:px-10 sm:py-20 lg:min-h-[620px] lg:px-16">
                            <div className="mx-auto max-w-3xl text-center motion-safe:animate-[fadeUp_900ms_ease-out]">
                                <h2 className="text-balance text-3xl font-semibold tracking-tight text-white/95 sm:text-5xl lg:text-6xl">
                                    Feel the difference when it clicks
                                </h2>

                                <div
                                    className="mt-10 flex justify-center motion-safe:animate-[fadeUp_900ms_ease-out]"
                                    style={{ animationDelay: "420ms", animationFillMode: "both" }}
                                >
                                    <button className="group inline-flex items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-300/90 px-6 py-3.5 text-sm font-semibold text-slate-950 shadow-[0_0_40px_rgba(110,231,183,0.18)] transition duration-300 hover:scale-[1.02] hover:bg-emerald-300 sm:px-7 sm:py-4 sm:text-base"
                                        onClick={() => navigate("/dashboard/upload")}
                                    >
                                        Start Improving My Swing
                                        <span className="ml-2 transition-transform duration-300 group-hover:translate-x-1">
                                            →
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(18px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slowZoom {
          from {
            transform: scale(1.04);
          }
          to {
            transform: scale(1.1);
          }
        }
      `}</style>
        </section>
    );
}
