
from playwright.sync_api import Page, expect, sync_playwright
import time

def verify_color_spacing(page: Page):
    # 1. Go to the app
    page.goto("http://localhost:3000")
    
    # 2. Unlock
    page.wait_for_selector("#unlock-screen")
    page.fill("#password-input", "password")
    page.click("#unlock-button")
    page.wait_for_selector("#app-container")
    
    # 3. Open Settings
    page.click("#settings-button")
    page.wait_for_selector("#page-settings:not(.hidden)")
    
    # 4. Change to Terminal Green and Relaxed Spacing
    page.select_option("#setting-text-color", "text-terminal-green")
    page.select_option("#setting-line-height", "leading-relaxed")
    
    time.sleep(0.5)
    
    # Screenshot Settings
    page.screenshot(path="verification/settings_enhanced.png")
    
    # 5. Check impact on Notes List
    page.click(".nav-button[data-page='notes-list']")
    time.sleep(0.5)
    
    page.screenshot(path="verification/notes_list_green_relaxed.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_color_spacing(page)
        finally:
            browser.close()
