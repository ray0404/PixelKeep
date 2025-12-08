
from playwright.sync_api import sync_playwright
import time
import os

def verify_audio_offloading():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        # 1. Navigate to the app
        print("Navigating to app...")
        page.goto("http://localhost:8080/index.html")

        # 2. Unlock the app
        print("Unlocking...")
        page.fill("#password-input", "test")
        page.click("#unlock-button")

        page.wait_for_selector("#notes-add-new-button")
        print("App unlocked.")

        # 3. Create a new note
        print("Creating new note...")
        page.click("#notes-add-new-button")
        page.wait_for_selector("#note-edit-title")

        page.fill("#note-edit-title", "Audio Test Note")
        page.fill("#note-edit-content", "Testing audio offloading.")

        # 4. Upload mock audio
        print("Uploading mock audio...")
        page.click("#note-record-audio")
        page.click("#audio-upload-file-btn")

        page.set_input_files("#audio-file-input", "mock_audio.webm")

        page.wait_for_selector("#note-edit-audio-wrapper:not(.hidden)", timeout=5000)

        page.screenshot(path="verification/1_editor_with_audio.png")
        print("Editor screenshot taken.")

        # 5. Save the note
        print("Saving note...")
        page.click("button[type='submit']")

        page.wait_for_selector("#notes-list-container")
        page.wait_for_selector("text=Audio Test Note")
        print("Note saved.")

        # 6. Verify data in IndexedDB
        print("Verifying IndexedDB...")
        # Use version 4 now
        audio_store_count = page.evaluate("""async () => {
            const db = await idb.openDB('PixelPWADatabase', 4);
            return await db.count('audio');
        }""")
        print(f"Audio store count: {audio_store_count}")

        if audio_store_count > 0:
            print("SUCCESS: Audio detected in 'audio' store.")
        else:
            print("FAILURE: No audio in 'audio' store.")

        # 7. Check the note content in DB to see if audio field is a reference
        print("Verifying Note reference via UI...")

        print("Opening note details...")
        page.fill("#notes-search-input", "Audio Test Note")
        page.click(".note-view-btn")

        page.wait_for_selector("#note-detail-audio")

        # Check src attribute
        audio_src = page.get_attribute("#note-detail-audio", "src")
        print(f"Audio src: {audio_src}")

        if "/secure-audio/" in audio_src:
            print("SUCCESS: Audio src is a virtual path.")
        else:
            print(f"FAILURE: Audio src is {audio_src}")

        page.screenshot(path="verification/2_details_with_audio.png")

        browser.close()

if __name__ == "__main__":
    verify_audio_offloading()
