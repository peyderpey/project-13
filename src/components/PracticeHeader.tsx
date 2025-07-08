import React from 'react';
import { Eye, EyeOff, CheckCircle, ChevronDown, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';

type HideLevel = 'show-all' | 'hide-25' | 'hide-50' | 'hide-75' | 'hide-all';

const hideOptions = [
  { value: 'show-all', label: 'Show All', icon: Eye },
  { value: 'hide-25', label: 'Hide 25%', icon: EyeOff },
  { value: 'hide-50', label: 'Hide 50%', icon: EyeOff },
  { value: 'hide-75', label: 'Hide 75%', icon: EyeOff },
  { value: 'hide-all', label: 'Hide All', icon: EyeOff }
];

interface PracticeHeaderProps {
  scriptTitle: string;
  selectedCharacter: string;
  hideLevel: string;
  setHideLevel: (level: HideLevel) => void;
  showHideDropdown: boolean;
  setShowHideDropdown: (show: boolean) => void;
  t: (key: string) => string;
  hiddenWordsMap: React.MutableRefObject<Map<string, Set<number>>>;
  onBack: () => void;
}

const PracticeHeader: React.FC<PracticeHeaderProps> = ({
  scriptTitle,
  selectedCharacter,
  hideLevel,
  setHideLevel,
  showHideDropdown,
  setShowHideDropdown,
  t,
  hiddenWordsMap,
  onBack
}) => (
  <div className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm shadow-sm border-b border-border">
    <div className="flex items-center justify-between px-4 py-3">
      {/* Back Button - Mobile optimized */}
      <Button
        variant="ghost"
        onClick={onBack}
        className="flex items-center space-x-2 text-muted-foreground hover:text-foreground min-h-[44px] px-3"
        size="sm"
      >
        <ArrowRight className="w-4 h-4 rotate-180" />
        <span className="text-sm font-medium hidden sm:inline">Back</span>
      </Button>

      {/* Title - Responsive */}
      <div className="text-center flex-1 px-4">
        <h1 className="text-base sm:text-lg font-semibold text-foreground truncate">
          {scriptTitle}
        </h1>
        <Badge variant="secondary" className="mt-1 text-xs">
          {selectedCharacter}
        </Badge>
      </div>

      {/* Hide Options Dropdown - Mobile optimized */}
      <DropdownMenu open={showHideDropdown} onOpenChange={setShowHideDropdown}>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className="flex items-center space-x-1 sm:space-x-2 min-h-[44px] px-2 sm:px-3"
            size="sm"
          >
            <Eye className="w-4 h-4" />
            <span className="text-sm font-medium hidden sm:inline">Hide</span>
            <ChevronDown className="w-3 h-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {hideOptions.map(option => {
            const IconComponent = option.icon;
            return (
              <DropdownMenuItem
                key={option.value}
                onClick={() => {
                  setHideLevel(option.value as HideLevel);
                  setShowHideDropdown(false);
                  // Clear cached hidden words when changing level
                  hiddenWordsMap.current.clear();
                }}
                className={`flex items-center space-x-3 min-h-[44px] ${
                  hideLevel === option.value ? 'bg-primary/10 text-primary' : ''
                }`}
              >
                <IconComponent className="w-4 h-4" />
                <span>{option.label}</span>
                {hideLevel === option.value && (
                  <CheckCircle className="w-4 h-4 ml-auto text-primary" />
                )}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </div>
);

export default PracticeHeader; 