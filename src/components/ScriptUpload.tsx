import React, { useCallback, useState } from 'react';
import { Upload, FileText, File, FileImage, Save, User, CheckCircle, XCircle, Globe, Copy, Sparkles, Crown, CreditCard, Loader2 } from 'lucide-react';
import { parseScript } from '../utils/scriptParser';
import { AIParsingService } from '../utils/aiParsingService';
import { AIAnalysisStorage } from '../services/aiAnalysisStorage';
import { Character, ScriptLine, SCRIPT_LANGUAGES, getScriptLanguageInfo } from '../types';
import { useTranslation } from '../i18n/useTranslation';
import { useAuth } from '../hooks/useAuth';
import { useUserRole } from '../hooks/useUserRole';
import { useScripts } from '../hooks/useScripts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ScriptUploadProps {
  onScriptLoaded: (characters: Character[], lines: ScriptLine[], title: string, scriptLanguage: string) => void;
}

interface DebugInfo {
  charactersFound: number;
  linesFound: number;
  title: string;
  scriptLanguage: string;
  characters: string[];
  firstFewLines: string[];
  stageDirections: number;
  skippedLines: number;
  parseStats?: any;
}

export const ScriptUpload: React.FC<ScriptUploadProps> = ({ onScriptLoaded }) => {
  const { user } = useAuth();
  const { canAccessAIFeatures } = useUserRole();
  const { saveScript } = useScripts();
  
  // UI State
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  
  // Form State
  const [saveToLibrary, setSaveToLibrary] = useState(true);
  const [author, setAuthor] = useState('');
  const [scriptLanguage, setScriptLanguage] = useState('en');
  const [scriptTitle, setScriptTitle] = useState('');
  const [clipboardText, setClipboardText] = useState('');
  
  // Parsing Options - Stage directions always included by default
  const [includeStageDirections, setIncludeStageDirections] = useState(true);
  const [strictMode, setStrictMode] = useState(false);
  const [verboseLogging, setVerboseLogging] = useState(false);
  
  // AI Parsing State
  const [showAIParsingDialog, setShowAIParsingDialog] = useState(false);
  const [aiParsingStatus, setAIParsingStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [selectedPackage, setSelectedPackage] = useState<'parsing' | 'bundle'>('parsing');

  // Check if user has access to AI parsing using the new role system
  const hasAIParsingAccess = canAccessAIFeatures();

  const processScript = useCallback(async (content: string, filename: string = 'Uploaded Script') => {
    setIsLoading(true);
    setError(null);
    setProcessingStep('');
    setDebugInfo(null);

    try {
      setProcessingStep('Analyzing script structure...');
      
      const title = scriptTitle || filename.replace(/\.[^/.]+$/, '');
      const { characters, lines } = await parseScript(content, title, {
        includeStageDirections,
        strictMode,
        verboseLogging
      });
      
      // Set debug info
      setDebugInfo({
        charactersFound: characters.length,
        linesFound: lines.length,
        title,
        scriptLanguage: getScriptLanguageInfo(scriptLanguage).nativeName,
        characters: characters.map(c => `${c.name} (${c.lineCount} lines)`),
        firstFewLines: lines.slice(0, 5).map(l => `${l.character}: ${l.text.substring(0, 50)}...`),
        stageDirections: 0,
        skippedLines: 0,
        parseStats: null
      });
      
      if (characters.length === 0) {
        // Offer AI parsing for premium users
        if (hasAIParsingAccess) {
          setError('No characters found in the script. Try our AI-powered parsing for better results!');
          setShowAIParsingDialog(true);
          return;
        } else {
          throw new Error('No characters found in the script. Please check the format or consider upgrading to premium for AI-assisted parsing.');
        }
      } else if (hasAIParsingAccess) {
        // Offer AI enhancement to premium users even if parsing succeeded
        setShowAIParsingDialog(true);
      }

      setProcessingStep('Processing complete!');

      // Save to library if user is authenticated and option is selected
      if (user && saveToLibrary) {
        setProcessingStep('Saving to library...');
        
        const saveResult = await saveScript(
          user.id,
          title,
          content,
          characters,
          lines,
          'txt',
          content.length,
          [], // Tags can be added later
          author || undefined,
          scriptLanguage
        );

        if (saveResult.error) {
          console.error('Failed to save script:', saveResult.error);
          onScriptLoaded(characters, lines, title, scriptLanguage);
        } else if (saveResult.data) {
          console.log('✅ Script saved successfully');
          onScriptLoaded(saveResult.data.characters, saveResult.data.lines, saveResult.data.title, scriptLanguage);
        } else {
          onScriptLoaded(characters, lines, title, scriptLanguage);
        }
      } else {
        onScriptLoaded(characters, lines, title, scriptLanguage);
      }
    } catch (err) {
      console.error('Script processing error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to process script';
      
      // Offer AI parsing for premium users on any error
      if (hasAIParsingAccess && !errorMessage.includes('AI-assisted')) {
        setError(`${errorMessage} Try our AI-powered parsing for better results!`);
        setShowAIParsingDialog(true);
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
      setProcessingStep('');
    }
  }, [scriptLanguage, includeStageDirections, strictMode, verboseLogging, scriptTitle, user, saveToLibrary, author, saveScript, onScriptLoaded, hasAIParsingAccess]);

  const handleFile = useCallback(async (file: File) => {
    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setError('File is too large. Maximum size is 10MB.');
      return;
    }

    // Check file type
    const supportedTypes = [
      'text/plain',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'application/pdf',
      'application/rtf',
      'text/rtf'
    ];

    const fileExtension = file.name.toLowerCase().split('.').pop();
    const supportedExtensions = ['txt', 'docx', 'doc', 'pdf', 'rtf'];

    if (!supportedTypes.includes(file.type) && !supportedExtensions.includes(fileExtension || '')) {
      setError('Unsupported file format. Please use TXT, DOCX, DOC, PDF, or RTF files.');
      return;
    }

    setProcessingStep('Extracting text from file...');
    
    try {
      let content: string;
      
      if (file.type === 'text/plain' || fileExtension === 'txt') {
        content = await file.text();
      } else {
        // For other formats, we'll need to extract text
        // For now, try reading as text (this works for some formats)
        try {
          content = await file.text();
        } catch {
          throw new Error('Unable to extract text from this file format. Please convert to TXT format or try AI-assisted parsing.');
        }
      }

      await processScript(content, file.name);
    } catch (err) {
      console.error('File processing error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process file');
      setIsLoading(false);
      setProcessingStep('');
    }
  }, [processScript]);

  const handleClipboardPaste = useCallback(async () => {
    if (!clipboardText.trim()) {
      setError('Please paste some text first');
      return;
    }

    await processScript(clipboardText, scriptTitle || 'Pasted Script');
  }, [clipboardText, processScript, scriptTitle]);

  const handleAIParsing = useCallback(async () => {
    if (!hasAIParsingAccess) {
      setError('AI parsing is only available for premium users and demo admin');
      return;
    }

    setAIParsingStatus('processing');
    
    try {
      const content = clipboardText || 'Sample script content';
      const title = scriptTitle || 'AI Parsed Script';
      
      // Set pricing based on selected package
      const aiParsingCost = selectedPackage === 'bundle' ? 5.00 : 3.50;
      
      setProcessingStep('AI is analyzing your script...');
      
      const result = await AIParsingService.parseScript(content, title, {
        includeStageDirections,
        strictMode,
        verboseLogging
      });
      
      const { characters, lines, stats } = result;
      
      // Set debug info for AI parsing
      setDebugInfo({
        charactersFound: characters.length,
        linesFound: lines.length,
        title,
        scriptLanguage: getScriptLanguageInfo(scriptLanguage).nativeName,
        characters: characters.map(c => `${c.name} (${c.lineCount} lines)`),
        firstFewLines: lines.slice(0, 5).map(l => `${l.character}: ${l.text.substring(0, 50)}...`),
        stageDirections: stats.stageDirections,
        skippedLines: stats.skippedLines,
        parseStats: stats
      });
      
      // Store comprehensive AI analysis in database for future use
      if (user) {
        setProcessingStep('Storing AI analysis for future use...');
        const storageResult = await AIAnalysisStorage.storeAnalysis(
          user.id,
          title,
          content,
          result
        );
        
        if (storageResult.success) {
          console.log('✅ AI analysis stored successfully:', storageResult.analysisId);
        } else {
          console.error('❌ Failed to store AI analysis:', storageResult.error);
        }
      }
      
      setAIParsingStatus('success');
      setShowAIParsingDialog(false);
      
      // Show success message with upsell if they only bought parsing
      if (selectedPackage === 'parsing') {
        // Add a subtle upsell message to the debug info
        setDebugInfo(prev => prev ? {
          ...prev,
          parseStats: {
            ...prev.parseStats,
            upsellMessage: "🎭 Want professional voiceovers too? Add AI Voiceovers for just $3.50 more!",
            analysisStored: true
          }
        } : prev);
      } else {
        // For bundle purchases, show comprehensive analysis info
        setDebugInfo(prev => prev ? {
          ...prev,
          parseStats: {
            ...prev.parseStats,
            analysisStored: true,
            bundleMessage: "🎭 Complete AI Bundle: Enhanced parsing + voice profiles ready for TTS!"
          }
        } : prev);
      }
      
      // Continue with normal flow
      if (user && saveToLibrary) {
        const saveResult = await saveScript(
          user.id,
          title,
          content,
          characters,
          lines,
          'txt',
          content.length,
          ['ai-parsed'],
          author || undefined,
          scriptLanguage
        );

        if (saveResult.data) {
          onScriptLoaded(saveResult.data.characters, saveResult.data.lines, saveResult.data.title, scriptLanguage);
        } else {
          onScriptLoaded(characters, lines, title, scriptLanguage);
        }
      } else {
        onScriptLoaded(characters, lines, title, scriptLanguage);
      }
    } catch (err) {
      setAIParsingStatus('error');
      setError('AI parsing failed. Please check your script format.');
    }
  }, [hasAIParsingAccess, clipboardText, scriptTitle, user, saveToLibrary, author, saveScript, onScriptLoaded, scriptLanguage]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const scriptFile = files.find(file => {
      const extension = file.name.toLowerCase().split('.').pop();
      return ['txt', 'docx', 'doc', 'pdf', 'rtf'].includes(extension || '');
    });

    if (scriptFile) {
      handleFile(scriptFile);
    } else {
      setError('Please drop a valid script file (TXT, DOCX, DOC, PDF, or RTF)');
    }
  }, [handleFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-foreground mb-4">
          Upload Your Script
        </h2>
        <p className="text-muted-foreground">
          Upload a script file or paste text to start practicing with AI-powered voice coaching
        </p>
      </div>

      {/* Script Language Selection - Fixed Position */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-base">
            <Globe className="w-4 h-4" />
            <span>Script Language</span>
          </CardTitle>
          <CardDescription>
            Select the original language of your script for proper voice selection and pronunciation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={scriptLanguage} onValueChange={setScriptLanguage}>
            <SelectTrigger>
              <SelectValue placeholder="Select script language" />
            </SelectTrigger>
            <SelectContent>
              {SCRIPT_LANGUAGES.map(lang => (
                <SelectItem key={lang.code} value={lang.code}>
                  {lang.flag} {lang.nativeName} ({lang.name})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="space-y-2">
            <Label htmlFor="scriptTitle">Script Title (Optional)</Label>
            <Input
              id="scriptTitle"
              value={scriptTitle}
              onChange={(e) => setScriptTitle(e.target.value)}
              placeholder="Enter script title"
            />
          </div>
        </CardContent>
      </Card>

      {/* Upload Methods */}
      <Tabs defaultValue="file" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="file">Upload File</TabsTrigger>
          <TabsTrigger value="clipboard">Paste Text</TabsTrigger>
        </TabsList>

        <TabsContent value="file" className="space-y-4">
          {/* File Upload Zone */}
          <Card className={`transition-all duration-200 ${
            isDragging ? 'border-primary bg-primary/5 scale-105' : ''
          } ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}>
            <CardContent className="p-12">
              <div
                className="border-2 border-dashed border-border rounded-xl p-8 text-center transition-all duration-200 hover:border-primary/50 relative"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <input
                  type="file"
                  accept=".txt,.docx,.doc,.pdf,.rtf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,application/pdf,application/rtf,text/rtf"
                  onChange={handleFileInput}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  disabled={isLoading}
                />

                <div className="space-y-4">
                  <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center">
                    {isLoading ? (
                      <Loader2 className="w-8 h-8 text-primary-foreground animate-spin" />
                    ) : (
                      <Upload className="w-8 h-8 text-primary-foreground" />
                    )}
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {isLoading ? (processingStep || 'Processing...') : 'Drop your script file here'}
                    </h3>
                    <p className="text-muted-foreground">
                      or <span className="text-primary font-medium">browse files</span>
                    </p>
                  </div>

                  <div className="flex items-center justify-center space-x-6 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <FileText className="w-4 h-4" />
                      <span>TXT</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <File className="w-4 h-4" />
                      <span>DOCX</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <FileImage className="w-4 h-4" />
                      <span>PDF</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <FileText className="w-4 h-4" />
                      <span>RTF</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clipboard" className="space-y-4">
          {/* Clipboard Input */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-base">
                <Copy className="w-4 h-4" />
                <span>Paste Script Text</span>
              </CardTitle>
              <CardDescription>
                Copy and paste your script text directly into the text area below.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={clipboardText}
                onChange={(e) => setClipboardText(e.target.value)}
                placeholder="Paste your script text here..."
                className="min-h-[200px] font-mono text-sm"
              />
              <Button 
                onClick={handleClipboardPaste}
                disabled={!clipboardText.trim() || isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {processingStep || 'Processing...'}
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Process Script Text
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Parsing Options */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Parsing Options</CardTitle>
          <CardDescription>
            Configure how your script should be processed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeStageDirections"
                checked={includeStageDirections}
                onCheckedChange={(checked) => setIncludeStageDirections(checked === true)}
              />
              <Label htmlFor="includeStageDirections" className="text-sm">
                Include stage directions (recommended)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="strictMode"
                checked={strictMode}
                onCheckedChange={(checked) => setStrictMode(checked === true)}
              />
              <Label htmlFor="strictMode" className="text-sm">
                Strict parsing mode
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="verboseLogging"
                checked={verboseLogging}
                onCheckedChange={(checked) => setVerboseLogging(checked === true)}
              />
              <Label htmlFor="verboseLogging" className="text-sm">
                Verbose logging
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save to Library Options */}
      {user && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-base">
              <Save className="w-4 h-4" />
              <span>Save to Library</span>
            </CardTitle>
            <CardDescription>
              Save this script to your personal library for future practice sessions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
                         <div className="flex items-center space-x-2">
               <Checkbox
                 id="saveToLibrary"
                 checked={saveToLibrary}
                 onCheckedChange={(checked) => setSaveToLibrary(checked === true)}
               />
               <Label htmlFor="saveToLibrary" className="text-sm font-medium">
                 Save to my library
               </Label>
             </div>

            {saveToLibrary && (
              <div className="space-y-2">
                <Label htmlFor="author">Author (Optional)</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="author"
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="pl-10"
                    placeholder="Enter author name"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Success Message with Debug Info */}
      {debugInfo && !error && (
        <Alert>
          <CheckCircle className="w-4 h-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">Script processed successfully!</p>
              <div className="text-sm space-y-1">
                <div>• Found {debugInfo.charactersFound} characters with {debugInfo.linesFound} total lines</div>
                <div>• Title: "{debugInfo.title}"</div>
                <div>• Script Language: {debugInfo.scriptLanguage}</div>
                <div>• Stage directions: {debugInfo.stageDirections}</div>
                <div>• Skipped lines: {debugInfo.skippedLines}</div>
                <details className="mt-2">
                  <summary className="cursor-pointer hover:text-primary">Show details</summary>
                  <div className="mt-2 text-xs space-y-1">
                    <div><strong>Characters:</strong> {debugInfo.characters.join(', ')}</div>
                    <div><strong>First few lines:</strong></div>
                    <ul className="list-disc list-inside ml-2">
                      {debugInfo.firstFewLines.map((line: string, i: number) => (
                        <li key={i}>{line}</li>
                      ))}
                    </ul>
                    {debugInfo.parseStats && (
                      <div className="mt-2">
                        <strong>Parse Statistics:</strong>
                        <pre className="text-xs bg-muted p-2 rounded mt-1">
                          {JSON.stringify(debugInfo.parseStats, null, 2)}
                        </pre>
                        {debugInfo.parseStats.upsellMessage && (
                          <div className="mt-2 p-2 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded text-sm">
                            {debugInfo.parseStats.upsellMessage}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </details>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Error Message with AI Parsing Option */}
      {error && (
        <Alert variant="destructive">
          <XCircle className="w-4 h-4" />
          <AlertDescription>
            <div className="space-y-3">
              <p className="font-medium">Script Processing Error</p>
              <p className="text-sm">{error}</p>
              
                             {hasAIParsingAccess && error.includes('AI-powered') && (
                 <Button
                   onClick={() => setShowAIParsingDialog(true)}
                   variant="outline"
                   size="sm"
                   className="mt-2"
                 >
                   <Sparkles className="mr-2 h-3 w-3" />
                   Try AI Parsing
                 </Button>
               )}
               
               {!hasAIParsingAccess && error.includes('AI-assisted') && (
                 <div className="mt-2 p-3 bg-muted rounded">
                   <p className="text-xs font-medium">Want AI-assisted parsing?</p>
                   <p className="text-xs text-muted-foreground">Upgrade to premium for advanced script parsing with AI assistance.</p>
                 </div>
               )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* AI Parsing Dialog */}
      <Dialog open={showAIParsingDialog} onOpenChange={setShowAIParsingDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              AI-Powered Script Enhancement
              <Crown className="h-4 w-4 text-yellow-500" />
            </DialogTitle>
            <DialogDescription>
              Enhance your script with AI-powered parsing and professional voiceovers
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Package Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* AI Parsing Only */}
              <div 
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedPackage === 'parsing' 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setSelectedPackage('parsing')}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-500" />
                    <span className="font-semibold">AI Parsing</span>
                  </div>
                  <Badge variant="secondary">$3.50</Badge>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Advanced character detection</li>
                  <li>• Smart dialogue extraction</li>
                  <li>• Stage direction handling</li>
                  <li>• Format error correction</li>
                </ul>
              </div>

              {/* Bundle Deal */}
              <div 
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all relative ${
                  selectedPackage === 'bundle' 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setSelectedPackage('bundle')}
              >
                <div className="absolute -top-2 -right-2">
                  <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                    BEST VALUE
                  </Badge>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Crown className="h-4 w-4 text-yellow-500" />
                    <span className="font-semibold">AI Bundle</span>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary">$5.00</Badge>
                    <div className="text-xs text-muted-foreground line-through">$7.00</div>
                  </div>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <strong>AI Parsing</strong> (worth $3.50)</li>
                  <li>• <strong>AI Voiceovers</strong> (worth $3.50)</li>
                  <li>• Character voice matching</li>
                  <li>• Professional audio generation</li>
                  <li>• Save $2.00 with bundle!</li>
                </ul>
              </div>
            </div>

            {/* Selected Package Details */}
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">
                  {selectedPackage === 'bundle' ? 'AI Parsing + Voiceovers Bundle' : 'AI Parsing Service'}
                </span>
                <Badge variant="secondary" className="text-lg">
                  ${selectedPackage === 'bundle' ? '5.00' : '3.50'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {selectedPackage === 'bundle' 
                  ? 'Complete AI enhancement: advanced script parsing + professional character voiceovers with voice matching technology.'
                  : 'Advanced AI analysis to extract characters, dialogue, and stage directions from complex formats.'
                }
              </p>
              {selectedPackage === 'bundle' && (
                <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded text-sm text-green-700 dark:text-green-300">
                  💰 Save $2.00 compared to purchasing separately!
                </div>
              )}
            </div>

            {/* Payment Info */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                <CreditCard className="h-4 w-4" />
                <span className="text-sm font-medium">Secure Payment</span>
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                One-time payment • No subscription • Instant processing
              </p>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={handleAIParsing}
                disabled={aiParsingStatus === 'processing'}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                {aiParsingStatus === 'processing' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    {selectedPackage === 'bundle' ? 'Get AI Bundle' : 'Get AI Parsing'}
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowAIParsingDialog(false)}
                disabled={aiParsingStatus === 'processing'}
              >
                Skip for now
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Format Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Formatting Tips</CardTitle>
        </CardHeader>
        <CardContent>
                     <ul className="text-sm text-muted-foreground space-y-2">
             <li>• <strong>Character names:</strong> Should be in ALL CAPS followed by a colon</li>
             <li>• <strong>Stage directions:</strong> Usually in [brackets] or (parentheses)</li>
             <li>• <strong>Scene breaks:</strong> Use "Act", "Scene", or clear separators</li>
             <li>• <strong>Multiple formats:</strong> TXT, DOCX, DOC, PDF, and RTF supported</li>
             <li>• <strong>Language support:</strong> Upload scripts in any language</li>
             <li>• <strong>AI Enhancement:</strong> Get AI parsing ($3.50) or AI Bundle with voiceovers ($5.00) - Premium users only</li>
             <li>• <strong>Stage directions:</strong> Can be included or excluded based on your preference</li>
             <li>• <strong>Enhanced parsing:</strong> Improved support for Shakespeare and classical formats</li>
           </ul>
        </CardContent>
      </Card>
    </div>
  );
};