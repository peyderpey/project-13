import React from 'react';
import { AlertCircle, SkipBack, SkipForward, Play, Pause, Bot } from 'lucide-react';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Card, CardContent } from './ui/card';
import { cn } from '../lib/utils';

interface PracticeFooterProps {
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
}

const PracticeFooter: React.FC<PracticeFooterProps> = ({
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

    {/* Mobile-Optimized Button Controls */}
    <div className="flex items-stretch gap-2 px-3 py-3 border-t border-border min-h-[60px]">
      {/* Previous Button - Touch-optimized */}
      <Button
        variant="outline"
        onClick={handleManualPrev}
        disabled={currentGlobalLineIndex === 0}
        className={cn(
          "flex items-center justify-center space-x-2 font-medium text-sm min-h-[48px]",
          practiceMode === 'auto'
            ? "flex-shrink-0 w-14 sm:w-16"
            : "flex-1 min-w-[100px]"
        )}
        title={t('common.previous')}
      >
        <SkipBack className="w-5 h-5" />
        {practiceMode !== 'auto' && <span className="hidden sm:inline">Previous</span>}
      </Button>

      {/* Auto/Manual Toggle - Mobile-optimized */}
      <Button
        onClick={() => setPracticeMode(practiceMode === 'auto' ? 'manual' : 'auto')}
        className={cn(
          "flex items-center justify-center space-x-2 font-medium text-sm whitespace-nowrap border-none min-h-[48px]",
          practiceMode === 'auto'
            ? "flex-1 min-w-[100px] bg-green-500 hover:bg-green-600 text-white"
            : "flex-shrink-0 w-16 sm:w-20 bg-red-500 hover:bg-red-600 text-white"
        )}
      >
        <Bot className="w-5 h-5 sm:w-6 sm:h-6" />
        {practiceMode === 'auto' && <span className="hidden sm:inline">Auto</span>}
      </Button>

      {/* Start/Pause Button - Touch-optimized */}
      <Button
        onClick={toggleAutoPause}
        variant={isAutoPaused ? "default" : "secondary"}
        className={cn(
          "flex items-center justify-center space-x-2 min-h-[48px]",
          practiceMode === 'auto' 
            ? "flex-1 min-w-[80px] border-2 border-primary" 
            : "flex-shrink-0 w-16 sm:w-20"
        )}
      >
        {isAutoPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
        {practiceMode === 'auto' && (
          <span className="hidden sm:inline">
            {isAutoPaused ? 'Start' : 'Pause'}
          </span>
        )}
      </Button>

      {/* Next Button - Touch-optimized */}
      <Button
        variant="outline"
        onClick={handleManualNext}
        disabled={currentGlobalLineIndex === lines.length - 1}
        className={cn(
          "flex items-center justify-center space-x-2 font-medium text-sm min-h-[48px]",
          practiceMode === 'auto'
            ? "flex-shrink-0 w-14 sm:w-16"
            : "flex-1 min-w-[100px]"
        )}
        title={t('common.next')}
      >
        {practiceMode !== 'auto' && <span className="hidden sm:inline">Next</span>}
        <SkipForward className="w-5 h-5" />
      </Button>
    </div>
  </div>
);

export default PracticeFooter; 