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

const PracticeHeader = ({
  scriptTitle,
  selectedCharacter,
  hideLevel,
  setHideLevel,
  showHideDropdown,
  setShowHideDropdown,
  t,
  hiddenWordsMap,
  onBack
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
}) => (
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
      <div className="text-center">
        <h1 className="text-lg font-semibold text-foreground">{scriptTitle}</h1>
        <Badge variant="secondary" className="mt-1">
          {selectedCharacter}
        </Badge>
      </div>

      {/* Hide Options Dropdown */}
      <DropdownMenu open={showHideDropdown} onOpenChange={setShowHideDropdown}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center space-x-2">
            <Eye className="w-4 h-4" />
            <span className="text-sm font-medium">Hide</span>
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
                className={`flex items-center space-x-3 ${
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