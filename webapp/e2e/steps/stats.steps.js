const puppeteer = require('puppeteer');
const { defineFeature, loadFeature } = require('jest-cucumber');
const setDefaultOptions = require('expect-puppeteer').setDefaultOptions;
const feature = loadFeature('./features/stats.feature');

let page;
let browser;

async function loginUser(page, username, password) {
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

    test('User views their own statistics', ({ given, when, then, and }) => {

        given(/^I am logged in as "([^"]*)" with password "([^"]*)"$/, async (username, password) => {
            await loginUser(page, username, password);
        });

        when('I navigate to my statistics page', async () => {
            await page.goto("http://localhost:3000/stats", { waitUntil: "networkidle0" });
            await page.waitForSelector('[data-testid="user-stats-container"]');
        });

        then('I should see my total games played', async () => {
            await page.waitForSelector('[data-testid="total-games-card"]');
            const totalGamesCard = await page.$('[data-testid="total-games-card"]');
            expect(totalGamesCard).not.toBeNull();
        });

        and('I should see my game history', async () => {
            const gamesTable = await page.$('[data-testid="games-table"]');
            const noGamesMessage = await page.$('[data-testid="no-games-message"]');
            expect(gamesTable !== null || noGamesMessage !== null).toBe(true);
        });
    });

    test('Admin views user statistics', ({ given, when, and, then }) => {

        given(/^I am logged in as admin "([^"]*)" with password "([^"]*)"$/, async (username, password) => {
            await loginUser(page, username, password);
        });

        when('I navigate to admin statistics', async () => {
            // Wait for dashboard to load
            await page.waitForSelector('[data-testid="admin-dashboard"]');

            // Click on stats button
            await page.waitForSelector('[data-testid="admin-stats-button"]');
            await page.click('[data-testid="admin-stats-button"]');

            // Wait for stats page to load
            await page.waitForSelector('[data-testid="admin-stats-container"]');
        });

        and(/^I filter by user "([^"]*)"$/, async (username) => {
            await page.waitForSelector('[data-testid="user-filter-dropdown"]');
            await page.click('[data-testid="user-filter-dropdown"]');
            await page.waitForTimeout(500);

            const userOption = await page.$(`[data-testid="user-filter-${username}"]`);
            if (userOption) {
                await userOption.click();
                await page.waitForTimeout(500);
            }
        });

        then(/^I should see games for user "([^"]*)"$/, async (username) => {
            await page.waitForTimeout(500);
            const gamesTable = await page.$('[data-testid="admin-games-table"]');
            const noDataInfo = await page.$('div[role="alert"]');
            expect(gamesTable !== null || noDataInfo !== null).toBe(true);
        });
    });

    afterAll(async () => {
        if (browser) {
            await browser.close();
        }
    });

});