import React, { useState } from 'react';
import { Eye, EyeOff, FileText, Layers, CheckCircle, ChevronDown, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';

type HideLevel = 'show-all' | 'hide-15' | 'hide-30' | 'hide-50' | 'hide-all';

const hideOptions = [
  { value: 'show-all', label: 'Show All', icon: Eye },
  { value: 'hide-15', label: 'Hide 15%', icon: EyeOff },
  { value: 'hide-30', label: 'Hide 30%', icon: EyeOff },
  { value: 'hide-50', label: 'Hide 50%', icon: EyeOff },
  { value: 'hide-all', label: 'Hide All', icon: EyeOff }
];

const PracticeHeader = ({
  scriptTitle,
  selectedCharacter,
  hideLevel,
  setHideLevel,
  showHideDropdown, // unused now
  setShowHideDropdown, // unused now
  t,
  hiddenWordsMap,
  onBack,
  displayMode,
  setDisplayMode
}: {
  scriptTitle: string;
  selectedCharacter: string;
  hideLevel: string;
  setHideLevel: (level: HideLevel) => void;
  showHideDropdown: boolean;
  setShowHideDropdown: (show: boolean) => void;
  t: (key: string) => string;
  hiddenWordsMap: React.MutableRefObject<Map<string, Set<number>>>;
  onBack: () => void;
  displayMode: 'full' | 'progressive';
  setDisplayMode: (mode: 'full' | 'progressive') => void;
}) => {
  // Animated label state
  const [hideLabel, setHideLabel] = useState<string | null>(null);
  const [labelVisible, setLabelVisible] = useState(false);

  // Hide options for label
  const hideLabels: Record<string, string> = {
    'show-all': 'Show All',
    'hide-15': 'Hide 15%',
    'hide-30': 'Hide 30%',
    'hide-50': 'Hide 50%',
    'hide-all': 'Hide All',
  };

  return (
    <div className="sticky top-0 z-40 bg-card shadow-sm border-b border-border">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={onBack}
          className="flex items-center space-x-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowRight className="w-4 h-4 rotate-180" />
          <span className="text-sm font-medium">Back</span>
        </Button>

        {/* Title */}
        <div className="flex flex-col items-center justify-center min-w-0">
          <Badge variant="secondary" className="mb-0.5 text-xs px-2 py-0.5 font-semibold max-w-full truncate">
            {selectedCharacter}
          </Badge>
          <span
            className="text-base font-medium text-foreground max-w-[160px] truncate block leading-tight"
            title={scriptTitle}
          >
            {scriptTitle}
          </span>
        </div>

        <div className="flex items-center space-x-2 relative">
          {/* Hide Mode Cycle Button */}
          <div className="relative">
            <Button
              variant="outline"
              className={`flex items-center justify-center transition-transform duration-200 ${labelVisible ? 'scale-110' : ''}`}
              onClick={() => {
                const currentIdx = hideOptions.findIndex(opt => opt.value === hideLevel);
                const nextIdx = (currentIdx + 1) % hideOptions.length;
                setHideLevel(hideOptions[nextIdx].value as HideLevel);
                hiddenWordsMap.current.clear();
                setHideLabel(hideLabels[hideOptions[nextIdx].value] || '');
                setLabelVisible(true);
                setTimeout(() => setLabelVisible(false), 900);
              }}
              title={hideLabels[hideLevel]}
              aria-label={hideLabels[hideLevel]}
            >
              {hideLevel === 'show-all' ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
            </Button>
            {/* Animated floating label */}
            <div
              className={`absolute left-1/2 -translate-x-1/2 -top-8 px-2 py-1 rounded bg-black text-white text-xs pointer-events-none transition-opacity duration-300 ${labelVisible ? 'opacity-90' : 'opacity-0'}`}
              style={{ zIndex: 20 }}
            >
              {hideLabel}
            </div>
          </div>
          {/* Display Mode Toggle Button */}
          <Button
            variant="outline"
            className="flex items-center justify-center"
            onClick={() => setDisplayMode(displayMode === 'full' ? 'progressive' : 'full')}
            title={displayMode === 'full' ? 'Progressive Reveal' : 'Show Full Script'}
            aria-label={displayMode === 'full' ? 'Progressive Reveal' : 'Show Full Script'}
          >
            {displayMode === 'full' ? <Layers className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PracticeHeader; 