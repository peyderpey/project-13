import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { supabase } from '../lib/supabase'; // Your Supabase client
import { useAuth } from '../hooks/useAuth';
import { useScripts } from '../hooks/useScripts'; // Assuming you have this hook
import { SCRIPT_LANGUAGES, ScriptLanguageInfo } from '../types';

import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Label } from './ui/label';
import { Loader2, FileUp, Sparkles, AlertCircle, CheckCircle, Info } from 'lucide-react';

// --- Helper Types ---
type ImportStep = 'upload' | 'metadata' | 'processing' | 'ai_assist' | 'complete' | 'error';

interface ScriptMetadata {
    title: string;
    author: string;
    language: string;
}

// --- Main Component ---
export const ScriptImport = ({ onScriptImported }: { onScriptImported: (playId: string) => void }) => {
    const { user } = useAuth();
    // NOTE: You will need to implement `saveAiAssistedScript` in your useScripts hook.
    const { saveScript, saveAiAssistedScript } = useScripts(); 

    const [step, setStep] = useState<ImportStep>('upload');
    const [file, setFile] = useState<File | null>(null);
    const [fileContent, setFileContent] = useState<string>('');
    const [metadata, setMetadata] = useState<ScriptMetadata>({ title: '', author: '', language: 'en' });
    const [error, setError] = useState<string | null>(null);
    const [processingMessage, setProcessingMessage] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);

    // --- File Handling ---
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

    // --- Form & Submission Logic ---
    const handleMetadataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
            // This would use your existing scriptParser
            const { characters, lines } = await standardParse(fileContent);

            if (characters.length === 0) {
                // If standard parsing fails, offer AI assistance
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
            // Convert file to base64 to send to Gemini
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
                
                // You will need a new function in your useScripts hook for this
                const { data: savedPlay, error: saveError } = await saveAiAssistedScript(user.id, geminiResponse);

                if (saveError) throw new Error(saveError);

                setProcessingMessage('AI-assisted import successful!');
                setStep('complete');
                if(savedPlay) {
                    onScriptImported(savedPlay.id);
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

    // --- Gemini API Call ---
    const callGeminiForConversion = async (base64Data: string, mimeType: string, scriptMetadata: ScriptMetadata) => {
        setProcessingMessage('Analyzing script with Gemini...');
        
        const prompt = `
            You are an expert script analyst and formatter for a professional rehearsal application.
            A user has uploaded a file that could not be parsed automatically.
            Your task is to analyze the provided file content, convert it into a structured JSON format, and provide deep analysis.
            The user has provided the following metadata:
            - Title: ${scriptMetadata.title}
            - Author: ${scriptMetadata.author}
            - Language: ${scriptMetadata.language}

            **Instructions:**
            1.  **Analyze the file content:** This could be plain text, a PDF, or an image of a scanned document. Perform OCR if necessary.
            2.  **Structure the Script:** Extract all scenes, characters, and dialogue. Format the output into a valid JSON object.
            3.  **Enrich the Data:** Based on your analysis, provide the following:
                - A concise script summary.
                - Detailed analysis for each main character (personality, motivations, age group, gender).
                - For each character, create a detailed voice profile suitable for Google Cloud Text-to-Speech.
                - For each character, generate a specific, creative prompt for Gemini's own text-to-speech engine to control the speaking style.
                - For each line of dialogue, generate the corresponding SSML markup.
            4.  **Output Format:** Return ONLY the JSON object, with no other text or markdown formatting.

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
                    "gender": "...",
                    "personality_traits": ["...", "..."],
                    "motivation": "..."
                  },
                  "voice_profile": {
                    "google_voice_recommendation": "en-US-Wavenet-D",
                    "gemini_tts_prompt": "Speak as a weary old detective, with a gravelly voice and a cynical, world-weary tone.",
                    "ssml_template": "<speak><prosody rate='slow' pitch='-2st'>...</prosody></speak>"
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
                        {
                            inline_data: {
                                mime_type: mimeType,
                                data: base64Data
                            }
                        }
                    ]
                }
            ],
            generation_config: {
                response_mime_type: "application/json",
            }
        };
        
        // NOTE: The 'import.meta' warning is related to your build environment's target.
        // This is the standard way to access environment variables in Vite and should work correctly.
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


    // --- Render Logic ---
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
                                    <li><strong>Scene Headings:</strong> Use `SCENE 1` or `ACT I, SCENE 1`.</li>
                                    <li><strong>Stage Directions:</strong> Enclose in (parentheses).</li>
                                </ul>
                            </AlertDescription>
                        </Alert>
                    </div>
                )}

                {step === 'metadata' && file && (
                    <div className="space-y-4 animate-in fade-in-50">
                        <h3 className="text-lg font-semibold">Script Details</h3>
                        <p className="text-sm text-muted-foreground">Please provide some basic information about this script.</p>
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
                                            {lang.flag} {lang.name}
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
                        <p className="text-sm text-muted-foreground">This may take a few moments, especially for large files or AI conversion.</p>
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
                        <p className="text-muted-foreground">Your script has been successfully added to your library.</p>
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

// Dummy parse function - replace with your actual implementation
const standardParse = async (content: string) => {
    // In a real scenario, this would call your scriptParser.ts logic
    console.log("Attempting standard parse...");
    // For this example, we'll simulate a failure to trigger AI assist
    return { characters: [], lines: [] };
};
