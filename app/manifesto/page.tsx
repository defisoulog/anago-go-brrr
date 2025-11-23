"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const GALLERY_COUNT = 38;

// Build list of gallery image paths
const GALLERY_IMAGES = Array.from({ length: GALLERY_COUNT }, (_, i) =>
  `/manifesto/gallery/gallery-${String(i + 1).padStart(2, "0")}.png`
);

export default function ManifestoPage() {
  const [currentIndex, setCurrentIndex] = useState(0);

  // --- AUTOPLAY GALLERY ---
  useEffect(() => {
    const id = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % GALLERY_COUNT);
    }, 3500);

    return () => clearInterval(id);
  }, []);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % GALLERY_COUNT);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + GALLERY_COUNT) % GALLERY_COUNT);
  };

  return (
    <main
      className="min-h-screen text-slate-100 flex flex-col bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: "url('/meme-maker/backgrounds/background-dark.png')",
        fontFamily:
          '"Space Grotesk", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <div className="min-h-screen w-full bg-black/40 backdrop-blur-sm">
        <div className="w-full max-w-6xl mx-auto px-4 py-10 flex-1 flex flex-col">
          {/* ================= HEADER ================= */}
          <header className="text-center mb-8">
            <p className="text-[10px] md:text-xs uppercase tracking-[0.35em] text-purple-300/80">
              Manifesto
            </p>

            <h1 className="mt-3 text-3xl md:text-5xl font-extrabold uppercase tracking-[0.35em] text-transparent bg-clip-text bg-gradient-to-r from-slate-100 via-white to-[#B49CFF] drop-shadow-[0_0_25px_rgba(122,63,255,0.9)]">
              ANAGO MANIFESTO
            </h1>

            <p className="mt-3 text-xs md:text-sm text-slate-300 tracking-[0.18em] uppercase">
              The Frenchie inside Monad HQ. Not lore. Not mascot. Actual dog.
              Full BRRRR.
            </p>
          </header>

          {/* ================= MAIN PANEL ================= */}
          <section className="bg-[#050511]/90 border border-slate-800/70 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.9)] p-6 md:p-8 flex flex-col items-center">
            {/* HERO IMAGE */}
            <div className="relative w-full max-w-md md:max-w-lg mb-8">
              <div className="relative w-full rounded-[32px] bg-gradient-to-br from-[#7A3FFF]/70 via-transparent to-[#050509] p-[2px]">
                <div className="relative w-full h-full rounded-[30px] bg-[#02020a] overflow-hidden flex items-center justify-center">
                  <Image
                    src="/manifesto/manifesto-hero.png"
                    alt="Anago — Monad HQ Frenchie"
                    width={900}
                    height={900}
                    className="w-full h-auto object-cover drop-shadow-[0_0_35px_rgba(122,63,255,0.6)] select-none pointer-events-none"
                    priority
                    placeholder="empty"
                    unoptimized
                    loading="eager"
                  />
                </div>
              </div>
            </div>

            {/* MANIFESTO TEXT */}
            <div className="max-w-2xl text-center text-base md:text-lg leading-relaxed text-slate-100">
              <p className="mb-4">
                Every chain has a dog.
                <br />
                But Monad got the real one — the Frenchie at HQ who became CEO
                for a day… and never clocked out.
              </p>

              <p className="mb-4">
                Anago watched Monad get built from the ground up.
                <br />
                He sat through meetings.
                <br />
                He guarded the node.
                <br />
                He stared into the purple until it stared back.
              </p>

              <p className="mb-4">
                Not lore.
                <br />
                Not mascot.
                <br />
                Actual Monad dog.
                <br />
                Full drip. Full chaos. Full BRRRR.
              </p>

              <p className="mb-4">
                Now he’s running the chain — faster, funnier, and way more
                cooked than any meme dog before him.
              </p>

              <p className="font-semibold text-purple-300">
                $ANAGO — The Dog of Monad.
                <br />
                BRRRR..
              </p>
            </div>

            {/* ================= GALLERY TITLE ================= */}
            <h2 className="mt-10 mb-6 text-center text-[11px] md:text-sm text-slate-300 tracking-[0.35em] uppercase">
              ANAGO GALLERY // V1
            </h2>

            {/* ================= GALLERY (FIXED) ================= */}
            <div className="w-full max-w-md md:max-w-lg">
              <div className="relative w-full rounded-[32px] bg-gradient-to-br from-[#7A3FFF]/70 via-transparent to-[#050509] p-[2px]">
                <div className="relative w-full h-full rounded-[30px] bg-[#02020a] overflow-hidden flex items-center justify-center">
                  <Image
                    key={currentIndex}
                    src={GALLERY_IMAGES[currentIndex]}
                    alt={`Anago gallery image ${currentIndex + 1}`}
                    width={900}
                    height={900}
                    className="w-full h-auto object-cover select-none pointer-events-none"
                    placeholder="empty"
                    unoptimized
                    loading="eager"
                  />

                  {/* Navigation */}
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/60 border border-slate-600/80 px-2 py-1 text-xs text-slate-100 hover:bg-black/80 hover:border-slate-200 transition"
                    aria-label="Previous image"
                  >
                    ◀
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/60 border border-slate-600/80 px-2 py-1 text-xs text-slate-100 hover:bg-black/80 hover:border-slate-200 transition"
                    aria-label="Next image"
                  >
                    ▶
                  </button>
                </div>
              </div>

              {/* DOTS */}
              <div className="mt-4 flex justify-center flex-wrap gap-1.5">
                {GALLERY_IMAGES.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setCurrentIndex(i)}
                    className={`h-1.5 rounded-full transition ${
                      i === currentIndex
                        ? "w-5 bg-[#B49CFF] shadow-[0_0_10px_rgba(122,63,255,0.9)]"
                        : "w-2 bg-slate-600/60 hover:bg-slate-300"
                    }`}
                    aria-label={`Go to image ${i + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* ================= BACK TO HOME ================= */}
            <div className="mt-10 flex justify-center">
              <a
                href="/"
                className="group inline-flex items-center gap-2 rounded-full border border-[#7A3FFF]/70 bg-black/80 px-6 py-2 text-[11px] md:text-xs font-medium uppercase tracking-[0.25em] text-purple-100 shadow-[0_0_18px_rgba(122,63,255,0.7)] transition hover:border-[#B49CFF] hover:bg-[#7A3FFF]/30"
              >
                <span className="h-1 w-1 rounded-full bg-purple-300 transition group-hover:scale-125 group-hover:shadow-[0_0_12px_rgba(255,255,255,0.9)]" />
                Back to Home
              </a>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}







