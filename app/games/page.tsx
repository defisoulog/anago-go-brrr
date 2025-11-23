"use client";

import Link from "next/link";
import React from "react";

const games = [
  { title: "Flappy Anago", href: "/games/flappy", subtitle: "Tap to flap · Classic tilt rage" },
  { title: "Anago Snake", href: "/games/snake", subtitle: "Eat tokens · Don’t eat your tail" },
  { title: "Dog Invaders", href: "/games/space-invaders", subtitle: "Shoot first · Ask never" },
  { title: "Anago Breakout", href: "/games/breakout", subtitle: "Break blocks · Free the brrr" },
  { title: "Bomberman-Lite", href: "/games/bomberman", subtitle: "Place bombs · Clear the grid" },
];

export default function GamesMenu() {
  const year = new Date().getFullYear();

  return (
    <main className="min-h-screen w-full bg-black text-white flex items-center justify-center px-4 py-10">
      <div
        className="
          relative
          w-full
          max-w-5xl
          border border-purple-500/40
          rounded-3xl
          bg-gradient-to-b from-purple-950/70 via-black to-black
          shadow-[0_0_60px_rgba(122,63,255,0.55)]
          overflow-hidden
        "
      >
        {/* CRT glow / vignette */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(122,63,255,0.55),_transparent_60%)] opacity-70" />
        {/* Scanlines overlay */}
        <div className="pointer-events-none absolute inset-0 mix-blend-soft-light opacity-40 bg-[repeating-linear-gradient(to_bottom,rgba(0,0,0,0.4)_0px,rgba(0,0,0,0.4)_2px,transparent_2px,transparent_4px)]" />

        {/* Inner bezel */}
        <div className="relative p-4 md:p-6 lg:p-8">
          {/* Top bar */}
          <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6 md:mb-8">
            <div>
              <p className="text-[10px] md:text-xs uppercase tracking-[0.3em] text-purple-200/70">
                $ANAGO ARCADE // CRT LOBBY
              </p>
              <h1 className="mt-1 text-2xl md:text-3xl lg:text-4xl font-semibold tracking-tight">
                ANAGO ARCADE v1
              </h1>
              <p className="mt-1 text-[11px] md:text-xs text-purple-100/70 font-mono">
                SELECT_GAME() · PRESS_START · {"{ NO COIN, JUST DEGEN }"}
              </p>
            </div>

            <div className="text-right font-mono text-[10px] md:text-xs text-purple-200/60">
              <p>
                STATUS: <span className="text-green-400">ONLINE</span>
              </p>
              <p>CHAIN: MONAD (SOON™)</p>
              <p className="text-[9px] md:text-[10px]">SCREEN: 640x480 · RGB</p>
            </div>
          </header>

          {/* Main content: game CRT cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 lg:gap-6">
            {games.map((game) => (
              <CRTCard
                key={game.href}
                href={game.href}
                title={game.title}
                subtitle={game.subtitle}
              />
            ))}
          </div>

          {/* Bottom bar */}
          <footer className="mt-8 pt-4 border-t border-purple-700/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-[10px] md:text-xs font-mono text-purple-200/60">
            <div>
              <p>
                TIP:{" "}
                <span className="text-purple-100">
                  Use full-screen for max CRT immersion.
                </span>
              </p>
              <p className="mt-1">
                More games, high scores & wallet-linked chaos coming soon.
              </p>
            </div>
            <div className="text-right">
              <p>© {year} $ANAGO ARCADE</p>
              <p className="text-[9px] md:text-[10px]">
                BUILDING IN THE GLITCH BETWEEN BLOCKS
              </p>
            </div>
          </footer>

          {/* BACK TO HOME BUTTON */}
          <div className="mt-6 flex justify-center">
            <Link
              href="/"
              className="cta-pill px-10 py-3 text-[10px] md:text-xs tracking-[0.25em] uppercase"
            >
              BACK TO HOME
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

type CRTCardProps = {
  href: string;
  title: string;
  subtitle: string;
};

const CRTCard: React.FC<CRTCardProps> = ({ href, title, subtitle }) => {
  return (
    <Link
      href={href}
      className="
        group
        relative
        rounded-2xl
        border border-purple-500/40
        bg-gradient-to-b from-zinc-900/90 via-black to-black
        shadow-[0_0_25px_rgba(0,0,0,0.9)]
        overflow-hidden
        transition-all
        duration-200
        hover:-translate-y-1
        hover:border-purple-300
        hover:shadow-[0_0_45px_rgba(122,63,255,0.8)]
      "
    >
      <div className="relative p-3 pb-4 flex flex-col gap-3">
        {/* CRT screen */}
        <div
          className="
            relative
            h-28 md:h-32
            rounded-xl
            border border-purple-900/70
            bg-gradient-to-br from-[#16071F] via-[#05010A] to-[#140028]
            overflow-hidden
          "
        >
          {/* Glow */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(122,63,255,0.3),transparent_60%)]" />

          {/* Scanlines */}
          <div className="absolute inset-0 opacity-40 mix-blend-soft-light bg-[repeating-linear-gradient(to_bottom,rgba(0,0,0,0.75)_0px,rgba(0,0,0,0.75)_2px,transparent_2px,transparent_4px)]" />

          {/* Screen Text */}
          <div className="relative h-full w-full flex flex-col items-center justify-center px-2 text-center">
            <p className="text-[11px] md:text-xs font-mono text-purple-100/80">
              {title.toUpperCase()}
            </p>
            <p className="mt-1 text-[9px] md:text-[10px] font-mono text-purple-200/70">
              {subtitle}
            </p>
            <p className="mt-2 text-[9px] uppercase tracking-[0.3em] text-green-300/80">
              ▶ PLAY
            </p>
          </div>
        </div>

        {/* Bottom info row */}
        <div className="flex items-center justify-between text-[10px] md:text-[11px] font-mono text-purple-200/70">
          <span className="uppercase tracking-[0.2em] text-purple-300/90">
            GAME
          </span>
          <span className="text-zinc-400 group-hover:text-green-300/90 transition-colors">
            STATUS: <span className="text-green-400">READY</span>
          </span>
        </div>
      </div>
    </Link>
  );
};


