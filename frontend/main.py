from playwright import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch()
    context = browser.newContext()
    page = context.newPage()
    page.goto("(link unavailable)")
    browser.close()
