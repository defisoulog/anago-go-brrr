import Image from "next/image";
import Link from "next/link";

const HERO_BG = "/backgrounds/anago-tile.png";
const HERO_IMG = "/backgrounds/anago-hero.png";
const PRINTR_LOGO = "/logos/printr-logo.png";

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden text-white">
      {/* Background tiles */}
      <div className="absolute inset-0 -z-10">
        <Image
          src={HERO_BG}
          alt="Anago tiled background"
          fill
          priority
          className="object-cover"
        />
        {/* light overlay for readability */}
        <div className="absolute inset-0 bg-black/12" />
      </div>

      {/* Content wrapper */}
      <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-8">
        {/* TITLE */}
        <h1
          className="
            fade-up delay-1
            mb-2 md:mb-4
            text-center
            text-[clamp(2.4rem,6vw,4.6rem)]
            font-extrabold
            uppercase
            tracking-[0.35em]
            text-white
            drop-shadow-[0_0_26px_rgba(255,255,255,0.9)]
            -translate-y-6 md:-translate-y-12
          "
          style={{ fontFamily: "var(--font-heading)" }}
        >
          ANAGO GO BRRR
        </h1>

        {/* HERO + DESKTOP BUTTONS AROUND IT */}
        <div className="relative mt-2 flex items-center justify-center">
          <div className="relative">
            {/* HERO IMAGE (auto-resized) */}
            <Image
              src={HERO_IMG}
              alt="Anago hero diamond"
              width={1000}
              height={1000}
              priority
              className="
                mx-auto h-auto
                w-[min(64vw,320px)]
                sm:w-[min(60vw,360px)]
                md:w-[400px)]
                lg:w-[440px)]
                drop-shadow-[0_0_40px_rgba(255,255,255,0.75)]
              "
            />

            {/* DESKTOP / TABLET BUTTONS AROUND HERO */}
            <div className="hidden md:block">
              {/* Left side */}
              <Link
                href="/meme"
                className="
                  cta-pill
                  absolute
                  left-[-280px]
                  top-1/2
                  -translate-y-1/2
                  whitespace-nowrap
                  fade-up delay-2
                "
              >
                Enter Meme Maker
              </Link>

              {/* Right side (brought in to match visually) */}
              <Link
                href="/games"
                className="
                  cta-pill
                  absolute
                  right-[-260px]
                  top-1/2
                  -translate-y-1/2
                  whitespace-nowrap
                  fade-up delay-3
                "
              >
                Play Mini Games
              </Link>

              {/* Bottom center */}
              <Link
                href="/manifesto"
                className="
                  cta-pill
                  absolute
                  left-1/2
                  bottom-[-80px]
                  -translate-x-1/2
                  whitespace-nowrap
                  fade-up delay-4
                "
              >
                About / Manifesto
              </Link>
            </div>
          </div>
        </div>

        {/* MOBILE BUTTON STACK (under hero) */}
        <div className="mt-6 flex w-full max-w-md flex-col items-center gap-4 md:hidden fade-up delay-2">
          <Link href="/meme" className="cta-pill w-full text-center">
            Enter Meme Maker
          </Link>
          <Link href="/games" className="cta-pill w-full text-center">
            Play Mini Games
          </Link>
          <Link href="/manifesto" className="cta-pill w-full text-center">
            About / Manifesto
          </Link>
        </div>

        {/* Small spacer before bottom row on desktop */}
        <div className="hidden md:block h-16" />

        {/* BOTTOM ROW: X, BUY ON PRINTR, X COMMUNITY */}
        <div className="mt-10 flex w-full max-w-3xl flex-col items-center gap-3 sm:flex-row sm:flex-nowrap sm:justify-center fade-up delay-4">
          {/* X main */}
          <Link
            href="https://x.com/AnagoGoBRRR"
            target="_blank"
            rel="noopener noreferrer"
            className="secondary-pill w-full sm:w-auto text-center"
          >
            X / @AnagoGoBRRR
          </Link>

          {/* Buy on Printr (center) */}
          <Link
            href="#"
            className="secondary-pill w-full sm:w-auto gap-3"
          >
            <span>Buy on Printr</span>
            <Image
              src={PRINTR_LOGO}
              alt="Printr logo"
              width={210}
              height={60}
              className="h-10 w-auto sm:h-11"
            />
          </Link>

          {/* X community */}
          <Link
            href="https://x.com/i/communities/1992325297597775901"
            target="_blank"
            rel="noopener noreferrer"
            className="secondary-pill w-full sm:w-auto text-center"
          >
            X Community
          </Link>
        </div>
      </div>
    </main>
  );
}

