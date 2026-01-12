**EXECUTE:** Apply updates specified below according to outlined context and prompt
---

# Context: Markdown & Line-Numbering Update
"Markdown mode/toggle" and "line-numbering mode/toggle", while both relating to note rendering/styling/note formatting, are *independant* features/options. The implementation, toggle, and behavior of one, should not affect the behavior of the other.

## Overall Parameters/Info/Behavior/etc.
Whether or not "markdown mode" or "line-numbering" UI toggles render on note pages at all will be dictated whether or not the options have been "turned on".

- Within the "settings" view/panel, both "markdown mode" and "line-numbering" should have their own options (toggle/check boxes); checking/selecting/toggling them on (respectiveley) within the settings menu will cause the markdown/line-numbering toggle UI's to be visible in the note sections of app (note-details and/or note-edit).
 
- When either "mode"/option is turned "on" from within the settings panel, this will give the user the "option" to use/toggle these features on or off from a not-by-note basis
    - **For example:** If "markdown mode" is toggled on within the settings panel, and user has a total of 5 notes within app, then within each note (note-detail view) there will be a "markdown mode" toggle UI. Engaging "markdown mode" via the UI on note-detail view on note's #1 and #2, but not on note's #3 - #5, will cause only note's #1 and #2 to render in/with respect to markdown formatting; note's #3 - #5 will not render with respect to markdown format.

## Intended Behavior of Markdown Rendering
The optional markdown rendering of notes is supposed to be *optional*, and therefore, any/all existing note display behavior should be preserved; note rendering should behave as it does currently when new (soon to be implemented) markdown rendering featured is toggled "off".

- When markdown rendering is toggled "on", any text typed in the note content text box of respective note should be rendered in the note's note-detail view formatted "into" the markdown "format".
    - **Example 1:** If the user types `## Example`, then the text should be rendered `Example` except larger/bold, in alignment with its respective header's (h2) formatting parameters.
    - **Example 2:** If the user types `**Example**`, then in the note's note-detail view, it should be rendered `Example`, but bold: **Example**

- The markdown toggle UI should *only* be visible (and affect text) on the note-detail view; the note content on the note-edit view should **not** change, regardless whether the markdown "mode" is toggled off or on. Toggling markdown on should only affect how the note's content is rendered on/in the *note-detail* view. 

- The markdown toggle UI (again, visible only on note's note-detail view) should only affect the rendering of note's content of that specific note.
    - If markdownUI is toggled "on" on note #1, but toggled "off" on note #2, then the note content within note #1's note-detail view should render in/with respect to markdown format, but note #2's content on its respective note-detail view should *not* render with respect to markdown format (should render *exactly* as typed on note's respective note-edit view). 

## Intended Behavior of line-numbering
Line-numbering "mode/format" (or simply "line-numbering"), when toggled on from within the settings panel, should cause a "new" line-numbering UI toggle to appear on (each respective note's) note-edit views. like with markdown mode/format, toggling line-numbering on for note #1, does not affect the line-number rendering on note #2 (rendering/toggling of line-numbering is independant from note to note).

- Line-numbering UI/toggle is *only* available on "note-edit" view(s); main use is for keeping track of line-numbers for scenarios where line number/newline instances are relevant.

- Line-numbering should work (essentially) the same way as they do in "coed-editor"/raw text editor apps/programs.
    - **For example:** When line-numbering is toggled on for a note, with regards to "newlines", hitting "enter" results to moving to newline/next numbered line.

---

# Prompt: Markdown & Line-Numbering Update

**Current Architecture Notes:**

* **Database:** `src/db/db.ts` defines the `Note` interface.
* **State:** `useNoteStore.ts` handles note CRUD; `useSettingsStore.ts` handles global app preferences.
* **Views:** `NoteDetails.tsx` displays content (currently via `dangerouslySetInnerHTML`), and `NoteEditor.tsx` allows editing (currently a `div` with `contentEditable`).

**Feature Requirements:**

## 1. Database & Schema Updates (`src/db/db.ts`)

* Update the `Note` interface to include two new optional boolean fields to persist the state per note:
* `isMarkdownMode` (default: false)
* `showLineNumbers` (default: false)

* Ensure `PixelKeepDB` versioning handles this schema update gracefully.
* Update `useNoteStore.ts` actions (`addNote`, `updateNote`) to support these fields.

## 2. Global Settings (`src/stores/useSettingsStore.ts` & `src/views/Settings.tsx`)

* Add two new boolean toggles in the Settings store and UI:
* `enableMarkdownFeature`: Controls the *availability* of the Markdown toggle button in the UI.
* `enableLineNumbersFeature`: Controls the *availability* of the Line Numbering toggle button in the UI.

* **Behavior:** If these are disabled in Settings, the respective toggle buttons should not appear in `NoteDetails` or `NoteEditor` at all.

## 3. Feature A: Markdown Rendering

* **Location:** Logic in `NoteDetails.tsx`.
* **Library:** You are authorized to add a lightweight markdown library (e.g., `react-markdown` or `marked`) to `package.json`.
* **Behavior:**
* If Global Setting `enableMarkdownFeature` is **ON**, show a "Markdown" toggle button in the `NoteDetails` header.
* This button toggles the `isMarkdownMode` property for the specific note being viewed.
* **Rendering Logic:**
* If `note.isMarkdownMode` is **TRUE**: Parse the `note.content` string as Markdown and render it. (Note: The content is currently stored as HTML from `contentEditable`. You may need to use a utility to strip HTML tags or render the raw HTML string as the source for the Markdown parser).
* If `note.isMarkdownMode` is **FALSE**: Keep existing behavior (`dangerouslySetInnerHTML`).

* **Constraint:** This only affects `NoteDetails`. The `NoteEditor` should remain as is.

## 4. Feature B: Line Numbering

* **Location:** `NoteEditor.tsx`.
* **Behavior:**
* If Global Setting `enableLineNumbersFeature` is **ON**, show a "Line Numbers" toggle button in the `NoteEditor` toolbar.
* This button toggles the `showLineNumbers` property for the specific note.

* **Implementation Details:**
* The editor is currently a `contentEditable` div.
* Implement a visual gutter on the left side of the editor that displays line numbers corresponding to the lines in the `contentEditable` area.
* Ensure the line numbers align correctly with the text lines, even when text wraps (if `wordWrap` is enabled) or when new lines are added via "Enter".
* *Tip:* Since `contentEditable` can vary in structure, consider using a CSS Counter approach on the block elements inside the editor, or a side-bar component that calculates line height.

**Deliverables:**

1. Updated `db.ts` with schema changes.
2. Updated `useSettingsStore.ts` and `Settings.tsx`.
3. Updated `NoteDetails.tsx` with Markdown logic.
4. Updated `NoteEditor.tsx` with Line Numbering logic.
5. Commands to install necessary dependencies.
