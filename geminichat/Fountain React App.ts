import React, { useState, useEffect, useCallback, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, addDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';

// Global Firebase variables (provided by the Canvas environment)
declare const __app_id: string | undefined;
declare const __firebase_config: string | undefined;
declare const __initial_auth_token: string | undefined;

// --- Start of Fountain Parser Code (integrated from fountainParser.ts) ---
// Define types for the parser output
export interface ScriptToken {
  type: string;
  text: string;
  scene_number?: string;
  character?: string;
  parenthetical?: string;
  dual?: 'left' | 'right'; // Added for dual dialogue
  depth?: number; // Added for sections
}

export interface FountainParseResult {
  title?: string;
  html: {
    title_page?: string;
    script: string;
  };
  tokens?: ScriptToken[];
}

const d = {
  title_page: /^((?:title|credit|author[s]?|source|notes|draft date|date|contact|copyright)\:)/gim,
  scene_heading: /^((?:\*{0,3}_?)?(?:(?:int|ext|est|i\/e)[. ]).+)|^(?:\.(?!\.+))(.+)/i,
  scene_number: /( *#(.+)# *)/,
  transition: /^((?:FADE (?:TO BLACK|OUT)|CUT TO BLACK)\.|.+ TO\:)|^(?:> *)(.+)/,
  dialogue: /^([A-Z*_]+[0-9A-Z (._\-')]*)(\^?)?(?:\n(?!\n+))([\s\S]+)/,
  parenthetical: /^(\(.+\))$/,
  action: /^(.+)/g,
  centered: /^(?:> *)(.+)(?: *<)(\n.+)*/g,
  section: /^(#+)(?: *)(.*)/,
  synopsis: /^(?:\=(?!\=+) *)(.*)/,
  note: /^(?:\[{2}(?!\[+))(.+)(?:\]{2}(?!\[+))$/,
  note_inline: /(?:\[{2}(?!\[+))([\s\S]+?)(?:\]{2}(?!\[+))/g,
  boneyard: /(^\/\*|^\*\/)$/g,
  page_break: /^\={3,}$/,
  line_break: /^ {2}$/,
  emphasis: /(_|\*{1,3}|_\*{1,3}|\*{1,3}_)(.+)(_|\*{1,3}|_\*{1,3}|\*{1,3}_)/g,
  bold_italic_underline: /(_{1}\*{3}(?=.+\*{3}_{1})|\*{3}_{1}(?=.+_{1}\*{3}))(.+?)(\*{3}_{1}|_{1}\*{3})/g,
  bold_underline: /(_{1}\*{2}(?=.+\*{2}_{1})|\*{2}_{1}(?=.+_{1}\*{2}))(.+?)(\*{2}_{1}|_{1}\*{2})/g,
  italic_underline: /(?:_{1}\*{1}(?=.+\*{1}_{1})|\*{1}_{1}(?=.+_{1}\*{1}))(.+?)(\*{1}_{1}|_{1}\*{1})/g,
  bold_italic: /(\*{3}(?=.+\*{3}))(.+?)(\*{3})/g,
  bold: /(\*{2}(?=.+\*{2}))(.+?)(\*{2})/g,
  italic: /(\*{1}(?=.+\*{1}))(.+?)(\*{1})/g,
  underline: /(_{1}(?=.+_{1}))(.+?)(_{1})/g,
  splitter: /\n{2,}/g,
  cleaner: /^\n+|\n+$/,
  standardizer: /\r\n|\r/g,
  whitespacer: /^\t+|^ {3,}/gm
};

const n = {
  note: "<!-- $1 -->",
  line_break: "<br />",
  bold_italic_underline: '<span class="bold italic underline">$2</span>',
  bold_underline: '<span class="bold underline">$2</span>',
  italic_underline: '<span class="italic underline">$2</span>',
  bold_italic: '<span class="bold italic">$2</span>',
  bold: '<span class="bold">$2</span>',
  italic: '<span class="italic">$2</span>',
  underline: '<span class="underline">$2</span>',
  lexer: function(c: string): string {
    if (c) {
      const j = "underline,italic,bold,bold_italic,italic_underline,bold_underline,bold_italic_underline".split(",");
      let k = j.length;
      let g, b;
      c = c.replace(d.note_inline, n.note).replace(/\\\*/g, "[star]").replace(/\\_/g, "[underline]").replace(/\n/g, n.line_break);
      while (k--) {
        g = j[k];
        b = d[g as keyof typeof d]; // Type assertion for dynamic property access
        if (b.test(c)) {
          c = c.replace(b, n[g as keyof typeof n]); // Type assertion for dynamic property access
        }
      }
      return c.replace(/\[star\]/g, "*").replace(/\[underline\]/g, "_").trim();
    }
    return c;
  }
};

const fountain = {
  parse: function(c: string, j?: boolean | ((result: FountainParseResult) => void), k?: (result: FountainParseResult) => void): FountainParseResult | void {
    let g: string | undefined; // title
    let returnTokens = false; // Flag to determine if tokens should be returned

    // Handle overloaded function signature: parse(text, callback) or parse(text, returnTokens, callback)
    if (typeof j === 'function') {
      k = j;
      j = false; // Default to not returning tokens if only callback is provided
    }
    if (typeof j === 'boolean') {
      returnTokens = j;
    }

    let b = c.replace(d.boneyard, "\n$1\n").replace(d.standardizer, "\n").replace(d.cleaner, "").replace(d.whitespacer, "").split(d.splitter);
    let f = b.length;
    let e, a, l, i, h, m: boolean | undefined, tokens: ScriptToken[] = [];

    while (f--) {
      e = b[f];
      if (d.title_page.test(e)) {
        a = e.replace(d.title_page, "\n$1").split(d.splitter).reverse();
        i = 0;
        for (h = a.length; i < h; i++) {
          l = a[i].replace(d.cleaner, "").split(/\:\n*/);
          tokens.push({ type: l[0].trim().toLowerCase().replace(" ", "_"), text: l[1].trim() });
        }
      } else if (a = e.match(d.scene_heading)) {
        if (e.indexOf("  ") !== e.length - 2) { // Changed from '  ' to '  ' for consistency
          if (a = e.match(d.scene_number)) {
            a = a[2];
            e = e.replace(d.scene_number, "");
          }
          tokens.push({ type: "scene_heading", text: e, scene_number: a || undefined });
        }
      } else if (a = e.match(d.centered)) {
        tokens.push({ type: "centered", text: a[0].replace(/>|</g, "") });
      } else if (a = e.match(d.transition)) {
        tokens.push({ type: "transition", text: a[1] || a[2] });
      } else if ((a = e.match(d.dialogue)) && a[1].indexOf("  ") !== a[1].length - 2) { // Changed from '  ' to '  '
        a[2] && tokens.push({ type: "dual_dialogue_end" });
        tokens.push({ type: "dialogue_end" });
        l = a[3].split(/(\(.+\))(?:\n+)/).reverse();
        i = 0;
        for (h = l.length; i < h; i++) {
          e = l[i];
          if (e.length > 0) {
            tokens.push({ type: d.parenthetical.test(e) ? "parenthetical" : "dialogue", text: e });
          }
        }
        tokens.push({ type: "character", text: a[1].trim() });
        tokens.push({ type: "dialogue_begin", dual: a[2] ? "right" : m ? "left" : undefined });
        m && tokens.push({ type: "dual_dialogue_begin" });
        m = a[2] ? true : false;
      } else if ((a = e.match(d.section))) {
        tokens.push({ type: "section", text: a[2], depth: a[1].length });
      } else if ((a = e.match(d.synopsis))) {
        tokens.push({ type: "synopsis", text: a[1] });
      } else if ((a = e.match(d.note))) {
        tokens.push({ type: "note", text: a[1] });
      } else if ((a = e.match(d.boneyard))) {
        tokens.push({ type: "/" === a[0][0] ? "boneyard_begin" : "boneyard_end" });
      } else if (d.page_break.test(e)) {
        tokens.push({ type: "page_break" });
      } else if (d.line_break.test(e)) {
        tokens.push({ type: "line_break" });
      } else {
        tokens.push({ type: "action", text: e });
      }
    }

    let m_length = tokens.length;
    let f_html: string[] = []; // title_page html
    let a_html: string[] = []; // script html
    let b_token: ScriptToken;

    for (let idx = 0; idx < m_length; idx++) {
      b_token = tokens[idx];
      b_token.text = n.lexer(b_token.text);

      switch (b_token.type) {
        case "title":
          f_html.push("<h1>" + b_token.text + "</h1>");
          g = b_token.text.replace("<br />", " ").replace(/<(?:.|\n)*?>/g, "");
          break;
        case "credit":
          f_html.push('<p class="credit">' + b_token.text + "</p>");
          break;
        case "author":
        case "authors":
          f_html.push('<p class="authors">' + b_token.text + "</p>");
          break;
        case "source":
          f_html.push('<p class="source">' + b_token.text + "</p>");
          break;
        case "notes":
          f_html.push('<p class="notes">' + b_token.text + "</p>");
          break;
        case "draft_date":
          f_html.push('<p class="draft-date">' + b_token.text + "</p>");
          break;
        case "date":
          f_html.push('<p class="date">' + b_token.text + "</p>");
          break;
        case "contact":
          f_html.push('<p class="contact">' + b_token.text + "</p>");
          break;
        case "copyright":
          f_html.push('<p class="copyright">' + b_token.text + "</p>");
          break;
        case "scene_heading":
          a_html.push("<h3" + (b_token.scene_number ? ' id="' + b_token.scene_number + '">' : ">") + b_token.text + "</h3>");
          break;
        case "transition":
          a_html.push("<h2>" + b_token.text + "</h2>");
          break;
        case "dual_dialogue_begin":
          a_html.push('<div class="dual-dialogue">');
          break;
        case "dialogue_begin":
          a_html.push('<div class="dialogue' + (b_token.dual ? " " + b_token.dual : "") + '">');
          break;
        case "character":
          a_html.push("<h4>" + b_token.text + "</h4>");
          break;
        case "parenthetical":
          a_html.push('<p class="parenthetical">' + b_token.text + "</p>");
          break;
        case "dialogue":
          a_html.push("<p>" + b_token.text + "</p>");
          break;
        case "dialogue_end":
          a_html.push("</div> ");
          break;
        case "dual_dialogue_end":
          a_html.push("</div> ");
          break;
        case "section":
          a_html.push('<p class="section" data-depth="' + b_token.depth + '">' + b_token.text + "</p>");
          break;
        case "synopsis":
          a_html.push('<p class="synopsis">' + b_token.text + "</p>");
          break;
        case "note":
          a_html.push("<!-- " + b_token.text + "-->");
          break;
        case "boneyard_begin":
          a_html.push("<!-- ");
          break;
        case "boneyard_end":
          a_html.push(" -->");
          break;
        case "action":
          a_html.push("<p>" + b_token.text + "</p>");
          break;
        case "centered":
          a_html.push('<p class="centered">'+b_token.text+"</p>");
          break;
        case "page_break":
          a_html.push("<hr />");
          break;
        case "line_break":
          a_html.push("<br />");
          break;
      }
    }

    const result: FountainParseResult = {
      title: g,
      html: {
        title_page: f_html.join(""),
        script: a_html.join("")
      },
      tokens: returnTokens ? tokens.reverse() : undefined // Reverse tokens back to original order if requested
    };

    if (typeof k === 'function') {
      k(result);
      return; // If a callback is provided, return void
    }
    return result; // Otherwise, return the result directly
  }
};
// --- End of Fountain Parser Code ---


const App: React.FC = () => {
  const [isDocked, setIsDocked] = useState(true);
  const [isDimmed, setIsDimmed] = useState(false);
  const [dpi, setDpi] = useState(100);
  const [scriptTitle, setScriptTitle] = useState('Untitled');
  const [scriptHtml, setScriptHtml] = useState<string>('');
  const [titlePageHtml, setTitlePageHtml] = useState<string>('');
  const [notification, setNotification] = useState<string | null>(null);
  const [fileApiSupported, setFileApiSupported] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Firestore state
  const [db, setDb] = useState<any>(null);
  const [auth, setAuth] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Initialize Firebase and Auth
  useEffect(() => {
    const initializeFirebase = async () => {
      try {
        const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
        const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};

        const app = initializeApp(firebaseConfig);
        const firestoreDb = getFirestore(app);
        const firebaseAuth = getAuth(app);

        setDb(firestoreDb);
        setAuth(firebaseAuth);

        onAuthStateChanged(firebaseAuth, async (user) => {
          if (user) {
            setUserId(user.uid);
          } else {
            // Sign in anonymously if no initial auth token is provided
            if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
              await signInWithCustomToken(firebaseAuth, __initial_auth_token);
              setUserId(firebaseAuth.currentUser?.uid || crypto.randomUUID());
            } else {
              await signInAnonymously(firebaseAuth);
              setUserId(firebaseAuth.currentUser?.uid || crypto.randomUUID());
            }
          }
          setIsAuthReady(true);
        });
      } catch (error) {
        console.error("Error initializing Firebase:", error);
      }
    };

    initializeFirebase();
  }, []);

  // Check for File API availability
  useEffect(() => {
    if (!window.File || !window.FileReader) {
      setFileApiSupported(false);
    }
  }, []);

  const showNotification = useCallback((message: string) => {
    setNotification(message);
    const timer = setTimeout(() => {
      setNotification(null);
    }, 3000); // Notification lasts for 3 seconds
    return () => clearTimeout(timer);
  }, []);

  const handleFileLoad = useCallback(async (fileContent: string) => {
    setIsLoading(true);
    // Call the imported fountain parser directly, requesting tokens
    const result = fountain.parse(fileContent, true) as FountainParseResult | void; // Cast to avoid void if callback not used

    setIsLoading(false);
    if (result) {
      setScriptHtml(result.html.script);
      if (result.title && result.html.title_page) {
        setTitlePageHtml(result.html.title_page);
        setScriptTitle(result.title);
      } else {
        setTitlePageHtml('');
        setScriptTitle('Untitled');
      }
      setIsDocked(false); // Show workspace
      showNotification(`${result.title || 'Untitled'} loaded!`);

      // Save parsed data to Firestore according to the new schema
      if (db && userId && isAuthReady) { // Ensure auth is ready before saving
        try {
          // 1. Save main script details to 'parsed_scripts'
          const parsedScriptsCollectionRef = collection(db, `artifacts/${__app_id}/users/${userId}/parsed_scripts`);
          const scriptDocRef = await addDoc(parsedScriptsCollectionRef, {
            title: result.title || 'Untitled',
            rawContent: fileContent,
            parsedHtmlTitlePage: result.html.title_page || '',
            parsedHtmlScript: result.html.script,
            createdAt: new Date(),
          });
          const scriptId = scriptDocRef.id; // Get the auto-generated ID for the new script document

          // 2. Save each token individually to 'script_tokens'
          if (result.tokens && result.tokens.length > 0) {
            const scriptTokensCollectionRef = collection(db, `artifacts/${__app_id}/users/${userId}/script_tokens`);
            for (let i = 0; i < result.tokens.length; i++) {
              const token = result.tokens[i];
              await addDoc(scriptTokensCollectionRef, {
                script_id: scriptId, // Link to the parent script
                order_index: i,     // Preserve the order
                type: token.type,
                text: token.text,
                scene_number: token.scene_number || null,
                character: token.character || null,
                parenthetical: token.parenthetical || null,
                dual: token.dual || null,
                depth: token.depth || null,
                createdAt: new Date(),
              });
            }
            console.log(`Script and ${result.tokens.length} tokens saved to Firestore!`);
          } else {
            console.log("Script saved to Firestore, but no tokens were parsed or saved.");
          }
        } catch (error) {
          console.error("Error saving script or tokens to Firestore:", error);
        }
      }

    } else {
      showNotification('Error parsing script.');
    }
  }, [db, userId, isAuthReady, showNotification]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('border-blue-500', 'border-2'); // Remove drag-over styling
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'text/plain') { // Assuming .fountain files are text/plain
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target && typeof evt.target.result === 'string') {
          handleFileLoad(evt.target.result);
        }
      };
      reader.readAsText(file);
    } else {
      showNotification('Please drop a valid text file.');
    }
  }, [handleFileLoad, showNotification]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.add('border-blue-500', 'border-2');
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('border-blue-500', 'border-2');
  }, []);

  const handleDockClick = useCallback(() => {
    setIsDocked(true);
    setScriptHtml('');
    setTitlePageHtml('');
    setScriptTitle('Untitled');
    showNotification('Docked back to file selection.');
  }, [showNotification]);

  const handleDimClick = useCallback(() => {
    setIsDimmed((prev) => !prev);
    showNotification(`Header ${isDimmed ? 'restored' : 'dimmed'}`);
  }, [isDimmed, showNotification]);

  const handleResizeClick = useCallback(() => {
    setDpi((prev) => (prev === 72 ? 100 : 72));
    showNotification(`Script resized to ${dpi === 72 ? 100 : 72} dpi`);
  }, [dpi, showNotification]);

  // Dual dialogue handling (adapted from original jQuery logic)
  const scriptRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scriptRef.current && !isDocked) {
      // This part mimics the jQuery .each and DOM manipulation for dual dialogue
      // In a real React app, you'd ideally parse this into structured data
      // and render it directly with React components, avoiding direct DOM manipulation.
      const dualDialogues = scriptRef.current.querySelectorAll('div.dialogue.dual');
      dualDialogues.forEach(dualDiv => {
        const prevDiv = dualDiv.previousElementSibling;
        if (prevDiv && prevDiv.classList.contains('dialogue')) {
          const dualDialogueWrapper = document.createElement('div');
          dualDialogueWrapper.classList.add('dual-dialogue');
          dualDiv.parentNode?.insertBefore(dualDialogueWrapper, dualDiv);
          dualDialogueWrapper.appendChild(prevDiv);
          dualDialogueWrapper.appendChild(dualDiv);
        }
      });
    }
  }, [scriptHtml, titlePageHtml, isDocked]); // Rerun when script content changes or dock state changes

  if (!fileApiSupported) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4 font-inter">
        <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md">
          <p className="text-red-500 text-lg">
            Oops, your browser doesn't support the HTML 5 File API. Work is underway to improve compatibility, hang tight!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-inter">
      {/* Notification */}
      {notification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in-out">
          {notification}
        </div>
      )}

      {/* User ID Display */}
      {isAuthReady && userId && (
        <div className="absolute top-4 right-4 bg-gray-800 text-white text-sm px-3 py-1 rounded-md shadow-md">
          User ID: {userId}
        </div>
      )}

      {/* Dock View */}
      {isDocked && (
        <div
          id="dock"
          className="flex flex-1 items-center justify-center p-4"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="bg-white p-8 rounded-xl shadow-lg text-center border-dashed border-2 border-gray-300 hover:border-blue-500 transition-colors duration-200">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Fountain.js Reader</h2>
            <p className="text-gray-600 mb-6">Drag and drop a Fountain script file here to load it.</p>
            <div className="text-sm text-gray-500">
              (e.g., .fountain or .txt file containing Fountain syntax)
            </div>
          </div>
        </div>
      )}

      {/* Workspace View */}
      {!isDocked && (
        <div id="workspace" className="flex flex-1 flex-col overflow-hidden">
          {/* Header */}
          <header className={`bg-white shadow-md p-4 transition-all duration-300 ${isDimmed ? 'opacity-50' : ''}`}>
            <div className="container mx-auto flex items-center justify-between rounded-md">
              <h1 id="script-title" className="text-2xl font-semibold text-gray-800">{scriptTitle}</h1>
              {/* Toolbar */}
              <div id="toolbar" className="flex space-x-2">
                <button
                  onClick={handleDockClick}
                  className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors duration-200 shadow-sm"
                  title="Dock"
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a2 2 0 012-2h10a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V4zm3 0h8v12H6V4z" clipRule="evenodd" />
                  </svg>
                </button>
                <button
                  onClick={handleDimClick}
                  className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors duration-200 shadow-sm"
                  title={isDimmed ? 'Restore Header' : 'Dim Header'}
                >
                  {isDimmed ? (
                    <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 12a2 2 1 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414L5.586 8H4a1 1 0 000 2h1.586l-3.293 3.293a1 1 0 101.414 1.414L8 11.414V13a1 1 0 102 0v-1.586l3.293 3.293a1 1 0 001.414-1.414L11.414 10H13a1 1 0 100-2h-1.586l3.293-3.293a1 1 0 00-1.414-1.414L10 8.586V7a1 1 0 10-2 0v1.586L3.707 2.293zM7 10a3 3 0 116 0 3 3 0 01-6 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
                <button
                  onClick={handleResizeClick}
                  className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors duration-200 shadow-sm"
                  title={dpi === 72 ? 'Resize to 100 dpi' : 'Resize to 72 dpi'}
                >
                  {dpi === 72 ? (
                    <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </header>

          {/* Script Content */}
          <div className="flex-1 overflow-auto p-4 flex justify-center">
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
              </div>
            ) : (
              <div
                id="script"
                ref={scriptRef}
                className={`bg-white rounded-lg shadow-lg p-8 transform transition-all duration-300
                  ${dpi === 72 ? 'w-[8.5in] h-[11in] text-base' : 'w-[8.5in] h-[11in] text-lg'}
                  overflow-y-auto`}
                style={{ width: `${dpi === 72 ? 8.5 : 8.5 * (100 / 72)}in`, height: `${dpi === 72 ? 11 : 11 * (100 / 72)}in` }}
              >
                {titlePageHtml && (
                  <div className="page title-page" dangerouslySetInnerHTML={{ __html: titlePageHtml }}></div>
                )}
                <div className="page" dangerouslySetInnerHTML={{ __html: scriptHtml }}></div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
