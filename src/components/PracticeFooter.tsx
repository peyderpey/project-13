import React from 'react';
import { AlertCircle, SkipBack, SkipForward, Play, Pause, Bot } from 'lucide-react';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Card, CardContent } from './ui/card';
import { cn } from '../lib/utils';

const PracticeFooter = ({
  progress,
  completedLines,
  myLines,
  currentGlobalLineIndex,
  lines,
  handleManualPrev,
  handleManualNext,
  practiceMode,
  setPracticeMode,
  isAutoPaused,
  stopAutoMode,
  startAutoMode,
  toggleAutoPause,
  t,
  speechRecognitionSupported,
  SceneNavigatorComponent
}: {
  progress: number;
  completedLines: Set<number>;
  myLines: any[];
  currentGlobalLineIndex: number;
  lines: any[];
  handleManualPrev: () => void;
  handleManualNext: () => void;
  practiceMode: 'auto' | 'manual';
  setPracticeMode: (mode: 'auto' | 'manual') => void;
  isAutoPaused: boolean;
  stopAutoMode: () => void;
  startAutoMode: () => void;
  toggleAutoPause: () => void;
  t: (key: string) => string;
  speechRecognitionSupported: boolean;
  SceneNavigatorComponent: React.FC;
}) => (
  <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-10 safe-area-pb shadow-lg">
    {!speechRecognitionSupported && (
      <div className="mx-3 mt-2">
        <Alert className="border-warning bg-warning/10">
          <AlertCircle className="w-4 h-4 text-warning" />
          <AlertDescription className="text-xs text-warning-foreground">
            {t('speech.notSupported')}
          </AlertDescription>
        </Alert>
      </div>
    )}

    {/* Progress Section */}
    <Card className="mx-3 mt-3 border-0 shadow-none">
      <CardContent className="p-3">
        {/* Progress Bar */}
        <div className="bg-muted rounded-full h-2 mb-2">
          <div 
            className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        {/* Progress Info */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{completedLines.size} / {myLines.length} completed ({Math.round(progress)}%)</span>
          <span>{currentGlobalLineIndex + 1} / {lines.length}</span>
        </div>
      </CardContent>
    </Card>

    {/* Scene Navigator */}
    <div className="border-t border-border">
      <SceneNavigatorComponent />
    </div>

    {/* Auto-Resize Button Controls */}
    <div className="flex items-stretch gap-2 px-3 py-3 border-t border-border min-h-[48px]">
      {/* Previous Button - Larger in manual mode */}
      <Button
        variant="outline"
        onClick={handleManualPrev}
        disabled={currentGlobalLineIndex === 0}
        className={cn(
          "flex items-center justify-center space-x-2 font-medium text-sm",
          practiceMode === 'auto'
            ? "flex-shrink-0 w-12 h-12"
            : "flex-1 min-w-[100px] h-12"
        )}
        title={t('common.previous')}
      >
        <SkipBack className="w-5 h-5" />
        {practiceMode !== 'auto' && <span>Previous</span>}
      </Button>

      {/* Auto/Manual Toggle - Robot icon, color-coded */}
      <Button
        onClick={() => setPracticeMode(practiceMode === 'auto' ? 'manual' : 'auto')}
        className={cn(
          "flex items-center justify-center space-x-2 font-medium text-sm whitespace-nowrap border-none",
          practiceMode === 'auto'
            ? "flex-1 min-w-[120px] h-12 bg-green-500 text-white"
            : "flex-shrink-0 w-16 h-12 bg-red-500 text-white"
        )}
      >
        <Bot className="w-6 h-6" />
        {practiceMode === 'auto' && <span>Auto</span>}
      </Button>

      {/* Start/Pause Button - Always show, icon only in manual mode */}
      <Button
        onClick={toggleAutoPause}
        variant={isAutoPaused ? "default" : "secondary"}
        className={cn(
          "flex items-center justify-center",
          practiceMode === 'auto' 
            ? "flex-1 min-w-[60px] h-12 border-2 border-primary" 
            : "flex-shrink-0 w-16 h-12"
        )}
      >
        {isAutoPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
        {practiceMode === 'auto' && (
          <span>
            {isAutoPaused ? 'Start' : 'Pause'}
          </span>
        )}
      </Button>

      {/* Next Button - Larger in manual mode */}
      <Button
        variant="outline"
        onClick={handleManualNext}
        disabled={currentGlobalLineIndex === lines.length - 1}
        className={cn(
          "flex items-center justify-center space-x-2 font-medium text-sm",
          practiceMode === 'auto'
            ? "flex-shrink-0 w-12 h-12"
            : "flex-1 min-w-[100px] h-12"
        )}
        title={t('common.next')}
      >
        {practiceMode !== 'auto' && <span>Next</span>}
        <SkipForward className="w-5 h-5" />
      </Button>
    </div>
  </div>
);

export default PracticeFooter; 