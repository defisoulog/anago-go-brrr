// @ts-nocheck

"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";

const CANVAS_WIDTH = 360;
const CANVAS_HEIGHT = 480;

// Colors – purple dog invaders CRT
const BG_COLOR = "#05010A";
const GRID_COLOR = "rgba(122,63,255,0.18)";
const PLAYER_COLOR = "#F9A8D4"; // bone highlight
const PLAYER_OUTLINE = "#7A3FFF";
const PLAYER_BULLET_COLOR = "#C4B5FD";

const ENEMY_FACE_COLOR = "#F472FF";
const ENEMY_EAR_COLOR = "#7A3FFF";
const ENEMY_FEATURE_COLOR = "#111827";
const ENEMY_BULLET_COLOR = "#FF6BD5";

const POWERUP_COLORS: Record<PowerUpType, string> = {
  rapid: "#A5B4FC",
  double: "#F472B6",
  shield: "#22C55E",
  speed: "#38BDF8",
};

type GameState = "ready" | "playing" | "gameover" | "win";

type Bullet = {
  x: number;
  y: number;
  dy: number;
};

type Enemy = {
  x: number;
  y: number;
  alive: boolean;
  dogType: number; // 0–3 for row style
};

type PowerUpType = "rapid" | "double" | "shield" | "speed";

type PowerUp = {
  x: number;
  y: number;
  type: PowerUpType;
};

const PLAYER_SPEED_BASE = 0.35; // pixels per ms
const PLAYER_WIDTH = 40;
const PLAYER_HEIGHT = 16;

const ENEMY_COLS = 8;
const ENEMY_ROWS = 4;
const ENEMY_SPACING_X = 34;
const ENEMY_SPACING_Y = 32;
const ENEMY_START_X = 40;
const ENEMY_START_Y = 70;
const ENEMY_MOVE_INTERVAL = 450;
const ENEMY_STEP_X = 8;
const ENEMY_STEP_Y = 18;

const PLAYER_BULLET_SPEED = -0.5;
const ENEMY_BULLET_SPEED = 0.25;
const ENEMY_SHOOT_INTERVAL = 900;

// Boss
const BOSS_WIDTH = 70;
const BOSS_HEIGHT = 40;
const BOSS_SPEED = 0.18;
const BOSS_SHOOT_INTERVAL = 700;
const BOSS_MAX_HP = 40;

// Power-ups
const POWER_UP_SPEED = 0.12;
const POWER_UP_CHANCE = 0.18;
const POWER_UP_DURATION = 8000; // ms

