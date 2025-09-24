import { useEffect, useRef } from "react";
import { useBoxingGame } from "../lib/stores/useBoxingGame";
import { GameEngine } from "../lib/gameEngine";

const GameCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameEngineRef = useRef<GameEngine | null>(null);
  const { gameState, player, opponent, arena } = useBoxingGame();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize game engine
    if (!gameEngineRef.current) {
      gameEngineRef.current = new GameEngine(canvas, ctx);
    }

    const gameEngine = gameEngineRef.current;

    // Game loop
    let animationId: number;
    const gameLoop = () => {
      if (gameState === 'playing') {
        gameEngine.update();
      }
      gameEngine.render();
      animationId = requestAnimationFrame(gameLoop);
    };

    gameLoop();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }, [gameState]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      tabIndex={0}
      style={{ outline: 'none' }}
    />
  );
};

export default GameCanvas;
