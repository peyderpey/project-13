import React, { useState, useMemo, useEffect } from 'react';
import { Play, RotateCcw, BookOpen } from 'lucide-react';
import { ScriptLine, UserProgress } from '../types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '../hooks/useAuth';
import { loadProgressFromDatabase } from '../utils/progressSync';

interface StartingPointSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  lines: ScriptLine[];
  selectedCharacter: string;
  lastProgress: UserProgress | null;
  scriptTitle: string; // Add scriptTitle prop
  onStartingPointSelect: (actNumber: number, sceneNumber: number, lineIndex: number) => void;
}

export const StartingPointSelector: React.FC<StartingPointSelectorProps> = ({
  isOpen,
  onClose,
  lines,
  selectedCharacter,
  lastProgress,
  scriptTitle,
  onStartingPointSelect
}) => {
  const [selectedAct, setSelectedAct] = useState(1);
  const [selectedScene, setSelectedScene] = useState(1);
  const [dbProgress, setDbProgress] = useState<UserProgress | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(false);
  const { user } = useAuth();

  // Load progress from database when component mounts
  useEffect(() => {
    if (isOpen && user?.id) {
      setLoadingProgress(true);
      
      loadProgressFromDatabase(user.id, scriptTitle, selectedCharacter)
        .then(progress => {
          setDbProgress(progress);
          console.log('Loaded progress from database:', progress);
        })
        .catch(err => {
          console.log('Failed to load progress from database:', err);
        })
        .finally(() => {
          setLoadingProgress(false);
        });
    }
  }, [isOpen, user?.id, selectedCharacter, scriptTitle]);

  // Use database progress if available, otherwise fall back to localStorage progress
  const availableProgress = dbProgress || lastProgress;

  // Organize lines by acts and scenes
  const scriptStructure = useMemo(() => {
    const structure: { [actNumber: number]: { [sceneNumber: number]: ScriptLine[] } } = {};
    
    lines.forEach(line => {
      const actNum = line.actNumber || 1;
      const sceneNum = line.sceneNumber || 1;
      
      if (!structure[actNum]) structure[actNum] = {};
      if (!structure[actNum][sceneNum]) structure[actNum][sceneNum] = [];
      
      structure[actNum][sceneNum].push(line);
    });
    
    return structure;
  }, [lines]);

  const acts = Object.keys(scriptStructure).map(Number).sort((a, b) => a - b);
  const scenes = selectedAct && scriptStructure[selectedAct] 
    ? Object.keys(scriptStructure[selectedAct]).map(Number).sort((a, b) => a - b)
    : [];

  const selectedSceneLines = selectedAct && selectedScene && scriptStructure[selectedAct]?.[selectedScene] 
    ? scriptStructure[selectedAct][selectedScene]
    : [];

  const myLines = selectedSceneLines.filter(line => line.character === selectedCharacter);

  const handleStart = () => {
    // Find the first line index for the selected act and scene
    const firstLineInScene = lines.findIndex(line => 
      (line.actNumber || 1) === selectedAct && (line.sceneNumber || 1) === selectedScene
    );
    
    onStartingPointSelect(selectedAct, selectedScene, Math.max(0, firstLineInScene));
  };

  const handleContinueFromLast = () => {
    if (availableProgress) {
      onStartingPointSelect(
        availableProgress.lastActNumber, 
        availableProgress.lastSceneNumber, 
        availableProgress.lastLineIndex
      );
    }
  };

  const handleStartFromBeginning = () => {
    // Start from the very beginning of the script
    onStartingPointSelect(1, 1, 0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground">Choose Starting Point</DialogTitle>
          <DialogDescription>
            Select where you would like to start your rehearsal session.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Quick Start Options */}
          <div className="grid grid-cols-1 gap-3">
            {/* Start from Beginning */}
            <Card className="border-2 border-primary/30 bg-card hover:bg-accent transition-colors duration-200">
              <CardContent className="p-4">
                <Button
                  onClick={handleStartFromBeginning}
                  variant="ghost"
                  className="w-full justify-start h-auto p-0"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                      <Play className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-foreground">Start from Beginning</h3>
                      <p className="text-sm text-muted-foreground">Begin rehearsal from Act 1, Scene 1</p>
                    </div>
                  </div>
                </Button>
              </CardContent>
            </Card>

            {/* Continue from last position */}
            {availableProgress && (
              <Card className="border-2 border-green-300 bg-green-50 hover:bg-green-100 dark:bg-success/20 dark:border-success dark:hover:bg-success/30 transition-colors duration-200">
                <CardContent className="p-4">
                  <Button
                    onClick={handleContinueFromLast}
                    variant="ghost"
                    className="w-full justify-start h-auto p-0"
                    disabled={loadingProgress}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-500 dark:bg-success rounded-full flex items-center justify-center">
                        <RotateCcw className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold text-foreground">Continue from Last Position</h3>
                        <p className="text-sm text-muted-foreground">
                          {loadingProgress ? 'Loading progress...' : 
                            `Act ${availableProgress.lastActNumber}, Scene ${availableProgress.lastSceneNumber} (Line ${availableProgress.lastLineIndex + 1})`
                          }
                        </p>
                        {availableProgress.completedLines.length > 0 && (
                          <p className="text-xs text-green-600 dark:text-success-foreground mt-1">
                            {availableProgress.completedLines.length} lines completed
                          </p>
                        )}
                      </div>
                    </div>
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Custom Selection */}
            <Card className="border-2 border-blue-300 bg-blue-50 hover:bg-blue-100 dark:bg-secondary/20 dark:border-secondary dark:hover:bg-secondary/30 transition-colors duration-200">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-500 dark:bg-secondary rounded-full flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left flex-1">
                    <h3 className="font-semibold text-foreground">Choose Specific Scene</h3>
                    <p className="text-sm text-muted-foreground">Select a specific act and scene to start from</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Custom Scene Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Select Scene</h3>
            
            {/* Act Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Act</label>
              <div className="flex flex-wrap gap-2">
                {acts.map(act => (
                  <Button
                    key={act}
                    variant={selectedAct === act ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setSelectedAct(act);
                      setSelectedScene(1); // Reset to first scene
                    }}
                  >
                    Act {act}
                  </Button>
                ))}
              </div>
            </div>

            {/* Scene Selection */}
            {scenes.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Scene</label>
                <div className="flex flex-wrap gap-2">
                  {scenes.map(scene => (
                    <Button
                      key={scene}
                      variant={selectedScene === scene ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedScene(scene)}
                    >
                      Scene {scene}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Scene Preview */}
            {selectedSceneLines.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">
                    Preview: Act {selectedAct}, Scene {selectedScene}
                  </label>
                  <Badge variant="secondary">
                    {selectedSceneLines.length} lines
                  </Badge>
                </div>
                
                <Card className="bg-muted/50">
                  <CardContent className="p-3">
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {selectedSceneLines.slice(0, 5).map((line, index) => (
                        <div key={index} className="text-sm">
                          <span className="font-medium text-primary">{line.character}:</span>
                          <span className="text-muted-foreground ml-2">
                            {line.text.length > 50 ? `${line.text.substring(0, 50)}...` : line.text}
                          </span>
                        </div>
                      ))}
                      {selectedSceneLines.length > 5 && (
                        <div className="text-xs text-muted-foreground">
                          ... and {selectedSceneLines.length - 5} more lines
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Your Lines in This Scene */}
                {myLines.length > 0 && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-foreground">Your Lines in This Scene</span>
                      <Badge variant="outline">{myLines.length} lines</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {myLines.slice(0, 3).map((line, index) => (
                        <div key={index} className="mb-1">
                          {line.text.length > 40 ? `${line.text.substring(0, 40)}...` : line.text}
                        </div>
                      ))}
                      {myLines.length > 3 && (
                        <div>... and {myLines.length - 3} more</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Start Button */}
            <Button 
              onClick={handleStart} 
              className="w-full"
              disabled={selectedSceneLines.length === 0}
            >
              Start from Act {selectedAct}, Scene {selectedScene}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};