
import asyncio
from playwright.async_api import async_playwright, expect

async def verify_frontend():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()
        page = await context.new_page()

        print("Loading app...")
        await page.goto("http://localhost:8000")

        # Unlock
        print("Unlocking...")
        await page.fill("#password-input", "test")
        await page.click("#unlock-button")
        await page.wait_for_selector("#app-container", state="visible")

        # We need to inject a note that exercises the image logic to verify visual correctness
        # The 'verify_fix.py' was doing this logic but headless.
        # Here we want to verify the UI *looks* correct.

        # Inject note with small image via evaluate
        await page.evaluate("""async () => {
             const password = "test";
             const imageId = "frontend-test-image";

             // Small red dot image
             const base64Img = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==";

             const encryptedImage = CryptoJS.AES.encrypt(JSON.stringify({ content: base64Img }), password).toString();

             const content = `<p>Visual Verification Note</p><img src="pixel-keep://image/${imageId}" style="width: 50px; height: 50px;"><p>End of Note</p>`;

             const id = 999999;
             const note = {
                 id: id,
                 title: "FRONTEND TEST",
                 content: content,
                 tags: ["test"],
                 audio: null,
                 updatedAt: new Date().toISOString(),
                 order: -999
             };

             const encryptedNote = CryptoJS.AES.encrypt(JSON.stringify(note), password).toString();

             const fsNode = {
                 id: `note-${id}`,
                 parentId: "root_notes",
                 type: "note",
                 name: note.title,
                 order: note.order,
                 itemRefId: id
             };
             const encryptedNode = CryptoJS.AES.encrypt(JSON.stringify(fsNode), password).toString();

             return new Promise((resolve, reject) => {
                 const req = indexedDB.open('PixelPWADatabase');
                 req.onsuccess = (e) => {
                     const db = e.target.result;
                     const tx = db.transaction(['notes', 'fs_nodes', 'images'], 'readwrite');

                     tx.objectStore('notes').put({ id: id, data: encryptedNote });
                     tx.objectStore('fs_nodes').put({ id: fsNode.id, data: encryptedNode });
                     tx.objectStore('images').put({ id: imageId, data: encryptedImage });

                     tx.oncomplete = () => resolve();
                 };
             });
        }""")

        # Reload to apply
        await page.reload()
        await page.fill("#password-input", "test")
        await page.click("#unlock-button")

        # Open the note
        print("Opening note...")
        # Wait for list to render
        await page.wait_for_selector("text=FRONTEND TEST")

        # Click view button
        # The note is order -999 so it should be first
        await page.click(".note-view-btn >> nth=0")

        # Wait for image to render
        await page.wait_for_selector("#note-detail-content img")

        # Wait a bit for image to paint
        await page.wait_for_timeout(500)

        # Screenshot
        print("Taking screenshot...")
        await page.screenshot(path="verification/frontend_verify.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(verify_frontend())
