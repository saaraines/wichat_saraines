const puppeteer = require('puppeteer');
const { defineFeature, loadFeature } = require('jest-cucumber');
const setDefaultOptions = require('expect-puppeteer').setDefaultOptions;
const feature = loadFeature('./features/stats.feature');

let page;
let browser;

async function registerAndLoginUser(page, username, password) {
    // Go to welcome page
    await page.goto("http://localhost:3000", { waitUntil: "load", timeout: 20000 });

    // Register
    await page.waitForSelector('[data-testid="register-tab"]', { timeout: 10000 });
    await page.click('[data-testid="register-tab"]');
    await page.waitForTimeout(300);

    await page.waitForSelector('[data-testid="register-username-field"]', { visible: true });
    await page.type('[data-testid="register-username-field"]', username);
    await page.type('[data-testid="register-password-field"]', password);
    await page.type('[data-testid="register-confirm-password-field"]', password);

    await page.click('[data-testid="register-submit-button"]');
    await page.waitForTimeout(3000);

    // Go back and login
    await page.goto("http://localhost:3000", { waitUntil: "load", timeout: 20000 });
    await page.waitForSelector('[data-testid="login-username-field"]', { visible: true });

    await page.type('[data-testid="login-username-field"]', username);
    await page.type('[data-testid="login-password-field"]', password);

    await page.click('[data-testid="login-submit-button"]');

    // Wait for game page to load
    await page.waitForSelector('[data-testid="game-start-screen"]', { timeout: 20000 });

    // Navigate to stats
    await page.goto("http://localhost:3000/stats", { waitUntil: "load", timeout: 20000 });
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
            await registerAndLoginUser(page, username, password);
        });

        when('I navigate to my statistics page', async () => {
            await page.waitForSelector('[data-testid="user-stats-container"]', { timeout: 10000 });
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