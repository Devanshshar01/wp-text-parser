from playwright.sync_api import sync_playwright
import os
import time

def run_verification():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={'width': 1280, 'height': 800},
            record_video_dir="/home/jules/verification/videos"
        )
        page = context.new_page()

        # Step 1: Open Home Landing Page
        page.goto("http://localhost:3000")
        page.wait_for_timeout(1000)

        # Step 2: Click "Try synthetic sample chat"
        sample_btn = page.get_by_role("button", name="Try synthetic sample chat")
        sample_btn.click()
        page.wait_for_timeout(1500)

        # Step 3: Select Participant (Who are you?)
        alex_btn = page.get_by_role("button", name="Alex")
        alex_btn.click()
        page.wait_for_timeout(1500)

        # Step 4: Scroll in chat
        page.wait_for_timeout(1000)

        # Take main screenshot
        page.screenshot(path="/home/jules/verification/screenshots/verification.png")

        context.close()
        browser.close()

if __name__ == "__main__":
    run_verification()
