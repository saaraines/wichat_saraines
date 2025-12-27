const puppeteer = require('puppeteer');
const { defineFeature, loadFeature } = require('jest-cucumber');
const setDefaultOptions = require('expect-puppeteer').setDefaultOptions;
const axios = require('axios');
const feature = loadFeature('./features/register.feature');

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

    test('Register with correct input', ({ given, and, when, then }) => {

        given('I am on the welcome page', async () => {
            await page.waitForSelector('[data-testid="welcome-page"]', { timeout: 5000 });
        });

        and('I click on the register tab', async () => {
            await page.waitForSelector('[data-testid="register-tab"]');
            await page.click('[data-testid="register-tab"]');
            await page.waitForTimeout(500);
            await page.waitForSelector('[data-testid="register-form"]', { timeout: 5000 });
        });

        when(/^I enter username "([^"]*)" and password "([^"]*)" and confirm password "([^"]*)"$/, async (username, password, confirmPassword) => {
            // Generate unique username to avoid conflicts
            const uniqueUsername = username + Date.now();

            // Fill username using React's native setter
            await page.waitForSelector('[data-testid="register-username-field"]', { visible: true });
            await page.evaluate((user, selector) => {
                const input = document.querySelector(selector);
                const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                    window.HTMLInputElement.prototype,
                    'value'
                ).set;
                nativeInputValueSetter.call(input, user);
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
            }, uniqueUsername, '[data-testid="register-username-field"]');
            await page.waitForTimeout(200);

            // Fill password using React's native setter
            await page.waitForSelector('[data-testid="register-password-field"]', { visible: true });
            await page.evaluate((pass, selector) => {
                const input = document.querySelector(selector);
                const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                    window.HTMLInputElement.prototype,
                    'value'
                ).set;
                nativeInputValueSetter.call(input, pass);
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
            }, password, '[data-testid="register-password-field"]');
            await page.waitForTimeout(200);

            // Fill confirm password using React's native setter
            await page.waitForSelector('[data-testid="register-confirm-password-field"]', { visible: true });
            await page.evaluate((confirmPass, selector) => {
                const input = document.querySelector(selector);
                const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                    window.HTMLInputElement.prototype,
                    'value'
                ).set;
                nativeInputValueSetter.call(input, confirmPass);
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
            }, confirmPassword, '[data-testid="register-confirm-password-field"]');
            await page.waitForTimeout(200);
        });

        and('I click the register button', async () => {
            await page.waitForSelector('[data-testid="register-submit-button"]');
            await page.click('[data-testid="register-submit-button"]');
            await page.waitForTimeout(3000);
        });

        then(/^I should see a success message "([^"]*)"$/, async (message) => {
            await page.waitForSelector('[data-testid="register-success-message"]', { timeout: 15000 });
            const successText = await page.$eval('[data-testid="register-success-message"]', el => el.textContent);
            expect(successText).toContain(message);
        });
    });

    test('Register with weak password', ({ given, and, when, then }) => {

        given('I am on the welcome page', async () => {
            await page.waitForSelector('[data-testid="welcome-page"]', { timeout: 5000 });
        });

        and('I click on the register tab', async () => {
            await page.waitForSelector('[data-testid="register-tab"]');
            await page.click('[data-testid="register-tab"]');
            await page.waitForTimeout(500);
            await page.waitForSelector('[data-testid="register-form"]', { timeout: 5000 });
        });

        when(/^I enter username "([^"]*)" and password "([^"]*)" and confirm password "([^"]*)"$/, async (username, password, confirmPassword) => {
            // Fill username
            await page.waitForSelector('[data-testid="register-username-field"]', { visible: true });
            await page.evaluate((user, selector) => {
                const input = document.querySelector(selector);
                const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                    window.HTMLInputElement.prototype,
                    'value'
                ).set;
                nativeInputValueSetter.call(input, user);
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
            }, username, '[data-testid="register-username-field"]');
            await page.waitForTimeout(200);

            // Fill weak password
            await page.waitForSelector('[data-testid="register-password-field"]', { visible: true });
            await page.evaluate((pass, selector) => {
                const input = document.querySelector(selector);
                const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                    window.HTMLInputElement.prototype,
                    'value'
                ).set;
                nativeInputValueSetter.call(input, pass);
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
            }, password, '[data-testid="register-password-field"]');
            await page.waitForTimeout(200);

            // Fill confirm password
            await page.waitForSelector('[data-testid="register-confirm-password-field"]', { visible: true });
            await page.evaluate((confirmPass, selector) => {
                const input = document.querySelector(selector);
                const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                    window.HTMLInputElement.prototype,
                    'value'
                ).set;
                nativeInputValueSetter.call(input, confirmPass);
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
            }, confirmPassword, '[data-testid="register-confirm-password-field"]');
            await page.waitForTimeout(200);
        });

        and('I click the register button', async () => {
            await page.waitForSelector('[data-testid="register-submit-button"]');
            await page.click('[data-testid="register-submit-button"]');
            await page.waitForTimeout(2000);
        });

        then(/^I should see an error message "([^"]*)"$/, async (message) => {
            await page.waitForSelector('[data-testid="register-error-message"]', { timeout: 5000 });
            const errorText = await page.$eval('[data-testid="register-error-message"]', el => el.textContent);
            expect(errorText).toContain(message);
        });
    });

    test('Register with repeated username', ({ given, and, when, then }) => {

        given('I am on the welcome page', async () => {
            await page.waitForSelector('[data-testid="welcome-page"]', { timeout: 5000 });
        });

        and('I click on the register tab', async () => {
            await page.waitForSelector('[data-testid="register-tab"]');
            await page.click('[data-testid="register-tab"]');
            await page.waitForTimeout(500);
            await page.waitForSelector('[data-testid="register-form"]', { timeout: 5000 });
        });

        when(/^I enter username "([^"]*)" and password "([^"]*)" and confirm password "([^"]*)"$/, async (username, password, confirmPassword) => {
            // Create user first to ensure it exists
            await createUser(username, password);

            // Fill username
            await page.waitForSelector('[data-testid="register-username-field"]', { visible: true });
            await page.evaluate((user, selector) => {
                const input = document.querySelector(selector);
                const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                    window.HTMLInputElement.prototype,
                    'value'
                ).set;
                nativeInputValueSetter.call(input, user);
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
            }, username, '[data-testid="register-username-field"]');
            await page.waitForTimeout(200);

            // Fill password
            await page.waitForSelector('[data-testid="register-password-field"]', { visible: true });
            await page.evaluate((pass, selector) => {
                const input = document.querySelector(selector);
                const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                    window.HTMLInputElement.prototype,
                    'value'
                ).set;
                nativeInputValueSetter.call(input, pass);
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
            }, password, '[data-testid="register-password-field"]');
            await page.waitForTimeout(200);

            // Fill confirm password
            await page.waitForSelector('[data-testid="register-confirm-password-field"]', { visible: true });
            await page.evaluate((confirmPass, selector) => {
                const input = document.querySelector(selector);
                const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                    window.HTMLInputElement.prototype,
                    'value'
                ).set;
                nativeInputValueSetter.call(input, confirmPass);
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
            }, confirmPassword, '[data-testid="register-confirm-password-field"]');
            await page.waitForTimeout(200);
        });

        and('I click the register button', async () => {
            await page.waitForSelector('[data-testid="register-submit-button"]');
            await page.click('[data-testid="register-submit-button"]');
            await page.waitForTimeout(2000);
        });

        then(/^I should see an error message "([^"]*)"$/, async (message) => {
            await page.waitForSelector('[data-testid="register-error-message"]', { timeout: 5000 });
            const errorText = await page.$eval('[data-testid="register-error-message"]', el => el.textContent);
            expect(errorText).toContain(message);
        });
    });

    afterAll(async () => {
        await browser.close();
    });

});