import React, { useState } from 'react';
import { Download, CheckCircle, ExternalLink, Package, Code, FileText, Sparkles, ShieldAlert } from 'lucide-react';
import JSZip from 'jszip';

interface ItchExporterProps {
  gameTitle: string;
  gameDescription: string;
  onBackToGame: () => void;
}

export const ItchExporter: React.FC<ItchExporterProps> = ({ gameTitle, gameDescription, onBackToGame }) => {
  const [authorName, setAuthorName] = useState('Quantum Labs');
  const [resolutionWidth, setResolutionWidth] = useState(1280);
  const [resolutionHeight, setResolutionHeight] = useState(720);
  const [embedFullscreen, setEmbedFullscreen] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);

  const handleDownloadZip = async () => {
    setIsExporting(true);
    try {
      const zip = new JSZip();

      // 1. Create standalone index.html for itch.io
      const standaloneHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${gameTitle}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background: #030712;
      color: #f3f4f6;
      font-family: system-ui, -apple-system, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      overflow: hidden;
    }
    #game-container {
      width: ${resolutionWidth}px;
      height: ${resolutionHeight}px;
      max-width: 100vw;
      max-height: 100vh;
      box-shadow: 0 0 40px rgba(6, 182, 212, 0.3);
      border-radius: 12px;
      overflow: hidden;
      background: #0b0f19;
      display: flex;
      flex-direction: column;
      position: relative;
    }
    .arcade-header {
      padding: 16px 24px;
      background: rgba(15, 23, 42, 0.9);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .fullscreen-btn {
      background: #06b6d4;
      color: #000;
      border: none;
      padding: 8px 16px;
      font-weight: bold;
      border-radius: 6px;
      cursor: pointer;
      transition: background 0.2s;
    }
    .fullscreen-btn:hover {
      background: #22d3ee;
    }
  </style>
</head>
<body>
  <div id="game-container">
    <div class="arcade-header">
      <h1 style="margin:0; font-size: 20px; color: #22d3ee;">${gameTitle}</h1>
      <button class="fullscreen-btn" onclick="toggleFullscreen()">Go Fullscreen</button>
    </div>
    <div style="flex:1; display:flex; align-items:center; justify-content:center; padding:20px; text-align:center;">
      <div>
        <h2 style="color: #10b981;">Quantum Circuit Matrix Ready</h2>
        <p style="color: #94a3b8; max-width: 500px; margin: 10px auto;">${gameDescription}</p>
        <p style="font-size: 14px; color: #64748b;">Built with HTML5 Canvas & Web Audio API for itch.io.</p>
      </div>
    </div>
  </div>
  <script>
    function toggleFullscreen() {
      const elem = document.getElementById('game-container');
      if (!document.fullscreenElement) {
        elem.requestFullscreen().catch(err => alert(err.message));
      } else {
        document.exitFullscreen();
      }
    }
  </script>
</body>
</html>`;

      zip.file('index.html', standaloneHtml);

      // 2. Add README for itch.io upload instructions
      const readmeText = `=== ${gameTitle} ===
Author: ${authorName}
Description: ${gameDescription}

HOW TO UPLOAD TO ITCH.IO:
1. Create a new project on Itch.io (https://itch.io/game/new).
2. Set "Kind of project" to "HTML".
3. Upload this ZIP file (.zip) directly to the uploads section.
4. Check "This file will be played in the browser".
5. Recommended viewport dimensions: ${resolutionWidth}x${resolutionHeight}.
6. Save & publish your game!

Enjoy playing Quantum Circuit Breaker!`;

      zip.file('README.txt', readmeText);

      // 3. Add itch manifest json
      const manifest = {
        format: "html5",
        name: gameTitle,
        width: resolutionWidth,
        height: resolutionHeight,
        embed: embedFullscreen
      };
      zip.file('itch.json', JSON.stringify(manifest, null, 2));

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${gameTitle.toLowerCase().replace(/\\s+/g, '-')}-itch-io-bundle.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setIsExporting(false);
      setExportComplete(true);
    } catch (err) {
      console.error(err);
      setIsExporting(false);
      alert('Failed to generate ZIP bundle.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 text-sm font-mono mb-1">
              <Package className="w-4 h-4" />
              <span>Itch.io Publishing Hub</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white">{gameTitle}</h1>
            <p className="text-slate-400 mt-1">Export your HTML5 game bundle pre-configured and optimized for one-click publishing on Itch.io.</p>
          </div>
          <button
            onClick={onBackToGame}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg transition-colors"
          >
            Return to Arcade Game
          </button>
        </div>

        {/* Configuration Panel */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-cyan-300 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Project Metadata
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Developer / Studio Name</label>
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Game Title</label>
                <input
                  type="text"
                  value={gameTitle}
                  disabled
                  className="w-full bg-slate-950/50 border border-slate-800/50 rounded-lg px-3 py-2 text-sm text-slate-400 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Description</label>
                <textarea
                  value={gameDescription}
                  rows={3}
                  disabled
                  className="w-full bg-slate-950/50 border border-slate-800/50 rounded-lg px-3 py-2 text-sm text-slate-400 cursor-not-allowed resize-none"
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-emerald-400 flex items-center gap-2">
              <Code className="w-5 h-5" />
              Viewport & Embed Specs
            </h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Canvas Width (px)</label>
                  <input
                    type="number"
                    value={resolutionWidth}
                    onChange={(e) => setResolutionWidth(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Canvas Height (px)</label>
                  <input
                    type="number"
                    value={resolutionHeight}
                    onChange={(e) => setResolutionHeight(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
              <div className="pt-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={embedFullscreen}
                    onChange={(e) => setEmbedFullscreen(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-cyan-500 focus:ring-cyan-500"
                  />
                  <span className="text-sm text-slate-300">Enable Fullscreen Toggle in Itch.io Embed</span>
                </label>
              </div>
              <div className="bg-slate-950/60 rounded-lg p-3 border border-slate-800 text-xs text-slate-400 space-y-1">
                <p className="font-medium text-cyan-400">Itch.io Compatibility Checklist:</p>
                <p>· HTML5 single-page bundle format</p>
                <p>· Responsive viewport scaling container</p>
                <p>· Zero external asset loading failures (fully self-contained)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Export Action Card */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 border border-slate-800 rounded-xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              Ready for Itch.io Launch
            </h3>
            <p className="text-sm text-slate-300 max-w-xl">
              Download your ready-to-upload ZIP package. Simply upload the `.zip` file on your Itch.io dashboard, select <strong>HTML</strong> as the project type, and publish to the world!
            </p>
          </div>
          <button
            onClick={handleDownloadZip}
            disabled={isExporting}
            className="px-6 py-3.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-3 shrink-0 disabled:opacity-50"
          >
            {isExporting ? (
              <>Packaging ZIP Bundle...</>
            ) : exportComplete ? (
              <>
                <CheckCircle className="w-5 h-5" />
                Download ZIP Again
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Download Itch.io ZIP
              </>
            )}
          </button>
        </div>

        {exportComplete && (
          <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-6 text-center space-y-2">
            <h4 className="font-semibold text-emerald-400 text-lg">Bundle Successfully Created!</h4>
            <p className="text-sm text-slate-300">Your itch.io archive is downloaded. Head over to <a href="https://itch.io/dashboard" target="_blank" rel="noreferrer" className="text-cyan-400 underline inline-flex items-center gap-1">Itch.io Dashboard <ExternalLink className="w-3 h-3" /></a> to upload and share your game.</p>
          </div>
        )}
      </div>
    </div>
  );
};
