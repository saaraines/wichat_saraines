const puppeteer = require('puppeteer');
const { defineFeature, loadFeature } = require('jest-cucumber');
const setDefaultOptions = require('expect-puppeteer').setDefaultOptions;
const feature = loadFeature('./features/blocked-user.feature');

let page;
let browser;

defineFeature(feature, test => {

    beforeAll(async () => {
        browser = process.env.GITHUB_ACTIONS
            ? await puppeteer.launch({ headless: "new", args: ['--no-sandbox', '--disable-setuid-sandbox'] })
            : await puppeteer.launch({ headless: false, slowMo: 50 });
        page = await browser.newPage();
        setDefaultOptions({ timeout: 10000 });
    });

    beforeEach(async () => {
        await page.goto("http://localhost:3000", { waitUntil: "networkidle0" });
        await page.waitForTimeout(500);
    });

    test('Blocked user sees error and is redirected', ({ given, when, and, then }) => {

        given('I am on the welcome page', async () => {
            await page.waitForSelector('[data-testid="welcome-page"]', { timeout: 5000 });
            await page.waitForSelector('[data-testid="login-form"]', { timeout: 5000 });
        });

        when(/^I enter username "([^"]*)" and password "([^"]*)"$/, async (username, password) => {
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
        });

        and('I click the login button', async () => {
            await page.waitForSelector('[data-testid="login-submit-button"]');
            await page.click('[data-testid="login-submit-button"]');
            await page.waitForTimeout(1000);
        });

        then(/^I should see an error message "([^"]*)"$/, async (message) => {
            await page.waitForSelector('[data-testid="login-error-message"]', { timeout: 5000 });
            const errorText = await page.$eval('[data-testid="login-error-message"]', el => el.textContent);
            expect(errorText).toContain(message);
        });

        and('I should be redirected to the blocked page', async () => {
            // Just wait for the redirect to complete
            await page.waitForTimeout(3000);

            // Verify we're on blocked page by URL
            const url = page.url();
            expect(url).toContain('/blocked');
        });
    });

    afterAll(async () => {
        await browser.close();
    });

});