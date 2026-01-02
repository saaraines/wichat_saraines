const puppeteer = require('puppeteer');
const { defineFeature, loadFeature } = require('jest-cucumber');
const setDefaultOptions = require('expect-puppeteer').setDefaultOptions;
const axios = require('axios');
const feature = loadFeature('./features/game.feature');

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
    await page.goto("http://localhost:3000/game", { waitUntil: "networkidle0", timeout: 20000 });
}

defineFeature(feature, test => {

    beforeAll(async () => {
        browser = process.env.GITHUB_ACTIONS
            ? await puppeteer.launch({ headless: "new", args: ['--no-sandbox', '--disable-setuid-sandbox'] })
            : await puppeteer.launch({ headless: false, slowMo: 50 });
        page = await browser.newPage();
        setDefaultOptions({ timeout: 15000 });
    });

    test('Start a game and view first question', ({ given, when, and, then }) => {

        given(/^I am logged in as "([^"]*)" with password "([^"]*)"$/, async (username, password) => {
            await createUserAndLogin(page, username, password);
        });

        when(/^I select category "([^"]*)"$/, async (category) => {
            await page.waitForSelector('[data-testid="game-start-screen"]', { timeout: 10000 });

            const categoryMap = {
                'Capitales': 'capitales',
                'Banderas': 'banderas',
                'Monumentos': 'monumentos'
            };
            const categoryKey = categoryMap[category];

            await page.waitForSelector(`[data-testid="category-${categoryKey}-button"]`, { timeout: 10000 });
            await page.click(`[data-testid="category-${categoryKey}-button"]`);
        });

        and('I click start game', async () => {
            await page.waitForSelector('[data-testid="start-game-button"]', { timeout: 10000 });
            await page.click('[data-testid="start-game-button"]');
            await page.waitForSelector('[data-testid="game-playing-screen"]', { timeout: 60000 });
        });

        then('I should see the game screen', async () => {
            const playingScreen = await page.$('[data-testid="game-playing-screen"]');
            expect(playingScreen).not.toBeNull();
        });

        and('I should see a question', async () => {
            await page.waitForSelector('[data-testid="time-left"]', { timeout: 10000 });
            const timer = await page.$('[data-testid="time-left"]');
            expect(timer).not.toBeNull();
        });
    });

    test('Use hint system', ({ given, and, when, then }) => {

        given(/^I am logged in as "([^"]*)" with password "([^"]*)"$/, async (username, password) => {
            await createUserAndLogin(page, username, password);
        });

        and('I have started a game', async () => {
            await page.waitForSelector('[data-testid="game-start-screen"]', { timeout: 10000 });
            await page.waitForSelector('[data-testid="category-capitales-button"]', { timeout: 10000 });
            await page.click('[data-testid="category-capitales-button"]');

            await page.waitForSelector('[data-testid="start-game-button"]', { timeout: 10000 });
            await page.click('[data-testid="start-game-button"]');
            await page.waitForSelector('[data-testid="game-playing-screen"]', { timeout: 60000 });
        });

        when('I click the hint button', async () => {
            await page.waitForSelector('[data-testid="hint-button"]', { timeout: 10000 });
            await page.click('[data-testid="hint-button"]');
        });

        then('The hint chat should open', async () => {
            await page.waitForSelector('[data-testid="hint-chat-window"]', { timeout: 10000 });
            const hintChat = await page.$('[data-testid="hint-chat-window"]');
            expect(hintChat).not.toBeNull();
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