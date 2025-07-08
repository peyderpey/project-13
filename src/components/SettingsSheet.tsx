import React from 'react';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription 
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Target, 
  Globe, 
  Clock, 
  Play, 
  Hand, 
  Book, 
  Eye, 
  EyeOff, 
  FileText, 
  Layers, 
  MessageCircle, 
  ZoomIn, 
  Monitor,
  Settings,
  Sparkles,
  Mic,
  Volume2
} from 'lucide-react';
import { AccuracyLevel, VoiceSettings } from '../types';
import { useTranslation } from '../i18n/useTranslation';
import { SUPPORTED_LANGUAGES, Language, getLanguageInfo } from '../i18n';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { ThemeToggle } from './ThemeToggle';

type PracticeMode = 'auto' | 'manual';

interface SettingsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  accuracyLevel: AccuracyLevel;
  onAccuracyLevelChange: (level: AccuracyLevel) => void;
  voiceSettings: VoiceSettings;
  onVoiceSettingsChange: (settings: VoiceSettings) => void;
  autoRecordTimeout: number;
  onAutoRecordTimeoutChange: (timeout: number) => void;
  practiceMode?: PracticeMode;
  onPracticeModeChange?: (mode: PracticeMode) => void;
  useNewPracticeSession?: boolean;
  onUseNewPracticeSessionChange?: (use: boolean) => void;
  language?: Language;
  onPracticeTemplateChange?: (template: string) => void;
}

