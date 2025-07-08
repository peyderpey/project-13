import React, { useState, useEffect, useCallback } from 'react';
import { 
  Play, 
  Download, 
  Sparkles, 
  Crown,
  AlertCircle,
  CheckCircle,
  Loader2,
  Zap
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useUserRole } from '../hooks/useUserRole';
import { Character, ScriptLine } from '../types';
import { 
  CharacterVoiceProfile, 
  VoiceAnalysisResult, 
  VoiceoverLine, 
  VoiceoverSession,
  GoogleVoice 
} from '../types/tts';
import { GoogleCloudTTSService } from '../services/googleCloudTTS';
import { GeminiVoiceAnalysisService } from '../services/geminiVoiceAnalysis';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AIVoiceoverProps {
  scriptId: string;
  scriptTitle: string;
  characters: Character[];
  lines: ScriptLine[];
  scriptLanguage: string;
  onClose?: () => void;
}

export const AIVoiceover: React.FC<AIVoiceoverProps> = ({ 
  scriptId, 
  scriptTitle, 
  characters, 
  lines, 
  scriptLanguage, 
  onClose 
}) => {
  const { user } = useAuth();
  const { canAccessAIFeatures, isDemoAdmin } = useUserRole();
  
  // Debug logging
  console.log('🎭 AIVoiceover component - User:', user?.email);
  console.log('🎭 AIVoiceover component - isDemoAdmin:', isDemoAdmin());
  console.log('🎭 AIVoiceover component - canAccessAIFeatures:', canAccessAIFeatures());
  
  // State management
  const [voiceAnalysis, setVoiceAnalysis] = useState<VoiceAnalysisResult | null>(null);
  const [voiceoverSession, setVoiceoverSession] = useState<VoiceoverSession | null>(null);
  const [availableVoices, setAvailableVoices] = useState<GoogleVoice[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState<'analysis' | 'review' | 'generation' | 'complete'>('analysis');
  const [error, setError] = useState<string | null>(null);
  const [previewAudio, setPreviewAudio] = useState<HTMLAudioElement | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState(scriptLanguage);

  // Check if user has access using the new role system
  const hasAccess = canAccessAIFeatures();

  useEffect(() => {
    if (!hasAccess) {
      setError('This feature is only available for premium users.');
      return;
    }

    loadAvailableVoices();
  }, [hasAccess, selectedLanguage]);

  const loadAvailableVoices = useCallback(async () => {
    try {
      const ttsService = new GoogleCloudTTSService(import.meta.env.VITE_GOOGLE_CLOUD_API_KEY || '');
      const voices = await ttsService.getAvailableVoices(selectedLanguage);
      setAvailableVoices(voices);
    } catch (error) {
      console.error('Failed to load voices:', error);
    }
  }, [selectedLanguage]);

  const analyzeScript = useCallback(async () => {
    if (!characters.length || !lines.length) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const geminiService = new GeminiVoiceAnalysisService(import.meta.env.VITE_GEMINI_API_KEY || '');
      
      const analysis = await geminiService.analyzeScriptForVoiceSelection({
        scriptTitle: scriptTitle,
        characters: characters,
        lines: lines,
        language: selectedLanguage
      });

      setVoiceAnalysis(analysis);
      setCurrentStep('review');
    } catch (error) {
      setError('Failed to analyze script. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [characters, lines, selectedLanguage, scriptTitle]);

  const previewVoice = useCallback(async (characterProfile: CharacterVoiceProfile, sampleText: string) => {
    try {
      const ttsService = new GoogleCloudTTSService(import.meta.env.VITE_GOOGLE_CLOUD_API_KEY || '');
      
      const audioBuffer = await ttsService.synthesizeSpeech(
        sampleText,
        characterProfile.recommendedVoice,
        {
          ...GoogleCloudTTSService.getDefaultAudioConfig(),
          ...characterProfile.voiceAttributes
        }
      );

      const blob = new Blob([audioBuffer], { type: 'audio/mp3' });
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      
      if (previewAudio) {
        previewAudio.pause();
        URL.revokeObjectURL(previewAudio.src);
      }
      
      setPreviewAudio(audio);
      audio.play();
    } catch (error) {
      console.error('Failed to preview voice:', error);
    }
  }, [previewAudio]);

  const generateVoiceover = useCallback(async () => {
    if (!voiceAnalysis) return;

    setIsGenerating(true);
    setError(null);

    try {
      const ttsService = new GoogleCloudTTSService(import.meta.env.VITE_GOOGLE_CLOUD_API_KEY || '');
      const geminiService = new GeminiVoiceAnalysisService(import.meta.env.VITE_GEMINI_API_KEY || '');

      const voiceoverLines: VoiceoverLine[] = [];
      let totalCost = 0;

      // Generate voiceover for each line
      for (const line of lines) {
        const characterProfile = voiceAnalysis.characters.find(
          c => c.characterName === line.character
        );

        if (!characterProfile) continue;

        try {
          // Generate SSML for the line
          const ssml = await geminiService.generateSSMLForLine(
            line.character,
            line.text,
            `Line ${line.lineNumber} in the script`,
            characterProfile
          );

          // Synthesize audio
          await ttsService.synthesizeSSML(
            ssml,
            characterProfile.recommendedVoice,
            {
              ...GoogleCloudTTSService.getDefaultAudioConfig(),
              ...characterProfile.voiceAttributes
            }
          );

          // TODO: Upload to Supabase storage
          const audioUrl = `generated_audio_${line.id}.mp3`; // Placeholder

          voiceoverLines.push({
            id: line.id,
            characterName: line.character,
            text: line.text,
            audioUrl,
            voiceProfile: characterProfile,
            status: 'completed'
          });

          // Calculate cost (approximate)
          totalCost += line.text.length * 0.000016; // Google Cloud TTS pricing
        } catch (error) {
          voiceoverLines.push({
            id: line.id,
            characterName: line.character,
            text: line.text,
            voiceProfile: characterProfile,
            status: 'error',
            error: 'Failed to generate audio'
          });
        }
      }

      const session: VoiceoverSession = {
        id: `session_${Date.now()}`,
        scriptId,
        title: 'Generated Voiceover',
        lines: voiceoverLines,
        totalCost,
        status: 'completed',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setVoiceoverSession(session);
      setCurrentStep('complete');
    } catch (error) {
      setError('Failed to generate voiceover. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [voiceAnalysis, lines, scriptId]);

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              Premium Feature
            </CardTitle>
            <CardDescription>
              AI Voiceover generation is only available for premium users.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Upgrade to premium to access AI-powered voiceover generation with Google Cloud TTS and Gemini AI.
              </AlertDescription>
            </Alert>
            
            {/* User Role Information */}
            {user && (
              <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
                <p><strong>Account Info:</strong></p>
                <p>Email: {user.email}</p>
                <p>Demo Admin: {isDemoAdmin() ? 'Yes' : 'No'}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-purple-500" />
            AI Voiceover Generation
          </h1>
          <p className="text-muted-foreground">
            Generate professional voiceovers using AI-powered voice selection
          </p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white">
          <Crown className="h-3 w-3" />
          Premium
        </Badge>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Progress Steps */}
      <div className="flex items-center space-x-4">
        <div className={`flex items-center gap-2 ${currentStep === 'analysis' ? 'text-primary' : 'text-muted-foreground'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            currentStep === 'analysis' ? 'bg-primary text-primary-foreground' : 'bg-muted'
          }`}>
            {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : '1'}
          </div>
          <span>Analysis</span>
        </div>
        <div className="flex-1 h-px bg-border" />
        <div className={`flex items-center gap-2 ${currentStep === 'review' ? 'text-primary' : 'text-muted-foreground'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            currentStep === 'review' ? 'bg-primary text-primary-foreground' : 'bg-muted'
          }`}>
            2
          </div>
          <span>Review</span>
        </div>
        <div className="flex-1 h-px bg-border" />
        <div className={`flex items-center gap-2 ${currentStep === 'generation' ? 'text-primary' : 'text-muted-foreground'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            currentStep === 'generation' ? 'bg-primary text-primary-foreground' : 'bg-muted'
          }`}>
            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : '3'}
          </div>
          <span>Generation</span>
        </div>
        <div className="flex-1 h-px bg-border" />
        <div className={`flex items-center gap-2 ${currentStep === 'complete' ? 'text-primary' : 'text-muted-foreground'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            currentStep === 'complete' ? 'bg-primary text-primary-foreground' : 'bg-muted'
          }`}>
            <CheckCircle className="h-4 w-4" />
          </div>
          <span>Complete</span>
        </div>
      </div>

      {/* Content based on current step */}
      {currentStep === 'analysis' && (
        <Card>
          <CardHeader>
            <CardTitle>Script Analysis</CardTitle>
            <CardDescription>
              Let AI analyze your script and recommend optimal voices for each character
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Language</label>
                <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en-US">English (US)</SelectItem>
                    <SelectItem value="en-GB">English (UK)</SelectItem>
                    <SelectItem value="fr-FR">French</SelectItem>
                    <SelectItem value="de-DE">German</SelectItem>
                    <SelectItem value="es-ES">Spanish</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Characters</label>
                <div className="text-2xl font-bold text-primary">{characters.length}</div>
              </div>
            </div>
            
            <Button 
              onClick={analyzeScript} 
              disabled={isAnalyzing || !characters.length}
              className="w-full"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing Script...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Start Analysis
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {currentStep === 'review' && voiceAnalysis && (
        <Tabs defaultValue="characters" className="space-y-4">
          <TabsList>
            <TabsTrigger value="characters">Character Voices</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="characters" className="space-y-4">
            {voiceAnalysis.characters.map((character, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{character.characterName}</span>
                    <Badge variant="secondary">{character.voiceType}</Badge>
                  </CardTitle>
                  <CardDescription>
                    {character.personality} • {character.age} • {character.accent}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Recommended Voice</label>
                      <Select defaultValue={character.recommendedVoice.name}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {availableVoices
                            .filter(v => v.languageCodes.includes(character.recommendedVoice.languageCode))
                            .map(voice => (
                              <SelectItem key={voice.name} value={voice.name}>
                                {voice.name} ({voice.ssmlGender})
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Voice Attributes</label>
                      <div className="space-y-2">
                        <div>
                          <label className="text-xs">Speaking Rate</label>
                          <Slider
                            defaultValue={[character.voiceAttributes.speakingRate]}
                            max={2}
                            min={0.25}
                            step={0.1}
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="text-xs">Pitch</label>
                          <Slider
                            defaultValue={[character.voiceAttributes.pitch]}
                            max={20}
                            min={-20}
                            step={1}
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => previewVoice(character, "Hello, this is a preview of my voice.")}
                  >
                    <Play className="mr-2 h-3 w-3" />
                    Preview Voice
                  </Button>
                </CardContent>
              </Card>
            ))}
            
            <Button onClick={() => setCurrentStep('generation')} className="w-full">
              Continue to Generation
            </Button>
          </TabsContent>

          <TabsContent value="preview">
            <Card>
              <CardHeader>
                <CardTitle>Voice Preview</CardTitle>
                <CardDescription>
                  Listen to sample lines with the selected voices
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Preview functionality will be implemented here
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Generation Settings</CardTitle>
                <CardDescription>
                  Configure voiceover generation parameters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Audio Quality</label>
                  <Select defaultValue="mp3">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mp3">MP3 (Standard)</SelectItem>
                      <SelectItem value="wav">WAV (High Quality)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Estimated Cost</label>
                                  <div className="text-2xl font-bold text-primary">
                  ${(lines.length * 0.000016).toFixed(4)}
                </div>
                  <p className="text-xs text-muted-foreground">
                    Based on Google Cloud TTS pricing
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {currentStep === 'generation' && (
        <Card>
          <CardHeader>
            <CardTitle>Generating Voiceover</CardTitle>
            <CardDescription>
              Creating AI-generated voiceovers for your script
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p>Generating voiceovers...</p>
                <p className="text-sm text-muted-foreground">
                  This may take a few minutes depending on script length
                </p>
              </div>
            </div>
            
            <Button 
              onClick={generateVoiceover} 
              disabled={isGenerating}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Start Generation
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {currentStep === 'complete' && voiceoverSession && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Voiceover Complete
            </CardTitle>
            <CardDescription>
              Your AI-generated voiceover is ready
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{voiceoverSession.lines.length}</div>
                <div className="text-sm text-muted-foreground">Lines Generated</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  ${voiceoverSession.totalCost.toFixed(4)}
                </div>
                <div className="text-sm text-muted-foreground">Total Cost</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">
                  {voiceoverSession.lines.filter(l => l.status === 'completed').length}
                </div>
                <div className="text-sm text-muted-foreground">Successful</div>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <h4 className="font-medium">Generated Lines</h4>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {voiceoverSession.lines.map(line => (
                  <div key={line.id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <div className="font-medium">{line.characterName}</div>
                      <div className="text-sm text-muted-foreground truncate">{line.text}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {line.status === 'completed' ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                      <Button variant="outline" size="sm">
                        <Play className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button className="flex-1">
                <Download className="mr-2 h-4 w-4" />
                Download All
              </Button>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 