const DogInvadersPage: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let lastTime = 0;

    // --- Sounds (user must add these files in /public/sounds) ---
    let shootSound: HTMLAudioElement | null = null;
    let hitSound: HTMLAudioElement | null = null;
    let powerSound: HTMLAudioElement | null = null;
    let bossHitSound: HTMLAudioElement | null = null;
    let gameOverSound: HTMLAudioElement | null = null;

    if (typeof window !== "undefined") {
      try {
        shootSound = new Audio("/sounds/dog_shoot.wav");
        hitSound = new Audio("/sounds/dog_hit.wav");
        powerSound = new Audio("/sounds/power_up.wav");
        bossHitSound = new Audio("/sounds/boss_hit.wav");
        gameOverSound = new Audio("/sounds/game_over.wav");
      } catch {
        // ignore if Audio not allowed
      }
    }

    const playSound = (audio: HTMLAudioElement | null) => {
      if (!audio) return;
      try {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      } catch {
        // ignore
      }
    };

    // --- Game state ---
    let gameState: GameState = "ready";
    let score = 0;
    let bestScore = 0;

    // Player
    let playerX = CANVAS_WIDTH / 2;
    const playerY = CANVAS_HEIGHT - 60;
    let moveLeft = false;
    let moveRight = false;
    let canShoot = true;
    let shootCooldownBase = 220; // ms

    // Enemies
    let enemies: Enemy[] = [];
    let enemyDir: 1 | -1 = 1;
    let enemyMoveTimer = 0;
    let enemyShootTimer = 0;

    // Boss
    let bossActive = false;
    let bossX = CANVAS_WIDTH / 2;
    let bossY = 110;
    let bossDir: 1 | -1 = 1;
    let bossHP = BOSS_MAX_HP;
    let bossBullets: Bullet[] = [];
    let bossShootTimer = 0;

    // Bullets
    let playerBullets: Bullet[] = [];
    let enemyBullets: Bullet[] = [];

    // Power-ups
    let powerUps: PowerUp[] = [];
    let rapidFire = false;
    let doubleShot = false;
    let shield = false;
    let speedBoost = false;
    let powerUpTimeouts: number[] = [];

    const clearPowerUps = () => {
      powerUpTimeouts.forEach((id) => clearTimeout(id));
      powerUpTimeouts = [];
      rapidFire = false;
      doubleShot = false;
      shield = false;
      speedBoost = false;
      shootCooldownBase = 220;
    };

    const randomPowerUpType = (): PowerUpType => {
      const types: PowerUpType[] = ["rapid", "double", "shield", "speed"];
      return types[Math.floor(Math.random() * types.length)];
    };

    const spawnPowerUp = (x: number, y: number) => {
      if (Math.random() > POWER_UP_CHANCE) return;
      powerUps.push({
        x,
        y,
        type: randomPowerUpType(),
      });
    };

    const activatePowerUp = (type: PowerUpType) => {
      playSound(powerSound);

      const timerId = window.setTimeout(() => {
        if (type === "rapid") rapidFire = false;
        if (type === "double") doubleShot = false;
        if (type === "shield") shield = false;
        if (type === "speed") speedBoost = false;
      }, POWER_UP_DURATION);

      powerUpTimeouts.push(timerId);

      switch (type) {
        case "rapid":
          rapidFire = true;
          break;
        case "double":
          doubleShot = true;
          break;
        case "shield":
          shield = true;
          break;
        case "speed":
          speedBoost = true;
          break;
      }
    };

    const initEnemies = () => {
      enemies = [];
      for (let row = 0; row < ENEMY_ROWS; row++) {
        for (let col = 0; col < ENEMY_COLS; col++) {
          enemies.push({
            x: ENEMY_START_X + col * ENEMY_SPACING_X,
            y: ENEMY_START_Y + row * ENEMY_SPACING_Y,
            alive: true,
            dogType: row, // 0..3
          });
        }
      }
      enemyDir = 1;
      enemyMoveTimer = 0;
      enemyShootTimer = 0;
    };

    const initBoss = () => {
      bossActive = true;
      bossX = CANVAS_WIDTH / 2;
      bossY = 110;
      bossDir = 1;
      bossHP = BOSS_MAX_HP;
      bossBullets = [];
      bossShootTimer = 0;
    };

    const resetGame = () => {
      gameState = "ready";
      score = 0;
      playerX = CANVAS_WIDTH / 2;
      moveLeft = false;
      moveRight = false;
      canShoot = true;

      playerBullets = [];
      enemyBullets = [];
      bossBullets = [];
      powerUps = [];
      clearPowerUps();

      initEnemies();
      bossActive = false;
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
          shootPlayerBullet();
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

    const handlePointerDown = () => {
      if (gameState === "gameover" || gameState === "win") {
        resetGame();
      } else {
        startGameIfNeeded();
        shootPlayerBullet();
      }
    };

    const shootPlayerBullet = () => {
      if (!canShoot || gameState !== "playing") return;
      canShoot = false;

      const cooldown =
        shootCooldownBase * (rapidFire ? 0.45 : 1); // faster when rapid

      // central bullet
      const bulletsToAdd: Bullet[] = [
        {
          x: playerX,
          y: playerY - PLAYER_HEIGHT / 2,
          dy: PLAYER_BULLET_SPEED,
        },
      ];

      // double shot side bullets
      if (doubleShot) {
        bulletsToAdd.push(
          {
            x: playerX - 9,
            y: playerY - PLAYER_HEIGHT / 2,
            dy: PLAYER_BULLET_SPEED,
          },
          {
            x: playerX + 9,
            y: playerY - PLAYER_HEIGHT / 2,
            dy: PLAYER_BULLET_SPEED,
          }
        );
      }

      playerBullets.push(...bulletsToAdd);
      playSound(shootSound);

      window.setTimeout(() => {
        canShoot = true;
      }, cooldown);
    };

    const shootEnemyBullet = () => {
      const aliveEnemies = enemies.filter((e) => e.alive);
      if (aliveEnemies.length === 0) return;
      const shooter =
        aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
      enemyBullets.push({
        x: shooter.x,
        y: shooter.y + 10,
        dy: ENEMY_BULLET_SPEED,
      });
    };

    const shootBossBullet = () => {
      if (!bossActive) return;
      // two bullets from boss sides
      bossBullets.push(
        {
          x: bossX - BOSS_WIDTH / 4,
          y: bossY + BOSS_HEIGHT / 2,
          dy: ENEMY_BULLET_SPEED * 1.2,
        },
        {
          x: bossX + BOSS_WIDTH / 4,
          y: bossY + BOSS_HEIGHT / 2,
          dy: ENEMY_BULLET_SPEED * 1.2,
        }
      );
    };

    const updateEnemies = (delta: number) => {
      if (bossActive) return; // stop moving normal enemies when boss is up

      enemyMoveTimer += delta;
      enemyShootTimer += delta;

      const aliveEnemies = enemies.filter((e) => e.alive);

      if (aliveEnemies.length === 0 && !bossActive && gameState === "playing") {
        initBoss(); // spawn boss instead of instant win
        return;
      }

      if (enemyMoveTimer >= ENEMY_MOVE_INTERVAL) {
        enemyMoveTimer = 0;

        let hitEdge = false;
        for (const enemy of aliveEnemies) {
          const nextX = enemy.x + ENEMY_STEP_X * enemyDir;
          if (nextX < 20 || nextX > CANVAS_WIDTH - 20) {
            hitEdge = true;
            break;
          }
        }

        if (hitEdge) {
          enemyDir = enemyDir === 1 ? -1 : 1;
          for (const enemy of aliveEnemies) {
            enemy.y += ENEMY_STEP_Y;
            if (enemy.y > playerY - 30) {
              gameState = "gameover";
              playSound(gameOverSound);
            }
          }
        } else {
          for (const enemy of aliveEnemies) {
            enemy.x += ENEMY_STEP_X * enemyDir;
          }
        }
      }

      if (enemyShootTimer >= ENEMY_SHOOT_INTERVAL) {
        enemyShootTimer = 0;
        shootEnemyBullet();
      }
    };

    const updateBoss = (delta: number) => {
      if (!bossActive || gameState !== "playing") return;

      bossX += bossDir * BOSS_SPEED * delta;
      if (bossX < BOSS_WIDTH / 2 + 16 || bossX > CANVAS_WIDTH - BOSS_WIDTH / 2 - 16) {
        bossDir = bossDir === 1 ? -1 : 1;
      }

      bossShootTimer += delta;
      if (bossShootTimer >= BOSS_SHOOT_INTERVAL) {
        bossShootTimer = 0;
        shootBossBullet();
      }

      // boss bullets move handled in updateBullets
    };

    const updatePlayer = (delta: number) => {
      if (gameState !== "playing") return;
      const speedMultiplier = speedBoost ? 1.7 : 1;
      const velocity =
        (moveRight ? 1 : 0) - (moveLeft ? 1 : 0);
      playerX += velocity * PLAYER_SPEED_BASE * speedMultiplier * delta;
      const halfW = PLAYER_WIDTH / 2;
      if (playerX < halfW + 8) playerX = halfW + 8;
      if (playerX > CANVAS_WIDTH - halfW - 8)
        playerX = CANVAS_WIDTH - halfW - 8;
    };

    const updateBulletsAndPowerUps = (delta: number) => {
      if (gameState !== "playing") return;

      // Player bullets
      playerBullets.forEach((b) => {
        b.y += b.dy * delta;
      });
      playerBullets = playerBullets.filter((b) => b.y > -30);

      // Enemy bullets
      enemyBullets.forEach((b) => {
        b.y += b.dy * delta;
      });
      enemyBullets = enemyBullets.filter((b) => b.y < CANVAS_HEIGHT + 30);

      // Boss bullets
      bossBullets.forEach((b) => {
        b.y += b.dy * delta;
      });
      bossBullets = bossBullets.filter((b) => b.y < CANVAS_HEIGHT + 30);

      // Power-ups
      powerUps.forEach((p) => {
        p.y += POWER_UP_SPEED * delta;
      });
      powerUps = powerUps.filter((p) => p.y < CANVAS_HEIGHT + 20);

      // Player bullets → normal enemies
      playerBullets.forEach((b) => {
        enemies.forEach((enemy) => {
          if (!enemy.alive || bossActive) return;
          const halfSize = 12;
          if (
            b.x > enemy.x - halfSize &&
            b.x < enemy.x + halfSize &&
            b.y > enemy.y - halfSize &&
            b.y < enemy.y + halfSize
          ) {
            enemy.alive = false;
            b.y = -999;
            score += 10;
            spawnPowerUp(enemy.x, enemy.y);
            playSound(hitSound);
          }
        });
      });
      playerBullets = playerBullets.filter((b) => b.y > -200);

      // Player bullets → boss
      if (bossActive) {
        playerBullets.forEach((b) => {
          if (
            b.x > bossX - BOSS_WIDTH / 2 &&
            b.x < bossX + BOSS_WIDTH / 2 &&
            b.y > bossY - BOSS_HEIGHT / 2 &&
            b.y < bossY + BOSS_HEIGHT / 2
          ) {
            bossHP -= doubleShot ? 2 : 1;
            b.y = -999;
            playSound(bossHitSound);
          }
        });
        playerBullets = playerBullets.filter((b) => b.y > -200);

        if (bossHP <= 0 && gameState === "playing") {
          bossActive = false;
          gameState = "win";
          if (score > bestScore) bestScore = score;
        }
      }

      // Enemy + boss bullets → player
      const checkBulletHitPlayer = (b: Bullet): boolean => {
        const halfW = PLAYER_WIDTH / 2;
        const halfH = PLAYER_HEIGHT / 2;
        if (
          b.x > playerX - halfW &&
          b.x < playerX + halfW &&
          b.y > playerY - halfH &&
          b.y < playerY + halfH
        ) {
          if (shield) {
            // eat the shot
            shield = false;
            return true; // remove bullet but no gameover
          } else {
            gameState = "gameover";
            playSound(gameOverSound);
            return true;
          }
        }
        return false;
      };

      enemyBullets = enemyBullets.filter((b) => !checkBulletHitPlayer(b));
      bossBullets = bossBullets.filter((b) => !checkBulletHitPlayer(b));

      // Player collects power-ups
      const halfW = PLAYER_WIDTH / 2;
      const halfH = PLAYER_HEIGHT / 2;
      powerUps = powerUps.filter((p) => {
        const hit =
          p.x > playerX - halfW &&
          p.x < playerX + halfW &&
          p.y > playerY - halfH &&
          p.y < playerY + halfH;
        if (hit) {
          activatePowerUp(p.type);
          return false;
        }
        return true;
      });
    };

    const drawBackground = (timestamp: number) => {
      ctx.fillStyle = BG_COLOR;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // purple grid
      ctx.strokeStyle = GRID_COLOR;
      ctx.lineWidth = 1;
      for (let x = 0; x < CANVAS_WIDTH; x += 24) {
        ctx.beginPath();
        ctx.moveTo(x + 0.5, 0);
        ctx.lineTo(x + 0.5, CANVAS_HEIGHT);
        ctx.stroke();
      }
      for (let y = 0; y < CANVAS_HEIGHT; y += 24) {
        ctx.beginPath();
        ctx.moveTo(0, y + 0.5);
        ctx.lineTo(CANVAS_WIDTH, y + 0.5);
        ctx.stroke();
      }

      // glitch sweep line
      ctx.strokeStyle = "rgba(255,107,213,0.22)";
      const glitchY = (Math.floor(timestamp / 110) % CANVAS_HEIGHT) + 0.5;
      ctx.beginPath();
      ctx.moveTo(0, glitchY);
      ctx.lineTo(CANVAS_WIDTH, glitchY);
      ctx.stroke();
    };

    const drawPlayer = () => {
      // dog bone ship
      const centerX = playerX;
      const centerY = playerY;
      const boneLength = PLAYER_WIDTH;
      const boneHeight = 10;
      const endRadius = 7;

      ctx.shadowColor = "rgba(250,250,250,0.45)";
      ctx.shadowBlur = 10;

      ctx.fillStyle = PLAYER_COLOR;
      ctx.strokeStyle = PLAYER_OUTLINE;
      ctx.lineWidth = 2;

      const leftX = centerX - boneLength / 2 + endRadius;
      const rightX = centerX + boneLength / 2 - endRadius;
      const topY = centerY - boneHeight / 2;
      const bottomY = centerY + boneHeight / 2;

      // main bar
      ctx.beginPath();
      ctx.moveTo(leftX, topY);
      ctx.lineTo(rightX, topY);
      ctx.lineTo(rightX, bottomY);
      ctx.lineTo(leftX, bottomY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // left round end
      ctx.beginPath();
      ctx.arc(leftX, topY, endRadius, Math.PI, Math.PI * 1.5);
      ctx.arc(leftX + boneHeight, topY, endRadius, Math.PI * 1.5, 0);
      ctx.arc(leftX + boneHeight, bottomY, endRadius, 0, Math.PI * 0.5);
      ctx.arc(leftX, bottomY, endRadius, Math.PI * 0.5, Math.PI);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // right round end
      ctx.beginPath();
      ctx.arc(rightX, topY, endRadius, Math.PI, Math.PI * 1.5);
      ctx.arc(rightX + boneHeight, topY, endRadius, Math.PI * 1.5, 0);
      ctx.arc(rightX + boneHeight, bottomY, endRadius, 0, Math.PI * 0.5);
      ctx.arc(rightX, bottomY, endRadius, Math.PI * 0.5, Math.PI);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // shield glow
      if (shield) {
        ctx.shadowBlur = 18;
        ctx.shadowColor = "rgba(45,212,191,0.9)";
        ctx.strokeStyle = "rgba(34,197,94,0.8)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 18, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.shadowBlur = 0;
      ctx.shadowColor = "transparent";
    };

    const drawDogFace = (
      enemy: Enemy,
      timestamp: number
    ) => {
      const headSize = 18;
      const half = headSize / 2;
      // small wobble
      const wobble =
        Math.sin((timestamp / 160 + enemy.y * 0.1 + enemy.x * 0.05)) * 1.5;
      const x = enemy.x + wobble;
      const y = enemy.y;

      // change ear / face size per dogType
      const earHeight = [6, 8, 5, 7][enemy.dogType] || 6;
      const earWidth = [4, 5, 3, 4][enemy.dogType] || 4;
      const faceColorVariants = [
        ENEMY_FACE_COLOR,
        "#F9A8D4",
        "#E5DEFF",
        "#FDB4FF",
      ];
      const faceColor =
        faceColorVariants[enemy.dogType] || ENEMY_FACE_COLOR;

      ctx.fillStyle = faceColor;
      ctx.beginPath();
      ctx.rect(x - half, y - half, headSize, headSize);
      ctx.fill();

      // Ears
      ctx.fillStyle = ENEMY_EAR_COLOR;

      if (enemy.dogType === 0 || enemy.dogType === 2) {
        // upright ears
        ctx.beginPath();
        ctx.moveTo(x - half + 2, y - half);
        ctx.lineTo(x - half + 2, y - half + earHeight);
        ctx.lineTo(x - half + 2 + earWidth, y - half + 2);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(x + half - 2, y - half);
        ctx.lineTo(x + half - 2, y - half + earHeight);
        ctx.lineTo(x + half - 2 - earWidth, y - half + 2);
        ctx.closePath();
        ctx.fill();
      } else {
        // floppy ears
        ctx.beginPath();
        ctx.moveTo(x - half + 2, y - half + 2);
        ctx.lineTo(x - half - 2, y - half + earHeight);
        ctx.lineTo(x - half + 4, y - half + earHeight);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(x + half - 2, y - half + 2);
        ctx.lineTo(x + half + 2, y - half + earHeight);
        ctx.lineTo(x + half - 4, y - half + earHeight);
        ctx.closePath();
        ctx.fill();
      }

      // Eyes + nose
      ctx.fillStyle = ENEMY_FEATURE_COLOR;
      ctx.beginPath();
      ctx.arc(x - 4, y - 1, 2, 0, Math.PI * 2);
      ctx.arc(x + 4, y - 1, 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(x, y + 2);
      ctx.lineTo(x - 2.5, y + 5);
      ctx.lineTo(x + 2.5, y + 5);
      ctx.closePath();
      ctx.fill();
    };

    const drawEnemies = (timestamp: number) => {
      ctx.shadowColor = "rgba(244,114,255,0.9)";
      ctx.shadowBlur = 16;

      for (const enemy of enemies) {
        if (!enemy.alive) continue;
        drawDogFace(enemy, timestamp);
      }

      ctx.shadowBlur = 0;
      ctx.shadowColor = "transparent";
    };

    const drawBoss = () => {
      if (!bossActive) return;

      ctx.shadowColor = "rgba(244,114,255,0.9)";
      ctx.shadowBlur = 20;

      // big Anago-like head
      const x = bossX;
      const y = bossY;
      const w = BOSS_WIDTH;
      const h = BOSS_HEIGHT;
      const halfW = w / 2;
      const halfH = h / 2;

      ctx.fillStyle = "#F9A8D4";
      ctx.beginPath();
      ctx.rect(x - halfW, y - halfH, w, h);
      ctx.fill();

      // ears
      ctx.fillStyle = "#7A3FFF";
      ctx.beginPath();
      ctx.moveTo(x - halfW + 4, y - halfH);
      ctx.lineTo(x - halfW + 2, y - halfH - 10);
      ctx.lineTo(x - halfW + 10, y - halfH + 2);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(x + halfW - 4, y - halfH);
      ctx.lineTo(x + halfW - 2, y - halfH - 10);
      ctx.lineTo(x + halfW - 10, y - halfH + 2);
      ctx.closePath();
      ctx.fill();

      // eyes
      ctx.fillStyle = "#111827";
      ctx.beginPath();
      ctx.arc(x - 10, y - 4, 4, 0, Math.PI * 2);
      ctx.arc(x + 10, y - 4, 4, 0, Math.PI * 2);
      ctx.fill();

      // nose
      ctx.beginPath();
      ctx.moveTo(x, y + 2);
      ctx.lineTo(x - 4, y + 8);
      ctx.lineTo(x + 4, y + 8);
      ctx.closePath();
      ctx.fill();

      // HP bar
      ctx.shadowBlur = 0;
      const hpRatio = Math.max(bossHP, 0) / BOSS_MAX_HP;
      ctx.fillStyle = "#1F2937";
      ctx.fillRect(x - 30, y - halfH - 14, 60, 5);
      ctx.fillStyle = "#A855F7";
      ctx.fillRect(x - 30, y - halfH - 14, 60 * hpRatio, 5);
    };

    const drawBulletsAndPowerUps = () => {
      // player bullets
      ctx.fillStyle = PLAYER_BULLET_COLOR;
      ctx.shadowColor = "rgba(196,181,253,0.8)";
      ctx.shadowBlur = 10;
      playerBullets.forEach((b) => {
        ctx.fillRect(b.x - 1, b.y - 8, 2, 12);
      });

      // enemy bullets
      ctx.fillStyle = ENEMY_BULLET_COLOR;
      ctx.shadowColor = "rgba(255,107,213,0.9)";
      enemyBullets.forEach((b) => {
        ctx.fillRect(b.x - 2, b.y - 6, 4, 10);
      });

      // boss bullets
      bossBullets.forEach((b) => {
        ctx.fillRect(b.x - 2, b.y - 6, 4, 12);
      });

      ctx.shadowBlur = 0;
      ctx.shadowColor = "transparent";

      // power-ups
      powerUps.forEach((p) => {
        ctx.fillStyle = POWERUP_COLORS[p.type];
        ctx.beginPath();
        ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#020617";
        ctx.font = "8px monospace";
        ctx.textAlign = "center";
        const label =
          p.type === "rapid"
            ? "R"
            : p.type === "double"
            ? "2X"
            : p.type === "shield"
            ? "S"
            : "SPD";
        ctx.fillText(label, p.x, p.y + 3);
      });
    };

    const drawHUD = () => {
      ctx.textAlign = "left";
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "14px monospace";
      ctx.fillText(`SCORE: ${score}`, 10, 22);

      ctx.textAlign = "right";
      ctx.fillText(`BEST: ${bestScore}`, CANVAS_WIDTH - 10, 22);
    };

    const drawOverlays = () => {
      ctx.textAlign = "center";
      ctx.font = "14px monospace";

      if (gameState === "ready") {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText("DOG INVADERS", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 14);

        ctx.font = "11px monospace";
        ctx.fillStyle = "#C4B5FD";
        ctx.fillText(
          "Move: Arrows / A-D · Shoot: Space / Tap",
          CANVAS_WIDTH / 2,
          CANVAS_HEIGHT / 2 + 10
        );
        ctx.fillStyle = "#9CA3AF";
        ctx.fillText(
          "Bone ship vs. neon dog-head invaders",
          CANVAS_WIDTH / 2,
          CANVAS_HEIGHT / 2 + 30
        );
      }

      if (gameState === "gameover" || gameState === "win") {
        ctx.fillStyle = "rgba(0,0,0,0.75)";
        ctx.fillRect(40, CANVAS_HEIGHT / 2 - 70, CANVAS_WIDTH - 80, 140);

        ctx.font = "16px monospace";
        ctx.fillStyle = gameState === "win" ? "#4ADE80" : "#FF6B9B";
        ctx.fillText(
          gameState === "win" ? "SECTOR CLEARED" : "GAME OVER",
          CANVAS_WIDTH / 2,
          CANVAS_HEIGHT / 2 - 16
        );

        ctx.font = "12px monospace";
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText(
          `Score: ${score}  ·  Best: ${bestScore}`,
          CANVAS_WIDTH / 2,
          CANVAS_HEIGHT / 2 + 6
        );

        ctx.fillStyle = "#C4B5FD";
        ctx.fillText(
          "Tap or Space to restart",
          CANVAS_WIDTH / 2,
          CANVAS_HEIGHT / 2 + 30
        );
      }
    };

    const drawCRTOverlay = () => {
      // scanlines
      ctx.fillStyle = "rgba(0,0,0,0.18)";
      for (let y = 0; y < CANVAS_HEIGHT; y += 3) {
        ctx.fillRect(0, y, CANVAS_WIDTH, 1);
      }

      // vignette / curve
      const gradient = ctx.createRadialGradient(
        CANVAS_WIDTH / 2,
        CANVAS_HEIGHT / 2,
        0,
        CANVAS_WIDTH / 2,
        CANVAS_HEIGHT / 2,
        CANVAS_HEIGHT / 1.1
      );
      gradient.addColorStop(0, "rgba(0,0,0,0)");
      gradient.addColorStop(1, "rgba(0,0,0,0.55)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    };

    const render = (timestamp: number) => {
      if (!lastTime) lastTime = timestamp;
      const delta = timestamp - lastTime;
      lastTime = timestamp;

      if (gameState === "playing") {
        updatePlayer(delta);
        updateEnemies(delta);
        updateBoss(delta);
        updateBulletsAndPowerUps(delta);

        if (gameState === "gameover" || gameState === "win") {
          if (score > bestScore) bestScore = score;
        }
      }

      drawBackground(timestamp);
      drawEnemies(timestamp);
      drawBoss();
      drawPlayer();
      drawBulletsAndPowerUps();
      drawHUD();
      drawOverlays();
      drawCRTOverlay();

      animationFrameId = window.requestAnimationFrame(render);
    };

    // init
    resetGame();
    animationFrameId = window.requestAnimationFrame(render);

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    canvas.addEventListener("pointerdown", handlePointerDown);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      canvas.removeEventListener("pointerdown", handlePointerDown);
      clearPowerUps();
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
            Dog Invaders
          </h1>
          <p className="text-sm text-purple-100/70">
            Bone ship vs. neon dog-head invaders. Clear the grid, face the boss.
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
            Arrows / A-D to move · Space / Tap to shoot / start
          </span>
        </p>
      </div>
    </main>
  );
};

export default DogInvadersPage;


