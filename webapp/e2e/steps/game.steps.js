const puppeteer = require('puppeteer');
const { defineFeature, loadFeature } = require('jest-cucumber');
const setDefaultOptions = require('expect-puppeteer').setDefaultOptions;
const feature = loadFeature('./features/game.feature');

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

    // Login
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
    await page.waitForTimeout(3000);

    // Navigate to game page manually
    await page.goto("http://localhost:3000/game", { waitUntil: "networkidle0" });
    await page.waitForSelector('[data-testid="game-start-screen"]', { timeout: 10000 });
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
            await registerAndLogin(page, username, password);
        });

        when(/^I select category "([^"]*)"$/, async (category) => {
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
            await registerAndLogin(page, username, password);
        });

        and('I have started a game', async () => {
            await page.waitForSelector('[data-testid="category-capitales-button"]');
            await page.click('[data-testid="category-capitales-button"]');

            await page.waitForSelector('[data-testid="start-game-button"]');
            await page.click('[data-testid="start-game-button"]');
            await page.waitForSelector('[data-testid="game-playing-screen"]', { timeout: 60000 });
        });

        when('I click the hint button', async () => {
            await page.waitForSelector('[data-testid="hint-button"]');
            await page.click('[data-testid="hint-button"]');
        });

        then('The hint chat should open', async () => {
            await page.waitForSelector('[data-testid="hint-chat-window"]', { timeout: 10000 });
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