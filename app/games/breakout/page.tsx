"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";

const CANVAS_WIDTH = 360;
const CANVAS_HEIGHT = 640;

const BG_COLOR = "#05010A";
const GRID_COLOR = "rgba(122,63,255,0.18)";

const PADDLE_WIDTH = 80;
const PADDLE_HEIGHT = 14;
const PADDLE_Y_OFFSET = 80;
const PADDLE_SPEED = 0.55; // px per ms

const BALL_RADIUS = 8;
const BALL_SPEED = 0.35; // px per ms

const BRICK_ROWS = 5;
const BRICK_COLS = 8;
const BRICK_MARGIN = 6;
const BRICK_TOP_OFFSET = 90;
const BRICK_HEIGHT = 20;

type GameState = "ready" | "playing" | "gameover" | "win";

type Brick = {
  x: number;
  y: number;
  width: number;
  height: number;
  alive: boolean;
  type: "brrr" | "dog" | "mono";
};

const BreakoutPage: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let lastTime = 0;

    // GAME STATE
    let gameState: GameState = "ready";
    let score = 0;
    let bestScore = 0;

    // Paddle
    let paddleX = CANVAS_WIDTH / 2;
    const paddleY = CANVAS_HEIGHT - PADDLE_Y_OFFSET;
    let moveLeft = false;
    let moveRight = false;

    // Ball
    let ballX = CANVAS_WIDTH / 2;
    let ballY = paddleY - BALL_RADIUS - 2;
    let ballVX = BALL_SPEED; // will be flipped randomly on reset
    let ballVY = -BALL_SPEED;

    // Bricks
    let bricks: Brick[] = [];

    const initBricks = () => {
      bricks = [];
      const totalMarginX = BRICK_MARGIN * (BRICK_COLS + 1);
      const brickWidth = (CANVAS_WIDTH - totalMarginX) / BRICK_COLS;

      for (let row = 0; row < BRICK_ROWS; row++) {
        for (let col = 0; col < BRICK_COLS; col++) {
          const x =
            BRICK_MARGIN + col * (brickWidth + BRICK_MARGIN) + brickWidth / 2;
          const y =
            BRICK_TOP_OFFSET +
            row * (BRICK_HEIGHT + BRICK_MARGIN) +
            BRICK_HEIGHT / 2;

          // type per row, just for colors/vibes
          const type: Brick["type"] =
            row === 0
              ? "brrr"
              : row === BRICK_ROWS - 1
              ? "dog"
              : "mono";

          bricks.push({
            x,
            y,
            width: brickWidth,
            height: BRICK_HEIGHT,
            alive: true,
            type,
          });
        }
      }
    };

    const resetBallAndPaddle = () => {
      paddleX = CANVAS_WIDTH / 2;
      ballX = CANVAS_WIDTH / 2;
      ballY = paddleY - BALL_RADIUS - 2;
      // random left/right start
      const dir = Math.random() < 0.5 ? -1 : 1;
      ballVX = BALL_SPEED * dir;
      ballVY = -BALL_SPEED;
    };

    const resetGame = () => {
      gameState = "ready";
      score = 0;
      initBricks();
      resetBallAndPaddle();
    };

    const startGameIfNeeded = () => {
      if (gameState === "ready") {
        gameState = "playing";
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "ArrowLeft" || e.code === "KeyA") {
        moveLeft = true;
        startGameIfNeeded();
      } else if (e.code === "ArrowRight" || e.code === "KeyD") {
        moveRight = true;
        startGameIfNeeded();
      } else if (e.code === "Space") {
        if (gameState === "gameover" || gameState === "win") {
          resetGame();
        } else {
          startGameIfNeeded();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "ArrowLeft" || e.code === "KeyA") {
        moveLeft = false;
      } else if (e.code === "ArrowRight" || e.code === "KeyD") {
        moveRight = false;
      }
    };

    const handlePointerDown = (evt: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = ((evt.clientX - rect.left) / rect.width) * CANVAS_WIDTH;
      paddleX = x;
      if (gameState === "gameover" || gameState === "win") {
        resetGame();
      } else {
        startGameIfNeeded();
      }
    };

    const handlePointerMove = (evt: PointerEvent) => {
      if (evt.buttons === 0) return; // only drag when pressed
      const rect = canvas.getBoundingClientRect();
      const x = ((evt.clientX - rect.left) / rect.width) * CANVAS_WIDTH;
      paddleX = x;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    canvas.addEventListener("pointerdown", handlePointerDown);
    canvas.addEventListener("pointermove", handlePointerMove);

    // COLLISION HELPERS
    const clamp = (v: number, min: number, max: number) =>
      v < min ? min : v > max ? max : v;

    const update = (delta: number) => {
      if (gameState !== "playing") return;

      // Paddle movement
      const direction = (moveRight ? 1 : 0) - (moveLeft ? 1 : 0);
      paddleX += direction * PADDLE_SPEED * delta;
      const halfPaddle = PADDLE_WIDTH / 2;
      paddleX = clamp(
        paddleX,
        halfPaddle + 6,
        CANVAS_WIDTH - halfPaddle - 6
      );

      // Ball movement
      ballX += ballVX * delta;
      ballY += ballVY * delta;

      // Walls
      if (ballX - BALL_RADIUS < 0) {
        ballX = BALL_RADIUS;
        ballVX = Math.abs(ballVX);
      } else if (ballX + BALL_RADIUS > CANVAS_WIDTH) {
        ballX = CANVAS_WIDTH - BALL_RADIUS;
        ballVX = -Math.abs(ballVX);
      }

      if (ballY - BALL_RADIUS < 0) {
        ballY = BALL_RADIUS;
        ballVY = Math.abs(ballVY);
      }

      // Paddle collision
      const paddleLeft = paddleX - PADDLE_WIDTH / 2;
      const paddleRight = paddleX + PADDLE_WIDTH / 2;
      const paddleTop = paddleY - PADDLE_HEIGHT / 2;
      const paddleBottom = paddleY + PADDLE_HEIGHT / 2;

      if (
        ballY + BALL_RADIUS > paddleTop &&
        ballY + BALL_RADIUS < paddleBottom + 6 &&
        ballX > paddleLeft &&
        ballX < paddleRight &&
        ballVY > 0
      ) {
        // reflect Y
        ballY = paddleTop - BALL_RADIUS;
        ballVY = -Math.abs(ballVY);

        // add some angle based on where it hits the paddle
        const hitPos = (ballX - paddleX) / (PADDLE_WIDTH / 2); // -1..1
        ballVX = BALL_SPEED * hitPos * 1.2;
        const speed = Math.sqrt(ballVX * ballVX + ballVY * ballVY);
        const targetSpeed = BALL_SPEED * 1.2;
        ballVX = (ballVX / speed) * targetSpeed;
        ballVY = (ballVY / speed) * targetSpeed;
      }

      // Bottom = miss
      if (ballY - BALL_RADIUS > CANVAS_HEIGHT) {
        gameState = "gameover";
      }

      // Brick collisions
      let bricksRemaining = 0;
      for (const brick of bricks) {
        if (!brick.alive) continue;
        bricksRemaining++;

        const halfW = brick.width / 2;
        const halfH = brick.height / 2;
        const left = brick.x - halfW;
        const right = brick.x + halfW;
        const top = brick.y - halfH;
        const bottom = brick.y + halfH;

        if (
          ballX + BALL_RADIUS > left &&
          ballX - BALL_RADIUS < right &&
          ballY + BALL_RADIUS > top &&
          ballY - BALL_RADIUS < bottom
        ) {
          // hit
          brick.alive = false;
          score += brick.type === "brrr" ? 30 : brick.type === "dog" ? 20 : 10;

          // Decide collision side
          const overlapLeft = ballX + BALL_RADIUS - left;
          const overlapRight = right - (ballX - BALL_RADIUS);
          const overlapTop = ballY + BALL_RADIUS - top;
          const overlapBottom = bottom - (ballY - BALL_RADIUS);
          const minOverlap = Math.min(
            overlapLeft,
            overlapRight,
            overlapTop,
            overlapBottom
          );

          if (minOverlap === overlapLeft) {
            ballX = left - BALL_RADIUS;
            ballVX = -Math.abs(ballVX);
          } else if (minOverlap === overlapRight) {
            ballX = right + BALL_RADIUS;
            ballVX = Math.abs(ballVX);
          } else if (minOverlap === overlapTop) {
            ballY = top - BALL_RADIUS;
            ballVY = -Math.abs(ballVY);
          } else {
            ballY = bottom + BALL_RADIUS;
            ballVY = Math.abs(ballVY);
          }
        }
      }

      if (bricksRemaining === 0 && gameState === "playing") {
        gameState = "win";
        if (score > bestScore) bestScore = score;
      }
    };

    const drawBackground = (timestamp: number) => {
      ctx.fillStyle = BG_COLOR;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // purple grid with gentle drift
      ctx.strokeStyle = GRID_COLOR;
      ctx.lineWidth = 1;
      const offset = (timestamp * 0.04) % 32;

      for (let x = -32; x < CANVAS_WIDTH + 32; x += 32) {
        ctx.beginPath();
        ctx.moveTo(x + offset, 0);
        ctx.lineTo(x + offset, CANVAS_HEIGHT);
        ctx.stroke();
      }
      for (let y = -32; y < CANVAS_HEIGHT + 32; y += 32) {
        ctx.beginPath();
        ctx.moveTo(0, y + offset);
        ctx.lineTo(CANVAS_WIDTH, y + offset);
        ctx.stroke();
      }

      // faint CRT vignette
      const gradient = ctx.createRadialGradient(
        CANVAS_WIDTH / 2,
        CANVAS_HEIGHT / 2,
        0,
        CANVAS_WIDTH / 2,
        CANVAS_HEIGHT / 2,
        CANVAS_HEIGHT / 1.1
      );
      gradient.addColorStop(0, "rgba(0,0,0,0)");
      gradient.addColorStop(1, "rgba(0,0,0,0.6)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    };

    const drawPaddle = () => {
      const x = paddleX;
      const y = paddleY;
      const halfW = PADDLE_WIDTH / 2;
      const halfH = PADDLE_HEIGHT / 2;

      ctx.save();
      ctx.shadowColor = "rgba(122,63,255,0.9)";
      ctx.shadowBlur = 18;

      const grad = ctx.createLinearGradient(
        x - halfW,
        y,
        x + halfW,
        y
      );
      grad.addColorStop(0, "#06B6D4");
      grad.addColorStop(0.5, "#7C3AED");
      grad.addColorStop(1, "#EC4899");

      ctx.fillStyle = grad;
      ctx.strokeStyle = "#E5E7EB";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(x - halfW, y - halfH, PADDLE_WIDTH, PADDLE_HEIGHT, 6);
      ctx.fill();
      ctx.stroke();

      // tiny "BRRR" text
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#E5E7EB";
      ctx.font = "9px monospace";
      ctx.textAlign = "center";
      ctx.fillText("BRRR", x, y + 3);

      ctx.restore();
    };

    const drawBall = () => {
      ctx.save();
      ctx.shadowColor = "rgba(250,250,255,0.9)";
      ctx.shadowBlur = 16;

      const gradient = ctx.createRadialGradient(
        ballX - 3,
        ballY - 3,
        2,
        ballX,
        ballY,
        BALL_RADIUS + 4
      );
      gradient.addColorStop(0, "#F9FAFB");
      gradient.addColorStop(0.5, "#C4B5FD");
      gradient.addColorStop(1, "#7C3AED");

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(ballX, ballY, BALL_RADIUS, 0, Math.PI * 2);
      ctx.fill();

      // tiny dog nose dot
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#020617";
      ctx.beginPath();
      ctx.arc(ballX + 2, ballY - 1, 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    const drawBricks = () => {
      for (const brick of bricks) {
        if (!brick.alive) continue;

        const halfW = brick.width / 2;
        const halfH = brick.height / 2;
        const x = brick.x - halfW;
        const y = brick.y - halfH;

        ctx.save();
        ctx.shadowBlur = 12;

        if (brick.type === "brrr") {
          ctx.shadowColor = "rgba(34,197,94,0.9)";
          const grad = ctx.createLinearGradient(x, y, x + brick.width, y);
          grad.addColorStop(0, "#16A34A");
          grad.addColorStop(1, "#22C55E");
          ctx.fillStyle = grad;
        } else if (brick.type === "dog") {
          ctx.shadowColor = "rgba(244,114,182,0.9)";
          ctx.fillStyle = "#F472B6";
        } else {
          ctx.shadowColor = "rgba(129,140,248,0.9)";
          ctx.fillStyle = "#6366F1";
        }

        ctx.strokeStyle = "rgba(250,250,250,0.9)";
        ctx.lineWidth = 1.2;

        ctx.beginPath();
        ctx.roundRect(x, y, brick.width, brick.height, 5);
        ctx.fill();
        ctx.stroke();

        // tiny icons / text
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#020617";
        ctx.font = "8px monospace";
        ctx.textAlign = "center";

        if (brick.type === "brrr") {
          ctx.fillText("$BRRR", brick.x, brick.y + 3);
        } else if (brick.type === "dog") {
          ctx.fillText("DOG", brick.x, brick.y + 3);
        } else {
          ctx.fillText("JEETS", brick.x, brick.y + 3);
        }

        ctx.restore();
      }
    };

    const drawHUD = () => {
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "14px 'PressStart2P', monospace";
      ctx.textAlign = "left";
      ctx.fillText(`SCORE ${score}`, 10, 28);

      ctx.textAlign = "right";
      ctx.fillText(`BEST ${bestScore}`, CANVAS_WIDTH - 10, 28);
    };

    const drawOverlay = () => {
      ctx.textAlign = "center";
      ctx.font = "11px 'PressStart2P', monospace";

      if (gameState === "ready") {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText(
          "ANAGO BREAKOUT",
          CANVAS_WIDTH / 2,
          CANVAS_HEIGHT / 2 - 40
        );
        ctx.fillStyle = "#C4B5FD";
        ctx.fillText(
          "Move: Arrows / A-D / Drag",
          CANVAS_WIDTH / 2,
          CANVAS_HEIGHT / 2 - 10
        );
        ctx.fillStyle = "#9CA3AF";
        ctx.fillText(
          "Break BRRR blocks · Don’t drop the ball",
          CANVAS_WIDTH / 2,
          CANVAS_HEIGHT / 2 + 14
        );
      }

      if (gameState === "gameover" || gameState === "win") {
        ctx.fillStyle = "rgba(0,0,0,0.75)";
        ctx.fillRect(
          40,
          CANVAS_HEIGHT / 2 - 80,
          CANVAS_WIDTH - 80,
          150
        );

        ctx.fillStyle = gameState === "win" ? "#4ADE80" : "#FF6B9B";
        ctx.font = "14px 'PressStart2P', monospace";
        ctx.fillText(
          gameState === "win" ? "SECTOR CLEARED" : "GAME OVER",
          CANVAS_WIDTH / 2,
          CANVAS_HEIGHT / 2 - 32
        );

        ctx.font = "11px 'PressStart2P', monospace";
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText(
          `SCORE ${score}`,
          CANVAS_WIDTH / 2,
          CANVAS_HEIGHT / 2 - 4
        );
        ctx.fillText(
          `BEST ${bestScore}`,
          CANVAS_WIDTH / 2,
          CANVAS_HEIGHT / 2 + 16
        );

        ctx.fillStyle = "#C4B5FD";
        ctx.fillText(
          "Tap / Space to restart",
          CANVAS_WIDTH / 2,
          CANVAS_HEIGHT / 2 + 44
        );
      }
    };

    const render = (timestamp: number) => {
      if (!lastTime) lastTime = timestamp;
      const delta = timestamp - lastTime;
      lastTime = timestamp;

      update(delta);
      drawBackground(timestamp);
      drawBricks();
      drawPaddle();
      drawBall();
      drawHUD();
      drawOverlay();

      animationFrameId = window.requestAnimationFrame(render);
    };

    // init & start
    resetGame();
    animationFrameId = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      canvas.removeEventListener("pointerdown", handlePointerDown);
      canvas.removeEventListener("pointermove", handlePointerMove);
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
            Anago Breakout
          </h1>
          <p className="text-sm text-purple-100/70">
            Bounce the BRRR ball, break the dog / degen blocks, don&apos;t whiff.
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
            Arrows / A-D to move · Drag / Tap to start
          </span>
        </p>
      </div>
    </main>
  );
};

export default BreakoutPage;
