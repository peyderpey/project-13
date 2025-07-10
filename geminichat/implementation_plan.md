# Project Plan: Gemini-Powered Script Intelligence

This document outlines the implementation plan for integrating Gemini AI to enhance script import, analysis, and text-to-speech capabilities in the Rehearsify application.

---

### **Phase 1: Database and Backend Setup**

1.  **Apply & Verify Database Schema:**
    *   **Action:** Execute the SQL from `geminichat/database schema for ai import.sql`.
    *   **Compatibility Check:** The new schema links to the existing `plays` and `characters` tables via foreign keys (`play_id`, `character_id`). The `scene_by_scene_analysis` JSONB field will hold the structured scene data from Gemini. The `saveAiAssistedScript` function (Step 3) will be responsible for correctly parsing this and populating the existing `scenes` and `lines` tables to ensure compatibility with current navigation logic.
    *   **Status:** ✅ **Completed**

2.  **Update Supabase API Types:**
    *   **Action:** After migrating the database, run the command to generate and update the TypeScript types for the new schema. This will provide type-safe access to `ai_script_analysis` and `character_voice_profiles` in the code.
    *   **Status:** ✅ **Completed**

3.  **Enhance `useScripts` Hook:**
    *   **Action:** Create the `saveAiAssistedScript` function in the `useScripts` hook, which calls a new `save_ai_assisted_script` PostgreSQL function to handle the multi-table transaction.
    *   **Status:** ✅ **Completed**

---

### **Phase 2: AI-Powered Script Import**

4.  **Integrate `ScriptImport` Component:**
    *   **Action:** Replace the current script upload UI with the component defined in `geminichat/script import component.ts`.
    *   **Status:** *Pending*

5.  **Implement Gemini API and Import Screen Flow:**
    *   **Action:** Integrate the `callGeminiForConversion` function and build out the detailed import UI flow (Upload -> Metadata -> AI Assist -> Complete/Error).
    *   **Status:** *Pending*

6.  **Conditional AI Usage:**
    *   **Action:** Use the `useUserRole` hook to conditionally render the "AI Assist" functionality for `premium` and `demo-admin` users only.
    *   **Status:** *Pending*

---

### **Phase 3: Script Editing and Character Configuration**

7.  **Integrate Fountain Editor:**
    *   **Action:** Adapt the code from `Fountain React App.ts` to create a "Script Editor" view presented after a successful import, allowing users to make corrections before final processing.
    *   **Status:** *Pending*

8.  **Character Review and TTS Selection:**
    *   **Action:** Build the "Character Review" screen to display Gemini's analysis and allow users to configure TTS voices for each character.
    *   **Functionality:** The UI will validate user voice selections against their chosen TTS engine (Local, Google Cloud, Gemini).
    *   **Status:** *Pending*

---

### **Phase 4: Audio Generation and Storage**

9.  **TTS Generation Service:**
    *   **Action:** Create a new service (`src/services/ttsGenerator.ts`) to handle API calls for TTS generation.
    *   **Status:** *Pending*

10. **Supabase Storage Integration:**
    *   **Action:** Upload the generated MP3 files from the TTS service to a Supabase storage bucket, using the line's unique ID as the filename.
    *   **Status:** *Pending*

---

### **Phase 5: Finalization and Polish**

11. **Duplicate Script Check:**
    *   **Action:** Implement a file hash check on upload. Offer a Gemini-powered "diff" for similarly titled scripts.
    *   **Status:** *Pending*

12. **Update Practice Screen:**.
    *   **Action:** Modify the `PracticeSession` component to fetch and play the pre-generated MP3 URLs from storage instead of generating TTS on the fly.
    *   **Status:** *Pending*

13. **Logging and Testing:**
    *   **Action:** Create a new `app_logs` table and a logging utility to record key events for debugging.
    *   **Functionality:** Perform extensive end-to-end testing of the entire workflow.
    *   **Status:** *Pending*
