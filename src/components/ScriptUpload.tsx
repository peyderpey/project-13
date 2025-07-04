import React, { useCallback, useState } from 'react';
import { Upload, FileText, File, FileImage, Save, User, CheckCircle, XCircle, Globe } from 'lucide-react';
import { parseScript } from '../utils/scriptParser';
import { Character, ScriptLine, SCRIPT_LANGUAGES, getScriptLanguageInfo } from '../types';
import { useTranslation } from '../i18n/useTranslation';
import { useAuth } from '../hooks/useAuth';
import { useScripts } from '../hooks/useScripts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface ScriptUploadProps {
  onScriptLoaded: (characters: Character[], lines: ScriptLine[], title: string, scriptLanguage: string) => void;
}

export const ScriptUpload: React.FC<ScriptUploadProps> = ({ onScriptLoaded }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { saveScript } = useScripts();
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [saveToLibrary, setSaveToLibrary] = useState(true);
  const [author, setAuthor] = useState('');
  const [scriptLanguage, setScriptLanguage] = useState('en'); // Original language of the script
  const [debugInfo, setDebugInfo] = useState<{
    charactersFound: number;
    linesFound: number;
    title: string;
    scriptLanguage: string;
    characters: string[];
    firstFewLines: string[];
  } | null>(null);

  const handleFile = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);
    setProcessingStep('');
    setDebugInfo(null);

    try {
      // Check file size (10MB limit for document files)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error(t('upload.errors.fileTooBig'));
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
        throw new Error(t('upload.errors.invalidFormat'));
      }

      setProcessingStep('Extracting text from file...');
      
      const { characters, lines, title } = await parseScript(file);
      
      // Set debug info
      setDebugInfo({
        charactersFound: characters.length,
        linesFound: lines.length,
        title,
        scriptLanguage: getScriptLanguageInfo(scriptLanguage).nativeName,
        characters: characters.map(c => `${c.name} (${c.lineCount} lines)`),
        firstFewLines: lines.slice(0, 5).map(l => `${l.character}: ${l.text.substring(0, 50)}...`)
      });
      
      if (characters.length === 0) {
        throw new Error(t('upload.errors.noCharacters'));
      }

      setProcessingStep('Processing complete!');

      // 🔥 NEW: Save to library if user is authenticated and option is selected
      if (user && saveToLibrary) {
        setProcessingStep('Saving to library...');
        const fileContent = await file.text().catch(() => ''); // Fallback for binary files
        
        const saveResult = await saveScript(
          user.id,
          title,
          fileContent,
          characters,
          lines,
          fileExtension || 'txt',
          file.size,
          [], // Tags can be added later
          author || undefined,
          scriptLanguage // Save the original script language
        );

        if (saveResult.error) {
          console.error('Failed to save script:', saveResult.error);
          // Continue with the original characters/lines if save fails
          onScriptLoaded(characters, lines, title, scriptLanguage);
        } else if (saveResult.data) {
          console.log('✅ Script saved successfully, using database version with IDs');
          // 🔥 Use the saved script data which includes database IDs for characters
          onScriptLoaded(saveResult.data.characters, saveResult.data.lines, saveResult.data.title, scriptLanguage);
        } else {
          // Fallback to original data if no saved data returned
          onScriptLoaded(characters, lines, title, scriptLanguage);
        }
      } else {
        // No save needed, use original data
        onScriptLoaded(characters, lines, title, scriptLanguage);
      }
    } catch (err) {
      console.error('Script upload error:', err);
      setError(err instanceof Error ? err.message : t('upload.errors.invalidFormat'));
    } finally {
      setIsLoading(false);
      setProcessingStep('');
    }
  }, [onScriptLoaded, t, user, saveScript, saveToLibrary, author, scriptLanguage]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const scriptFile = files.find(file => {
      const extension = file.name.toLowerCase().split('.').pop();
      return ['txt', 'docx', 'doc', 'pdf', 'rtf'].includes(extension || '') ||
             file.type.includes('text') ||
             file.type.includes('document') ||
             file.type.includes('pdf') ||
             file.type.includes('rtf');
    });

    if (scriptFile) {
      handleFile(scriptFile);
    } else {
      setError(t('upload.errors.invalidFormat'));
    }
  }, [handleFile, t]);

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
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-foreground mb-4">
          {t('upload.title')}
        </h2>
        <p className="text-muted-foreground">
          {t('upload.subtitle')}
        </p>
      </div>

      {/* Script Language Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-base">
            <Globe className="w-4 h-4" />
            <span>Script Language (Original Language)</span>
          </CardTitle>
          <CardDescription>
            Select the original language of the script you're uploading. This helps with proper pronunciation and character voice selection.
          </CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      {/* Save to Library Options */}
      {user && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-base">
              <Save className="w-4 h-4" />
              <span>{t('upload.saveToLibrary')}</span>
            </CardTitle>
            <CardDescription>
              {t('upload.saveToLibraryDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="saveToLibrary"
                checked={saveToLibrary}
                onCheckedChange={(checked: boolean | 'indeterminate') => setSaveToLibrary(checked as boolean)}
              />
              <Label htmlFor="saveToLibrary" className="text-sm font-medium">
                Save to my library
              </Label>
            </div>

            {saveToLibrary && (
              <div className="space-y-2">
                <Label htmlFor="author">Author (optional)</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="author"
                    type="text"
                    value={author}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAuthor(e.target.value)}
                    className="pl-10"
                    placeholder="Enter author name"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* File Upload Zone */}
      <Card className={`transition-all duration-200 ${
        isDragging ? 'border-primary bg-primary/5 scale-105' : ''
      } ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}>
        <CardContent className="p-12">
          <div
            className="border-2 border-dashed border-border rounded-xl p-8 text-center transition-all duration-200 hover:border-primary/50"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <input
              type="file"
              accept=".txt,.docx,.doc,.pdf,.rtf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,application/pdf,application/rtf,text/rtf"
              onChange={handleFileInput}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isLoading}
            />

            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center">
                {isLoading ? (
                  <div className="animate-spin w-6 h-6 border-2 border-background border-t-transparent rounded-full" />
                ) : (
                  <Upload className="w-8 h-8 text-primary-foreground" />
                )}
              </div>

              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {isLoading ? (processingStep || t('upload.processing')) : t('upload.dropZone')}
                </h3>
                <p className="text-muted-foreground">
                  {t('common.or')} <span className="text-primary font-medium">{t('upload.browseFiles')}</span>
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
                  </div>
                </details>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <XCircle className="w-4 h-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">{t('upload.errors.title')}</p>
              <p className="text-sm">{error}</p>
              {debugInfo && (
                <details className="mt-2">
                  <summary className="cursor-pointer hover:text-destructive text-sm">Show debug info</summary>
                  <pre className="mt-2 text-xs bg-destructive/10 p-2 rounded overflow-auto">
                    {JSON.stringify(debugInfo, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Format Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('upload.formatTips.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>• {t('upload.formatTips.tip1')}</li>
            <li>• {t('upload.formatTips.tip2')}</li>
            <li>• {t('upload.formatTips.tip3')}</li>
            <li>• {t('upload.formatTips.tip4')}</li>
            <li>• {t('upload.formatTips.tip5')}</li>
            <li>• <strong>Language Support:</strong> Upload scripts in any language and specify the original language for proper voice selection</li>
            <li>• <strong>Enhanced Parser:</strong> Improved support for Shakespeare and classical play formats</li>
            <li>• <strong>Character Voice Assignment:</strong> Each character will automatically be assigned appropriate voices based on the script language</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};