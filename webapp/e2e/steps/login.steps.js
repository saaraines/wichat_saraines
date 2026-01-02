const puppeteer = require('puppeteer');
const { defineFeature, loadFeature } = require('jest-cucumber');
const setDefaultOptions = require('expect-puppeteer').setDefaultOptions;
const axios = require('axios');
const feature = loadFeature('./features/login.feature');

let page;
let browser;

const apiEndpoint = 'http://localhost:8000';

async function registerUser(page, username, password) {
    await page.goto("http://localhost:3000", { waitUntil: "networkidle0" });

    // Click on register tab
    await page.waitForSelector('[data-testid="register-tab"]');
    await page.click('[data-testid="register-tab"]');
    await page.waitForTimeout(300);

    // Fill username
    await page.waitForSelector('[data-testid="register-username-field"]', { visible: true });
    await page.evaluate((user, selector) => {
        const input = document.querySelector(selector);
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(input, user);
        input.dispatchEvent(new Event('input', { bubbles: true }));
    }, username, '[data-testid="register-username-field"]');

    // Fill password
    await page.evaluate((pass, selector) => {
        const input = document.querySelector(selector);
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(input, pass);
        input.dispatchEvent(new Event('input', { bubbles: true }));
    }, password, '[data-testid="register-password-field"]');

    // Fill confirm password
    await page.evaluate((pass, selector) => {
        const input = document.querySelector(selector);
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(input, pass);
        input.dispatchEvent(new Event('input', { bubbles: true }));
    }, password, '[data-testid="register-confirm-password-field"]');

    // Click register
    await page.click('[data-testid="register-submit-button"]');
    await page.waitForTimeout(2000);
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
            // Register user first
            await registerUser(page, username, password);

            // Now go back to login page
            await page.goto("http://localhost:3000", { waitUntil: "networkidle0" });
            await page.waitForSelector('[data-testid="login-form"]', { timeout: 5000 });

            // Fill username
            await page.waitForSelector('[data-testid="login-username-field"]', { visible: true });
            await page.evaluate((user, selector) => {
                const input = document.querySelector(selector);
                const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                setter.call(input, user);
                input.dispatchEvent(new Event('input', { bubbles: true }));
            }, username, '[data-testid="login-username-field"]');

            // Fill password
            await page.evaluate((pass, selector) => {
                const input = document.querySelector(selector);
                const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                setter.call(input, pass);
                input.dispatchEvent(new Event('input', { bubbles: true }));
            }, password, '[data-testid="login-password-field"]');
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
            // Register user with correct password
            await registerUser(page, username, 'CorrectPass123');

            // Go back to login
            await page.goto("http://localhost:3000", { waitUntil: "networkidle0" });
            await page.waitForSelector('[data-testid="login-form"]', { timeout: 5000 });

            // Fill username
            await page.waitForSelector('[data-testid="login-username-field"]', { visible: true });
            await page.evaluate((user, selector) => {
                const input = document.querySelector(selector);
                const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                setter.call(input, user);
                input.dispatchEvent(new Event('input', { bubbles: true }));
            }, username, '[data-testid="login-username-field"]');

            // Fill WRONG password
            await page.evaluate((pass, selector) => {
                const input = document.querySelector(selector);
                const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                setter.call(input, pass);
                input.dispatchEvent(new Event('input', { bubbles: true }));
            }, password, '[data-testid="login-password-field"]');
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