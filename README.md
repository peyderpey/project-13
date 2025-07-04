# Rehearsify 🎭

**Professional Script Rehearsal Platform** - A React/TypeScript web application for theater performers with AI-powered speech recognition, multi-language support, and intelligent progress tracking.

## 🚀 Current Project Status

### ✅ Recently Completed (Latest Session)

#### Practice Session Logic Fixes
- **Loop Prevention**: Fixed circular dependency issues in line advancement and TTS completion
- **Actor-Friendly Timing**: Implemented generous timeouts for dramatic pauses (15+ seconds)
- **Speech Recognition Flow**: Separated auto/manual advancement logic for better control
- **TTS Completion Handling**: Ensured next line only appears after TTS finishes
- **Timeout Management**: Consolidated timeout handling with proper cleanup

#### UI Modernization Attempts
- **shadcn/ui Integration**: Attempted to modernize practice screen with shadcn components
- **Chat Interface**: Created custom chat-like interface for dialogue display
- **Component Updates**: Updated PracticeHeader and PracticeFooter with modern UI elements
- **Revert Strategy**: Created `PracticeSessionUI.tsx` for future UI-only changes without affecting core logic

#### Settings Management (Previous Session)
- **Hybrid Settings Persistence**: localStorage for offline/instant access + Supabase DB syncing for logged-in users
- **Simplified Voice Settings**: Removed pitch adjustment, kept voice speed and voice selection
- **Language Dropdown UI**: Fixed with proper theme tokens and accessibility
- **New Hook**: `useAppSettings` manages settings with automatic DB sync

#### Speech Synthesis & Recognition Improvements
- **Script Language Usage**: TTS and ASR now use script language (not interface language) during practice
- **Voice Index Restoration**: Restored voiceIndex for character selection compatibility
- **Accessibility Fixes**: Added `DialogDescription` to resolve accessibility warnings

#### Rehearsal Progress Syncing
- **Background Sync Utility**: `progressSync.ts` syncs localStorage progress to Supabase without affecting PracticeSession
- **Database Integration**: Progress saved to `rehearsal_sessions` table with RLS policies
- **Demo Script Handling**: Demo scripts (Pygmalion, Salomé) skip DB sync, use localStorage only
- **StartingPointSelector**: Updated to load progress from database for uploaded scripts

### 🔧 Technical Implementation

#### Key Files Modified
- `src/components/PracticeSession.tsx` - Core practice logic with timeout fixes
- `src/components/PracticeSessionUI.tsx` - UI-only variant for future modernization
- `src/components/PracticeHeader.tsx` - Updated with shadcn/ui components
- `src/components/PracticeFooter.tsx` - Updated with shadcn/ui components
- `src/hooks/useAppSettings.ts` - Settings management hook
- `src/utils/progressSync.ts` - Background progress syncing utility

#### Database Tables
```sql
-- User settings table
user_settings (
  id, user_id, settings_data, created_at, updated_at
)

-- Rehearsal sessions table  
rehearsal_sessions (
  id, user_id, play_id, character_name, session_data, 
  accuracy_scores, completed_lines, total_lines, created_at, updated_at
)
```

### ✅ Current Working State
- **Practice Session**: Fully functional with actor-friendly timing and proper flow control
- **Progress Syncing**: Working for uploaded scripts with database integration
- **Settings Management**: Hybrid localStorage + database persistence
- **Speech Recognition**: Robust with generous timeouts and proper cleanup
- **UI Components**: Modern header/footer with shadcn/ui, original practice screen logic preserved

### 📋 Next Steps

1. **UI Modernization** (Future)
   - Use `PracticeSessionUI.tsx` for UI-only changes
   - Implement shadcn/ui chat components
   - Modernize speech bubble design
   - Add animations and transitions

2. **Feature Enhancements** (Optional)
   - Add progress analytics dashboard
   - Implement script sharing between users
   - Add rehearsal session export/import
   - Voice customization per character

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
- **Backend**: Supabase (PostgreSQL, Auth, RLS)
- **Speech**: Web Speech API (recognition + synthesis)
- **File Processing**: Mammoth.js (DOCX), custom PDF/RTF parsers
- **State**: React hooks + localStorage + Supabase real-time
- **UI Components**: shadcn/ui (partial integration)

## 🎯 Core Features

- **AI Speech Recognition**: Real-time accuracy feedback with actor-friendly timeouts (15+ seconds)
- **Multi-Character Voice Synthesis**: Language-specific voices per character
- **Smart Script Parsing**: TXT, DOCX, PDF, RTF with character/dialogue extraction
- **Progress Tracking**: localStorage + database syncing for uploaded scripts
- **Multi-Language**: 6 languages (EN, TR, DE, FR, ES, IT) with script/interface separation
- **Responsive Design**: Works on desktop, tablet, mobile
- **Accessibility**: WCAG compliant with keyboard navigation
- **Actor-Friendly Timing**: Generous timeouts for dramatic pauses and natural speech patterns

## 🚀 Quick Start

```bash
npm install
npm run dev
```

## 📁 Key Project Structure

```
src/
├── components/          # React components
│   ├── PracticeSession.tsx      # Core practice logic (current)
│   ├── PracticeSessionUI.tsx    # UI-only variant (future)
│   ├── PracticeHeader.tsx       # Modern header with shadcn/ui
│   └── PracticeFooter.tsx       # Modern footer with shadcn/ui
├── hooks/              # Custom hooks (useAuth, useScripts, useAppSettings)
├── utils/              # Utilities (scriptParser, progressSync)
├── i18n/               # Internationalization
├── types/              # TypeScript definitions
└── lib/                # Supabase client
```

## 🔐 Environment Variables

Create `.env.local`:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

**Last Updated**: Current session focused on practice session logic fixes and UI modernization preparation. Core functionality is stable and working well with actor-friendly timing and proper flow control. 