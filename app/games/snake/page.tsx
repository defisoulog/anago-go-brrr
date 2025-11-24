"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";

const GRID_SIZE = 20; 
const CELL_SIZE = 16;
const CANVAS_SIZE = GRID_SIZE * CELL_SIZE;

type Direction = "up" | "down" | "left" | "right";
type GameState = "ready" | "playing" | "gameover";

type Cell = { x: number; y: number };

const STEP_MS = 120;

const BG_COLOR = "#05010A";
const GRID_COLOR = "rgba(122,63,255,0.18)";
const SNAKE_HEAD_COLOR = "#F472FF";
const SNAKE_BODY_COLOR = "rgba(122,63,255,0.9)";
const FOOD_COLOR = "#FF6BD5";
const SCORE_TEXT_COLOR = "#FFFFFF";
const ACCENT_TEXT_COLOR = "#C4B5FD";

const SnakePage: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let lastTime = 0;
    let accumulator = 0;

    let gameState: GameState = "ready";

    let snake: Cell[] = [{ x: 10, y: 10 }];
    let direction: Direction = "right";
    let nextDirection: Direction = "right";
    let food: Cell = { x: 5, y: 10 };
    let score = 0;
    let bestScore = 0;

    const randomFood = (snakeBody: Cell[]): Cell => {
      while (true) {
        const x = Math.floor(Math.random() * GRID_SIZE);
        const y = Math.floor(Math.random() * GRID_SIZE);
        const onSnake = snakeBody.some((c) => c.x === x && c.y === y);
        if (!onSnake) return { x, y };
      }
    };

    const resetGame = () => {
      gameState = "ready";
      snake = [{ x: 10, y: 10 }];
      direction = "right";
      nextDirection = "right";
      food = randomFood(snake);
      score = 0;
    };

    const startGameIfNeeded = () => {
      if (gameState === "ready") {
        gameState = "playing";
      }
    };

    const handleDirectionChange = (newDir: Direction) => {
      if (direction === "up" && newDir === "down") return;
      if (direction === "down" && newDir === "up") return;
      if (direction === "left" && newDir === "right") return;
      if (direction === "right" && newDir === "left") return;

      nextDirection = newDir;
    };

    // KEYBOARD CONTROLS
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "ArrowUp" || e.code === "KeyW") {
        handleDirectionChange("up");
        startGameIfNeeded();
      } else if (e.code === "ArrowDown" || e.code === "KeyS") {
        handleDirectionChange("down");
        startGameIfNeeded();
      } else if (e.code === "ArrowLeft" || e.code === "KeyA") {
        handleDirectionChange("left");
        startGameIfNeeded();
      } else if (e.code === "ArrowRight" || e.code === "KeyD") {
        handleDirectionChange("right");
        startGameIfNeeded();
      } else if (e.code === "Space") {
        if (gameState === "gameover") {
          resetGame();
        } else {
          startGameIfNeeded();
        }
      }
    };

    // 🟣 MOBILE SWIPE CONTROLS
    let touchStartX = 0;
    let touchStartY = 0;

    const handlePointerDown = (evt: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      touchStartX = evt.clientX - rect.left;
      touchStartY = evt.clientY - rect.top;

      if (gameState === "gameover") resetGame();
      else startGameIfNeeded();
    };

    const handlePointerUp = (evt: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const dx = (evt.clientX - rect.left) - touchStartX;
      const dy = (evt.clientY - rect.top) - touchStartY;

      const absX = Math.abs(dx);
      const absY = Math.abs(dy);

      if (absX < 20 && absY < 20) return;

      if (absX > absY) {
        if (dx > 0) handleDirectionChange("right");
        else handleDirectionChange("left");
      } else {
        if (dy > 0) handleDirectionChange("down");
        else handleDirectionChange("up");
      }
    };

    canvas.addEventListener("pointerdown", handlePointerDown);
    canvas.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("keydown", handleKeyDown);

    const step = () => {
      if (gameState !== "playing") return;

      direction = nextDirection;

      const head = snake[0];
      let newHead: Cell = { x: head.x, y: head.y };

      if (direction === "up") newHead.y -= 1;
      if (direction === "down") newHead.y += 1;
      if (direction === "left") newHead.x -= 1;
      if (direction === "right") newHead.x += 1;

      if (
        newHead.x < 0 ||
        newHead.x >= GRID_SIZE ||
        newHead.y < 0 ||
        newHead.y >= GRID_SIZE
      ) {
        gameState = "gameover";
        return;
      }

      if (snake.some((c) => c.x === newHead.x && c.y === newHead.y)) {
        gameState = "gameover";
        return;
      }

      snake = [newHead, ...snake];

      if (newHead.x === food.x && newHead.y === food.y) {
        score += 1;
        if (score > bestScore) bestScore = score;
        food = randomFood(snake);
      } else {
        snake.pop();
      }
    };

    const render = (timestamp: number) => {
      if (!lastTime) lastTime = timestamp;
      const delta = timestamp - lastTime;
      lastTime = timestamp;

      accumulator += delta;
      while (accumulator >= STEP_MS) {
        step();
        accumulator -= STEP_MS;
      }

      ctx.fillStyle = BG_COLOR;
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      ctx.strokeStyle = GRID_COLOR;
      ctx.lineWidth = 1;
      for (let i = 0; i <= GRID_SIZE; i++) {
        ctx.beginPath();
        ctx.moveTo(i * CELL_SIZE + 0.5, 0);
        ctx.lineTo(i * CELL_SIZE + 0.5, CANVAS_SIZE);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i * CELL_SIZE + 0.5);
        ctx.lineTo(CANVAS_SIZE, i * CELL_SIZE + 0.5);
        ctx.stroke();
      }

      ctx.strokeStyle = "rgba(255,107,213,0.18)";
      ctx.lineWidth = 2;
      const glitchY =
        (Math.floor(timestamp / 120) % GRID_SIZE) * CELL_SIZE + 0.5;
      ctx.beginPath();
      ctx.moveTo(0, glitchY);
      ctx.lineTo(CANVAS_SIZE, glitchY);
      ctx.stroke();

      ctx.shadowColor = "rgba(255,107,213,0.8)";
      ctx.shadowBlur = 12;
      ctx.fillStyle = FOOD_COLOR;
      ctx.fillRect(
        food.x * CELL_SIZE + 3,
        food.y * CELL_SIZE + 3,
        CELL_SIZE - 6,
        CELL_SIZE - 6
      );
      ctx.shadowBlur = 0;

      snake.forEach((segment, idx) => {
        const px = segment.x * CELL_SIZE;
        const py = segment.y * CELL_SIZE;

        if (idx === 0) ctx.fillStyle = SNAKE_HEAD_COLOR;
        else ctx.fillStyle = SNAKE_BODY_COLOR;

        ctx.fillRect(px + 1, py + 1, CELL_SIZE - 2, CELL_SIZE - 2);

        if (idx === 0) {
          ctx.fillStyle = "rgba(255,255,255,0.25)";
          ctx.fillRect(px + 4, py + 4, CELL_SIZE - 10, CELL_SIZE - 10);
        }
      });

      ctx.fillStyle = SCORE_TEXT_COLOR;
      ctx.font = "14px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`SCORE: ${score}`, 8, 18);
      ctx.textAlign = "right";
      ctx.fillText(`BEST: ${bestScore}`, CANVAS_SIZE - 8, 18);

      ctx.textAlign = "center";
      ctx.font = "13px monospace";

      if (gameState === "ready") {
        ctx.fillStyle = SCORE_TEXT_COLOR;
        ctx.fillText("ANAGO SNAKE", CANVAS_SIZE / 2, CANVAS_SIZE / 2 - 12);
        ctx.font = "11px monospace";
        ctx.fillStyle = ACCENT_TEXT_COLOR;
        ctx.fillText(
          "Tap or Swipe to start",
          CANVAS_SIZE / 2,
          CANVAS_SIZE / 2 + 12
        );
      }

      if (gameState === "gameover") {
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.fillRect(30, CANVAS_SIZE / 2 - 52, CANVAS_SIZE - 60, 104);

        ctx.fillStyle = "#FF6B9B";
        ctx.font = "14px monospace";
        ctx.fillText("GAME OVER", CANVAS_SIZE / 2, CANVAS_SIZE / 2 - 12);

        ctx.fillStyle = SCORE_TEXT_COLOR;
        ctx.font = "11px monospace";
        ctx.fillText(
          `Score: ${score}  ·  Best: ${bestScore}`,
          CANVAS_SIZE / 2,
          CANVAS_SIZE / 2 + 10
        );
        ctx.fillStyle = ACCENT_TEXT_COLOR;
        ctx.fillText(
          "Tap or Swipe to restart",
          CANVAS_SIZE / 2,
          CANVAS_SIZE / 2 + 30
        );
      }

      animationFrameId = window.requestAnimationFrame(render);
    };

    animationFrameId = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.removeEventListener("keydown", handleKeyDown);
      canvas.removeEventListener("pointerdown", handlePointerDown);
      canvas.removeEventListener("pointerup", handlePointerUp);
    };
  }, []);

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="max-w-md w-full flex flex-col items-center gap-4">
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
            Anago Snake
          </h1>
          <p className="text-sm text-purple-100/70">
            Purple CRT snake with glitchy vibes.
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
          <div className="w-full max-w-[320px]">
            <canvas
              ref={canvasRef}
              width={CANVAS_SIZE}
              height={CANVAS_SIZE}
              className="w-full h-auto rounded-xl bg-black"
            />
          </div>
        </div>

        <p className="text-xs text-center text-zinc-400">
          Controls:{" "}
          <span className="text-purple-300">Arrows / WASD / Swipe</span> ·
          Tap or swipe to start / restart.
        </p>
      </div>
    </main>
  );
};

export default SnakePage;

