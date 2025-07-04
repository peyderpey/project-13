import React from 'react';
import { ChevronLeft, ChevronRight, Book, FileText } from 'lucide-react';
import { ScriptLine } from '../types';

interface SceneNavigatorProps {
  lines: ScriptLine[];
  currentLineIndex: number;
  onJumpToAct: (actNumber: number, sceneNumber: number) => void;
}

export const SceneNavigator: React.FC<SceneNavigatorProps> = ({
  lines,
  currentLineIndex,
  onJumpToAct
}) => {
  const currentLine = lines[currentLineIndex];
  const currentAct = currentLine?.actNumber || 1;
  const currentScene = currentLine?.sceneNumber || 1;

  // Get unique acts and scenes
  const acts = Array.from(new Set(lines.map(line => line.actNumber || 1))).sort((a, b) => a - b);
  const scenesInCurrentAct = Array.from(
    new Set(lines.filter(line => (line.actNumber || 1) === currentAct).map(line => line.sceneNumber || 1))
  ).sort((a, b) => a - b);

  const currentActIndex = acts.indexOf(currentAct);
  const currentSceneIndex = scenesInCurrentAct.indexOf(currentScene);

  const canGoPrevAct = currentActIndex > 0;
  const canGoNextAct = currentActIndex < acts.length - 1;
  const canGoPrevScene = currentSceneIndex > 0;
  const canGoNextScene = currentSceneIndex < scenesInCurrentAct.length - 1;

  const goToPreviousAct = () => {
    if (canGoPrevAct) {
      const prevAct = acts[currentActIndex - 1];
      const firstSceneInAct = Array.from(
        new Set(lines.filter(line => (line.actNumber || 1) === prevAct).map(line => line.sceneNumber || 1))
      ).sort((a, b) => a - b)[0];
      onJumpToAct(prevAct, firstSceneInAct);
    }
  };

  const goToNextAct = () => {
    if (canGoNextAct) {
      const nextAct = acts[currentActIndex + 1];
      const firstSceneInAct = Array.from(
        new Set(lines.filter(line => (line.actNumber || 1) === nextAct).map(line => line.sceneNumber || 1))
      ).sort((a, b) => a - b)[0];
      onJumpToAct(nextAct, firstSceneInAct);
    }
  };

  const goToPreviousScene = () => {
    if (canGoPrevScene) {
      const prevScene = scenesInCurrentAct[currentSceneIndex - 1];
      onJumpToAct(currentAct, prevScene);
    }
  };

  const goToNextScene = () => {
    if (canGoNextScene) {
      const nextScene = scenesInCurrentAct[currentSceneIndex + 1];
      onJumpToAct(currentAct, nextScene);
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Act Navigation */}
        <div className="flex items-center space-x-2">
          <button
            onClick={goToPreviousAct}
            disabled={!canGoPrevAct}
            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            title="Previous Act"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <div className="flex items-center space-x-1 px-2 py-1 bg-purple-50 rounded text-purple-700 text-sm">
            <Book className="w-3 h-3" />
            <span className="font-medium">Act {currentAct}</span>
          </div>
          
          <button
            onClick={goToNextAct}
            disabled={!canGoNextAct}
            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            title="Next Act"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Current Position */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            {currentLine?.actTitle || `Act ${currentAct}`} - {currentLine?.sceneTitle || `Scene ${currentScene}`}
          </p>
        </div>

        {/* Scene Navigation */}
        <div className="flex items-center space-x-2">
          <button
            onClick={goToPreviousScene}
            disabled={!canGoPrevScene}
            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            title="Previous Scene"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <div className="flex items-center space-x-1 px-2 py-1 bg-blue-50 rounded text-blue-700 text-sm">
            <FileText className="w-3 h-3" />
            <span className="font-medium">Scene {currentScene}</span>
          </div>
          
          <button
            onClick={goToNextScene}
            disabled={!canGoNextScene}
            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            title="Next Scene"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};