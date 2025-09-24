import { useBoxingGame } from "../lib/stores/useBoxingGame";

const GameUI = () => {
  const { 
    gameState, 
    player, 
    opponent, 
    playerProgress,
    roundData,
    playerStamina,
    opponentStamina 
  } = useBoxingGame();

  if (gameState !== 'playing' && gameState !== 'roundBreak') return null;

  const playerHealthPercent = (player.health / player.maxHealth) * 100;
  const opponentHealthPercent = opponent ? (opponent.health / opponent.maxHealth) * 100 : 0;
  const playerStaminaPercent = (playerStamina / 100) * 100;
  const opponentStaminaPercent = (opponentStamina / 100) * 100;

  return (
    <div className="absolute top-0 left-0 right-0 z-10 p-4">
      {/* Health Bars */}
      <div className="flex justify-between items-center mb-4">
        {/* Player Health */}
        <div className="w-1/3">
          <div className="text-white text-sm mb-1">YOU</div>
          <div className="bg-gray-700 rounded-full h-6 overflow-hidden">
            <div 
              className="bg-green-500 h-full transition-all duration-300"
              style={{ width: `${playerHealthPercent}%` }}
            />
          </div>
          <div className="text-white text-xs mt-1">
            {player.health}/{player.maxHealth} HP
          </div>
        </div>

        {/* Round Info */}
        <div className="text-center">
          {gameState === 'roundBreak' ? (
            <>
              <div className="text-yellow-400 text-2xl font-bold">
                {Math.ceil(roundData.breakTimer / 1000)}
              </div>
              <div className="text-yellow-300 text-sm">BREAK</div>
              <div className="text-white text-xs">Round {roundData.currentRound + 1} starts soon</div>
            </>
          ) : (
            <>
              <div className="text-white text-2xl font-bold">
                {Math.ceil(roundData.roundTimer / 1000)}
              </div>
              <div className="text-gray-300 text-sm">
                ROUND {roundData.currentRound}/{roundData.totalRounds}
              </div>
            </>
          )}
        </div>

        {/* Opponent Health */}
        <div className="w-1/3 text-right">
          <div className="text-white text-sm mb-1">
            {opponent?.name?.toUpperCase() || 'OPPONENT'}
          </div>
          <div className="bg-gray-700 rounded-full h-6 overflow-hidden">
            <div 
              className="bg-red-500 h-full transition-all duration-300 ml-auto"
              style={{ width: `${opponentHealthPercent}%` }}
            />
          </div>
          <div className="text-white text-xs mt-1">
            {opponent?.health || 0}/{opponent?.maxHealth || 0} HP
          </div>
        </div>
      </div>

      {/* Stamina Bars */}
      <div className="flex justify-between items-center mb-4">
        {/* Player Stamina */}
        <div className="w-1/3">
          <div className="text-white text-xs mb-1">STAMINA</div>
          <div className="bg-gray-700 rounded-full h-3 overflow-hidden border">
            <div 
              className={`h-full transition-all duration-300 ${
                playerStaminaPercent < 30 ? 'bg-red-500' : 
                playerStaminaPercent < 60 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${playerStaminaPercent}%` }}
            />
          </div>
          {playerStaminaPercent < 30 && (
            <div className="text-red-400 text-xs mt-1 animate-pulse">TIRED!</div>
          )}
        </div>

        <div className="w-1/3"></div>

        {/* Opponent Stamina */}
        <div className="w-1/3 text-right">
          <div className="text-white text-xs mb-1">STAMINA</div>
          <div className="bg-gray-700 rounded-full h-3 overflow-hidden border">
            <div 
              className={`h-full transition-all duration-300 ml-auto ${
                opponentStaminaPercent < 30 ? 'bg-red-500' : 
                opponentStaminaPercent < 60 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${opponentStaminaPercent}%` }}
            />
          </div>
          {opponentStaminaPercent < 30 && (
            <div className="text-red-400 text-xs mt-1 animate-pulse">TIRED!</div>
          )}
        </div>
      </div>

      {/* Player Stats and Round Scores */}
      <div className="absolute bottom-4 left-4 bg-black/50 rounded p-2">
        <div className="text-white text-sm">
          <div>Money: ${playerProgress.money}</div>
          <div>Wins: {playerProgress.wins}</div>
          {roundData.roundScores.length > 0 && (
            <div className="mt-2 border-t border-gray-600 pt-2">
              <div className="text-xs font-semibold mb-1">ROUND SCORES:</div>
              {roundData.roundScores.map((score, index) => (
                <div key={index} className="text-xs flex justify-between w-20">
                  <span>R{index + 1}:</span>
                  <span className={score.player > score.opponent ? 'text-green-400' : score.player < score.opponent ? 'text-red-400' : 'text-yellow-400'}>
                    {score.player}-{score.opponent}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-4 right-4 text-white text-xs">
        <div className="bg-black bg-opacity-50 p-2 rounded">
          <div>Move: Arrow Keys</div>
          <div>Jab: D | Cross: F | Uppercut: S</div>
          <div>Block: W | Dodge: S | Duck: D</div>
        </div>
      </div>
    </div>
  );
};

export default GameUI;
