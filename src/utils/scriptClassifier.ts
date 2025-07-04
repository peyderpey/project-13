import { ClassifiedLine, ContentType, ScriptStructure, Act, Scene, ParsedLine } from '../types';

export class ScriptClassifier {
  private static readonly PATTERNS = {
    // Character name patterns
    CHARACTER: /^([A-ZÇĞİÖŞÜ][A-ZÇĞİÖŞÜ\s]{2,}(?:\s*\([^)]*\))?)\s*$/,
    CHARACTER_WITH_COLON: /^([A-ZÇĞİÖŞÜa-zçğıöşü][A-ZÇĞİÖŞÜa-zçğıöşü\s]+):\s*(.+)$/,
    
    // Shared dialogue patterns
    SHARED_CHARACTER: /^([A-ZÇĞİÖŞÜ][A-ZÇĞİÖŞÜ\s,&]+)\s*$/,
    
    // Act and scene patterns
    ACT: /^(ACT|PERDE|BÖLÜM)\s+([IVX]+|\d+)/i,
    SCENE: /^(SCENE|SAHNE)\s+(\d+|[IVX]+)/i,
    
    // Stage directions
    STAGE_DIRECTION_PAREN: /^\s*\([^)]+\)\s*$/,
    STAGE_DIRECTION_BRACKET: /^\s*\[[^\]]+\]\s*$/,
    
    // Setting and at rise
    SETTING: /^(SETTING|SAHNE|MEKAN):\s*(.+)/i,
    AT_RISE: /^(AT RISE|PERDE AÇILIRKEN):\s*(.+)/i,
    
    // Title and cast
    TITLE: /^[A-ZÇĞİÖŞÜ][A-ZÇĞİÖŞÜa-zçğıöşü\s:'-]+$/,
    CAST: /^(CAST|CHARACTERS|OYUNCULAR|KARAKTERLER)/i,
    
    // Page markers to ignore
    PAGE_MARKER: /^\s*(\d+\s*[-–]\s*\d+\s*[-–]\s*\d+|\d+)\s*$/
  };

  static classifyScript(content: string): ScriptStructure {
    const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const classifiedLines = lines.map((line, index) => this.classifyLine(line, index, lines));
    
    return this.buildScriptStructure(classifiedLines, lines);
  }

  private static classifyLine(line: string, index: number, allLines: string[]): ClassifiedLine {
    // Skip page markers
    if (this.PATTERNS.PAGE_MARKER.test(line)) {
      return { type: 'unknown', content: line, confidence: 0 };
    }

    // Check for act headers
    const actMatch = line.match(this.PATTERNS.ACT);
    if (actMatch) {
      return { 
        type: 'act', 
        content: line, 
        confidence: 0.95,
        metadata: { formatting: 'header' }
      };
    }

    // Check for scene headers
    const sceneMatch = line.match(this.PATTERNS.SCENE);
    if (sceneMatch) {
      return { 
        type: 'scene', 
        content: line, 
        confidence: 0.95,
        metadata: { formatting: 'header' }
      };
    }

    // Check for setting
    const settingMatch = line.match(this.PATTERNS.SETTING);
    if (settingMatch) {
      return { 
        type: 'setting', 
        content: settingMatch[2], 
        confidence: 0.9 
      };
    }

    // Check for at rise
    const atRiseMatch = line.match(this.PATTERNS.AT_RISE);
    if (atRiseMatch) {
      return { 
        type: 'setting', 
        content: atRiseMatch[2], 
        confidence: 0.9,
        metadata: { formatting: 'at_rise' }
      };
    }

    // Check for cast list
    if (this.PATTERNS.CAST.test(line)) {
      return { type: 'cast', content: line, confidence: 0.9 };
    }

    // Check for stage directions in parentheses or brackets
    if (this.PATTERNS.STAGE_DIRECTION_PAREN.test(line) || this.PATTERNS.STAGE_DIRECTION_BRACKET.test(line)) {
      return { 
        type: 'direction', 
        content: line, 
        confidence: 0.85 
      };
    }

    // Check for character with colon (immediate dialogue)
    const colonMatch = line.match(this.PATTERNS.CHARACTER_WITH_COLON);
    if (colonMatch) {
      const characters = this.parseCharacterNames(colonMatch[1]);
      return {
        type: characters.length > 1 ? 'shared' : 'dialogue',
        content: colonMatch[2],
        confidence: 0.9,
        metadata: { 
          characters,
          isShared: characters.length > 1
        }
      };
    }

    // Check for character name (all caps)
    const characterMatch = line.match(this.PATTERNS.CHARACTER);
    if (characterMatch && index + 1 < allLines.length) {
      const nextLine = allLines[index + 1];
      // Verify next line is not another character name
      if (!this.PATTERNS.CHARACTER.test(nextLine) && !this.PATTERNS.ACT.test(nextLine) && !this.PATTERNS.SCENE.test(nextLine)) {
        const characters = this.parseCharacterNames(characterMatch[1]);
        return {
          type: 'character',
          content: characterMatch[1],
          confidence: 0.8,
          metadata: { 
            characters,
            isShared: characters.length > 1
          }
        };
      }
    }

    // Check for shared character names
    const sharedMatch = line.match(this.PATTERNS.SHARED_CHARACTER);
    if (sharedMatch && (line.includes(',') || line.includes('&'))) {
      const characters = this.parseCharacterNames(sharedMatch[1]);
      if (characters.length > 1) {
        return {
          type: 'character',
          content: sharedMatch[1],
          confidence: 0.75,
          metadata: { 
            characters,
            isShared: true
          }
        };
      }
    }

    // Check if it might be a title (early in document, title case)
    if (index < 5 && this.PATTERNS.TITLE.test(line) && line.length < 100) {
      return { type: 'title', content: line, confidence: 0.7 };
    }

    // Default to dialogue if it follows a character
    if (index > 0) {
      const prevClassified = this.classifyLine(allLines[index - 1], index - 1, allLines);
      if (prevClassified.type === 'character') {
        return { 
          type: 'dialogue', 
          content: line, 
          confidence: 0.6,
          metadata: { characters: prevClassified.metadata?.characters }
        };
      }
    }

    // Unknown content
    return { type: 'unknown', content: line, confidence: 0.1 };
  }

  private static parseCharacterNames(text: string): string[] {
    // Handle various separators for shared dialogue
    const separators = [',', '&', ' AND ', ' and ', ' VE ', ' ve '];
    let characters = [text.trim()];
    
    for (const sep of separators) {
      if (text.includes(sep)) {
        characters = text.split(sep).map(name => name.trim().replace(/[()]/g, ''));
        break;
      }
    }
    
    return characters.filter(name => name.length > 0);
  }

  private static buildScriptStructure(classifiedLines: ClassifiedLine[], originalLines: string[]): ScriptStructure {
    const structure: ScriptStructure = {
      title: 'Untitled Script',
      acts: []
    };

    // Find title
    const titleLine = classifiedLines.find(line => line.type === 'title');
    if (titleLine) {
      structure.title = titleLine.content;
    }

    // Find cast
    const castLines = classifiedLines.filter(line => line.type === 'cast');
    if (castLines.length > 0) {
      structure.cast = castLines.map(line => line.content);
    }

    let currentAct: Act | null = null;
    let currentScene: Scene | null = null;
    let lineCounter = 0;
    let currentCharacter: string | string[] | null = null;

    for (let i = 0; i < classifiedLines.length; i++) {
      const classified = classifiedLines[i];
      const originalLine = originalLines[i];

      switch (classified.type) {
        case 'act':
          currentAct = {
            act: classified.content,
            scenes: []
          };
          structure.acts.push(currentAct);
          currentScene = null;
          break;

        case 'scene':
          if (!currentAct) {
            currentAct = {
              act: 'ACT I',
              scenes: []
            };
            structure.acts.push(currentAct);
          }
          currentScene = {
            scene: classified.content,
            lines: []
          };
          currentAct.scenes.push(currentScene);
          break;

        case 'setting':
          if (currentScene) {
            if (classified.metadata?.formatting === 'at_rise') {
              currentScene.atRise = classified.content;
            } else {
              currentScene.setting = classified.content;
            }
          }
          break;

        case 'character':
          currentCharacter = classified.metadata?.characters || [classified.content];
          break;

        case 'dialogue':
          if (!currentScene) {
            if (!currentAct) {
              currentAct = {
                act: 'ACT I',
                scenes: []
              };
              structure.acts.push(currentAct);
            }
            currentScene = {
              scene: 'Scene 1',
              lines: []
            };
            currentAct.scenes.push(currentScene);
          }

          const dialogueLine: ParsedLine = {
            id: `line-${lineCounter++}`,
            type: classified.metadata?.isShared ? 'shared' : 'dialogue',
            character: currentCharacter || 'UNKNOWN',
            text: classified.content,
            lineNumber: lineCounter
          };

          currentScene.lines.push(dialogueLine);
          break;

        case 'shared':
          if (!currentScene) {
            if (!currentAct) {
              currentAct = {
                act: 'ACT I',
                scenes: []
              };
              structure.acts.push(currentAct);
            }
            currentScene = {
              scene: 'Scene 1',
              lines: []
            };
            currentAct.scenes.push(currentScene);
          }

          const sharedLine: ParsedLine = {
            id: `line-${lineCounter++}`,
            type: 'shared',
            character: classified.metadata?.characters || ['UNKNOWN'],
            text: classified.content,
            lineNumber: lineCounter
          };

          currentScene.lines.push(sharedLine);
          break;

        case 'direction':
          if (currentScene) {
            const directionLine: ParsedLine = {
              id: `line-${lineCounter++}`,
              type: 'direction',
              text: classified.content,
              lineNumber: lineCounter
            };
            currentScene.lines.push(directionLine);
          }
          break;
      }
    }

    return structure;
  }

  // Convert structured script back to simple format for compatibility
  static convertToSimpleFormat(structure: ScriptStructure): { characters: any[], lines: any[], title: string } {
    const characters: { [key: string]: number } = {};
    const lines: any[] = [];
    let lineId = 0;

    for (const act of structure.acts) {
      for (const scene of act.scenes) {
        for (const line of scene.lines) {
          if (line.type === 'dialogue' || line.type === 'shared') {
            const characterNames = Array.isArray(line.character) ? line.character : [line.character];
            
            for (const charName of characterNames) {
              if (charName && charName !== 'UNKNOWN') {
                characters[charName] = (characters[charName] || 0) + 1;
              }
            }

            // For shared lines, create separate entries for each character
            if (line.type === 'shared' && Array.isArray(line.character)) {
              for (const charName of line.character) {
                lines.push({
                  id: `line-${lineId++}`,
                  character: charName,
                  text: line.text || '',
                  lineNumber: lines.length + 1,
                  direction: line.direction
                });
              }
            } else {
              lines.push({
                id: `line-${lineId++}`,
                character: Array.isArray(line.character) ? line.character[0] : line.character,
                text: line.text || '',
                lineNumber: lines.length + 1,
                direction: line.direction
              });
            }
          }
        }
      }
    }

    const characterList = Object.entries(characters)
      .map(([name, lineCount]) => ({ name, lineCount }))
      .sort((a, b) => b.lineCount - a.lineCount);

    return {
      characters: characterList,
      lines,
      title: structure.title
    };
  }
}