export const SettingsSheet: React.FC<SettingsSheetProps> = ({
  isOpen,
  onClose,
  accuracyLevel,
  onAccuracyLevelChange,
  voiceSettings,
  onVoiceSettingsChange,
  autoRecordTimeout,
  onAutoRecordTimeoutChange,
  practiceMode = 'auto',
  onPracticeModeChange,
  useNewPracticeSession = false,
  onUseNewPracticeSessionChange,
  language,
  onPracticeTemplateChange
}) => {
  const { t, setLanguage } = useTranslation();

  const [selectedHideLevel, setSelectedHideLevel] = React.useState(
    () => localStorage.getItem('hideLevel-default') || 'show-all'
  );
  const [selectedDisplayMode, setSelectedDisplayMode] = React.useState(
    () => localStorage.getItem('displayMode-default') || 'full'
  );

  const templateOptions = [
    { value: 'chat', label: 'Chat', icon: MessageCircle, description: 'Modern chat interface' },
    { value: 'classic', label: 'Classic', icon: Book, description: 'Traditional script view' },
    { value: 'large-print', label: 'Large Print', icon: ZoomIn, description: 'Easy to read text' },
    { value: 'teleprompter', label: 'Auto-Q', icon: Monitor, description: 'Auto-scrolling text' },
    { value: 'theatre', label: 'Theatre', icon: Book, description: 'Stage-style layout' },
  ];
  const [selectedTemplate, setSelectedTemplate] = React.useState(
    () => localStorage.getItem('practiceTemplate-default') || 'chat'
  );

  // Auto-save functions
  const handleTemplateChange = (template: string) => {
    setSelectedTemplate(template);
    localStorage.setItem('practiceTemplate-default', template);
    if (typeof onPracticeTemplateChange === 'function') {
      onPracticeTemplateChange(template);
    }
  };

  const handleHideLevelChange = (level: string) => {
    setSelectedHideLevel(level);
    localStorage.setItem('hideLevel-default', level);
  };

  const handleDisplayModeChange = (mode: string) => {
    setSelectedDisplayMode(mode);
    localStorage.setItem('displayMode-default', mode);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left" className="w-full max-w-md p-0 overflow-y-auto">
        <SheetHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="text-xl font-semibold flex items-center gap-2">
                <Settings className="w-5 h-5" />
                {t('settings.title') || 'Settings'}
              </SheetTitle>
              <SheetDescription className="text-sm text-muted-foreground">
                Personalize your experience
              </SheetDescription>
            </div>
            <ThemeToggle />
          </div>
        </SheetHeader>

        <div className="flex-1 p-6">
          <Tabs defaultValue="practice" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="practice" className="text-xs">Practice</TabsTrigger>
              <TabsTrigger value="voice" className="text-xs">Voice</TabsTrigger>
              <TabsTrigger value="interface" className="text-xs">Interface</TabsTrigger>
            </TabsList>

            {/* Practice Settings Tab */}
            <TabsContent value="practice" className="space-y-6">
              {/* Practice Template */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Practice Template
                  </CardTitle>
                  <CardDescription>
                    Choose how your practice sessions look
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    {templateOptions.map(opt => (
                      <Button
                        key={opt.value}
                        variant={selectedTemplate === opt.value ? "default" : "outline"}
                        size="sm"
                        className="h-auto p-3 flex flex-col items-center gap-2"
                        onClick={() => handleTemplateChange(opt.value)}
                      >
                        <opt.icon className="w-4 h-4" />
                        <div className="text-center">
                          <div className="font-medium text-xs">{opt.label}</div>
                          <div className="text-xs opacity-70">{opt.description}</div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Practice Mode */}
              {onPracticeModeChange && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Play className="w-4 h-4" />
                      Practice Mode
                    </CardTitle>
                    <CardDescription>
                      How practice sessions start by default
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <Button
                        variant={practiceMode === 'auto' ? "default" : "outline"}
                        className="w-full justify-start h-auto p-3"
                        onClick={() => onPracticeModeChange('auto')}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        <div className="text-left">
                          <div className="font-medium">Auto Mode</div>
                          <div className="text-xs opacity-70">Automatic progression</div>
                        </div>
                      </Button>
                      <Button
                        variant={practiceMode === 'manual' ? "default" : "outline"}
                        className="w-full justify-start h-auto p-3"
                        onClick={() => onPracticeModeChange('manual')}
                      >
                        <Hand className="w-4 h-4 mr-2" />
                        <div className="text-left">
                          <div className="font-medium">Manual Mode</div>
                          <div className="text-xs opacity-70">Manual control with Next</div>
                        </div>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Display Options */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Display Options
                  </CardTitle>
                  <CardDescription>
                    Customize how text appears during practice
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Hide Mode</Label>
                    <div className="flex flex-wrap gap-1">
                      {[
                        { value: 'show-all', label: 'Show All' },
                        { value: 'hide-15', label: '15%' },
                        { value: 'hide-30', label: '30%' },
                        { value: 'hide-50', label: '50%' },
                        { value: 'hide-all', label: 'Hide All' }
                      ].map(opt => (
                        <Badge
                          key={opt.value}
                          variant={selectedHideLevel === opt.value ? "default" : "secondary"}
                          className="cursor-pointer"
                          onClick={() => handleHideLevelChange(opt.value)}
                        >
                          {opt.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Display Mode</Label>
                    <div className="flex gap-2">
                      <Badge
                        variant={selectedDisplayMode === 'full' ? "default" : "secondary"}
                        className="cursor-pointer"
                        onClick={() => handleDisplayModeChange('full')}
                      >
                        Show Full Script
                      </Badge>
                      <Badge
                        variant={selectedDisplayMode === 'progressive' ? "default" : "secondary"}
                        className="cursor-pointer"
                        onClick={() => handleDisplayModeChange('progressive')}
                      >
                        Progressive Reveal
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Voice Settings Tab */}
            <TabsContent value="voice" className="space-y-6">
              {/* Voice Speed */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Volume2 className="w-4 h-4" />
                    Voice Speed
                  </CardTitle>
                  <CardDescription>
                    Adjust character voice playback speed
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm font-medium">
                        Speed: {voiceSettings.rate.toFixed(1)}x
                      </Label>
                      <Badge variant="outline">
                        {voiceSettings.rate < 1 ? 'Slow' : voiceSettings.rate > 1 ? 'Fast' : 'Normal'}
                      </Badge>
                    </div>
                    <Slider
                      value={[voiceSettings.rate]}
                      onValueChange={(value) => onVoiceSettingsChange({
                        ...voiceSettings,
                        rate: value[0]
                      })}
                      min={0.5}
                      max={2}
                      step={0.1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0.5x</span>
                      <span>1.0x</span>
                      <span>2.0x</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Auto-Record Timeout */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Mic className="w-4 h-4" />
                    Auto-Record Timeout
                  </CardTitle>
                  <CardDescription>
                    How long to wait before auto-recording
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm font-medium">
                        {autoRecordTimeout} seconds
                      </Label>
                      <Badge variant="outline">
                        {autoRecordTimeout <= 5 ? 'Fast' : autoRecordTimeout <= 9 ? 'Medium' : 'Slow'}
                      </Badge>
                    </div>
                    <Slider
                      value={[autoRecordTimeout]}
                      onValueChange={(value) => onAutoRecordTimeoutChange(value[0])}
                      min={3}
                      max={15}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>3s</span>
                      <span>9s</span>
                      <span>15s</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Interface Settings Tab */}
            <TabsContent value="interface" className="space-y-6">
              {/* Language Selection */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Interface Language
                  </CardTitle>
                  <CardDescription>
                    Choose your preferred language
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Select value={language} onValueChange={(value) => setLanguage(value as Language)}>
                    <SelectTrigger>
                      <SelectValue asChild>
                        {(() => {
                          const lang = SUPPORTED_LANGUAGES.find((l) => l.code === language);
                          return lang ? (
                            <span className="flex items-center space-x-2">
                              <span className="text-lg">{lang.flag}</span>
                              <span>{lang.nativeName}</span>
                            </span>
                          ) : (
                            <span>Select Language</span>
                          );
                        })()}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {SUPPORTED_LANGUAGES.map((lang) => (
                        <SelectItem key={lang.code} value={lang.code}>
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">{lang.flag}</span>
                            <span>{lang.nativeName}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* Accuracy Level */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Accuracy Level
                  </CardTitle>
                  <CardDescription>
                    How strict speech recognition should be
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Select value={accuracyLevel} onValueChange={(value) => onAccuracyLevelChange(value as AccuracyLevel)}>
                    <SelectTrigger>
                      <SelectValue>
                        {(() => {
                          const opt = [
                            { value: 'exact' as AccuracyLevel, label: t('settings.accuracy.exact.label'), description: t('settings.accuracy.exact.description') },
                            { value: 'semantic' as AccuracyLevel, label: t('settings.accuracy.semantic.label'), description: t('settings.accuracy.semantic.description') },
                            { value: 'loose' as AccuracyLevel, label: t('settings.accuracy.loose.label'), description: t('settings.accuracy.loose.description') }
                          ].find(o => o.value === accuracyLevel);
                          return opt ? (
                            <div className="flex flex-col">
                              <span className="font-medium">{opt.label}</span>
                              <span className="text-xs text-muted-foreground">{opt.description}</span>
                            </div>
                          ) : null;
                        })()}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {[
                        { value: 'exact' as AccuracyLevel, label: t('settings.accuracy.exact.label'), description: t('settings.accuracy.exact.description') },
                        { value: 'semantic' as AccuracyLevel, label: t('settings.accuracy.semantic.label'), description: t('settings.accuracy.semantic.description') },
                        { value: 'loose' as AccuracyLevel, label: t('settings.accuracy.loose.label'), description: t('settings.accuracy.loose.description') }
                      ].map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <div className="flex flex-col">
                            <span className="font-medium">{opt.label}</span>
                            <span className="text-xs text-muted-foreground">{opt.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}; 