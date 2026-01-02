const puppeteer = require('puppeteer');
const { defineFeature, loadFeature } = require('jest-cucumber');
const setDefaultOptions = require('expect-puppeteer').setDefaultOptions;
const axios = require('axios');
const feature = loadFeature('./features/stats.feature');

let page;
let browser;

const apiEndpoint = 'http://localhost:8000';

async function registerAndLoginUser(page, username, password) {
    // Register via API
    try {
        await axios.post(`${apiEndpoint}/adduser`, { username, password });
    } catch (error) {
        // User might already exist
    }

    // Login via UI
    await page.goto("http://localhost:3000", { waitUntil: "networkidle0", timeout: 20000 });
    await page.waitForSelector('[data-testid="login-username-field"]', { visible: true, timeout: 10000 });

    await page.evaluate((user, selector) => {
        const input = document.querySelector(selector);
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(input, user);
        input.dispatchEvent(new Event('input', { bubbles: true }));
    }, username, '[data-testid="login-username-field"]');

    await page.evaluate((pass, selector) => {
        const input = document.querySelector(selector);
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(input, pass);
        input.dispatchEvent(new Event('input', { bubbles: true }));
    }, password, '[data-testid="login-password-field"]');

    await page.click('[data-testid="login-submit-button"]');
    await page.waitForNavigation({ waitUntil: "networkidle0", timeout: 20000 });
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
            await page.goto("http://localhost:3000/stats", { waitUntil: "networkidle0", timeout: 20000 });
            await page.waitForSelector('[data-testid="user-stats-container"]', { timeout: 10000 });
        });

        then('I should see my total games played', async () => {
            await page.waitForSelector('[data-testid="total-games-card"]', { timeout: 10000 });
            const totalGamesCard = await page.$('[data-testid="total-games-card"]');
            expect(totalGamesCard).not.toBeNull();
        });

        and('I should see my game history', async () => {
            // Check either games table or no games message
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