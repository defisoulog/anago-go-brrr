"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";

const CANVAS_WIDTH = 360;
const CANVAS_HEIGHT = 640;

const BG_COLOR = "#05010A";
const GRID_COLOR = "#7A3FFF22";
const GROUND_COLOR = "#1A1028";

// Physics tuning (nice & playable)
const GRAVITY = 0.0013;
const FLAP_STRENGTH = -0.55;
const MAX_FALL_SPEED = 0.75;

const GROUND_HEIGHT = 80;

// Pipes
const PIPE_WIDTH = 60;
const PIPE_GAP_HEIGHT = 190;
const PIPE_SPEED = 0.11;
const PIPE_INTERVAL = 1900;

// Pixel-style fonts (will fall back to system if the custom font isn’t loaded)
const SCORE_FONT = "20px 'PressStart2P', system-ui";
const SMALL_FONT = "11px 'PressStart2P', system-ui";

type GameState = "ready" | "playing" | "gameover";

type Pipe = {
  x: number;
  gapY: number;
};

const FlappyAnagoPage: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // ---- SPRITE ----
    const playerSprite = new Image();
    playerSprite.src = "/games/anago-flappy.png"; // put this file in /public/games/anago-flappy.png
    let spriteLoaded = false;
    playerSprite.onload = () => {
      spriteLoaded = true;
    };

    // ---- GAME STATE ----
    let animationFrameId: number;
    let lastTime = 0;

    let gameState: GameState = "ready";

    const playerRadius = 16;
    const playerX = CANVAS_WIDTH / 3;

    let playerY = CANVAS_HEIGHT / 2;
    let playerVelocity = 0;

    let pipes: Pipe[] = [];
    let timeSinceLastPipe = 0;

    let score = 0;
    let bestScore = 0;

    // ---- HELPERS ----
    const resetGame = () => {
      gameState = "ready";
      playerY = CANVAS_HEIGHT / 2;
      playerVelocity = 0;
      pipes = [];
      timeSinceLastPipe = 0;
      score = 0;
    };

    const spawnPipe = () => {
      const margin = 60;
      const gapY =
        margin +
        Math.random() *
          (CANVAS_HEIGHT - GROUND_HEIGHT - PIPE_GAP_HEIGHT - margin * 2);

      pipes.push({
        x: CANVAS_WIDTH + PIPE_WIDTH,
        gapY,
      });
    };

    const startGameIfNeeded = () => {
      if (gameState === "ready") {
        gameState = "playing";
      }
    };

    const handleFlap = () => {
      if (gameState === "gameover") {
        resetGame();
        return;
      }

      startGameIfNeeded();
      if (gameState === "playing") {
        playerVelocity = FLAP_STRENGTH;
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        handleFlap();
      }
    };

    const handlePointerDown = () => {
      handleFlap();
    };

    window.addEventListener("keydown", handleKeyDown);
    canvas.addEventListener("pointerdown", handlePointerDown);

    // ---- MAIN LOOP ----
    const render = (timestamp: number) => {
      if (!lastTime) lastTime = timestamp;
      const deltaTime = timestamp - lastTime;
      lastTime = timestamp;

      // UPDATE
      if (gameState === "playing") {
        // Physics
        playerVelocity += GRAVITY * deltaTime;
        if (playerVelocity > MAX_FALL_SPEED) {
          playerVelocity = MAX_FALL_SPEED;
        }
        playerY += playerVelocity * deltaTime;

        const floorY = CANVAS_HEIGHT - GROUND_HEIGHT - playerRadius;
        if (playerY > floorY) {
          playerY = floorY;
          playerVelocity = 0;
          gameState = "gameover";
        }
        if (playerY < playerRadius) {
          playerY = playerRadius;
          playerVelocity = 0;
        }

        // Pipes
        timeSinceLastPipe += deltaTime;
        if (timeSinceLastPipe > PIPE_INTERVAL) {
          spawnPipe();
          timeSinceLastPipe = 0;
        }

        pipes.forEach((pipe) => {
          pipe.x -= PIPE_SPEED * deltaTime;
        });

        // Remove off-screen pipes
        pipes = pipes.filter((pipe) => pipe.x + PIPE_WIDTH > 0);

        // Collision + scoring
        pipes.forEach((pipe) => {
          const withinPipeX =
            playerX + playerRadius > pipe.x &&
            playerX - playerRadius < pipe.x + PIPE_WIDTH;

          if (withinPipeX) {
            const topPipeBottomY = pipe.gapY;
            const bottomPipeTopY = pipe.gapY + PIPE_GAP_HEIGHT;

            if (
              playerY - playerRadius < topPipeBottomY ||
              playerY + playerRadius > bottomPipeTopY
            ) {
              gameState = "gameover";
            }
          }

          // Score when fully passed
          if (
            !("scored" in (pipe as any)) &&
            pipe.x + PIPE_WIDTH < playerX - playerRadius
          ) {
            (pipe as any).scored = true;
            score += 1;
            if (score > bestScore) bestScore = score;
          }
        });
      }

      // DRAW — background
      ctx.fillStyle = BG_COLOR;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      const speed = 0.05;
      const offset = (timestamp * speed) % 40;

      ctx.strokeStyle = GRID_COLOR;
      ctx.lineWidth = 1;

      for (let x = -40; x < CANVAS_WIDTH + 40; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x + offset, 0);
        ctx.lineTo(x + offset, CANVAS_HEIGHT);
        ctx.stroke();
      }

      for (let y = -40; y < CANVAS_HEIGHT + 40; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y + offset);
        ctx.lineTo(CANVAS_WIDTH, y + offset);
        ctx.stroke();
      }

      // Ground
      ctx.fillStyle = GROUND_COLOR;
      ctx.fillRect(
        0,
        CANVAS_HEIGHT - GROUND_HEIGHT,
        CANVAS_WIDTH,
        GROUND_HEIGHT
      );

      // PIPES (with glow + glitch stripes)
      pipes.forEach((pipe) => {
        const topPipeHeight = pipe.gapY;
        const bottomPipeY = pipe.gapY + PIPE_GAP_HEIGHT;
        const bottomPipeHeight =
          CANVAS_HEIGHT - GROUND_HEIGHT - bottomPipeY;

        // Glow settings
        ctx.shadowColor = "rgba(122, 63, 255, 0.9)";
        ctx.shadowBlur = 18;

        const gradient = ctx.createLinearGradient(
          pipe.x,
          0,
          pipe.x + PIPE_WIDTH,
          0
        );
        gradient.addColorStop(0, "#2A0B46");
        gradient.addColorStop(0.5, "#51129B");
        gradient.addColorStop(1, "#2A0B46");
        ctx.fillStyle = gradient;
        ctx.strokeStyle = "#C5A3FF";
        ctx.lineWidth = 3;

        // Top pipe
        ctx.beginPath();
        ctx.rect(pipe.x, 0, PIPE_WIDTH, topPipeHeight);
        ctx.fill();
        ctx.stroke();

        // Bottom pipe
        ctx.beginPath();
        ctx.rect(pipe.x, bottomPipeY, PIPE_WIDTH, bottomPipeHeight);
        ctx.fill();
        ctx.stroke();

        // Glitch stripes
        ctx.shadowBlur = 0;
        ctx.fillStyle = "rgba(197,163,255,0.35)";
        const stripeWidth = 4;
        ctx.fillRect(pipe.x + 6, 0, stripeWidth, topPipeHeight);
        ctx.fillRect(
          pipe.x + PIPE_WIDTH - 10,
          bottomPipeY,
          stripeWidth,
          bottomPipeHeight
        );
      });

      // Reset shadow
      ctx.shadowBlur = 0;
      ctx.shadowColor = "transparent";

      // PLAYER — sprite or fallback circle
      const spriteSize = 40;
      if (spriteLoaded) {
        ctx.save();
        ctx.translate(playerX, playerY);

        // tilt a bit when moving up/down
        const tilt = Math.max(Math.min(playerVelocity * 1.2, 0.4), -0.4);
        ctx.rotate(tilt);

        ctx.drawImage(
          playerSprite,
          -spriteSize / 2,
          -spriteSize / 2,
          spriteSize,
          spriteSize
        );
        ctx.restore();
      } else {
        ctx.fillStyle = "#7A3FFF";
        ctx.beginPath();
        ctx.arc(playerX, playerY, playerRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.arc(playerX + 6, playerY - 4, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#000000";
        ctx.beginPath();
        ctx.arc(playerX + 7, playerY - 4, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // SCORE — pixel style
      ctx.textAlign = "center";
      ctx.fillStyle = "#FFFFFF";
      ctx.font = SCORE_FONT;
      ctx.fillText(String(score), CANVAS_WIDTH / 2, 50);

      ctx.textAlign = "right";
      ctx.font = SMALL_FONT;
      ctx.fillStyle = "#AAAAFF";
      ctx.fillText(`BEST ${bestScore}`, CANVAS_WIDTH - 10, 26);

      // STATE OVERLAYS
      ctx.textAlign = "center";

      if (gameState === "ready") {
        ctx.font = SMALL_FONT;
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText(
          "FLAPPY ANAGO",
          CANVAS_WIDTH / 2,
          CANVAS_HEIGHT / 2 - 40
        );

        ctx.fillStyle = "#CCCCFF";
        ctx.fillText(
          "TAP / CLICK / SPACE TO START",
          CANVAS_WIDTH / 2,
          CANVAS_HEIGHT / 2 - 10
        );

        ctx.fillStyle = "#8888CC";
        ctx.fillText(
          "AVOID THE GLITCH PIPES",
          CANVAS_WIDTH / 2,
          CANVAS_HEIGHT / 2 + 18
        );
      }

      if (gameState === "gameover") {
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.fillRect(
          40,
          CANVAS_HEIGHT / 2 - 80,
          CANVAS_WIDTH - 80,
          130
        );

        ctx.font = SMALL_FONT;
        ctx.fillStyle = "#FF6B9B";
        ctx.fillText(
          "GAME OVER",
          CANVAS_WIDTH / 2,
          CANVAS_HEIGHT / 2 - 32
        );

        ctx.fillStyle = "#FFFFFF";
        ctx.fillText(
          `SCORE ${score}`,
          CANVAS_WIDTH / 2,
          CANVAS_HEIGHT / 2 - 6
        );
        ctx.fillText(
          `BEST ${bestScore}`,
          CANVAS_WIDTH / 2,
          CANVAS_HEIGHT / 2 + 14
        );

        ctx.fillStyle = "#CCCCFF";
        ctx.fillText(
          "TAP / SPACE TO RESTART",
          CANVAS_WIDTH / 2,
          CANVAS_HEIGHT / 2 + 40
        );
      }

      animationFrameId = window.requestAnimationFrame(render);
    };

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
            Flappy Anago
          </h1>
          <p className="text-sm text-purple-100/70">
            Tap / click / space to flap. Don&apos;t kiss the pipes.
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
          <span className="text-purple-300">Space / Click / Tap</span> ·
          Pass pipes to score.
        </p>
      </div>
    </main>
  );
};

export default FlappyAnagoPage;

