import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase'; // Your Supabase client
import { useAuth } from '@/hooks/useAuth';
import { useScripts } from '@/hooks/useScripts'; // Your data-fetching hooks
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Loader2, User, Save, Sparkles, Volume2, ArrowLeft, ArrowRight } from 'lucide-react';

// --- Type Definitions ---
// These types should ideally be in a central types file (e.g., src/types/index.ts)
interface CharacterProfile {
    character_id: string;
    name: string;
    gender?: string;
    age_group?: string;
    analysis?: {
        description: string;
        motivation: string;
        personality_traits: string[];
    };
    voice_profile?: {
        google_voice_recommendation: string;
        gemini_tts_prompt: string;
        ssml_template: string;
    };
}

interface GoogleVoice {
    name: string;
    ssmlGender: string;
    languageCodes: string[];
}

interface CharacterReviewProps {
    playId: string;
    onReviewComplete: (playId: string) => void;
    onBack: () => void;
}

// --- Main Component ---
export const CharacterReview: React.FC<CharacterReviewProps> = ({ playId, onReviewComplete, onBack }) => {
    const { user } = useAuth();
    const { getCharactersForPlay, updateCharacterProfile, getAvailableGoogleVoices } = useScripts(); 
    
    const [characters, setCharacters] = useState<CharacterProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [availableVoices, setAvailableVoices] = useState<GoogleVoice[]>([]);

    // Fetch initial character data and available voices on component mount
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // Fetch both characters and voices concurrently for better performance
                const [fetchedCharacters, fetchedVoices] = await Promise.all([
                    getCharactersForPlay(playId),
                    getAvailableGoogleVoices('en-US') // Assuming 'en-US' for now; this could be dynamic
                ]);
                
                setCharacters(fetchedCharacters || []);
                setAvailableVoices(fetchedVoices || []);

            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
                setError(`Failed to load character data: ${errorMessage}`);
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [playId, getCharactersForPlay, getAvailableGoogleVoices]);

    // Handler for updating any field for a character
    const handleCharacterChange = (charId: string, section: keyof CharacterProfile | null, field: string, value: string | string[]) => {
        setCharacters(prevChars =>
            prevChars.map(char => {
                if (char.character_id === charId) {
                    const updatedChar = { ...char };
                    if (section) {
                        // Ensure nested objects exist before updating
                        updatedChar[section] = { ...(updatedChar[section] || {}), [field]: value };
                    } else {
                        updatedChar[field as keyof CharacterProfile] = value;
                    }
                    return updatedChar;
                }
                return char;
            })
        );
    };

    // Save all changes and proceed
    const handleSaveAndContinue = async () => {
        setIsSaving(true);
        setError(null);
        try {
            // Use Promise.all to save all character updates concurrently
            await Promise.all(
                characters.map(char => 
                    updateCharacterProfile(char.character_id, {
                        character_name: char.name,
                        gender: char.gender,
                        age_group: char.age_group,
                        analysis: char.analysis,
                        voice_profile: char.voice_profile,
                    })
                )
            );
            onReviewComplete(playId); // Proceed to the next step
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Could not save changes.";
            setError(`Failed to save changes: ${errorMessage}`);
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    // A simple function to test the selected voice using the browser's built-in TTS
    const playTestAudio = (voiceName: string, text: string) => {
        if (!window.speechSynthesis) {
            alert("Sorry, your browser doesn't support text-to-speech.");
            return;
        }
        window.speechSynthesis.cancel(); // Stop any previous speech
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Find a matching voice from the browser's list
        const voice = window.speechSynthesis.getVoices().find(v => v.name === voiceName);
        if (voice) {
            utterance.voice = voice;
        }
        utterance.lang = 'en-US'; // Hardcoded for now
        window.speechSynthesis.speak(utterance);
    };


    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    return (
        <Card className="w-full max-w-4xl mx-auto">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-6 w-6 text-primary" />
                        Finalize Your Cast
                    </CardTitle>
                    <Button onClick={onBack} variant="ghost" size="sm">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                </div>
                <CardDescription>
                    Review the AI-generated character details. Make any necessary corrections before you start rehearsing.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {error && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
                
                <Accordion type="single" collapsible defaultValue={characters[0]?.character_id} className="w-full space-y-4">
                    {characters.map(char => (
                        <AccordionItem value={char.character_id} key={char.character_id} className="border rounded-lg">
                            <AccordionTrigger className="p-4 hover:no-underline">
                                <div className="flex items-center gap-4 w-full">
                                    <User className="h-6 w-6 text-muted-foreground" />
                                    <Input
                                        value={char.character_name}
                                        onChange={(e) => handleCharacterChange(char.character_id, null, 'character_name', e.target.value)}
                                        className="text-lg font-semibold border-none shadow-none p-0 h-auto focus-visible:ring-0 bg-transparent"
                                        onClick={(e) => e.stopPropagation()} // Prevent accordion from closing when clicking input
                                    />
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="p-6 pt-0 space-y-6 bg-muted/20">
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <Label htmlFor={`gender-${char.character_id}`}>Gender</Label>
                                        <Input id={`gender-${char.character_id}`} value={char.gender || ''} onChange={(e) => handleCharacterChange(char.character_id, null, 'gender', e.target.value)} placeholder="e.g., Male, Female, Non-binary" />
                                    </div>
                                    <div>
                                        <Label htmlFor={`age-${char.character_id}`}>Age Group</Label>
                                        <Input id={`age-${char.character_id}`} value={char.age_group || ''} onChange={(e) => handleCharacterChange(char.character_id, null, 'age_group', e.target.value)} placeholder="e.g., Young Adult, Middle-aged" />
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor={`desc-${char.character_id}`}>AI-Generated Description</Label>
                                    <Textarea id={`desc-${char.character_id}`} value={char.analysis?.description || 'No description generated.'} onChange={(e) => handleCharacterChange(char.character_id, 'analysis', 'description', e.target.value)} rows={4} placeholder="A brief description of the character's personality and motivations." />
                                </div>

                                <div className="p-4 bg-background rounded-lg space-y-4 border">
                                    <h4 className="font-semibold text-base">Voice & Speech Profile</h4>
                                     <div>
                                        <Label htmlFor={`gemini-prompt-${char.character_id}`}>Gemini TTS Prompt</Label>
                                        <Textarea id={`gemini-prompt-${char.character_id}`} value={char.voice_profile?.gemini_tts_prompt || ''} onChange={(e) => handleCharacterChange(char.character_id, 'voice_profile', 'gemini_tts_prompt', e.target.value)} placeholder="e.g., Speak as a wise old king with a hint of sadness."/>
                                    </div>
                                    <div className="flex items-end gap-2">
                                        <div className="flex-grow">
                                            <Label htmlFor={`google-voice-${char.character_id}`}>Google Cloud Voice</Label>
                                            <Select
                                                value={char.voice_profile?.google_voice_recommendation}
                                                onValueChange={(value) => handleCharacterChange(char.character_id, 'voice_profile', 'google_voice_recommendation', value)}
                                            >
                                                <SelectTrigger id={`google-voice-${char.character_id}`}>
                                                    <SelectValue placeholder="Select a voice" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {availableVoices.map((voice: GoogleVoice) => (
                                                        <SelectItem key={voice.name} value={voice.name}>
                                                            {voice.name} ({voice.ssmlGender})
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <Button variant="outline" size="icon" onClick={() => playTestAudio(char.voice_profile?.google_voice_recommendation || '', "Hello, this is a test of my voice.")}>
                                            <Volume2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                                
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>

                <div className="flex justify-end mt-8">
                    <Button onClick={handleSaveAndContinue} disabled={isSaving || isLoading}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save & Continue
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};
