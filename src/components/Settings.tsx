import React from 'react';
import { X, Target, Globe, Clock, Play, Hand, Book, Eye, EyeOff, FileText, Layers, MessageCircle, ZoomIn, Monitor } from 'lucide-react';
import { AccuracyLevel, VoiceSettings } from '../types';
import { useTranslation } from '../i18n/useTranslation';
import { SUPPORTED_LANGUAGES, Language, getLanguageInfo } from '../i18n';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { ThemeToggle } from './ThemeToggle';

type PracticeMode = 'auto' | 'manual';

interface SettingsProps {
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

export const Settings: React.FC<SettingsProps> = ({
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
    { value: 'chat', label: 'Chat', icon: MessageCircle },
    { value: 'classic', label: 'Classic', icon: Book },
    { value: 'large-print', label: 'Large Print', icon: ZoomIn },
    { value: 'teleprompter', label: 'Auto-Q', icon: Monitor },
    { value: 'theatre', label: 'Theatre', icon: Book },
  ];
  const [selectedTemplate, setSelectedTemplate] = React.useState(
    () => localStorage.getItem('practiceTemplate-default') || 'chat'
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-border shadow-lg">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground text-center w-full">{t('settings.title')}</h2>
          <div className="flex-shrink-0 ml-auto">
            <ThemeToggle />
          </div>
        </div>

        <div className="p-6 space-y-8 text-foreground">
          {/* Global Settings Explanation */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-1">Personalize Your Experience</h2>
            <p className="text-sm text-muted-foreground">
              These settings are saved to your account and will be remembered everywhere you log in. Changes apply instantly across all your devices.
            </p>
          </div>

          {/* Practice Template Selector - full width, no empty space */}
          <div className="mb-8 w-full">
            <h3 className="text-base font-medium mb-2">Practice Template</h3>
            <div className="flex w-full mb-2">
              {templateOptions.map(opt => (
                <button
                  key={opt.value}
                  className={`flex-1 flex flex-col items-center justify-center p-4 rounded-lg border transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50 min-w-0
                    ${selectedTemplate === opt.value ? 'border-primary bg-primary/10 ring-2 ring-primary' : 'border-border bg-muted hover:bg-accent/30'}`}
                  style={{ marginLeft: 0, marginRight: 0, borderRight: 'none' }}
                  onClick={() => {
                    setSelectedTemplate(opt.value);
                    localStorage.setItem('practiceTemplate-default', opt.value);
                    if (typeof onPracticeTemplateChange === 'function') {
                      onPracticeTemplateChange(opt.value);
                    }
                  }}
                  type="button"
                >
                  <opt.icon className={`w-8 h-8 mb-2 ${selectedTemplate === opt.value ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className={`font-medium text-base sm:text-sm xs:text-xs ${selectedTemplate === opt.value ? 'text-primary' : 'text-foreground'}`}>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Advanced/Other Settings */}
          <div className="space-y-8">
            {/* Practice Mode Setting */}
            {onPracticeModeChange && (
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <Play className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-lg font-medium text-foreground">Practice Mode</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Choose how you want practice sessions to start by default
                </p>
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <label
                    className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:bg-accent ${
                      practiceMode === 'auto'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-300 dark:ring-blue-700' 
                        : 'border-border'
                    }`}
                  >
                    <input
                      type="radio"
                      name="practiceMode"
                      value="auto"
                      checked={practiceMode === 'auto'}
                      onChange={(e) => onPracticeModeChange(e.target.value as PracticeMode)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex items-center space-x-2">
                      <Play className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <div>
                        <span className="font-medium text-foreground">Auto Mode</span>
                        <p className="text-xs text-muted-foreground">Automatic progression through lines</p>
                      </div>
                    </div>
                  </label>

                  <label
                    className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:bg-accent ${
                      practiceMode === 'manual'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-300 dark:ring-blue-700' 
                        : 'border-border'
                    }`}
                  >
                    <input
                      type="radio"
                      name="practiceMode"
                      value="manual"
                      checked={practiceMode === 'manual'}
                      onChange={(e) => onPracticeModeChange(e.target.value as PracticeMode)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex items-center space-x-2">
                      <Hand className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <span className="font-medium text-foreground">Manual Mode</span>
                        <p className="text-xs text-muted-foreground">Manual control with Next button</p>
                      </div>
                    </div>
                  </label>
                </div>

                {/* Practice Display Options (moved here) */}
                <div>
                  <h3 className="text-base font-medium mb-2">Practice Display Options</h3>
                  <div className="mb-2">
                    <div className="flex items-center space-x-2 mb-1">
                      <Eye className="w-5 h-5" />
                      <span>Hide Mode</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-1">
                      {[
                        { value: 'show-all', label: 'Show All' },
                        { value: 'hide-15', label: 'Hide 15%' },
                        { value: 'hide-30', label: 'Hide 30%' },
                        { value: 'hide-50', label: 'Hide 50%' },
                        { value: 'hide-all', label: 'Hide All' }
                      ].map(opt => (
                        <button
                          key={opt.value}
                          className={`px-3 py-1 rounded border ${selectedHideLevel === opt.value ? 'bg-primary text-white' : 'bg-muted'}`}
                          onClick={() => {
                            setSelectedHideLevel(opt.value);
                            localStorage.setItem(`hideLevel-default`, opt.value);
                          }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <Layers className="w-5 h-5" />
                      <span>Display Mode</span>
                    </div>
                    <div className="flex gap-2 mb-1">
                      <button
                        className={`px-3 py-1 rounded border ${selectedDisplayMode === 'full' ? 'bg-primary text-white' : 'bg-muted'}`}
                        onClick={() => {
                          setSelectedDisplayMode('full');
                          localStorage.setItem('displayMode-default', 'full');
                        }}
                      >
                        Show Full Script
                      </button>
                      <button
                        className={`px-3 py-1 rounded border ${selectedDisplayMode === 'progressive' ? 'bg-primary text-white' : 'bg-muted'}`}
                        onClick={() => {
                          setSelectedDisplayMode('progressive');
                          localStorage.setItem('displayMode-default', 'progressive');
                        }}
                      >
                        Progressive Reveal
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Auto-Record Timeout */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                <h3 className="text-lg font-medium text-foreground">{t('settings.timeout.title')}</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {t('settings.timeout.description')}
              </p>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">
                    {t('settings.timeout.label')}: {autoRecordTimeout} {t('time.seconds')}
                  </Label>
                  <Slider
                    value={[autoRecordTimeout]}
                    onValueChange={(value) => onAutoRecordTimeoutChange(value[0])}
                    min={3}
                    max={15}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>3s ({t('settings.timeout.fast')})</span>
                    <span>9s ({t('settings.timeout.medium')})</span>
                    <span>15s ({t('settings.timeout.slow')})</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Interface Language Selection */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Globe className="w-5 h-5 text-green-600 dark:text-green-400" />
                <h3 className="text-lg font-medium text-foreground">{t('settings.interfaceLanguage')}</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {t('settings.interfaceLanguageDescription')}
              </p>
              <div className="space-y-2">
                <Label htmlFor="language-select" className="text-sm font-medium text-foreground">
                  {t('settings.interfaceLanguage')}
                </Label>
                <Select value={language} onValueChange={(value) => setLanguage(value as Language)}>
                  <SelectTrigger id="language-select" className="w-full">
                    <SelectValue asChild>
                      {(() => {
                        const lang = SUPPORTED_LANGUAGES.find((l) => l.code === language);
                        return lang ? (
                          <span className="flex items-center space-x-2">
                            <span className="text-lg">{lang.flag}</span>
                            <span>{lang.nativeName}</span>
                          </span>
                        ) : (
                          <span>{t('settings.selectInterfaceLanguage')}</span>
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
              </div>
            </div>

            {/* Accuracy Level */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h3 className="text-lg font-medium text-foreground">{t('settings.accuracy.title')}</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {t('settings.accuracy.description')}
              </p>
              <Select value={accuracyLevel} onValueChange={(value) => onAccuracyLevelChange(value as AccuracyLevel)}>
                <SelectTrigger className="w-full">
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
            </div>

            {/* Voice Speed Setting */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Play className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-medium text-foreground">Voice Speed</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Adjust the speed of character voices during rehearsal. This setting applies to all character voices.
              </p>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">
                    Speed: {voiceSettings.rate.toFixed(1)}x
                  </Label>
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
                    <span>0.5x (Slow)</span>
                    <span>1.0x (Normal)</span>
                    <span>2.0x (Fast)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-border">
          <button
            onClick={onClose}
            className="w-full bg-primary text-white py-3 px-4 rounded-lg hover:bg-primary/90 transition-colors duration-200 font-medium"
          >
            {t('settings.saveSettings')}
          </button>
        </div>
      </div>
    </div>
  );
};