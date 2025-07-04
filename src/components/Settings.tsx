import React from 'react';
import { X, Target, Globe, Clock, Play, Hand, Book } from 'lucide-react';
import { AccuracyLevel, VoiceSettings } from '../types';
import { useTranslation } from '../i18n/useTranslation';
import { SUPPORTED_LANGUAGES, Language, getLanguageInfo } from '../i18n';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

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
  language
}) => {
  const { t, setLanguage } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-border shadow-lg">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">{t('settings.title')}</h2>
          <div className="flex items-center space-x-2">
            {/* ThemeToggle removed from Settings */}
            <button
              onClick={onClose}
              className="p-2 text-muted-foreground hover:text-foreground rounded-lg transition-colors duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-8 text-foreground">
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
              <div className="grid grid-cols-2 gap-3">
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
            </div>
          )}

          {/* New Practice Session Toggle */}
          {onUseNewPracticeSessionChange && (
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Book className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h3 className="text-lg font-medium text-foreground">New Practice Session (Beta)</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Try the new refactored practice session with improved state management and scene-by-scene navigation.
              </p>
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="new-practice-session"
                  checked={useNewPracticeSession}
                  onChange={(e) => onUseNewPracticeSessionChange(e.target.checked)}
                  className="w-4 h-4 text-purple-600 bg-background border-border rounded focus:ring-purple-500 focus:ring-2"
                />
                <label htmlFor="new-practice-session" className="text-sm font-medium text-foreground">
                  Enable new practice session
                </label>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                This is a temporary toggle for testing. The new version uses useReducer for better state management.
              </p>
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
            <div className="space-y-3">
              {[
                { 
                  value: 'exact' as AccuracyLevel, 
                  label: t('settings.accuracy.exact.label'), 
                  description: t('settings.accuracy.exact.description')
                },
                { 
                  value: 'semantic' as AccuracyLevel, 
                  label: t('settings.accuracy.semantic.label'), 
                  description: t('settings.accuracy.semantic.description')
                },
                { 
                  value: 'loose' as AccuracyLevel, 
                  label: t('settings.accuracy.loose.label'), 
                  description: t('settings.accuracy.loose.description')
                }
              ].map(({ value, label, description }) => (
                <label
                  key={value}
                  className={`flex items-start space-x-3 p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:bg-accent ${
                    accuracyLevel === value 
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 ring-2 ring-purple-300 dark:ring-purple-700' 
                      : 'border-border'
                  }`}
                >
                  <input
                    type="radio"
                    name="accuracy"
                    value={value}
                    checked={accuracyLevel === value}
                    onChange={(e) => onAccuracyLevelChange(e.target.value as AccuracyLevel)}
                    className="mt-1 text-purple-600 focus:ring-purple-500"
                  />
                  <div>
                    <div className="font-medium text-foreground">{label}</div>
                    <div className="text-sm text-muted-foreground">{description}</div>
                  </div>
                </label>
              ))}
            </div>
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