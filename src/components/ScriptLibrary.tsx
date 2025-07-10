import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  UploadCloud,
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { ScriptImport } from './ScriptImport';
import { SpeechSetup } from './SpeechSetup';

interface ScriptLibraryProps {
  onScriptSelect: (characters: Character[], lines: ScriptLine[], title: string, language: string) => void;
}

export const ScriptLibrary: React.FC<ScriptLibraryProps> = ({ onScriptSelect }) => {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const { userScripts, demoScripts, fetchUserScripts, fetchDemoScripts, loading: scriptsLoading } = useScripts();
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [hasInitialFetch, setHasInitialFetch] = useState(false);
  const [isImportSheetOpen, setIsImportSheetOpen] = useState(false);
  
  const { settings } = useAppSettings();
  const deviceId = settings.deviceId;
  const [showSpeechSetup, setShowSpeechSetup] = useState(false);
  const [pendingScript, setPendingScript] = useState<any>(null);

  function shouldSkipSpeechSetup() {
    if (!isAuthenticated) return false;
    return localStorage.getItem(`skipSpeechSetup-${deviceId}`) === 'true';
  }

  const handleRehearse = (script: any) => {
    if (shouldSkipSpeechSetup()) {
      onScriptSelect(script.characters, script.lines, script.title, script.language || 'en');
    } else {
      setPendingScript(script);
      setShowSpeechSetup(true);
    }
  };
  
  const handleSpeechSetupContinue = () => {
    setShowSpeechSetup(false);
    if (pendingScript) {
      onScriptSelect(
        pendingScript.characters,
        pendingScript.lines,
        pendingScript.title,
        pendingScript.language || 'en'
      );
      setPendingScript(null);
    }
  };

  const handleSpeechSetupCancel = () => {
    setShowSpeechSetup(false);
    setPendingScript(null);
  };
  
  const handleImportComplete = () => {
    setIsImportSheetOpen(false);
    if (user?.id) {
        fetchUserScripts(user.id);
    }
  };
  
  const handleScriptSelect = (script: any) => {
    onScriptSelect(
      script.characters, 
      script.lines, 
      script.title, 
      script.language || 'en'
    );
  };

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
        setConnectionStatus('disconnected');
      }
    };
    checkConnection();
    fetchDemoScripts();
  }, [fetchDemoScripts]);

  useEffect(() => {
    if (isAuthenticated && user?.id && connectionStatus === 'connected' && !hasInitialFetch) {
      setHasInitialFetch(true);
      fetchUserScripts(user.id);
    } else if (!isAuthenticated) {
      setHasInitialFetch(false);
    }
  }, [user?.id, isAuthenticated, connectionStatus, hasInitialFetch, fetchUserScripts]);

  function getScriptProgress(script: SavedScript) {
    let bestProgress = null;
    
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
          
          if (!bestProgress || (percent < 100 && percent > (bestProgress.percent || 0))) {
            bestProgress = { percent, quality: '—', key, character: char.name };
          }
        } catch {}
      }
    }
    
    return bestProgress || { percent: 0, quality: null, key: null, character: null };
  }
  
  let inProgressScript = null;
  let inProgressMeta: any = null;
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

  const myScripts = isAuthenticated
    ? userScripts.filter(s => !inProgressScript || s.id !== inProgressScript.id)
    : [];

  return (
    <>
      {showSpeechSetup && (
        <SpeechSetup
          isDemoUser={!isAuthenticated}
          onContinue={handleSpeechSetupContinue}
          onCancel={handleSpeechSetupCancel}
        />
      )}

      <Sheet open={isImportSheetOpen} onOpenChange={setIsImportSheetOpen}>
        <SheetContent className="w-full max-w-full sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>{t('upload.title')}</SheetTitle>
            <SheetDescription>{t('upload.subtitle')}</SheetDescription>
          </SheetHeader>
          <div className="py-4">
            <ScriptImport onScriptImported={handleImportComplete} />
          </div>
        </SheetContent>
      </Sheet>

      <div className="relative max-w-6xl mx-auto pb-24">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            {t('library.title')}
          </h2>
          <p className="text-muted-foreground">
            {t('library.subtitle')}
          </p>
          
          {connectionStatus !== 'connected' && (
            <Alert variant={connectionStatus === 'disconnected' ? 'destructive' : 'default'} className="my-4">
              {connectionStatus === 'disconnected' ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4 animate-pulse" />}
              <AlertDescription>
                 {connectionStatus === 'disconnected' ? 'Connection Error. Please check your internet.' : 'Checking Connection...'}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {inProgressScript && inProgressMeta && (
           <div className="mb-10">
            <h3 className="text-xl font-semibold mb-3">{t('library.continueRehearsing')}</h3>
            <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary">
               <CardHeader className="flex flex-row items-center justify-between">
                 <div>
                    <CardTitle>{inProgressScript.title}</CardTitle>
                    {inProgressMeta.character && <CardDescription>{t('practice.subtitle')} {inProgressMeta.character}</CardDescription>}
                 </div>
                 <Button onClick={() => handleScriptSelect(inProgressScript)} size="lg">
                    <PlayCircle className="mr-2 h-5 w-5"/> {t('library.continue')}
                 </Button>
               </CardHeader>
               <CardContent>
                 <div className="text-sm text-muted-foreground">{t('library.progress')}: {inProgressMeta.percent}%</div>
               </CardContent>
            </Card>
          </div>
        )}

        {isAuthenticated && (
          <div className="mb-10">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">{t('library.myScripts')}</h2>
                <Button onClick={() => setIsImportSheetOpen(true)}>
                    <UploadCloud className="mr-2 h-4 w-4" /> Import Script
                </Button>
            </div>
            {scriptsLoading && !hasInitialFetch && <p>Loading your scripts...</p>}
            {!scriptsLoading && myScripts.length === 0 && (
                <Card className="text-center p-8 border-dashed">
                    <CardTitle>{t('library.noScripts')}</CardTitle>
                    <CardDescription className="mt-2 mb-4">{t('library.uploadFirst')}</CardDescription>
                    <Button onClick={() => setIsImportSheetOpen(true)}>Import First Script</Button>
                </Card>
            )}
            {myScripts.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myScripts.map(script => {
                    const meta = getScriptProgress(script);
                    return (
                    <Card key={script.id} className="group hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
                        <CardHeader>
                        <CardTitle>{script.title}</CardTitle>
                        {script.author && <CardDescription>{script.author}</CardDescription>}
                        </CardHeader>
                        <CardContent>
                          <div className="text-sm text-muted-foreground mb-2">Progress: {meta.percent}%</div>
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
                          <Button onClick={() => handleRehearse(script)} className="w-full">
                            Rehearse
                          </Button>
                        </CardFooter>
                    </Card>
                    );
                })}
                </div>
            )}
          </div>
        )}

        <div className="mb-10">
          <h2 className="text-2xl font-bold mb-4">{t('library.demoScripts')}</h2>
          {demoScripts.length === 0 && !scriptsLoading && (
            <p>No demo scripts available at the moment.</p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {demoScripts.map(script => (
              <Card key={script.id} className="group hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
                <CardHeader>
                  <CardTitle>{script.title}</CardTitle>
                  {script.author && <CardDescription>{script.author}</CardDescription>}
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
                </CardContent>
                <CardFooter>
                  <Button onClick={() => handleRehearse(script)} className="w-full">
                    Rehearse
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
        
      </div>
    </>
  );
};