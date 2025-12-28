const puppeteer = require('puppeteer');
const { defineFeature, loadFeature } = require('jest-cucumber');
const setDefaultOptions = require('expect-puppeteer').setDefaultOptions;
const axios = require('axios');
const feature = loadFeature('./features/login.feature');

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

defineFeature(feature, test => {

    beforeAll(async () => {
        browser = process.env.GITHUB_ACTIONS
            ? await puppeteer.launch({ headless: "new", args: ['--no-sandbox', '--disable-setuid-sandbox'] })
            : await puppeteer.launch({ headless: false, slowMo: 50 });
        page = await browser.newPage();
        setDefaultOptions({ timeout: 10000 });
    });

    beforeEach(async () => {
        // Navigate to welcome page before each test
        await page.goto("http://localhost:3000", { waitUntil: "networkidle0" });
        await page.waitForTimeout(500);
    });

    test('Login with correct credentials', ({ given, when, and, then }) => {

        given('I am on the welcome page', async () => {
            await page.waitForSelector('[data-testid="welcome-page"]', { timeout: 5000 });
            await page.waitForSelector('[data-testid="login-form"]', { timeout: 5000 });
        });

        when(/^I enter username "([^"]*)" and password "([^"]*)"$/, async (username, password) => {
            // Create user first
            await createUser(username, password);

            // Fill username using React's native setter
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

            // Fill password using React's native setter
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
        });

        and('I click the login button', async () => {
            await page.waitForSelector('[data-testid="login-submit-button"]');
            await page.click('[data-testid="login-submit-button"]');
            await page.waitForNavigation({ waitUntil: "networkidle0", timeout: 10000 });
        });

        then(/^I should be redirected to "([^"]*)"$/, async (path) => {
            const url = page.url();
            expect(url).toContain(path);
        });
    });

    test('Login with incorrect credentials', ({ given, when, and, then }) => {

        given('I am on the welcome page', async () => {
            await page.waitForSelector('[data-testid="welcome-page"]', { timeout: 5000 });
            await page.waitForSelector('[data-testid="login-form"]', { timeout: 5000 });
        });

        when(/^I enter username "([^"]*)" and password "([^"]*)"$/, async (username, password) => {
            // Create user with different password
            await createUser(username, 'CorrectPass123');

            // Fill username using React's native setter
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

            // Fill wrong password using React's native setter
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
        });

        and('I click the login button', async () => {
            await page.waitForSelector('[data-testid="login-submit-button"]');
            await page.click('[data-testid="login-submit-button"]');
            await page.waitForTimeout(2000);
        });

        then(/^I should see an error message "([^"]*)"$/, async (message) => {
            await page.waitForSelector('[data-testid="login-error-message"]', { timeout: 5000 });
            const errorText = await page.$eval('[data-testid="login-error-message"]', el => el.textContent);
            expect(errorText).toContain(message);
        });
    });

    afterAll(async () => {
        await browser.close();
    });

});