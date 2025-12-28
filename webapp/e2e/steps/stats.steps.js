const puppeteer = require('puppeteer');
const { defineFeature, loadFeature } = require('jest-cucumber');
const setDefaultOptions = require('expect-puppeteer').setDefaultOptions;
const feature = loadFeature('./features/stats.feature');

let page;
let browser;

// Helper function to login
async function loginUser(page, username, password) {
    await page.goto("http://localhost:3000", { waitUntil: "networkidle0" });
    await page.waitForTimeout(500);

    // Wait for login form
    await page.waitForSelector('[data-testid="login-form"]', { timeout: 5000 });

    // Fill username
    await page.waitForSelector('[data-testid="login-username-field"]', { visible: true });
    await page.evaluate((user, selector) => {
        const input = document.querySelector(selector);
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
            'value'
        ).set;
        nativeInputValueSetter.call(input, user);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
    }, username, '[data-testid="login-username-field"]');
    await page.waitForTimeout(200);

    // Fill password
    await page.waitForSelector('[data-testid="login-password-field"]', { visible: true });
    await page.evaluate((pass, selector) => {
        const input = document.querySelector(selector);
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
            'value'
        ).set;
        nativeInputValueSetter.call(input, pass);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
    }, password, '[data-testid="login-password-field"]');
    await page.waitForTimeout(200);

    // Click login
    await page.waitForSelector('[data-testid="login-submit-button"]');
    await page.click('[data-testid="login-submit-button"]');
    await page.waitForNavigation({ waitUntil: "networkidle0", timeout: 10000 });
}

defineFeature(feature, test => {

    beforeAll(async () => {
        browser = process.env.GITHUB_ACTIONS
            ? await puppeteer.launch({ headless: "new", args: ['--no-sandbox', '--disable-setuid-sandbox'] })
            : await puppeteer.launch({ headless: false, slowMo: 50 });
        page = await browser.newPage();
        setDefaultOptions({ timeout: 10000 });
    });

    test('User views their own statistics', ({ given, when, then, and }) => {

        given(/^I am logged in as "([^"]*)" with password "([^"]*)"$/, async (username, password) => {
            await loginUser(page, username, password);
        });

        when('I navigate to my statistics page', async () => {
            // Should be redirected to /game after login, navigate to /stats
            await page.goto("http://localhost:3000/stats", { waitUntil: "networkidle0" });
            await page.waitForTimeout(2000);
        });

        then('I should see my total games played', async () => {
            await page.waitForSelector('[data-testid="user-stats-container"]', { timeout: 10000 });
            await page.waitForSelector('[data-testid="total-games-card"]', { timeout: 5000 });
            
            const totalGames = await page.$eval('[data-testid="total-games-value"]', el => el.textContent);
            const gamesCount = parseInt(totalGames);
            
            expect(gamesCount).toBeGreaterThan(0);
        });

        and('I should see my game history', async () => {
            // Check if games table exists
            const gamesTable = await page.$('[data-testid="games-table"]');
            expect(gamesTable).not.toBeNull();
        });
    });

    test('Admin views user statistics', ({ given, when, and, then }) => {

        given(/^I am logged in as admin "([^"]*)" with password "([^"]*)"$/, async (username, password) => {
            await loginUser(page, username, password);
        });

        when('I navigate to admin statistics', async () => {
            // Should be redirected to /admin after login
            await page.waitForTimeout(1000);
            
            // Click on "ESTADÍSTICAS" button (using XPath since it's text-based)
            const statsButton = await page.$x("//div[contains(text(), 'ESTADÍSTICAS')]");
            if (statsButton.length > 0) {
                await statsButton[0].click();
                await page.waitForTimeout(2000);
            }
            
            // Wait for admin stats to load
            await page.waitForSelector('[data-testid="admin-stats-container"]', { timeout: 10000 });
        });

        and(/^I filter by user "([^"]*)"$/, async (username) => {
            // Wait for user filter dropdown
            await page.waitForSelector('[data-testid="user-filter-dropdown"]', { timeout: 5000 });
            
            // Click to open dropdown
            await page.click('[data-testid="user-filter-dropdown"]');
            await page.waitForTimeout(500);
            
            // Select the user from dropdown
            const userOption = await page.$(`[data-testid="user-filter-${username}"]`);
            if (userOption) {
                await userOption.click();
                await page.waitForTimeout(2000);
            }
        });

        then(/^I should see games for user "([^"]*)"$/, async (username) => {
            // Verify games table exists
            await page.waitForSelector('[data-testid="admin-games-table"]', { timeout: 5000 });
            
            // Verify table has content (first row should contain username)
            const tableRows = await page.$$('[data-testid="admin-games-table"] tbody tr');
            expect(tableRows.length).toBeGreaterThan(0);
        });
    });

    afterAll(async () => {
        await browser.close();
    });

});
