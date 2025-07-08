import { Character, ScriptLine } from '../types';
import { FileExtractor } from './fileExtractor';
import { ScriptClassifier } from './scriptClassifier';

export const parseScript = async (
  fileOrContent: File | string, 
  title: string = 'Untitled Script',
  options: {
    includeStageDirections?: boolean;
    strictMode?: boolean;
    verboseLogging?: boolean;
  } = {}
): Promise<{ 
  characters: Character[], 
  lines: ScriptLine[],
  title: string 
}> => {
  let content: string;
  let extractedTitle = title;

  // Handle file input
  if (fileOrContent instanceof File) {
    try {
      const extracted = await FileExtractor.extractText(fileOrContent);
      content = extracted.text;
      extractedTitle = extracted.metadata?.title || fileOrContent.name.replace(/\.[^/.]+$/, "");
    } catch (error) {
      throw new Error(`Failed to extract content from file: ${error}`);
    }
  } else {
    content = fileOrContent;
  }

  console.log('Script content preview:', content.substring(0, 500));
  console.log('Total content length:', content.length);

  // Clean up the content
  content = cleanScriptContent(content);

  // For Shakespeare and classic play formats, use the enhanced parser
  console.log('Using enhanced Shakespeare parser...');
  return parseShakespeareScript(content, extractedTitle, options);
};

const cleanScriptContent = (content: string): string => {
  // Remove any BOM (Byte Order Mark)
  content = content.replace(/^\uFEFF/, '');
  
  // Normalize line endings
  content = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  // Remove excessive whitespace but preserve structure
  content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
  
  // Fix common encoding issues
  content = content.replace(/â€™/g, "'"); // Smart quote
  content = content.replace(/â€œ/g, '"'); // Smart quote open
  content = content.replace(/â€\x9D/g, '"'); // Smart quote close
  
  return content.trim();
};

