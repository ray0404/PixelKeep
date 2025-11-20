
from playwright.sync_api import Page, expect, sync_playwright
import time

def verify_settings_and_bold_fix(page: Page):
    # 1. Go to the app
    page.goto("http://localhost:3000")

    # 2. Unlock
    # Wait for unlock screen
    page.wait_for_selector("#unlock-screen")
    page.fill("#password-input", "password")
    page.click("#unlock-button")

    # Wait for main app
    page.wait_for_selector("#app-container")

    # 3. Open Settings
    page.click("#settings-button")
    page.wait_for_selector("#page-settings:not(.hidden)")

    # 4. Change Settings
    # Change Font to Inter
    page.select_option("#setting-font", "Inter")
    # Change Background to Solid Black
    page.select_option("#setting-bg", "bg-solid-black")
    # Change Scale
    page.fill("#setting-scale", "110")
    page.dispatch_event("#setting-scale", "input")

    # Toggle Compact Mode
    page.click("#setting-compact") # Check it

    time.sleep(1) # Wait for transitions

    # Take Settings Screenshot
    page.screenshot(path="verification/settings_page.png")

    # 5. Verify Bold Fix
    # Go back to notes
    page.click(".nav-button[data-page='notes-list']")

    # Create New Note
    page.click("#notes-add-new-button")
    page.wait_for_selector("#note-edit-content")

    # Click inside editor
    page.click("#note-edit-content")

    # Check if bold command state is true/false
    is_bold = page.evaluate("document.queryCommandState('bold')")
    print(f"Is Bold Active: {is_bold}")

    if is_bold:
        print("FAIL: Bold is active on empty note focus.")
    else:
        print("PASS: Bold is not active.")

    # Type something
    page.keyboard.type("This is normal text.")

    page.screenshot(path="verification/note_editor_normal.png")

    # Toggle Bold and type
    page.click("#format-bold")
    page.keyboard.type(" This is bold text.")

    page.screenshot(path="verification/note_editor_bold.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_settings_and_bold_fix(page)
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")
        finally:
            browser.close()
