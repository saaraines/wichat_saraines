const puppeteer = require('puppeteer');
const { defineFeature, loadFeature } = require('jest-cucumber');
const setDefaultOptions = require('expect-puppeteer').setDefaultOptions;
const axios = require('axios');
const feature = loadFeature('./features/stats.feature');

let page;
let browser;

const apiEndpoint = 'http://localhost:8000';

async function createUserAndLogin(page, username, password) {
    // Create user via API
    try {
        await axios.post(`${apiEndpoint}/adduser`, { username, password });
    } catch (error) {
        // User might exist
    }

    // Get token via API
    const loginResponse = await axios.post(`${apiEndpoint}/login`, { username, password });
    const token = loginResponse.data.token;

    // Set token in browser localStorage
    await page.goto("http://localhost:3000", { waitUntil: "networkidle0" });
    await page.evaluate((token) => {
        localStorage.setItem('token', token);
    }, token);
    await page.evaluate((username) => {
        localStorage.setItem('username', username);
    }, username);

    // Reload to apply login
    await page.goto("http://localhost:3000/stats", { waitUntil: "networkidle0", timeout: 20000 });
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
            await createUserAndLogin(page, username, password);
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

    afterEach(async () => {
        // Logout after each test
        await page.evaluate(() => {
            localStorage.clear();
        });
    });

    afterAll(async () => {
        if (browser) {
            await browser.close();
        }
    });

});