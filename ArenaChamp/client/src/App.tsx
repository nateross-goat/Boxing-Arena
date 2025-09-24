import { useEffect } from "react";
import BoxingGame from "./components/BoxingGame";
import { useSoundManager } from "./lib/soundManager";
import "./index.css";

function App() {
  const { initializeSounds } = useSoundManager();

  useEffect(() => {
    // Initialize sound system
    initializeSounds();
  }, [initializeSounds]);

  return (
    <div className="w-full h-full bg-black overflow-hidden">
      <BoxingGame />
    </div>
  );
}

export default App;
