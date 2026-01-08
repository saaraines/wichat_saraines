const puppeteer = require('puppeteer');
const { defineFeature, loadFeature } = require('jest-cucumber');
const setDefaultOptions = require('expect-puppeteer').setDefaultOptions;
const feature = loadFeature('./features/blocked-user.feature');

let page;
let browser;

defineFeature(feature, test => {

    beforeAll(async () => {
        browser = await puppeteer.launch({ headless: false, slowMo: 50 });
        page = await browser.newPage();
        setDefaultOptions({ timeout: 10000 });
    });

    test('Usuario bloqueado intenta hacer login', ({ given, when, and, then }) => {

        given('estoy en la página de bienvenida', async () => {
            await page.goto("http://localhost:3000", { waitUntil: "networkidle0" });
            await page.waitForSelector('[data-testid="welcome-page"]', { timeout: 5000 });
            await page.waitForSelector('[data-testid="login-form"]', { timeout: 5000 });
        });

        when(/^ingreso usuario "([^"]*)" y contraseña "([^"]*)"$/, async (username, password) => {
            // Llenar username
            await page.waitForSelector('[data-testid="login-username-field"]', { visible: true });
            await page.evaluate((user, selector) => {
                const input = document.querySelector(selector);
                const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                setter.call(input, user);
                input.dispatchEvent(new Event('input', { bubbles: true }));
            }, username, '[data-testid="login-username-field"]');

            // Llenar password
            await page.evaluate((pass, selector) => {
                const input = document.querySelector(selector);
                const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                setter.call(input, pass);
                input.dispatchEvent(new Event('input', { bubbles: true }));
            }, password, '[data-testid="login-password-field"]');
        });

        and('hago clic en el botón de login', async () => {
            await page.waitForSelector('[data-testid="login-submit-button"]');
            await page.click('[data-testid="login-submit-button"]');
            await page.waitForTimeout(1000);
        });

        then('debería ver un mensaje de error de cuenta bloqueada', async () => {
            await page.waitForSelector('[data-testid="login-error-message"]', { timeout: 5000 });
            const errorText = await page.$eval('[data-testid="login-error-message"]', el => el.textContent);
            expect(errorText).toContain('bloqueada');
        });

        and('debería ser redirigido a la página de bloqueado', async () => {
            // Esperar la redirección (el Login.js tiene un timeout de 2000ms)
            await page.waitForTimeout(2500);
            const url = page.url();
            expect(url).toContain('/blocked');
        });
    });

    afterAll(async () => {
        await browser.close();
    });

});