const parseShakespeareScript = (content: string, title: string, options: {
  includeStageDirections?: boolean;
  strictMode?: boolean;
  verboseLogging?: boolean;
} = {}): { 
  characters: Character[], 
  lines: ScriptLine[],
  title: string 
} => {
  const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const scriptLines: ScriptLine[] = [];
  const characterCounts: { [key: string]: number } = {};
  
  console.log('Total non-empty lines to process:', lines.length);
  
  let currentCharacter = '';
  let pendingDialogue = '';
  let lineCounter = 0;
  let currentAct = 1;
  let currentScene = 1;
  let currentActTitle = 'ACT I';
  let currentSceneTitle = 'SCENE I';
  
  // Enhanced patterns for Shakespeare-style scripts
  const characterWithDialoguePattern = /^([A-Z][A-Z\s&]{1,20}):\s*(.+)$/; // More flexible for names like "FIRST CITIZEN"
  const standaloneCharacterPattern = /^([A-Z][A-Z\s&]{1,20}):?\s*$/; // Character name alone
  const stageDirectionPattern = /^\s*[\[\(].*[\]\)]\s*$|^Enter\s|^Exit\s|^Exeunt/i;
  const actPattern = /^(ACT)\s+([IVX]+|\d+)/i;
  const scenePattern = /^(SCENE)\s+([IVX]+|\d+)/i;
  const structuralPattern = /^(SETTING|AT RISE|PROLOGUE|EPILOGUE|Title:|Author:|Language:|SCENE:)/i;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip very short lines
    if (line.length < 3) continue;
    
    // Check for act headers
    const actMatch = line.match(actPattern);
    if (actMatch) {
      // Save any pending dialogue before switching acts
      if (currentCharacter && pendingDialogue) {
        savePendingDialogue(currentCharacter, pendingDialogue, characterCounts, scriptLines, lineCounter, currentAct, currentScene, currentActTitle, currentSceneTitle);
        lineCounter++;
        pendingDialogue = '';
      }
      
      currentAct = romanToNumber(actMatch[2]) || parseInt(actMatch[2]) || currentAct + 1;
      currentActTitle = line;
      currentScene = 1; // Reset scene when new act starts
      console.log('Found act:', currentAct, line);
      continue;
    }
    
    // Check for scene headers  
    const sceneMatch = line.match(scenePattern);
    if (sceneMatch) {
      // Save any pending dialogue before switching scenes
      if (currentCharacter && pendingDialogue) {
        savePendingDialogue(currentCharacter, pendingDialogue, characterCounts, scriptLines, lineCounter, currentAct, currentScene, currentActTitle, currentSceneTitle);
        lineCounter++;
        pendingDialogue = '';
      }
      
      currentScene = romanToNumber(sceneMatch[2]) || parseInt(sceneMatch[2]) || currentScene + 1;
      currentSceneTitle = line;
      console.log('Found scene:', currentScene, line);
      continue;
    }
    
    // Skip other structural elements
    if (structuralPattern.test(line)) {
      console.log('Skipping structural element:', line);
      continue;
    }
    
    // Handle stage directions based on options (default: always include)
    if (stageDirectionPattern.test(line)) {
      const includeStageDirections = options.includeStageDirections !== false; // Default to true
      console.log(`Found stage direction: ${line} (${includeStageDirections ? 'including' : 'skipping'})`);
      
      if (includeStageDirections && currentCharacter) {
        // Add stage direction as part of the current character's context
        if (pendingDialogue) {
          pendingDialogue += ' ' + line;
        } else {
          pendingDialogue = line;
        }
      }
      continue;
    }
    
    // Check for character with immediate dialogue (CHARACTER: dialogue)
    const immediateDialogueMatch = line.match(characterWithDialoguePattern);
    if (immediateDialogueMatch) {
      const character = immediateDialogueMatch[1].trim();
      const dialogue = immediateDialogueMatch[2].trim();
      
      // Validate character name (all caps, reasonable length, not common words)
      if (isValidCharacterName(character) && dialogue.length > 5) {
        // Save any pending dialogue from previous character first
        if (currentCharacter && pendingDialogue) {
          savePendingDialogue(currentCharacter, pendingDialogue, characterCounts, scriptLines, lineCounter, currentAct, currentScene, currentActTitle, currentSceneTitle);
          lineCounter++;
          pendingDialogue = '';
        }
        
        characterCounts[character] = (characterCounts[character] || 0) + 1;
        scriptLines.push({
          id: `line-${lineCounter++}`,
          character,
          text: dialogue,
          lineNumber: scriptLines.length + 1,
          actNumber: currentAct,
          sceneNumber: currentScene,
          actTitle: currentActTitle,
          sceneTitle: currentSceneTitle
        });
        console.log(`Found immediate dialogue - ${character}: ${dialogue.substring(0, 50)}...`);
        
        currentCharacter = character; // Update current character
        continue;
      }
    }
    
    // Check for standalone character name
    const standaloneMatch = line.match(standaloneCharacterPattern);
    if (standaloneMatch) {
      const potentialCharacter = standaloneMatch[1].trim().replace(':', '');
      
      if (isValidCharacterName(potentialCharacter)) {
        // Save any pending dialogue from previous character
        if (currentCharacter && pendingDialogue) {
          savePendingDialogue(currentCharacter, pendingDialogue, characterCounts, scriptLines, lineCounter, currentAct, currentScene, currentActTitle, currentSceneTitle);
          lineCounter++;
        }
        
        currentCharacter = potentialCharacter;
        pendingDialogue = '';
        console.log('Found standalone character name:', currentCharacter);
        continue;
      }
    }
    
    // If we have a current character and this line doesn't look like structure/directions
    if (currentCharacter && line.length > 2) {
      // Check if this might be dialogue continuation
      if (!standaloneCharacterPattern.test(line) && 
          !structuralPattern.test(line) &&
          !stageDirectionPattern.test(line) &&
          !line.match(/^[A-Z\s&]{3,}:/) && // Not another character with colon
          !line.match(/^[A-Z][A-Z\s&]{10,}$/)) { // Not a long all-caps line (likely character)
        
        if (pendingDialogue) {
          pendingDialogue += ' ' + line;
        } else {
          pendingDialogue = line;
        }
      }
    }
  }
  
  // Don't forget the last character's dialogue
  if (currentCharacter && pendingDialogue) {
    savePendingDialogue(currentCharacter, pendingDialogue, characterCounts, scriptLines, lineCounter, currentAct, currentScene, currentActTitle, currentSceneTitle);
  }
  
  // Create character list - filter out characters with very few lines
  const characters: Character[] = Object.entries(characterCounts)
    .filter(([name, count]) => {
      return count >= 1 && isValidCharacterName(name);
    })
    .map(([name, lineCount]) => ({ name, lineCount }))
    .sort((a, b) => b.lineCount - a.lineCount);
  
  console.log('Parsing results:', {
    totalLines: scriptLines.length,
    characters: characters.length,
    acts: Math.max(...scriptLines.map(l => l.actNumber || 1)),
    scenes: Math.max(...scriptLines.map(l => l.sceneNumber || 1)),
    characterList: characters.map(c => `${c.name} (${c.lineCount} lines)`)
  });
  
  // Validate results
  if (characters.length === 0) {
    throw new Error('No characters found in the script. Please ensure character names are in ALL CAPS and followed by a colon.');
  }
  
  if (scriptLines.length === 0) {
    throw new Error('No dialogue lines found in the script. Please check the formatting.');
  }
  
  return { characters, lines: scriptLines, title };
};

