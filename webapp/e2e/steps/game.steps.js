const puppeteer = require('puppeteer');
const { defineFeature, loadFeature } = require('jest-cucumber');
const setDefaultOptions = require('expect-puppeteer').setDefaultOptions;
const axios = require('axios');
const feature = loadFeature('./features/game.feature');

let page;
let browser;

const apiEndpoint = 'http://localhost:8000';

async function createUser(username, password) {
    try {
        await axios.post(`${apiEndpoint}/adduser`, { username, password });
    } catch (error) {
        // User might already exist
    }
}

async function loginUser(username, password) {
    await page.goto("http://localhost:3000", { waitUntil: "networkidle0" });

    await page.waitForSelector('[data-testid="login-form"]');
    await page.waitForSelector('[data-testid="login-username-field"]', { visible: true });

    await page.evaluate((user, selector) => {
        const input = document.querySelector(selector);
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(input, user);
        input.dispatchEvent(new Event('input', { bubbles: true }));
    }, username, '[data-testid="login-username-field"]');

    await page.waitForSelector('[data-testid="login-password-field"]', { visible: true });
    await page.evaluate((pass, selector) => {
        const input = document.querySelector(selector);
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(input, pass);
        input.dispatchEvent(new Event('input', { bubbles: true }));
    }, password, '[data-testid="login-password-field"]');

    await page.waitForSelector('[data-testid="login-submit-button"]');
    await page.click('[data-testid="login-submit-button"]');
    await page.waitForNavigation({ waitUntil: "networkidle0" });
}

defineFeature(feature, test => {

    beforeAll(async () => {
        browser = process.env.GITHUB_ACTIONS
            ? await puppeteer.launch({ headless: "new", args: ['--no-sandbox', '--disable-setuid-sandbox'] })
            : await puppeteer.launch({ headless: false, slowMo: 50 });
        page = await browser.newPage();
        setDefaultOptions({ timeout: 10000 });
    });

    test('Start a game and view first question', ({ given, when, and, then }) => {

        given(/^I am logged in as "([^"]*)" with password "([^"]*)"$/, async (username, password) => {
            await createUser(username, password);
            await loginUser(username, password);
        });

        when(/^I select category "([^"]*)"$/, async (category) => {
            await page.waitForSelector('[data-testid="game-start-screen"]');

            const categoryMap = {
                'Capitales': 'capitales',
                'Banderas': 'banderas',
                'Monumentos': 'monumentos'
            };
            const categoryKey = categoryMap[category];

            await page.waitForSelector(`[data-testid="category-${categoryKey}-button"]`);
            await page.click(`[data-testid="category-${categoryKey}-button"]`);
        });

        and('I click start game', async () => {
            await page.waitForSelector('[data-testid="start-game-button"]');
            await page.click('[data-testid="start-game-button"]');
            await page.waitForSelector('[data-testid="game-playing-screen"]', { timeout: 30000 });
        });

        then('I should see the game screen', async () => {
            const playingScreen = await page.$('[data-testid="game-playing-screen"]');
            expect(playingScreen).not.toBeNull();
        });

        and('I should see a question', async () => {
            await page.waitForSelector('[data-testid="question-card"]');
            const questionCard = await page.$('[data-testid="question-card"]');
            expect(questionCard).not.toBeNull();
        });
    });

    test('Use hint system', ({ given, and, when, then }) => {

        given(/^I am logged in as "([^"]*)" with password "([^"]*)"$/, async (username, password) => {
            await createUser(username, password);
            await loginUser(username, password);
        });

        and('I have started a game', async () => {
            await page.waitForSelector('[data-testid="game-start-screen"]');
            await page.waitForSelector('[data-testid="category-capitales-button"]');
            await page.click('[data-testid="category-capitales-button"]');

            await page.waitForSelector('[data-testid="start-game-button"]');
            await page.click('[data-testid="start-game-button"]');
            await page.waitForSelector('[data-testid="game-playing-screen"]', { timeout: 30000 });
        });

        when('I click the hint button', async () => {
            await page.waitForSelector('[data-testid="hint-button"]');
            await page.click('[data-testid="hint-button"]');
        });

        then('The hint chat should open', async () => {
            await page.waitForSelector('[data-testid="hint-chat-window"]');
            const hintChat = await page.$('[data-testid="hint-chat-window"]');
            expect(hintChat).not.toBeNull();
        });
    });

    afterAll(async () => {
        if (browser) {
            await browser.close();
        }
    });

});