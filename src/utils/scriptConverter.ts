// src/utils/scriptConverter.ts
import { SavedScript, ScriptLine } from '../hooks/useScripts';

/**
 * Converts a 'play' object from the database into the `SavedScript` format used by the frontend.
 */
export const convertPlayToSavedScript = (play: any): SavedScript => {
    const characters = (play.characters || []).map((char: any) => ({
        id: char.character_id,
        name: char.character_name,
        lineCount: char.line_count || 0,
        voiceSettings: char.voice_settings || {}
    }));
    const lines = convertScenesToLines(play.scenes || [], play.title);
    return {
        id: play.play_id,
        title: play.title,
        author: play.author || undefined,
        language: play.language || undefined,
        characters,
        lines,
        file_type: play.file_type || 'text',
        file_size: play.file_size || 0,
        created_at: play.created_at || '',
        updated_at: play.updated_at || '',
        is_public: play.is_public || false,
        tags: play.tags || []
    };
};

/**
 * Converts an array of scene objects from the database into a flat array of `ScriptLine` objects.
 */
function convertScenesToLines(scenes: any[], playTitle: string): ScriptLine[] {
    const lines: ScriptLine[] = [];
    let globalLineNumber = 1;
    const sortedScenes = scenes.sort((a, b) => (a.act_number || 1) - (b.act_number || 1) || (a.scene_number || 1) - (b.scene_number || 1));

    sortedScenes.forEach(scene => {
        if (scene.scene_content && typeof scene.scene_content === 'string') {
            // This is the corrected line.
            const sceneLines: string[] = scene.scene_content.split('
').map((line: string) => line.trim()).filter((line: string) => line.length > 0);
            
            sceneLines.forEach((lineText: string) => {
                const colonMatch = lineText.match(/^([A-Z\s]+):\s*(.+)$/);
                if (colonMatch) {
                    lines.push({
                        id: `${playTitle}-scene-${scene.scene_id}-line-${globalLineNumber}`,
                        character: colonMatch[1].trim(),
                        text: colonMatch[2].trim(),
                        lineNumber: globalLineNumber++,
                        actNumber: scene.act_number || 1,
                        sceneNumber: scene.scene_number || 1
                    });
                }
            });
        }
    });
    return lines;
}

/**
 * Converts a flat array of `ScriptLine` objects back into a structured array of scenes for database storage.
 */
export function convertLinesToScenes(lines: ScriptLine[]): any[] {
    const sceneGroups = new Map<string, { actNumber: number; sceneNumber: number; lines: ScriptLine[] }>();
    lines.forEach(line => {
        const key = `act-${line.actNumber || 1}-scene-${line.sceneNumber || 1}`;
        if (!sceneGroups.has(key)) {
            sceneGroups.set(key, { actNumber: line.actNumber || 1, sceneNumber: line.sceneNumber || 1, lines: [] });
        }
        sceneGroups.get(key)!.lines.push(line);
    });
    return Array.from(sceneGroups.values()).map(group => ({
        actNumber: group.actNumber,
        sceneNumber: group.sceneNumber,
        content: group.lines.map(line => `${line.character}: ${line.text}`).join('
')
    }));
}
