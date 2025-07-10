import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '../hooks/useAuth';
import { useScripts, GeminiScriptResponse } from '../hooks/useScripts';
import { SCRIPT_LANGUAGES } from '../types';
import { parseScript } from '../utils/scriptParser';

import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Label } from './ui/label';
import { Loader2, FileUp, Sparkles, AlertCircle, CheckCircle, Info } from 'lucide-react';

type ImportStep = 'upload' | 'metadata' | 'processing' | 'ai_assist' | 'complete' | 'error';

interface ScriptMetadata {
    title: string;
    author: string;
    language: string;
}

export const ScriptImport = ({ onScriptImported }: { onScriptImported: (playId: string) => void }) => {
    const { user } = useAuth();
    const { saveScript, saveAiAssistedScript } = useScripts(); 

    const [step, setStep] = useState<ImportStep>('upload');
    const [file, setFile] = useState<File | null>(null);
    const [fileContent, setFileContent] = useState<string>('');
    const [metadata, setMetadata] = useState<ScriptMetadata>({ title: '', author: '', language: 'en' });
    const [error, setError] = useState<string | null>(null);
    const [processingMessage, setProcessingMessage] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const selectedFile = acceptedFiles[0];
        if (selectedFile) {
            setFile(selectedFile);
            setMetadata(prev => ({ ...prev, title: selectedFile.name.replace(/\.[^/.]+$/, '') }));

            const reader = new FileReader();
            reader.onload = async (e) => {
                const content = e.target?.result as string;
                setFileContent(content);
                setStep('metadata');
            };
            reader.readAsText(selectedFile);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'text/plain': ['.txt'],
            'application/pdf': ['.pdf'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'image/jpeg': ['.jpg', '.jpeg'],
            'image/png': ['.png'],
        },
        maxFiles: 1,
    });

    const handleMetadataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setMetadata(prev => ({ ...prev, [name]: value }));
    };

    const handleLanguageChange = (value: string) => {
        setMetadata(prev => ({ ...prev, language: value }));
    };

    const handleStandardImport = async () => {
        if (!user || !file) return;
        setIsProcessing(true);
        setProcessingMessage('Parsing script structure...');
        setError(null);

        try {
            const { characters, lines } = await parseScript(file);

            if (characters.length === 0) {
                setProcessingMessage('Standard parsing failed. Trying AI assistance...');
                setStep('ai_assist');
                return;
            }

            setProcessingMessage('Saving script to your library...');
            const { data: savedScript, error: saveError } = await saveScript(
                user.id,
                metadata.title,
                fileContent,
                characters,
                lines,
                file.type,
                file.size,
                [],
                metadata.author,
                metadata.language
            );

            if (saveError) throw new Error(saveError);

            setProcessingMessage('Import successful!');
            setStep('complete');
            if (savedScript) {
                onScriptImported(savedScript.id);
            }

        } catch (err) {
            console.error("Standard import failed:", err);
            setProcessingMessage('Standard parsing failed. Trying AI assistance...');
            setStep('ai_assist');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleAiAssistImport = async () => {
        if (!user || !file) return;
        setIsProcessing(true);
        setError(null);
        setProcessingMessage('Engaging Gemini for advanced script conversion...');

        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                const base64File = reader.result as string;
                const fileData = base64File.split(',')[1];

                const geminiResponse = await callGeminiForConversion(fileData, file.type, metadata);

                if (!geminiResponse || !geminiResponse.script) {
                    throw new Error('AI conversion failed to produce a valid script.');
                }
                
                setProcessingMessage('AI analysis complete. Saving to database...');
                
                const { data: savedPlay, error: saveError } = await saveAiAssistedScript(user.id, geminiResponse);

                if (saveError) throw new Error(saveError);

                setProcessingMessage('AI-assisted import successful!');
                setStep('complete');
                if(savedPlay) {
                    onScriptImported(savedPlay.play_id);
                }
            };
            reader.onerror = (error) => {
                throw new Error("Could not read file for AI conversion.");
            };

        } catch (err) {
            console.error("AI-assisted import failed:", err);
            setError(err instanceof Error ? err.message : 'An unknown error occurred during AI conversion.');
            setStep('error');
        } finally {
            setIsProcessing(false);
        }
    };

    const callGeminiForConversion = async (base64Data: string, mimeType: string, scriptMetadata: ScriptMetadata): Promise<GeminiScriptResponse> => {
        setProcessingMessage('Analyzing script with Gemini...');
        
        const prompt = `
            You are an expert script analyst and formatter for a professional rehearsal application.
            A user has uploaded a file that could not be parsed automatically.
            Your task is to analyze the provided file content, convert it into a structured JSON format, and provide deep analysis.
            The user has provided the following metadata:
            - Title: ${scriptMetadata.title}
            - Author: ${scriptMetadata.author}
            - Language: ${scriptMetadata.language}

            **JSON Output Schema:**
            {
              "script": {
                "title": "...",
                "author": "...",
                "language": "...",
                "summary": "...",
                "scenes": [
                  {
                    "scene_number": 1,
                    "act_number": 1,
                    "setting": "...",
                    "lines": [
                      {
                        "line_number": 1,
                        "character": "...",
                        "dialogue": "...",
                        "ssml": "<speak>...</speak>"
                      }
                    ]
                  }
                ]
              },
              "characters": [
                {
                  "name": "...",
                  "analysis": {
                    "description": "...",
                    "age_group": "...",
                    "gender": "..."
                  },
                  "voice_profile": {
                    "google_voice_recommendation": "en-US-Wavenet-D",
                    "gemini_tts_prompt": "Speak as a weary old detective...",
                    "ssml_template": "<speak>...</speak>"
                  }
                }
              ]
            }
        `;

        const payload = {
            contents: [
                {
                    parts: [
                        { text: prompt },
                        { inline_data: { mime_type: mimeType, data: base64Data } }
                    ]
                }
            ],
            generation_config: {
                response_mime_type: "application/json",
            }
        };
        
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${apiKey}`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Gemini API error: ${response.status} ${errorBody}`);
        }

        const result = await response.json();
        return JSON.parse(result.candidates[0].content.parts[0].text);
    };

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Import New Script</CardTitle>
                <CardDescription>Follow the steps to add a new script to your library.</CardDescription>
            </CardHeader>
            <CardContent>
                {step === 'upload' && (
                    <div>
                        <div {...getRootProps()} className={`p-10 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${isDragActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}>
                            <input {...getInputProps()} />
                            <FileUp className="mx-auto h-12 w-12 text-muted-foreground" />
                            <p className="mt-2 text-sm text-muted-foreground">
                                {isDragActive ? 'Drop the file here...' : 'Drag & drop a file here, or click to select'}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">Supported: TXT, PDF, DOCX, JPG, PNG</p>
                        </div>
                        <Alert variant="default" className="mt-6">
                            <Info className="h-4 w-4" />
                            <AlertTitle>Formatting Rules for TXT Files</AlertTitle>
                            <AlertDescription>
                                <ul className="list-disc list-inside space-y-1 mt-2 text-sm">
                                    <li><strong>Character Names:</strong> Place in ALL CAPS on their own line.</li>
                                    <li><strong>Dialogue:</strong> Should follow directly after the character name line.</li>
                                </ul>
                            </AlertDescription>
                        </Alert>
                    </div>
                )}

                {step === 'metadata' && file && (
                    <div className="space-y-4 animate-in fade-in-50">
                        <h3 className="text-lg font-semibold">Script Details</h3>
                        <div>
                            <Label htmlFor="title">Title</Label>
                            <Input id="title" name="title" value={metadata.title} onChange={handleMetadataChange} required />
                        </div>
                        <div>
                            <Label htmlFor="author">Author</Label>
                            <Input id="author" name="author" value={metadata.author} onChange={handleMetadataChange} required />
                        </div>
                        <div>
                            <Label htmlFor="language">Language</Label>
                            <Select onValueChange={handleLanguageChange} defaultValue={metadata.language}>
                                <SelectTrigger id="language">
                                    <SelectValue placeholder="Select language" />
                                </SelectTrigger>
                                <SelectContent>
                                    {SCRIPT_LANGUAGES.map((lang) => (
                                        <SelectItem key={lang.code} value={lang.code}>
                                            {lang.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex justify-end space-x-2 pt-4">
                            <Button variant="outline" onClick={() => setStep('upload')}>Back</Button>
                            <Button onClick={handleStandardImport}>Import Script</Button>
                        </div>
                    </div>
                )}
                
                {(step === 'processing' || step === 'ai_assist') && (
                     <div className="text-center p-8 space-y-4">
                        <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
                        <p className="text-lg font-semibold">{processingMessage}</p>
                        {step === 'ai_assist' && !isProcessing && (
                             <Button onClick={handleAiAssistImport} size="lg">
                                <Sparkles className="mr-2 h-5 w-5" />
                                Start AI Conversion
                            </Button>
                        )}
                    </div>
                )}

                {step === 'complete' && (
                    <div className="text-center p-8 space-y-4">
                        <CheckCircle className="h-16 w-16 mx-auto text-green-500" />
                        <h3 className="text-2xl font-bold">Import Complete!</h3>
                        <Button onClick={() => onScriptImported('')} size="lg">Go to My Scripts</Button>
                    </div>
                )}

                {step === 'error' && (
                     <div className="text-center p-8 space-y-4">
                        <AlertCircle className="h-16 w-16 mx-auto text-destructive" />
                        <h3 className="text-2xl font-bold">Import Failed</h3>
                        <p className="text-muted-foreground">{error}</p>
                        <Button onClick={() => setStep('upload')} variant="outline">Try Again</Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};