// Helper function to convert Roman numerals to numbers
const romanToNumber = (roman: string): number | null => {
  const romanNumerals: { [key: string]: number } = {
    'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5,
    'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10
  };
  return romanNumerals[roman.toUpperCase()] || null;
};

const isValidCharacterName = (name: string): boolean => {
  // Must be all uppercase
  if (name !== name.toUpperCase()) return false;
  
  // Reasonable length
  if (name.length < 3 || name.length > 25) return false;
  
  // Must start with a letter
  if (!name.match(/^[A-Z]/)) return false;
  
  // Exclude common non-character words
  const excludeWords = [
    'THE', 'AND', 'OR', 'BUT', 'TO', 'FOR', 'WITH', 'BY', 'AT', 'IN', 'ON',
    'ACT', 'SCENE', 'END', 'EXIT', 'ENTER', 'ALL', 'BOTH', 'EACH', 'EVERY',
    'SOME', 'ANY', 'MANY', 'MUCH', 'MORE', 'MOST', 'LESS', 'LEAST',
    'SETTING', 'PROLOGUE', 'EPILOGUE', 'CHORUS'
  ];
  
  if (excludeWords.includes(name)) return false;
  
  // Exclude lines that are clearly stage directions or descriptions
  if (name.includes('ENTER') || name.includes('EXIT') || name.includes('SCENE')) return false;
  
  return true;
};

const savePendingDialogue = (
  character: string, 
  dialogue: string, 
  characterCounts: { [key: string]: number }, 
  scriptLines: ScriptLine[], 
  lineCounter: number,
  actNumber: number,
  sceneNumber: number,
  actTitle: string,
  sceneTitle: string
) => {
  const trimmedDialogue = dialogue.trim();
  if (trimmedDialogue.length > 0) {
    characterCounts[character] = (characterCounts[character] || 0) + 1;
    scriptLines.push({
      id: `line-${lineCounter}`,
      character,
      text: trimmedDialogue,
      lineNumber: scriptLines.length + 1,
      actNumber,
      sceneNumber,
      actTitle,
      sceneTitle
    });
    console.log(`Saved pending dialogue - ${character}: ${trimmedDialogue.substring(0, 50)}...`);
  }
};

export const calculateAccuracy = (
  expected: string, 
  actual: string, 
  level: 'exact' | 'semantic' | 'loose'
): number => {
  // Enhanced normalization for better comparison
  const normalizeText = (text: string) => {
    return text
      .toLowerCase()
      // Handle Unicode apostrophes and quotes
      .replace(/['']/g, "'")
      .replace(/[""]/g, '"')
      // Normalize Turkish characters for comparison
      .replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i')
      .replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u')
      // Remove punctuation except apostrophes in contractions
      .replace(/[^\w\s']/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const expectedNorm = normalizeText(expected);
  const actualNorm = normalizeText(actual);

  console.log('Accuracy calculation:', { expected: expectedNorm, actual: actualNorm, level });

  switch (level) {
    case 'exact':
      return expectedNorm === actualNorm ? 100 : 0;
    
    case 'semantic': {
      const expectedWords = expectedNorm.split(' ').filter(w => w.length > 2);
      const actualWords = actualNorm.split(' ').filter(w => w.length > 2);
      
      if (expectedWords.length === 0) return actualWords.length === 0 ? 100 : 0;
      
      let matches = 0;
      expectedWords.forEach(word => {
        if (actualWords.some(actualWord => 
          actualWord.includes(word) || word.includes(actualWord) ||
          levenshteinDistance(word, actualWord) <= Math.max(1, Math.floor(word.length * 0.2))
        )) {
          matches++;
        }
      });
      
      return Math.round((matches / expectedWords.length) * 100);
    }
    
    case 'loose': {
      const similarity = calculateStringSimilarity(expectedNorm, actualNorm);
      return Math.round(similarity * 100);
    }
    
    default:
      return 0;
  }
};

const calculateStringSimilarity = (str1: string, str2: string): number => {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
};

const levenshteinDistance = (str1: string, str2: string): number => {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }

  return matrix[str2.length][str1.length];
};