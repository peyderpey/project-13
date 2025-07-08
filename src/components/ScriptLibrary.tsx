import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Bug,
  Wifi,
  WifiOff,
  Users,
  PlayCircle
} from 'lucide-react';
import { Character, ScriptLine } from '../types';
import { useTranslation } from '../i18n/useTranslation';
import { useAuth } from '../hooks/useAuth';
import { useScripts, SavedScript } from '../hooks/useScripts';
import { useAppSettings } from '../hooks/useAppSettings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ScriptLibraryProps {
  onScriptSelect: (characters: Character[], lines: ScriptLine[], title: string, language: string) => void;
}

export const ScriptLibrary: React.FC<ScriptLibraryProps> = ({ onScriptSelect }) => {
  const { t, language } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const { userScripts, fetchUserScripts, getDemoScripts } = useScripts();
  const { characterPerformance, getPerformanceRating } = useAppSettings();
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [hasInitialFetch, setHasInitialFetch] = useState(false);
  const [debugMode, setDebugMode] = useState(false);

  const demoScripts = getDemoScripts();
  const languageFilteredDemos = demoScripts.filter(script => 
    script.language === language
  );

  // Check connection status
  useEffect(() => {
    const checkConnection = async () => {
      try {
        setConnectionStatus('checking');
        const response = await fetch(import.meta.env.VITE_SUPABASE_URL + '/rest/v1/', {
          method: 'HEAD',
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
          }
        });
        setConnectionStatus(response.ok ? 'connected' : 'disconnected');
      } catch (error) {
        console.error('Connection check failed:', error);
        setConnectionStatus('disconnected');
      }
    };

    checkConnection();
  }, []);

  // Single effect to handle initial fetch
  useEffect(() => {
    console.log('ScriptLibrary: Auth state changed:', {
      isAuthenticated,
      userId: user?.id,
      email: user?.email,
      connectionStatus,
      hasInitialFetch
    });

    if (isAuthenticated && user?.id && connectionStatus === 'connected' && !hasInitialFetch) {
      console.log('ScriptLibrary: Performing initial fetch for authenticated user');
      setHasInitialFetch(true);
      fetchUserScripts(user.id);
    } else if (!isAuthenticated) {
      console.log('ScriptLibrary: User not authenticated, resetting state');
      setHasInitialFetch(false);
    }
  }, [user?.id, isAuthenticated, connectionStatus, hasInitialFetch, fetchUserScripts]);

  const handleScriptSelect = (script: any) => { // Changed type to any as SavedScript and DemoScript are removed
    console.log('ScriptLibrary: Selecting script:', {
      title: script.title,
      language: script.language || 'en',
      characters: script.characters.length,
      lines: script.lines.length
    });
    
    // Enhanced debugging for database scripts
    if ('file_type' in script) {
      console.log('🔍 Database script details:', {
        id: script.id,
        title: script.title,
        language: script.language || 'en',
        charactersCount: script.characters.length,
        linesCount: script.lines.length,
        characters: script.characters.map((c: any) => `${c.name} (${c.lineCount} lines)`),
        firstFewLines: script.lines.slice(0, 5).map((l: any, i: number) => `${i+1}. ${l.character}: ${l.text.substring(0, 40)}...`),
        lineNumberRange: script.lines.length > 0 ? `${script.lines[0].lineNumber} - ${script.lines[script.lines.length - 1].lineNumber}` : 'No lines',
        actSceneInfo: script.lines.length > 0 ? `Act ${script.lines[0].actNumber || 1}, Scene ${script.lines[0].sceneNumber || 1}` : 'No act/scene info'
      });

      // Check for potential issues
      const issues = [];
      if (script.characters.length === 0) issues.push('No characters found');
      if (script.lines.length === 0) issues.push('No lines found');
      
      const characterNamesInLines = [...new Set(script.lines.map((l: any) => l.character))];
      const characterNamesInCharacters = script.characters.map((c: any) => c.name);
      const missingCharacters = characterNamesInLines.filter(name => !characterNamesInCharacters.includes(name));
      if (missingCharacters.length > 0) issues.push(`Characters in lines but not in character list: ${missingCharacters.join(', ')}`);

      const lineNumberGaps = [];
      for (let i = 1; i < script.lines.length; i++) {
        if (script.lines[i].lineNumber !== script.lines[i-1].lineNumber + 1) {
          lineNumberGaps.push(`Gap between line ${script.lines[i-1].lineNumber} and ${script.lines[i].lineNumber}`);
        }
      }
      if (lineNumberGaps.length > 0) issues.push(`Line number gaps: ${lineNumberGaps.join(', ')}`);

      if (issues.length > 0) {
        console.warn('⚠️ Script data issues detected:', issues);
      } else {
        console.log('✅ Script data validation passed');
      }
    }
    
    // ✅ CRITICAL FIX: Always pass the script language
    onScriptSelect(
      script.characters, 
      script.lines, 
      script.title, 
      script.language || 'en'  // Pass script language, default to 'en' if undefined
    );
  };

  // Note: deleteScript functionality removed to clean up unused imports
  // const handleDeleteScript = async (scriptId: string) => {
  //   if (window.confirm(t('library.confirmDelete'))) {
  //     console.log('ScriptLibrary: Deleting script:', scriptId);
  //     const result = await deleteScript(scriptId);
  //     if (result.error) {
  //       console.error('ScriptLibrary: Failed to delete script:', result.error);
  //     } else {
  //       console.log('ScriptLibrary: Script deleted successfully');
  //     }
  //   }
  // };

  // Note: handleRefreshScripts and formatDate removed to clean up unused functions
  // const handleRefreshScripts = () => {
  //   console.log('ScriptLibrary: Manual refresh triggered');
  //   if (user?.id) {
  //     setHasInitialFetch(false); // Reset to allow new fetch
  //     fetchUserScripts(user.id);
  //   }
  // };

  // const formatDate = (dateString: string) => {
  //   return new Date(dateString).toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', {
  //     year: 'numeric',
  //     month: 'short',
  //     day: 'numeric'
  //   });
  // };

  // Helper to get progress and performance for a script
  function getScriptProgress(script: SavedScript) {
    // Try all characters for this script
    let bestProgress = null;
    let bestPerformance = null;
    
    if (!script.characters) return { percent: 0, quality: null, key: null, performance: null };
    
    for (const char of script.characters) {
      const key = `${script.title}-${char.name}`;
      const raw = localStorage.getItem(key);
      if (raw) {
        try {
          const progress = JSON.parse(raw);
          const percent = progress.completedLines && char.lineCount
            ? Math.round((progress.completedLines.length / char.lineCount) * 100)
            : 0;
          
          // Get performance data
          const perfKey = `${script.title}-${char.name}`;
          const performance = characterPerformance[perfKey];
          
          if (!bestProgress || (percent < 100 && percent > (bestProgress.percent || 0))) {
            bestProgress = { percent, quality: '—', key, character: char.name };
            bestPerformance = performance;
          }
        } catch {}
      }
    }
    
    return { 
      ...(bestProgress || { percent: 0, quality: null, key: null, character: null }), 
      performance: bestPerformance 
    };
  }

  // Find in-progress script (first with progress < 100%)
  let inProgressScript = null;
  let inProgressMeta = null;
  if (isAuthenticated && userScripts.length > 0) {
    for (const script of userScripts) {
      const meta = getScriptProgress(script);
      if (meta.percent > 0 && meta.percent < 100) {
        inProgressScript = script;
        inProgressMeta = meta;
        break;
      }
    }
  }

  // My Scripts (excluding in-progress)
  const myScripts = isAuthenticated
    ? userScripts.filter(s => !inProgressScript || s.id !== inProgressScript.id)
    : [];

  // Note: handleUploadClick removed to clean up unused functions
  // function handleUploadClick() {
  //   // TODO: Implement navigation to upload screen/modal
  //   // setActiveTab('upload');
  //   // Or call a prop/callback if needed
  // }

  return (
    <div className="relative max-w-6xl mx-auto pb-24 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-2">
          {t('library.title')}
        </h2>
        <p className="text-muted-foreground">
          {t('library.subtitle')}
        </p>
        
        {/* Debug toggle for development */}
        {process.env.NODE_ENV === 'development' && (
          <Button
            onClick={() => setDebugMode(!debugMode)}
            variant="ghost"
            size="sm"
            className="mt-2 text-xs"
          >
            <Bug className="w-3 h-3 mr-1" />
            Debug Mode: {debugMode ? 'ON' : 'OFF'}
          </Button>
        )}
      </div>

      {/* Connection Status */}
      {connectionStatus !== 'connected' && (
        <Alert className={`mb-6 ${
          connectionStatus === 'disconnected' 
            ? 'border-destructive bg-destructive/10 text-destructive'
            : 'border-warning bg-warning/10 text-warning-foreground'
        }`}>
          {connectionStatus === 'disconnected' ? (
            <WifiOff className="w-4 h-4" />
          ) : (
            <Wifi className="w-4 h-4 animate-pulse" />
          )}
          <AlertDescription className="flex items-center justify-between">
            <span>
              {connectionStatus === 'disconnected' 
                ? 'Connection Error - Unable to connect to the database. Please check your internet connection.'
                : 'Checking Connection...'
              }
            </span>
            {connectionStatus === 'disconnected' && (
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                size="sm"
                className="ml-4"
              >
                Retry
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Section: Continue Rehearsing */}
      {inProgressScript && inProgressMeta && (
        <div className="mb-10">
          <div className="relative rounded-2xl bg-gradient-to-r from-primary to-accent shadow-xl border-2 border-primary p-6 flex items-center mb-4">
            <PlayCircle className="w-10 h-10 text-white drop-shadow-lg mr-4" />
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white drop-shadow">{t('library.continueRehearsing')}</h2>
              <div className="text-white/80 mt-1 font-medium">{inProgressScript.title}</div>
              {inProgressScript.author && (
                <div className="text-white/60 text-sm">{inProgressScript.author}</div>
              )}
              <div className="flex items-center gap-6 mt-2">
                <div className="text-sm text-white/80">{t('library.progress')}: {inProgressMeta.percent}%</div>
                <div className="text-sm text-white/80">
                  {t('library.quality')}: 
                  {inProgressMeta.performance ? (
                    <span className="ml-1">
                      {getPerformanceRating(inProgressMeta.performance.averageAccuracy).rating} 
                      {getPerformanceRating(inProgressMeta.performance.averageAccuracy).emoji}
                    </span>
                  ) : (
                    <span className="italic ml-1">—</span>
                  )}
                </div>
              </div>
            </div>
            <Button
              className="ml-4 px-8 py-3 text-lg font-semibold shadow-lg bg-white text-primary hover:bg-accent hover:text-white transition animate-pulse"
              onClick={() => handleScriptSelect(inProgressScript)}
            >
              {t('library.continue')}
            </Button>
          </div>
        </div>
      )}

      {/* Section: My Scripts */}
      {isAuthenticated && myScripts.length > 0 && (
        <div className="mb-10">
          <h2 className="text-2xl font-bold mb-4">My Scripts</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {myScripts.map(script => {
              const meta = getScriptProgress(script);
              return (
                <Card key={script.id} className="group hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
                  <CardHeader>
                    <CardTitle>{script.title}</CardTitle>
                    {script.author && <CardDescription>{script.author}</CardDescription>}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm text-muted-foreground">Progress: {meta.percent}%</div>
                      <div className="text-sm text-muted-foreground">
                        Quality: 
                        {meta.performance ? (
                          <span className="ml-1">
                            {getPerformanceRating(meta.performance.averageAccuracy).rating} 
                            {getPerformanceRating(meta.performance.averageAccuracy).emoji}
                          </span>
                        ) : (
                          <span className="italic ml-1">—</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4" />
                        <span>{script.characters.length} {t('library.characters')}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <FileText className="w-4 h-4" />
                        <span>{script.lines.length} {t('library.lines')}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button onClick={() => handleScriptSelect(script)} className="w-full">
                      Rehearse
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Section: Demo Scripts */}
      <div className="mb-10">
        <h2 className="text-2xl font-bold mb-4">Demo Scripts</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {languageFilteredDemos.map(script => (
            <Card key={script.id} className="group hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
              <CardHeader>
                <CardTitle>{script.title}</CardTitle>
                <CardDescription>{script.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>{script.characters.length} {t('library.characters')}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <FileText className="w-4 h-4" />
                    <span>{script.lines.length} {t('library.lines')}</span>
                  </div>
                </div>
                {script.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {script.tags.slice(0, 3).map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {script.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{script.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button onClick={() => handleScriptSelect(script)} className="w-full">
                  Rehearse
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

    </div>
  );
};