const puppeteer = require('puppeteer');
const { defineFeature, loadFeature } = require('jest-cucumber');
const setDefaultOptions = require('expect-puppeteer').setDefaultOptions;
const axios = require('axios');
const feature = loadFeature('./features/game.feature');

let page;
let browser;

const apiEndpoint = 'http://localhost:8000';

// Helper function to create a user via API
async function createUser(username, password) {
    try {
        await axios.post(`${apiEndpoint}/adduser`, { username, password });
    } catch (error) {
        // User might already exist, ignore error
    }
}

// Helper function to login
async function loginUser(username, password) {
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

    test('Start a game and view first question', ({ given, when, and, then }) => {

        given(/^I am logged in as "([^"]*)" with password "([^"]*)"$/, async (username, password) => {
            await createUser(username, password);
            await loginUser(username, password);
        });

        when(/^I select category "([^"]*)"$/, async (category) => {
            await page.waitForSelector('[data-testid="game-start-screen"]', { timeout: 5000 });

            // Click on the category button
            const categoryMap = {
                'Capitales': 'capitales',
                'Banderas': 'banderas',
                'Monumentos': 'monumentos'
            };
            const categoryKey = categoryMap[category];
            await page.waitForSelector(`[data-testid="category-${categoryKey}-button"]`);
            await page.click(`[data-testid="category-${categoryKey}-button"]`);
            await page.waitForTimeout(500);
        });

        and('I click start game', async () => {
            await page.waitForSelector('[data-testid="start-game-button"]');
            await page.click('[data-testid="start-game-button"]');
            await page.waitForTimeout(5000); // Wait for game to load questions
        });

        then('I should see the game screen', async () => {
            await page.waitForSelector('[data-testid="game-playing-screen"]', { timeout: 10000 });
            const playingScreen = await page.$('[data-testid="game-playing-screen"]');
            expect(playingScreen).not.toBeNull();
        });

        and('I should see a question', async () => {
            await page.waitForSelector('[data-testid="question-card"]', { timeout: 5000 });
            const questionCard = await page.$('[data-testid="question-card"]');
            expect(questionCard).not.toBeNull();

            await page.waitForSelector('[data-testid="question-text"]', { timeout: 5000 });
            const questionText = await page.$eval('[data-testid="question-text"]', el => el.textContent);
            expect(questionText.length).toBeGreaterThan(0);
        });
    });

    test('Use hint system', ({ given, and, when, then }) => {

        given(/^I am logged in as "([^"]*)" with password "([^"]*)"$/, async (username, password) => {
            await createUser(username, password);
            await loginUser(username, password);
        });

        and('I have started a game', async () => {
            await page.waitForSelector('[data-testid="game-start-screen"]', { timeout: 5000 });

            // Select category and start
            await page.waitForSelector('[data-testid="category-capitales-button"]');
            await page.click('[data-testid="category-capitales-button"]');
            await page.waitForTimeout(500);

            await page.waitForSelector('[data-testid="start-game-button"]');
            await page.click('[data-testid="start-game-button"]');
            await page.waitForTimeout(5000); // Wait for game to load

            await page.waitForSelector('[data-testid="game-playing-screen"]', { timeout: 10000 });
        });

        when('I click the hint button', async () => {
            await page.waitForSelector('[data-testid="hint-button"]', { timeout: 5000 });
            await page.click('[data-testid="hint-button"]');
            await page.waitForTimeout(1000);
        });

        then('The hint chat should open', async () => {
            await page.waitForSelector('[data-testid="hint-chat-window"]', { timeout: 5000 });
            const hintChat = await page.$('[data-testid="hint-chat-window"]');
            expect(hintChat).not.toBeNull();

            // Verify chat elements exist
            const chatHeader = await page.$('[data-testid="hint-chat-header"]');
            expect(chatHeader).not.toBeNull();

            const chatMessages = await page.$('[data-testid="hint-chat-messages"]');
            expect(chatMessages).not.toBeNull();

            const chatInput = await page.$('[data-testid="hint-chat-input"]');
            expect(chatInput).not.toBeNull();
        });
    });

    afterAll(async () => {
        await browser.close();
    });

});