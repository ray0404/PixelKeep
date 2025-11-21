
from playwright.sync_api import Page, expect, sync_playwright
import time

def debug_bold_issue(page: Page):
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
    
    # Check initial state
    is_bold = page.evaluate("document.queryCommandState('bold')")
    print(f"Initial Bold State: {is_bold}")
    
    font_weight = page.evaluate("window.getComputedStyle(document.getElementById('note-edit-content')).fontWeight")
    print(f"Computed Font Weight: {font_weight}")
    
    if is_bold:
        print("Attempting to toggle bold off...")
        # Toggle via toolbar button
        page.click("#format-bold")
        
        is_bold_after = page.evaluate("document.queryCommandState('bold')")
        print(f"Bold State after toggle: {is_bold_after}")
        
        if not is_bold_after:
            print("SUCCESS: Toggling bold turned it off.")
        else:
            print("FAIL: Toggling bold did NOT turn it off.")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            debug_bold_issue(page)
        finally:
            browser.close()
