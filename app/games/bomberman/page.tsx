"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";

const CANVAS_WIDTH = 360;
const CANVAS_HEIGHT = 480;

// Grid
const GRID_COLS = 11;
const GRID_ROWS = 13;
const TILE_SIZE = 28;
const GRID_TOP = 80;
const GRID_LEFT = (CANVAS_WIDTH - GRID_COLS * TILE_SIZE) / 2;

// Colors / theme
const BG_COLOR = "#05010A";
const GRID_LINE_COLOR = "rgba(122,63,255,0.16)";
const SOLID_COLOR = "#1F102F";
const CRATE_COLOR = "#7A3FFF";
const CRATE_ACCENT = "#F9A8D4";
const PLAYER_FACE_COLOR = "#F9A8D4";
const PLAYER_EAR_COLOR = "#7A3FFF";
const PLAYER_FEATURE_COLOR = "#020617";
const BOMB_COLOR = "#C4B5FD";
const EXPLOSION_COLOR = "#FF6BD5";

type GameState = "ready" | "playing" | "gameover" | "win";

type TileType = "empty" | "solid" | "crate";

type Bomb = {
  x: number; // tile
  y: number; // tile
  timeLeft: number; // ms until explosion
};

type ExplosionTile = {
  x: number;
  y: number;
  timeLeft: number; // ms until fade
};

const BOMB_FUSE = 1800; // ms
const EXPLOSION_DURATION = 260; // ms
const EXPLOSION_RANGE = 3;

