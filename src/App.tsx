/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { ItchExporter } from './components/ItchExporter';

export default function App() {
  const [currentView, setCurrentView] = useState<'game' | 'itch'>('game');

  return (
    <div className="min-h-screen bg-slate-950 font-sans selection:bg-cyan-500 selection:text-slate-950">
      {currentView === 'game' ? (
        <GameCanvas onOpenItchHub={() => setCurrentView('itch')} />
      ) : (
        <ItchExporter
          gameTitle="Quantum Circuit Breaker"
          gameDescription="An immersive arcade puzzle-action game powered by a novel quantum resonance routing algorithm, featuring AI-generated challenges and procedural Web Audio synthesizer."
          onBackToGame={() => setCurrentView('game')}
        />
      )}
    </div>
  );
}
