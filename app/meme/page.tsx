'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import * as htmlToImage from 'html-to-image';

type TraitCategory = 'hats' | 'eyes' | 'glasses' | 'mouth' | 'neck' | 'nose';

interface Trait {
  id: string;
  label: string;
  category: TraitCategory;
  src: string; // path under /public
}

// Bottom → top stacking order
const LAYER_ORDER: TraitCategory[] = [
  'neck',
  'mouth',
  'nose',
  'eyes',
  'glasses',
  'hats',
];

// All traits registered here
const TRAITS: Trait[] = [
  // ========================
  // HATS
  // ========================
  { id: 'hat_black', label: 'Top Hat', category: 'hats', src: '/meme-maker/hats/hat_black.png' },
  { id: 'hat_blue_1', label: 'Blue Cap', category: 'hats', src: '/meme-maker/hats/Hat_blue_1.png' },
  { id: 'hat_brrr', label: 'BRRR Cap', category: 'hats', src: '/meme-maker/hats/hat_brrr.png' },
  { id: 'hat_bunny', label: 'Bunny Ears', category: 'hats', src: '/meme-maker/hats/hat_bunny.png' },
  { id: 'hat_ceo', label: 'CEO Cap', category: 'hats', src: '/meme-maker/hats/hat_ceo.png' },
  { id: 'hat_cheff', label: 'Chef Hat', category: 'hats', src: '/meme-maker/hats/hat_cheff.png' },
  { id: 'hat_clown', label: 'Clown Hat', category: 'hats', src: '/meme-maker/hats/hat_clown.png' },
  { id: 'hat_cowboy', label: 'Cowboy Hat', category: 'hats', src: '/meme-maker/hats/hat_cowboy.png' },
  { id: 'hat_crown', label: 'Crown', category: 'hats', src: '/meme-maker/hats/hat_crown.png' },
  { id: 'hat_joker', label: 'Jester Hat', category: 'hats', src: '/meme-maker/hats/hat_joker.png' },
  { id: 'hat_l1', label: 'L1 Cap', category: 'hats', src: '/meme-maker/hats/hat_l1.png' },
  { id: 'hat_merlyn', label: 'Wizard Hat', category: 'hats', src: '/meme-maker/hats/hat_merlyn.png' },
  { id: 'hat_miner', label: 'Miner Helmet', category: 'hats', src: '/meme-maker/hats/hat_miner.png' },
  { id: 'hat_pirate', label: 'Pirate Hat', category: 'hats', src: '/meme-maker/hats/hat_pirate.png' },
  { id: 'hat_ring', label: 'Halo Ring', category: 'hats', src: '/meme-maker/hats/hat_ring.png' },
  { id: 'hat_samurai', label: 'Samurai Helmet', category: 'hats', src: '/meme-maker/hats/hat_samurai.png' },
  { id: 'hat_ufo', label: 'UFO Hat', category: 'hats', src: '/meme-maker/hats/hat_ufo.png' },
  { id: 'hat_viking', label: 'Viking Helmet', category: 'hats', src: '/meme-maker/hats/hat_viking.png' },

  // ========================
  // EYES
  // ========================
  { id: 'eyes_mad', label: 'Mad Eyes', category: 'eyes', src: '/meme-maker/eyes/eyes_mad.png' },
  { id: 'eyes_monoecle', label: 'Monoecle', category: 'eyes', src: '/meme-maker/eyes/eyes_monoecle.png' },
  { id: 'eyes_spiral', label: 'Spiral Eyes', category: 'eyes', src: '/meme-maker/eyes/eyes_spiral.png' },
  { id: 'eyes_tears', label: 'Tears', category: 'eyes', src: '/meme-maker/eyes/eyes_tears.png' },

  // ========================
  // GLASSES
  // ========================
  { id: 'glasses_blindfold', label: 'Blindfold', category: 'glasses', src: '/meme-maker/glasses/glasses_blindfold.png' },
  { id: 'glasses_brown', label: 'Brown Shades', category: 'glasses', src: '/meme-maker/glasses/glasses_brown.png' },
  { id: 'glasses_cyan', label: 'Cyan Glasses', category: 'glasses', src: '/meme-maker/glasses/glasses_cyan.png' },
  { id: 'glasses_cyborg', label: 'Cyborg Visor', category: 'glasses', src: '/meme-maker/glasses/glasses_cyborg.png' },
  { id: 'glasses_hex', label: 'Hex Glasses', category: 'glasses', src: '/meme-maker/glasses/glasses_hex.png' },
  { id: 'glasses_pixel', label: 'Pixel Thug', category: 'glasses', src: '/meme-maker/glasses/glasses_pixel.png' },
  { id: 'glasses_printr', label: 'Printr Shades', category: 'glasses', src: '/meme-maker/glasses/glasses_printr.png' },
  { id: 'glasses_purp', label: 'Purple Glasses', category: 'glasses', src: '/meme-maker/glasses/glasses_purp.png' },
  { id: 'glasses_snow', label: 'Snow Goggles', category: 'glasses', src: '/meme-maker/glasses/glasses_snow.png' },
  { id: 'glasses_star', label: 'Star Glasses', category: 'glasses', src: '/meme-maker/glasses/glasses_star.png' },
  { id: 'glasses_vr', label: 'VR Helmet', category: 'glasses', src: '/meme-maker/glasses/glasses_vr.png' },

  // ========================
  // MOUTH
  // ========================
  { id: 'mouth_bone', label: 'Bone', category: 'mouth', src: '/meme-maker/mouth/mouth_bone.png' },
  { id: 'mouth_bubblegum', label: 'Bubblegum', category: 'mouth', src: '/meme-maker/mouth/mouth_bubblegum.png' },
  { id: 'mouth_canines', label: 'Canines', category: 'mouth', src: '/meme-maker/mouth/mouth_canines.png' },
  { id: 'mouth_cigar', label: 'Cigar', category: 'mouth', src: '/meme-maker/mouth/mouth_cigar.png' },
  { id: 'mouth_Clench', label: 'Clenched Teeth', category: 'mouth', src: '/meme-maker/mouth/mouth_Clench.png' },
  { id: 'mouth_gold', label: 'Gold Grill', category: 'mouth', src: '/meme-maker/mouth/mouth_gold.png' },
  { id: 'mouth_lips', label: 'Lips', category: 'mouth', src: '/meme-maker/mouth/mouth_lips.png' },
  { id: 'mouth_lollipop', label: 'Lollipop', category: 'mouth', src: '/meme-maker/mouth/mouth_lollipop.png' },
  { id: 'mouth_pacifier', label: 'Pacifier', category: 'mouth', src: '/meme-maker/mouth/mouth_pacifier.png' },
  { id: 'mouth_popsicle', label: 'Popsicle', category: 'mouth', src: '/meme-maker/mouth/mouth_popsicle.png' },
  { id: 'mouth_spliff', label: 'Spliff', category: 'mouth', src: '/meme-maker/mouth/mouth_spliff.png' },
  { id: 'mouth_Sushi', label: 'Sushi', category: 'mouth', src: '/meme-maker/mouth/mouth_Sushi.png' },
  { id: 'mouth_tongue', label: 'Tongue Out', category: 'mouth', src: '/meme-maker/mouth/mouth_tongue.png' },
  { id: 'mouth_toothpick', label: 'Toothpick', category: 'mouth', src: '/meme-maker/mouth/mouth_toothpick.png' },

  // ========================
  // NECK
  // ========================
  { id: 'neck_anecklace', label: 'Anago Necklace', category: 'neck', src: '/meme-maker/neck/neck_anecklace.png' },
  { id: 'neck_bone', label: 'Bone Collar', category: 'neck', src: '/meme-maker/neck/neck_bone.png' },
  { id: 'neck_bow', label: 'Bow Tie', category: 'neck', src: '/meme-maker/neck/neck_bow.png' },
  { id: 'neck_gchain', label: 'Gold Chain', category: 'neck', src: '/meme-maker/neck/neck_gchain.png' },
  { id: 'neck_scarf', label: 'Scarf', category: 'neck', src: '/meme-maker/neck/neck_scarf.png' },
  { id: 'neck_spikes', label: 'Spiked Collar', category: 'neck', src: '/meme-maker/neck/neck_spikes.png' },
  { id: 'neck_ti', label: 'Purple Tie', category: 'neck', src: '/meme-maker/neck/neck_ti.png' },

  // ========================
  // NOSE
  // ========================
  { id: 'nose_bandaid', label: 'Bandaid', category: 'nose', src: '/meme-maker/nose/nose_bandaid.png' },
  { id: 'nose_Clown', label: 'Clown Nose', category: 'nose', src: '/meme-maker/nose/nose_Clown.png' },
  { id: 'nose_coin', label: 'Coin Nose', category: 'nose', src: '/meme-maker/nose/nose_coin.png' },
  { id: 'nose_heart', label: 'Heart Nose', category: 'nose', src: '/meme-maker/nose/nose_heart.png' },
  { id: 'nose_monad', label: 'Monad Nose', category: 'nose', src: '/meme-maker/nose/nose_monad.png' },
  { id: 'nose_mustache', label: 'Mustache', category: 'nose', src: '/meme-maker/nose/nose_mustache.png' },
  { id: 'nose_pig', label: 'Pig Nose', category: 'nose', src: '/meme-maker/nose/nose_pig.png' },
  { id: 'nose_pircing', label: 'Piercing', category: 'nose', src: '/meme-maker/nose/nose_pircing.png' },
  { id: 'nose_ring', label: 'Ring', category: 'nose', src: '/meme-maker/nose/nose_ring.png' },
  { id: 'nose_skull', label: 'Skull Nose', category: 'nose', src: '/meme-maker/nose/nose_skull.png' },
];

