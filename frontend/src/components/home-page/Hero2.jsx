/**
 * Hero2 – Results-focused hero section with demo preview
 *
 * Displays:
 * - Centered text block with header, subtitle, and CTA
 * - Demo preview card showing upload page screenshot
 */

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../auth/authContext';
import DemoPreview from './DemoPreview.jsx';
import EmblaCarousel from '../carousel/EmblaCarousel.jsx';

function backgroundTexture() {
    return (
        <div
            className="pointer-events-none absolute inset-0 opacity-20"
            style={{
                backgroundImage: "url('/icons/topography.svg')",
                backgroundRepeat: 'repeat',
                backgroundPosition: 'top left',
                backgroundSize: '1200px',
            }}
        />
    );
}

function BottomVignette() {
    return (
        <div className="pointer-events-none absolute inset-0 shadow-[inset_0_-120px_180px_-60px_rgba(0,0,0,0.6)]" />
    );
}

function TextBlock() {
    const { user } = useAuth();
    const [cta, setCta] = useState("Try for free →");
    const [ctaSubtext, setCtaSubtext] = useState("Try it free — your first 3 videos are on us");

    const titles = [
        "Your Phone is Now Your Swing Coach: Instant AI Analysis",
        "Upload. Analyze. Improve. The Fastest Path to a Better Swing",
        "The Only Golf Lesson You Can Take in Your Living Room",
        "Expert Swing Analysis, No Appointment Required. Turn Video into Pro-Level Feedback",
    ]

    useEffect(() => {
        if (user) {
            // User is authenticated, show personalized content
            setCta("Make your analysis →");
            setCtaSubtext(`Welcome back, ${user.displayName}! Ready to upload your next video?`);
        } else {
            // User is not authenticated, show default content
            setCta("Try for free →");
            setCtaSubtext("Try it free — your first 3 videos are on us");
        }
    }, [user]);

    return (
        <div className="text-center max-w-2xl mx-auto px-4 mb-16">
            {/* Header */}
            <h2 className="text-3xl sm:text-5xl font-bold leading-tight tracking-tight mb-4 text-slate-100">
                Fix Your Swing. Instantly.
            </h2>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-300 mb-8">
                Upload any video, get a pro-level, frame-by-frame report and personalized drills—all without leaving the driving range
            </p>

            {/* CTA Button */}
            <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl px-6 sm:px-8 py-3 sm:py-4 bg-emerald-500/90 hover:bg-emerald-500 text-white font-semibold shadow-md shadow-emerald-900/30 focus:outline-none focus:ring-2 focus:ring-emerald-300 transition-colors text-base sm:text-lg mb-4"
                onClick={() => window.location.href = '/analyse'}
            >
                {cta}
            </button>

            {/* Small text below CTA */}
            <p className="text-sm text-slate-400">
                {ctaSubtext}
            </p>
        </div>
    );
}



export default function Hero2() {
    const OPTIONS = { loop: true }
    const IMAGES = [
        {
            source: "/media/pose2.jpg",
            title: 'Find Your Perfect Swing Position'
        },
        {
            source: '/media/Summary.png',
            title: 'Find out your flaws instantly'
        },
        {
            source: '/media/probAndRec.png',
            title: 'Get Personalized Drills and Exercises'
        },

    ]

    return (
        <section className="relative py-16 sm:py-24 md:py-32 bg-[#0b1020] text-slate-100">
            {/* Background texture and vignette */}
            {backgroundTexture()}
            {BottomVignette()}

            <main className="relative z-10 mx-auto w-full max-w-6xl px-4">
                {/* Text Block */}
                {TextBlock()}

                <EmblaCarousel images={IMAGES} options={OPTIONS} />

                {/* Demo Preview */}

                <div className="text-center max-w-2xl mx-auto px-4 mb-16">
                    {/* Header */}
                    <h2 className="text-3xl sm:text-5xl font-bold leading-tight tracking-tight mb-4 text-slate-100">
                        See How It Works, upload a video today!
                    </h2>
                </div>
                {DemoPreview()}
            </main>
        </section>
    );
}
