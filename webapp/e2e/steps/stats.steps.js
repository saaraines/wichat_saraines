const puppeteer = require('puppeteer');
const { defineFeature, loadFeature } = require('jest-cucumber');
const setDefaultOptions = require('expect-puppeteer').setDefaultOptions;
const feature = loadFeature('./features/stats.feature');

let page;
let browser;

async function registerAndLogin(page, username, password) {
    // Go to homepage
    await page.goto("http://localhost:3000", { waitUntil: "networkidle0" });

    // Register
    await page.waitForSelector('[data-testid="register-tab"]');
    await page.click('[data-testid="register-tab"]');
    await page.waitForTimeout(300);

    await page.waitForSelector('[data-testid="register-username-field"]', { visible: true });
    await page.evaluate((user) => {
        const input = document.querySelector('[data-testid="register-username-field"]');
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(input, user);
        input.dispatchEvent(new Event('input', { bubbles: true }));
    }, username);

    await page.evaluate((pass) => {
        const input = document.querySelector('[data-testid="register-password-field"]');
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(input, pass);
        input.dispatchEvent(new Event('input', { bubbles: true }));
    }, password);

    await page.evaluate((pass) => {
        const input = document.querySelector('[data-testid="register-confirm-password-field"]');
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(input, pass);
        input.dispatchEvent(new Event('input', { bubbles: true }));
    }, password);

    await page.click('[data-testid="register-submit-button"]');
    await page.waitForTimeout(3000);

    // Login - redirects to /game
    await page.goto("http://localhost:3000", { waitUntil: "networkidle0" });
    await page.waitForSelector('[data-testid="login-username-field"]', { visible: true });

    await page.evaluate((user) => {
        const input = document.querySelector('[data-testid="login-username-field"]');
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(input, user);
        input.dispatchEvent(new Event('input', { bubbles: true }));
    }, username);

    await page.evaluate((pass) => {
        const input = document.querySelector('[data-testid="login-password-field"]');
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(input, pass);
        input.dispatchEvent(new Event('input', { bubbles: true }));
    }, password);

    await page.click('[data-testid="login-submit-button"]');

    // Wait a bit for login to process
    await page.waitForTimeout(2000);

    // Navigate directly to stats (don't wait for automatic redirect to /game)
    await page.goto("http://localhost:3000/stats", { waitUntil: "networkidle0" });
    await page.waitForSelector('[data-testid="total-games-card"]', { timeout: 15000 });
}

defineFeature(feature, test => {

    beforeAll(async () => {
        browser = process.env.GITHUB_ACTIONS
            ? await puppeteer.launch({ headless: "new", args: ['--no-sandbox', '--disable-setuid-sandbox'] })
            : await puppeteer.launch({ headless: false, slowMo: 50 });
        page = await browser.newPage();
        setDefaultOptions({ timeout: 15000 });
    });

    test('User views their own statistics', ({ given, when, then, and }) => {

        given(/^I am logged in as "([^"]*)" with password "([^"]*)"$/, async (username, password) => {
            await registerAndLogin(page, username, password);
        });

        when('I navigate to my statistics page', async () => {
            // Already on stats page from registerAndLogin
        });

        then('I should see my total games played', async () => {
            await page.waitForSelector('[data-testid="total-games-card"]', { timeout: 10000 });
            const totalGamesCard = await page.$('[data-testid="total-games-card"]');
            expect(totalGamesCard).not.toBeNull();
        });

        and('I should see my game history', async () => {
            const gamesTable = await page.$('[data-testid="games-table"]');
            const noGamesMessage = await page.$('[data-testid="no-games-message"]');
            expect(gamesTable !== null || noGamesMessage !== null).toBe(true);
        });
    });

    afterAll(async () => {
        if (browser) {
            await browser.close();
        }
    });

});