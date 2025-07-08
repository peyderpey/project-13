# Rehearsify 🎭

**Professional Script Rehearsal Platform** - A React/TypeScript web application for theater performers with AI-powered speech recognition, multi-language support, and intelligent progress tracking.

## 🚀 Current Project Status

### ✅ Recently Completed (Latest Session)

#### UI Modernization with shadcn/ui Sheets
- **Replaced Drawer Components**: Successfully replaced left-side drawer menu with shadcn/ui Sheet component
- **Settings Sheet**: Implemented right-side Sheet for settings with auto-save functionality (no "Save" button needed)
- **Mobile Optimization**: Settings page fully optimized for mobile using shadcn/ui Tabs, Cards, Badges, and other components
- **Accessibility**: Proper SheetTitle and SheetDescription components for screen readers
- **Responsive Design**: Sheets work seamlessly on desktop, tablet, and mobile devices

#### User Permissions System
- **Database Integration**: Successfully created `user_permissions` table in Supabase with proper RLS policies
- **Role Management**: Implemented `is_demo_admin` and `is_pro_member` flags for feature access control
- **Premium Features**: App now properly enforces limits based on user roles using `useUserRole` hook
- **Migration Cleanup**: Fixed broken migrations and resolved RLS policy issues for plays table
- **Admin Controls**: Only admins can update user permissions, regular users cannot change their own roles

#### Practice Session Logic Fixes
- **Loop Prevention**: Fixed circular dependency issues in line advancement and TTS completion
- **Actor-Friendly Timing**: Implemented generous timeouts for dramatic pauses (15+ seconds)
- **Speech Recognition Flow**: Separated auto/manual advancement logic for better control
- **TTS Completion Handling**: Ensured next line only appears after TTS finishes
- **Timeout Management**: Consolidated timeout handling with proper cleanup

#### Settings Management
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
- `src/components/Header.tsx` - Updated to use new Sheet components for menu and settings
- `src/components/Settings.tsx` - Completely redesigned with mobile-optimized shadcn/ui components
- `src/components/PracticeSession.tsx` - Core practice logic with timeout fixes
- `src/components/PracticeSessionUI.tsx` - UI-only variant for future modernization
- `src/components/PracticeHeader.tsx` - Updated with shadcn/ui components
- `src/components/PracticeFooter.tsx` - Updated with shadcn/ui components
- `src/hooks/useAppSettings.ts` - Settings management hook
- `src/hooks/useUserRole.ts` - User permissions and role checking hook
- `src/utils/progressSync.ts` - Background progress syncing utility

#### Database Tables
```sql
-- User settings table
user_settings (
  id, user_id, settings_data, created_at, updated_at
)

-- User permissions table
user_permissions (
  id, user_id, is_demo_admin, is_pro_member, created_at, updated_at
)

-- Rehearsal sessions table  
rehearsal_sessions (
  id, user_id, play_id, character_name, session_data, 
  accuracy_scores, completed_lines, total_lines, created_at, updated_at
)

-- Plays table (with RLS policies)
plays (
  id, user_id, title, content, created_at, updated_at
)
```

### ✅ Current Working State
- **UI Components**: Modern Sheet-based navigation and settings with full mobile optimization
- **User Permissions**: Fully functional role-based access control system
- **Practice Session**: Fully functional with actor-friendly timing and proper flow control
- **Progress Syncing**: Working for uploaded scripts with database integration
- **Settings Management**: Hybrid localStorage + database persistence with auto-save
- **Speech Recognition**: Robust with generous timeouts and proper cleanup
- **Database**: All tables properly configured with RLS policies

### 📋 Next Steps

1. **Feature Enhancements** (Optional)
   - Add progress analytics dashboard
   - Implement script sharing between users
   - Add rehearsal session export/import
   - Voice customization per character

2. **Performance Optimization**
   - Optimize script conversion in Script Library (currently converts every time page opens)
   - Implement caching for frequently accessed data

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
- **Backend**: Supabase (PostgreSQL, Auth, RLS)
- **Speech**: Web Speech API (recognition + synthesis)
- **File Processing**: Mammoth.js (DOCX), custom PDF/RTF parsers
- **State**: React hooks + localStorage + Supabase real-time
- **UI Components**: shadcn/ui (fully integrated)

## 🎯 Core Features

- **AI Speech Recognition**: Real-time accuracy feedback with actor-friendly timeouts (15+ seconds)
- **Multi-Character Voice Synthesis**: Language-specific voices per character
- **Smart Script Parsing**: TXT, DOCX, PDF, RTF with character/dialogue extraction
- **Progress Tracking**: localStorage + database syncing for uploaded scripts
- **Multi-Language**: 6 languages (EN, TR, DE, FR, ES, IT) with script/interface separation
- **Responsive Design**: Works on desktop, tablet, mobile with modern Sheet-based UI
- **Accessibility**: WCAG compliant with keyboard navigation and screen reader support
- **Actor-Friendly Timing**: Generous timeouts for dramatic pauses and natural speech patterns
- **Role-Based Access**: Premium features controlled by user permissions system

## 🚀 Quick Start

```bash
npm install
npm run dev
```

## 📁 Key Project Structure

```
src/
├── components/          # React components
│   ├── Header.tsx              # Main header with Sheet navigation
│   ├── Settings.tsx            # Mobile-optimized settings with shadcn/ui
│   ├── PracticeSession.tsx     # Core practice logic (current)
│   ├── PracticeSessionUI.tsx   # UI-only variant (future)
│   ├── PracticeHeader.tsx      # Modern header with shadcn/ui
│   └── PracticeFooter.tsx      # Modern footer with shadcn/ui
├── hooks/              # Custom hooks (useAuth, useScripts, useAppSettings, useUserRole)
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

**Last Updated**: Current session focused on UI modernization with shadcn/ui Sheets, mobile-optimized settings, and user permissions system implementation. All core functionality is stable and working well with modern, accessible UI components.

## TODO / Known Issues

- **Script Library Optimization**: Scripts are converted every time the page opens. This should be fixed to avoid unnecessary processing.

## User Roles and Permissions

User roles are managed in the `user_permissions` table:

- `is_demo_admin`: If true, the user has unlimited access to all features (no limits).
- `is_pro_member`: If true, the user can access all features, but with certain usage limits (enforced in the app).

**Only admins can update the `user_permissions` table. Regular users cannot change their own roles.**

The app uses these roles to control access to premium features and enforce limits for pro members. The `useUserRole` hook provides easy access to check user permissions throughout the application. 