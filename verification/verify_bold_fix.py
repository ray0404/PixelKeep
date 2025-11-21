
from playwright.sync_api import Page, expect, sync_playwright
import time

def verify_bold_fix(page: Page):
    page.goto("http://localhost:3000")

    # Unlock
    page.wait_for_selector("#unlock-screen")
    page.fill("#password-input", "password")
    page.click("#unlock-button")
    page.wait_for_selector("#app-container")

    # Go to Note Editor (New Note)
    page.click("#notes-add-new-button")
    page.wait_for_selector("#note-edit-content")

    # Focus editor
    page.click("#note-edit-content")

    # Wait for the setTimeout fix to run
    time.sleep(0.5)

    # Check state
    is_bold = page.evaluate("document.queryCommandState('bold')")
    print(f"Bold State after focus: {is_bold}")

    if not is_bold:
        print("PASS: Bold is correctly OFF after focus.")
    else:
        print("FAIL: Bold is still ON.")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_bold_fix(page)
        finally:
            browser.close()