const DogBomberPage: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 🔧 Important for mobile: prevent scroll/zoom gestures on canvas
    canvas.style.touchAction = "none";

    let animationFrameId: number;
    let lastTime = 0;

    // GAME STATE
    let gameState: GameState = "ready";
    let score = 0;
    let bestScore = 0;

    // GRID / MAP
    let grid: TileType[][] = [];

    // PLAYER (tile coords)
    let playerX = 1;
    let playerY = 1;

    // BOMBS + EXPLOSIONS
    let bombs: Bomb[] = [];
    let explosions: ExplosionTile[] = [];
    let crateCount = 0;

    // ====== MAP SETUP ======
    const createInitialGrid = () => {
      grid = [];
      crateCount = 0;

      for (let y = 0; y < GRID_ROWS; y++) {
        const row: TileType[] = [];
        for (let x = 0; x < GRID_COLS; x++) {
          // Border walls
          if (
            x === 0 ||
            y === 0 ||
            x === GRID_COLS - 1 ||
            y === GRID_ROWS - 1
          ) {
            row.push("solid");
            continue;
          }

          // Inner solid pillars (checkerboard style)
          if (x % 2 === 0 && y % 2 === 0) {
            row.push("solid");
            continue;
          }

          // Keep a safe starting zone around (1,1)
          const distFromStart = Math.abs(x - 1) + Math.abs(y - 1);
          if (distFromStart <= 2) {
            row.push("empty");
            continue;
          }

          // Random crates on remaining empty tiles
          if (Math.random() < 0.45) {
            row.push("crate");
            crateCount++;
          } else {
            row.push("empty");
          }
        }
        grid.push(row);
      }

      // Ensure player start is empty
      grid[1][1] = "empty";
      playerX = 1;
      playerY = 1;
    };

    const resetGame = () => {
      gameState = "ready";
      score = 0;
      bombs = [];
      explosions = [];
      createInitialGrid();
    };

    // ====== HELPERS ======
    const tileInBounds = (x: number, y: number) =>
      x >= 0 && y >= 0 && x < GRID_COLS && y < GRID_ROWS;

    const isWalkable = (x: number, y: number) => {
      if (!tileInBounds(x, y)) return false;
      const t = grid[y][x];
      if (t === "solid" || t === "crate") return false;
      // check bombs
      const bombHere = bombs.some((b) => b.x === x && b.y === y);
      if (bombHere) return false;
      return true;
    };

    const startGameIfNeeded = () => {
      if (gameState === "ready") {
        gameState = "playing";
      }
    };

    const tryMovePlayer = (dx: number, dy: number) => {
      if (gameState === "gameover" || gameState === "win") return;
      startGameIfNeeded();
      const nx = playerX + dx;
      const ny = playerY + dy;
      if (isWalkable(nx, ny)) {
        playerX = nx;
        playerY = ny;
      }
    };

    const placeBomb = () => {
      if (gameState === "gameover" || gameState === "win") {
        resetGame();
        return;
      }
      startGameIfNeeded();

      // only one bomb per tile
      const exists = bombs.some((b) => b.x === playerX && b.y === playerY);
      if (exists) return;

      bombs.push({
        x: playerX,
        y: playerY,
        timeLeft: BOMB_FUSE,
      });
    };

    const triggerExplosionAt = (x: number, y: number) => {
      const tiles: { x: number; y: number }[] = [];

      // Center
      tiles.push({ x, y });

      // Four directions
      const dirs = [
        { dx: 1, dy: 0 },
        { dx: -1, dy: 0 },
        { dx: 0, dy: 1 },
        { dx: 0, dy: -1 },
      ];

      for (const { dx, dy } of dirs) {
        for (let i = 1; i <= EXPLOSION_RANGE; i++) {
          const tx = x + dx * i;
          const ty = y + dy * i;
          if (!tileInBounds(tx, ty)) break;
          const t = grid[ty][tx];
          if (t === "solid") {
            // explosion stops at solid wall (doesn't show)
            break;
          }
          tiles.push({ x: tx, y: ty });
          if (t === "crate") {
            // crate is destroyed and stops blast
            grid[ty][tx] = "empty";
            crateCount--;
            score += 10;
            break;
          }
        }
      }

      // Add explosion tiles
      tiles.forEach((tile) => {
        explosions.push({
          x: tile.x,
          y: tile.y,
          timeLeft: EXPLOSION_DURATION,
        });
      });

      // Chain reaction: any bomb within explosion also detonates
      bombs.forEach((b) => {
        if (
          tiles.some((t) => t.x === b.x && t.y === b.y) &&
          b.timeLeft > 0
        ) {
          b.timeLeft = 0; // will be processed next update
        }
      });
    };

    const update = (delta: number) => {
      if (gameState !== "playing") return;

      // Update bombs
      bombs.forEach((b) => {
        b.timeLeft -= delta;
      });

      const bombsToExplode = bombs.filter((b) => b.timeLeft <= 0);
      if (bombsToExplode.length > 0) {
        bombsToExplode.forEach((b) => {
          triggerExplosionAt(b.x, b.y);
        });
        bombs = bombs.filter((b) => b.timeLeft > 0);
      }

      // Update explosions
      explosions.forEach((e) => {
        e.timeLeft -= delta;
      });
      explosions = explosions.filter((e) => e.timeLeft > 0);

      // Player hit by explosion?
      const hit = explosions.some((e) => e.x === playerX && e.y === playerY);
      if (hit) {
        gameState = "gameover";
      }

      // Win condition: no crates left
      if (crateCount <= 0 && gameState === "playing") {
        gameState = "win";
        if (score > bestScore) bestScore = score;
      }
    };

    // ====== INPUT: KEYBOARD ======
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "ArrowUp" || e.code === "KeyW") {
        e.preventDefault();
        tryMovePlayer(0, -1);
      } else if (e.code === "ArrowDown" || e.code === "KeyS") {
        e.preventDefault();
        tryMovePlayer(0, 1);
      } else if (e.code === "ArrowLeft" || e.code === "KeyA") {
        e.preventDefault();
        tryMovePlayer(-1, 0);
      } else if (e.code === "ArrowRight" || e.code === "KeyD") {
        e.preventDefault();
        tryMovePlayer(1, 0);
      } else if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        placeBomb();
      }
    };

    // ====== INPUT: TOUCH / POINTER (MOBILE) ======
    const handlePointerDown = (evt: PointerEvent) => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const cx =
        ((evt.clientX - rect.left) / rect.width) * CANVAS_WIDTH;
      const cy =
        ((evt.clientY - rect.top) / rect.height) * CANVAS_HEIGHT;

      const playerCenterX =
        GRID_LEFT + playerX * TILE_SIZE + TILE_SIZE / 2;
      const playerCenterY =
        GRID_TOP + playerY * TILE_SIZE + TILE_SIZE / 2;

      const dx = cx - playerCenterX;
      const dy = cy - playerCenterY;

      // If tap is close to player → drop bomb
      const distSq = dx * dx + dy * dy;
      if (distSq < (TILE_SIZE * TILE_SIZE) / 2) {
        placeBomb();
        return;
      }

      // Otherwise move one step in tap direction
      if (Math.abs(dx) > Math.abs(dy)) {
        // horizontal
        if (dx > 0) {
          tryMovePlayer(1, 0);
        } else {
          tryMovePlayer(-1, 0);
        }
      } else {
        // vertical
        if (dy > 0) {
          tryMovePlayer(0, 1);
        } else {
          tryMovePlayer(0, -1);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    canvas.addEventListener("pointerdown", handlePointerDown);

    // ====== DRAWING ======
    const drawBackground = (timestamp: number) => {
      ctx.fillStyle = BG_COLOR;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Subtle grid behind everything
      ctx.strokeStyle = GRID_LINE_COLOR;
      ctx.lineWidth = 1;
      const offset = (timestamp * 0.04) % 24;

      for (let x = -24; x < CANVAS_WIDTH + 24; x += 24) {
        ctx.beginPath();
        ctx.moveTo(x + offset, 0);
        ctx.lineTo(x + offset, CANVAS_HEIGHT);
        ctx.stroke();
      }
      for (let y = -24; y < CANVAS_HEIGHT + 24; y += 24) {
        ctx.beginPath();
        ctx.moveTo(0, y + offset);
        ctx.lineTo(CANVAS_WIDTH, y + offset);
        ctx.stroke();
      }
    };

    const drawGridTiles = () => {
      for (let y = 0; y < GRID_ROWS; y++) {
        for (let x = 0; x < GRID_COLS; x++) {
          const t = grid[y][x];
          const px = GRID_LEFT + x * TILE_SIZE;
          const py = GRID_TOP + y * TILE_SIZE;

          if (t === "solid") {
            ctx.save();
            ctx.shadowColor = "rgba(15,23,42,0.9)";
            ctx.shadowBlur = 8;
            ctx.fillStyle = SOLID_COLOR;
            ctx.strokeStyle = "rgba(148,163,184,0.5)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4, 4);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
          } else if (t === "crate") {
            ctx.save();
            ctx.shadowColor = "rgba(122,63,255,0.7)";
            ctx.shadowBlur = 12;
            ctx.fillStyle = CRATE_COLOR;
            ctx.strokeStyle = CRATE_ACCENT;
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.roundRect(px + 3, py + 3, TILE_SIZE - 6, TILE_SIZE - 6, 5);
            ctx.fill();
            ctx.stroke();

            // Little dog bone icon
            ctx.shadowBlur = 0;
            ctx.fillStyle = "#0F172A";
            ctx.font = "8px monospace";
            ctx.textAlign = "center";
            ctx.fillText("DOG", px + TILE_SIZE / 2, py + TILE_SIZE / 2 + 3);

            ctx.restore();
          } else {
            // empty tile faint outline
            ctx.strokeStyle = "rgba(148,163,184,0.18)";
            ctx.lineWidth = 0.5;
            ctx.strokeRect(px + 4, py + 4, TILE_SIZE - 8, TILE_SIZE - 8);
          }
        }
      }
    };

    const drawBombs = () => {
      bombs.forEach((b) => {
        const px =
          GRID_LEFT + b.x * TILE_SIZE + TILE_SIZE / 2;
        const py =
          GRID_TOP + b.y * TILE_SIZE + TILE_SIZE / 2;

        const fuseRatio = Math.max(b.timeLeft, 0) / BOMB_FUSE;
        const pulse = 1 + 0.15 * Math.sin((1 - fuseRatio) * 10);

        ctx.save();
        ctx.shadowColor = "rgba(196,181,253,0.9)";
        ctx.shadowBlur = 16;

        const radius = (TILE_SIZE / 3) * pulse;
        const gradient = ctx.createRadialGradient(
          px - 3,
          py - 3,
          2,
          px,
          py,
          radius + 4
        );
        gradient.addColorStop(0, "#F9FAFB");
        gradient.addColorStop(0.5, BOMB_COLOR);
        gradient.addColorStop(1, "#7C3AED");
        ctx.fillStyle = gradient;

        ctx.beginPath();
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.fill();

        // tiny fuse
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "#F97316";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(px, py - radius);
        ctx.lineTo(px, py - radius - 6);
        ctx.stroke();

        ctx.restore();
      });
    };

    const drawExplosions = () => {
      explosions.forEach((e) => {
        const px =
          GRID_LEFT + e.x * TILE_SIZE + TILE_SIZE / 2;
        const py =
          GRID_TOP + e.y * TILE_SIZE + TILE_SIZE / 2;

        const alpha = Math.max(e.timeLeft, 0) / EXPLOSION_DURATION;

        ctx.save();
        ctx.globalAlpha = 0.2 + 0.8 * alpha;
        ctx.shadowColor = "rgba(255,107,213,0.9)";
        ctx.shadowBlur = 20;
        ctx.fillStyle = EXPLOSION_COLOR;

        // cross shape
        const w = TILE_SIZE * 0.9;
        const h = TILE_SIZE * 0.9;
        const arm = TILE_SIZE * 0.28;

        // vertical bar
        ctx.fillRect(px - arm / 2, py - h / 2, arm, h);
        // horizontal bar
        ctx.fillRect(px - w / 2, py - arm / 2, w, arm);

        ctx.restore();
      });
    };

    const drawPlayer = () => {
      const px =
        GRID_LEFT + playerX * TILE_SIZE + TILE_SIZE / 2;
      const py =
        GRID_TOP + playerY * TILE_SIZE + TILE_SIZE / 2;

      ctx.save();
      ctx.shadowColor = "rgba(244,114,182,0.9)";
      ctx.shadowBlur = 16;

      const size = TILE_SIZE * 0.7;
      const half = size / 2;

      // face
      ctx.fillStyle = PLAYER_FACE_COLOR;
      ctx.beginPath();
      ctx.roundRect(
        px - half,
        py - half,
        size,
        size,
        6
      );
      ctx.fill();

      // ears
      ctx.fillStyle = PLAYER_EAR_COLOR;
      const earW = size * 0.25;
      const earH = size * 0.35;
      ctx.beginPath();
      ctx.roundRect(
        px - half + 2,
        py - half - earH * 0.4,
        earW,
        earH,
        4
      );
      ctx.roundRect(
        px + half - earW - 2,
        py - half - earH * 0.4,
        earW,
        earH,
        4
      );
      ctx.fill();

      // eyes
      ctx.shadowBlur = 0;
      ctx.fillStyle = PLAYER_FEATURE_COLOR;
      ctx.beginPath();
      ctx.arc(px - size * 0.18, py - size * 0.05, 2.5, 0, Math.PI * 2);
      ctx.arc(px + size * 0.18, py - size * 0.05, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // nose
      ctx.beginPath();
      ctx.moveTo(px, py + size * 0.04);
      ctx.lineTo(px - 3, py + size * 0.12);
      ctx.lineTo(px + 3, py + size * 0.12);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    };

    const drawHUD = () => {
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "13px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`SCORE: ${score}`, 12, 26);
      ctx.textAlign = "right";
      ctx.fillText(`BEST: ${bestScore}`, CANVAS_WIDTH - 12, 26);
    };

    const drawOverlay = () => {
      ctx.textAlign = "center";
      ctx.font = "12px monospace";

      if (gameState === "ready") {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText(
          "DOG BOMBER",
          CANVAS_WIDTH / 2,
          GRID_TOP - 28
        );
        ctx.fillStyle = "#C4B5FD";
        ctx.fillText(
          "Move: tap around dog · Bomb: tap on dog (or Space / Enter)",
          CANVAS_WIDTH / 2,
          GRID_TOP - 8
        );
      }

      if (gameState === "gameover" || gameState === "win") {
        ctx.fillStyle = "rgba(0,0,0,0.8)";
        ctx.fillRect(
          40,
          CANVAS_HEIGHT / 2 - 70,
          CANVAS_WIDTH - 80,
          140
        );

        ctx.fillStyle = gameState === "win" ? "#4ADE80" : "#FF6B9B";
        ctx.font = "15px monospace";
        ctx.fillText(
          gameState === "win" ? "AREA CLEARED" : "DOG FRIED",
          CANVAS_WIDTH / 2,
          CANVAS_HEIGHT / 2 - 20
        );

        ctx.font = "12px monospace";
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText(
          `Score: ${score}  ·  Best: ${bestScore}`,
          CANVAS_WIDTH / 2,
          CANVAS_HEIGHT / 2 + 4
        );

        ctx.fillStyle = "#C4B5FD";
        ctx.fillText(
          "Tap / Space / Enter to restart",
          CANVAS_WIDTH / 2,
          CANVAS_HEIGHT / 2 + 30
        );
      }
    };

    const render = (timestamp: number) => {
      if (!lastTime) lastTime = timestamp;
      const delta = timestamp - lastTime;
      lastTime = timestamp;

      update(delta);
      drawBackground(timestamp);
      drawGridTiles();
      drawBombs();
      drawExplosions();
      drawPlayer();
      drawHUD();
      drawOverlay();

      animationFrameId = window.requestAnimationFrame(render);
    };

    // init + start
    resetGame();
    animationFrameId = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.removeEventListener("keydown", handleKeyDown);
      canvas.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="max-w-md w-full flex flex-col items-center gap-4">
        {/* Back to arcade */}
        <div className="w-full flex justify-start">
          <Link
            href="/games"
            className="text-xs font-mono text-purple-300/80 hover:text-purple-100 underline underline-offset-4"
          >
            ◀ Back to ANAGO Arcade
          </Link>
        </div>

        <header className="text-center space-y-1">
          <p className="text-xs uppercase tracking-[0.2em] text-purple-300/70">
            $ANAGO Arcade
          </p>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Dog Bomber
          </h1>
          <p className="text-sm text-purple-100/70">
            Neon dog heads, BRRR crates, chain explosions. Classic grid chaos.
          </p>
        </header>

        <div
          className="
            relative
            border border-purple-500/40
            rounded-2xl
            bg-gradient-to-b from-purple-900/40 via-black to-black
            shadow-[0_0_40px_rgba(122,63,255,0.45)]
            p-3
            w-full
            flex
            justify-center
          "
        >
          <div className="w-full max-w-[360px]">
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              className="w-full h-auto rounded-xl bg-black"
            />
          </div>
        </div>

        <p className="text-xs text-center text-zinc-400">
          Controls:{" "}
          <span className="text-purple-300">
            Arrows / WASD to move · Space/Enter to bomb · Tap around dog to move, tap on dog to bomb
          </span>
        </p>
      </div>
    </main>
  );
};

export default DogBomberPage;