const CATEGORY_LABELS: Record<TraitCategory, string> = {
  hats: 'Hats',
  eyes: 'Eyes',
  glasses: 'Glasses',
  mouth: 'Mouth',
  neck: 'Neck',
  nose: 'Nose',
};

type SelectedTraits = {
  [K in TraitCategory]: Trait | null;
};

const MemePage = () => {
  const [activeCategory, setActiveCategory] = useState<TraitCategory>('hats');

  const [selectedTraits, setSelectedTraits] = useState<SelectedTraits>({
    hats: null,
    eyes: null,
    glasses: null,
    mouth: null,
    neck: null,
    nose: null,
  });

  const [topText, setTopText] = useState('');
  const [bottomText, setBottomText] = useState('');

  const [exporting, setExporting] = useState(false);
  const [copying, setCopying] = useState(false);
  const [clipboardSupported, setClipboardSupported] = useState(false);

  // Hidden export-only container (512x512 dog+traits+text, plain <img>)
  const exportRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasClipboardItem = !!(window as any).ClipboardItem;
      setClipboardSupported(!!navigator.clipboard && hasClipboardItem);
    }
  }, []);

  const traitsForActiveCategory = TRAITS.filter(
    (trait) => trait.category === activeCategory,
  );

  const handleTraitClick = (trait: Trait) => {
    setSelectedTraits((prev) => {
      const current = prev[trait.category];
      if (current && current.id === trait.id) {
        return { ...prev, [trait.category]: null };
      }
      return { ...prev, [trait.category]: trait };
    });
  };

  const handleReset = () => {
    setSelectedTraits({
      hats: null,
      eyes: null,
      glasses: null,
      mouth: null,
      neck: null,
      nose: null,
    });
    setTopText('');
    setBottomText('');
  };

  const handleRandomize = () => {
    const categories: TraitCategory[] = [
      'hats',
      'eyes',
      'glasses',
      'mouth',
      'neck',
      'nose',
    ];

    const newSelected: SelectedTraits = {
      hats: null,
      eyes: null,
      glasses: null,
      mouth: null,
      neck: null,
      nose: null,
    };

    categories.forEach((cat) => {
      const pool = TRAITS.filter((t) => t.category === cat);
      if (pool.length === 0) {
        newSelected[cat] = null;
        return;
      }

      // 80% chance to equip something, 20% none
      const equip = Math.random() < 0.8;
      if (!equip) {
        newSelected[cat] = null;
        return;
      }

      const randomIndex = Math.floor(Math.random() * pool.length);
      newSelected[cat] = pool[randomIndex];
    });

    setSelectedTraits(newSelected);
  };

  const handleExportPng = async () => {
    if (!exportRef.current) return;
    try {
      setExporting(true);
      const dataUrl = await htmlToImage.toPng(exportRef.current, {
        pixelRatio: 2,
        backgroundColor: 'transparent',
      });

      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = 'anago-meme.png';
      link.click();
    } catch (error) {
      console.error(error);
      alert('Failed to export PNG. Try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleCopyToClipboard = async () => {
    if (!exportRef.current || !clipboardSupported) return;
    try {
      setCopying(true);
      const blob = await htmlToImage.toBlob(exportRef.current, {
        pixelRatio: 2,
        backgroundColor: 'transparent',
      });

      if (!blob) throw new Error('No blob generated');

      const item = new (window as any).ClipboardItem({ 'image/png': blob });
      await navigator.clipboard.write([item]);
      alert('Copied image to clipboard ✅');
    } catch (error) {
      console.error(error);
      alert('Failed to copy image. Your browser may not support this.');
    } finally {
      setCopying(false);
    }
  };

  return (
    <main
      className="min-h-screen text-slate-100 flex flex-col bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage:
          "url('/meme-maker/backgrounds/background-dark.png')",
        fontFamily:
          '"Space Grotesk", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      {/* Hidden export-only renderer: dog + traits + text, 512x512, transparent */}
      <div className="fixed -left-[9999px] top-0">
        <div
          ref={exportRef}
          className="relative w-[512px] h-[512px]"
          style={{ backgroundColor: 'transparent' }}
        >
          {/* Base dog as plain <img> */}
          <img
            src="/meme-maker/base/anago.png"
            alt="Anago base export"
            className="absolute inset-0 w-full h-full object-contain"
          />

          {/* Traits as plain <img>s */}
          {LAYER_ORDER.map((category) => {
            const trait = selectedTraits[category];
            if (!trait) return null;
            return (
              <img
                key={trait.id}
                src={trait.src}
                alt={trait.label}
                className="absolute inset-0 w-full h-full object-contain"
              />
            );
          })}

          {/* Top text */}
          {topText.trim() !== '' && (
            <div className="absolute left-1/2 -translate-x-1/2 top-4 w-[90%] text-center">
              <span className="block text-[26px] font-extrabold uppercase tracking-wide text-white drop-shadow-[0_0_3px_black]">
                {topText}
              </span>
            </div>
          )}

          {/* Bottom text */}
          {bottomText.trim() !== '' && (
            <div className="absolute left-1/2 -translate-x-1/2 bottom-4 w-[90%] text-center">
              <span className="block text-[26px] font-extrabold uppercase tracking-wide text-white drop-shadow-[0_0_3px_black]">
                {bottomText}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Visible UI */}
      <div className="min-h-screen w-full bg-black/40 backdrop-blur-sm">
        <div className="w-full max-w-6xl mx-auto px-4 py-8 flex-1 flex flex-col">
          {/* Header */}
          <header className="text-center mb-8">
            <h1 className="text-3xl md:text-5xl font-extrabold uppercase tracking-[0.35em] text-transparent bg-clip-text bg-gradient-to-r from-slate-100 via-white to-[#B49CFF] drop-shadow-[0_0_25px_rgba(122,63,255,0.9)]">
              ANAGO MEME MAKER
            </h1>
            <p className="mt-3 text-xs md:text-sm text-slate-300 tracking-[0.18em] uppercase">
              Stack hats · eyes · glasses · mouth · neck · nose on the real
              Anago Frenchie
            </p>
          </header>

          {/* Main layout: mobile = column, desktop = row */}
          <section className="flex-1 flex flex-col gap-6 md:flex-row md:items-stretch">
            {/* Preview */}
            <div className="md:w-1/2 bg-[#050511]/90 border border-slate-800/70 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.9)] p-4 md:p-6 flex flex-col">
              <div className="flex items-center justify-between mb-3 gap-2">
                <h2 className="text-[11px] md:text-xs uppercase tracking-[0.25em] text-slate-500">
                  Preview
                </h2>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleRandomize}
                    className="text-[11px] md:text-xs px-3 py-1 rounded-full border border-[#7A3FFF]/70 text-[#E5D9FF] bg-[#7A3FFF]/20 hover:bg-[#7A3FFF]/40 hover:border-[#B49CFF] transition"
                  >
                    Randomize
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="text-[11px] md:text-xs px-3 py-1 rounded-full border border-slate-700/70 text-slate-200 hover:bg-slate-900/80 hover:border-slate-300 transition"
                  >
                    Reset
                  </button>
                </div>
              </div>

              <div className="flex-1 flex items-center justify-center">
                <div className="relative w-full max-w-sm aspect-square rounded-[32px] bg-gradient-to-br from-[#7A3FFF]/50 via-transparent to-[#050509] p-[2px]">
                  <div className="relative w-full h-full rounded-[30px] bg-[#02020a] flex items-center justify-center overflow-hidden">
                    {/* Base + traits */}
                    <Image
                      src="/meme-maker/base/anago.png"
                      alt="Anago base template"
                      fill
                      priority
                      className="object-contain drop-shadow-[0_0_35px_rgba(122,63,255,0.6)]"
                    />
                    {LAYER_ORDER.map((category) => {
                      const trait = selectedTraits[category];
                      if (!trait) return null;
                      return (
                        <Image
                          key={trait.id}
                          src={trait.src}
                          alt={trait.label}
                          fill
                          className="object-contain pointer-events-none"
                        />
                      );
                    })}

                    {/* Top text preview */}
                    {topText.trim() !== '' && (
                      <div className="absolute left-1/2 -translate-x-1/2 top-4 w-[90%] text-center pointer-events-none">
                        <span className="block text-[20px] md:text-[24px] font-extrabold uppercase tracking-wide text-white drop-shadow-[0_0_3px_black]">
                          {topText}
                        </span>
                      </div>
                    )}

                    {/* Bottom text preview */}
                    {bottomText.trim() !== '' && (
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-4 w-[90%] text-center pointer-events-none">
                        <span className="block text-[20px] md:text-[24px] font-extrabold uppercase tracking-wide text-white drop-shadow-[0_0_3px_black]">
                          {bottomText}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 🔍 Bigger, readable caption */}
              <p className="mt-3 text-[12px] md:text-[13px] text-slate-400 text-center tracking-wide leading-snug">
                Export = 512×512 transparent PNG (dog + traits + meme text).{' '}
                Perfect for goated Anago memes 🐶🔥.
              </p>
            </div>

            {/* Controls */}
            <div className="md:w-1/2 bg-[#050511]/90 border border-slate-800/70 rounded-3xl p-4 md:p-6 flex flex-col">
              {/* Category Tabs */}
              <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
                {(Object.keys(CATEGORY_LABELS) as TraitCategory[]).map(
                  (category) => {
                    const isActive = category === activeCategory;
                    return (
                      <button
                        key={category}
                        type="button"
                        onClick={() => setActiveCategory(category)}
                        className={`whitespace-nowrap px-3 py-1.5 rounded-full text-[11px] md:text-xs border transition shadow-sm ${
                          isActive
                            ? 'bg-[#7A3FFF] border-[#B49CFF] text-white shadow-[0_0_18px_rgba(122,63,255,0.9)]'
                            : 'bg-black/40 border-slate-700/80 text-slate-300 hover:bg-slate-900/80 hover:border-slate-200'
                        }`}
                      >
                        {CATEGORY_LABELS[category]}
                      </button>
                    );
                  },
                )}
              </div>

              {/* Trait grid */}
              <div className="flex-1 flex flex-col">
                <h3 className="text-[11px] md:text-xs text-slate-400 mb-2">
                  {CATEGORY_LABELS[activeCategory]} ·{' '}
                  <span className="text-slate-500">
                    click to equip / unequip
                  </span>
                </h3>

                {traitsForActiveCategory.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    No traits found for this category yet.
                  </p>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 overflow-y-auto pr-1">
                    {traitsForActiveCategory.map((trait) => {
                      const isSelected =
                        selectedTraits[trait.category]?.id === trait.id;

                      return (
                        <button
                          key={trait.id}
                          type="button"
                          onClick={() => handleTraitClick(trait)}
                          className={`relative flex flex-col items-center gap-1 p-2 rounded-xl border bg-black/40 hover:bg-slate-950/80 transition group ${
                            isSelected
                              ? 'border-[#7A3FFF] shadow-[0_0_18px_rgba(122,63,255,0.7)]'
                              : 'border-slate-700/70'
                          }`}
                        >
                          <div className="relative w-full aspect-square rounded-lg bg-gradient-to-br from-slate-900 via-black to-slate-950 overflow-hidden">
                            <Image
                              src={trait.src}
                              alt={trait.label}
                              fill
                              className="object-contain"
                            />
                          </div>
                          <span className="text-[10px] text-slate-200 text-center truncate w-full">
                            {trait.label}
                          </span>

                          {isSelected && (
                            <span className="absolute top-1 right-1 text-[9px] px-1.5 py-0.5 rounded-full bg-[#7A3FFF] text-white">
                              ON
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Meme text inputs */}
              <div className="mt-4 space-y-2">
                <label className="block text-[11px] md:text-xs text-slate-300 uppercase tracking-[0.18em]">
                  Top text
                  <input
                    type="text"
                    value={topText}
                    onChange={(e) => setTopText(e.target.value)}
                    placeholder="WHEN ANAGO ENTERS MONAD..."
                    className="mt-1 w-full rounded-lg bg-black/40 border border-slate-700 px-2 py-1 text-xs md:text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#7A3FFF]"
                  />
                </label>
                <label className="block text-[11px] md:text-xs text-slate-300 uppercase tracking-[0.18em]">
                  Bottom text
                  <input
                    type="text"
                    value={bottomText}
                    onChange={(e) => setBottomText(e.target.value)}
                    placeholder="CHAINS GO BRRRR"
                    className="mt-1 w-full rounded-lg bg-black/40 border border-slate-700 px-2 py-1 text-xs md:text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#7A3FFF]"
                  />
                </label>
              </div>

              {/* Export buttons */}
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleExportPng}
                  disabled={exporting}
                  className="px-4 py-2 rounded-xl text-xs md:text-sm bg-slate-100 text-slate-900 border border-slate-300 hover:bg-white hover:border-slate-100 transition disabled:opacity-60"
                >
                  {exporting ? 'Exporting…' : 'Export PNG (transparent)'}
                </button>

                <button
                  type="button"
                  onClick={handleCopyToClipboard}
                  disabled={copying || !clipboardSupported}
                  className="px-4 py-2 rounded-xl text-xs md:text-sm bg-slate-900/80 text-slate-200 border border-slate-700 hover:bg-slate-800 transition disabled:opacity-50"
                >
                  {clipboardSupported
                    ? copying
                      ? 'Copying…'
                      : 'Copy to Clipboard'
                    : 'Copy not supported'}
                </button>
              </div>
            </div>
          </section>

          {/* BACK TO HOME BUTTON */}
          <div className="mt-10 flex justify-center">
            <Link
              href="/"
              className="cta-pill px-10 py-3 text-xs md:text-sm tracking-[0.25em] uppercase"
            >
              BACK TO HOME
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
};

export default MemePage;


