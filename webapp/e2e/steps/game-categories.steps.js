const puppeteer = require('puppeteer');
const { defineFeature, loadFeature } = require('jest-cucumber');
const setDefaultOptions = require('expect-puppeteer').setDefaultOptions;
const feature = loadFeature('./features/game-categories.feature');

let page;
let browser;

async function login(username, password) {
    await page.goto("http://localhost:3000", { waitUntil: "networkidle0" });
    await page.waitForSelector('[data-testid="login-username-field"]', { visible: true });

    await page.evaluate((user, selector) => {
        const input = document.querySelector(selector);
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(input, user);
        input.dispatchEvent(new Event('input', { bubbles: true }));
    }, username, '[data-testid="login-username-field"]');

    await page.evaluate((pass, selector) => {
        const input = document.querySelector(selector);
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(input, pass);
        input.dispatchEvent(new Event('input', { bubbles: true }));
    }, password, '[data-testid="login-password-field"]');

    await page.click('[data-testid="login-submit-button"]');
    await page.waitForNavigation({ waitUntil: "networkidle0", timeout: 10000 });
}

async function selectCategory(category) {
    const buttonMap = {
        'Capitales': '[data-testid="category-capitales-button"]',
        'Banderas': '[data-testid="category-banderas-button"]',
        'Monumentos': '[data-testid="category-monumentos-button"]'
    };

    const buttonSelector = buttonMap[category];
    await page.waitForSelector(buttonSelector, { timeout: 5000 });
    await page.click(buttonSelector);
    await page.waitForTimeout(500);
}

function getCategoryKeywords(category) {
    const keywords = {
        'Capitales': ['capital', 'Capital', 'CAPITAL'],
        'Banderas': ['bandera', 'Bandera', 'BANDERA'],
        'Monumentos': ['monumento', 'Monumento', 'MONUMENTO']
    };
    return keywords[category] || [];
}

defineFeature(feature, test => {

    beforeAll(async () => {
        browser = await puppeteer.launch({ headless: false, slowMo: 30 });
        page = await browser.newPage();
        setDefaultOptions({ timeout: 15000 });
    });

    test('Jugar en categoría Capitales', ({ given, when, and, then }) => {

        given(/^he iniciado sesión como "([^"]*)"$/, async (username) => {
            await login(username, 'hola');
        });

        when(/^selecciono la categoría "([^"]*)"$/, async (category) => {
            await selectCategory(category);
        });

        and('inicio el juego', async () => {
            await page.waitForSelector('[data-testid="start-game-button"]', { timeout: 5000 });
            await page.click('[data-testid="start-game-button"]');
            await page.waitForTimeout(3000);
        });

        then('debería ver una pregunta de categoría Capitales', async () => {
            await page.waitForSelector('[data-testid="question-text"]', { timeout: 5000 });
            const questionText = await page.$eval('[data-testid="question-text"]', el => el.textContent);

            const keywords = getCategoryKeywords('Capitales');
            const hasKeyword = keywords.some(keyword => questionText.includes(keyword));

            expect(hasKeyword).toBe(true);
        });

        and('debería poder ver la imagen de la pregunta', async () => {
            const image = await page.$('[data-testid="question-image"]');
            expect(image).toBeTruthy();
        });

        and('debería ver 4 opciones de respuesta', async () => {
            const options = await page.$$('[data-testid^="answer-option-"]');
            expect(options.length).toBe(4);
        });
    });

    test('Jugar en categoría Banderas', ({ given, when, and, then }) => {

        given(/^he iniciado sesión como "([^"]*)"$/, async (username) => {
            await login(username, 'hola');
        });

        when(/^selecciono la categoría "([^"]*)"$/, async (category) => {
            await selectCategory(category);
        });

        and('inicio el juego', async () => {
            await page.waitForSelector('[data-testid="start-game-button"]', { timeout: 5000 });
            await page.click('[data-testid="start-game-button"]');
            await page.waitForTimeout(3000);
        });

        then('debería ver una pregunta de categoría Banderas', async () => {
            await page.waitForSelector('[data-testid="question-text"]', { timeout: 5000 });
            const questionText = await page.$eval('[data-testid="question-text"]', el => el.textContent);

            const keywords = getCategoryKeywords('Banderas');
            const hasKeyword = keywords.some(keyword => questionText.includes(keyword));

            expect(hasKeyword).toBe(true);
        });

        and('debería poder ver la imagen de la pregunta', async () => {
            const image = await page.$('[data-testid="question-image"]');
            expect(image).toBeTruthy();
        });

        and('debería ver 4 opciones de respuesta', async () => {
            const options = await page.$$('[data-testid^="answer-option-"]');
            expect(options.length).toBe(4);
        });
    });

    afterAll(async () => {
        await browser.close();
    });

});