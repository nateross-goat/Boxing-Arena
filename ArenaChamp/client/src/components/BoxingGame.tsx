import { useEffect, useRef, useState } from "react";
import { useBoxingGame } from "../lib/stores/useBoxingGame";
import GameCanvas from "./GameCanvas";
import GameUI from "./GameUI";
import UpgradesMenu from "./UpgradesMenu";
import FighterSelectionMenu from "./FighterSelectionMenu";

const BoxingGame = () => {
  const { 
    gameState, 
    initializeGame, 
    startGame, 
    resetGame,
    showUpgrades,
    showFighterSelection,
    setShowUpgrades,
    setShowFighterSelection
  } = useBoxingGame();
  
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!isInitialized) {
      initializeGame();
      setIsInitialized(true);
    }
  }, [initializeGame, isInitialized]);

  const handleStartGame = () => {
    if (gameState === 'menu') {
      setShowFighterSelection(true);
    } else if (gameState === 'gameOver' || gameState === 'victory') {
      resetGame();
    }
  };

  const handleUpgrades = () => {
    setShowUpgrades(true);
  };

  if (!isInitialized) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black text-white">
        <div className="text-2xl">Loading Boxing Arena...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative bg-black">
      {/* Game Canvas */}
      <GameCanvas />
      
      {/* Game UI Overlay */}
      <GameUI />

      {/* Main Menu */}
      {gameState === 'menu' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80 z-20">
          <div className="text-center text-white">
            <h1 className="text-6xl font-bold mb-8 text-red-500">BOXING ARENA</h1>
            <div className="space-y-4">
              <button
                onClick={handleStartGame}
                className="block mx-auto px-8 py-4 bg-red-600 hover:bg-red-700 text-white text-xl font-bold rounded-lg transition-colors"
              >
                FIGHT
              </button>
              <button
                onClick={handleUpgrades}
                className="block mx-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white text-xl font-bold rounded-lg transition-colors"
              >
                UPGRADES
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Over/Victory Screen */}
      {(gameState === 'gameOver' || gameState === 'victory') && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80 z-20">
          <div className="text-center text-white">
            <h2 className="text-4xl font-bold mb-4">
              {gameState === 'victory' ? 'VICTORY!' : 'KNOCKOUT!'}
            </h2>
            <p className="text-xl mb-8">
              {gameState === 'victory' ? 'You won $5!' : 'Try again!'}
            </p>
            <div className="space-y-4">
              <button
                onClick={handleStartGame}
                className="block mx-auto px-8 py-4 bg-green-600 hover:bg-green-700 text-white text-xl font-bold rounded-lg transition-colors"
              >
                {gameState === 'victory' ? 'NEXT FIGHT' : 'TRY AGAIN'}
              </button>
              <button
                onClick={() => resetGame()}
                className="block mx-auto px-8 py-4 bg-gray-600 hover:bg-gray-700 text-white text-xl font-bold rounded-lg transition-colors"
              >
                MAIN MENU
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upgrades Menu */}
      {showUpgrades && (
        <UpgradesMenu onClose={() => setShowUpgrades(false)} />
      )}

      {/* Fighter Selection Menu */}
      {showFighterSelection && (
        <FighterSelectionMenu onClose={() => setShowFighterSelection(false)} />
      )}
    </div>
  );
};

export default BoxingGame;
