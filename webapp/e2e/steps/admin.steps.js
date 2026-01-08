const puppeteer = require('puppeteer');
const { defineFeature, loadFeature } = require('jest-cucumber');
const setDefaultOptions = require('expect-puppeteer').setDefaultOptions;
const feature = loadFeature('./features/admin.feature');

let page;
let browser;

async function loginAsAdmin() {
    await page.goto("http://localhost:3000", { waitUntil: "networkidle0" });
    await page.waitForSelector('[data-testid="login-username-field"]', { visible: true });
    
    await page.evaluate((user, selector) => {
        const input = document.querySelector(selector);
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(input, user);
        input.dispatchEvent(new Event('input', { bubbles: true }));
    }, 'admin', '[data-testid="login-username-field"]');

    await page.evaluate((pass, selector) => {
        const input = document.querySelector(selector);
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(input, pass);
        input.dispatchEvent(new Event('input', { bubbles: true }));
    }, 'hola', '[data-testid="login-password-field"]');

    await page.click('[data-testid="login-submit-button"]');
    await page.waitForNavigation({ waitUntil: "networkidle0", timeout: 10000 });
}

defineFeature(feature, test => {

    beforeAll(async () => {
        browser = await puppeteer.launch({ headless: false, slowMo: 30 });
        page = await browser.newPage();
        setDefaultOptions({ timeout: 15000 });
    });

    test('Login como administrador y acceder al dashboard', ({ given, when, and, then }) => {

        given('estoy en la página de bienvenida', async () => {
            await page.goto("http://localhost:3000", { waitUntil: "networkidle0" });
            await page.waitForSelector('[data-testid="welcome-page"]', { timeout: 5000 });
        });

        when(/^ingreso usuario "([^"]*)" y contraseña "([^"]*)"$/, async (username, password) => {
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
        });

        and('hago clic en login', async () => {
            await page.click('[data-testid="login-submit-button"]');
            await page.waitForNavigation({ waitUntil: "networkidle0", timeout: 10000 });
        });

        then('debería estar en la página de admin', async () => {
            const url = page.url();
            expect(url).toContain('/admin');
        });

        and('debería ver las 3 tarjetas del dashboard', async () => {
            await page.waitForSelector('[data-testid="admin-dashboard"]', { timeout: 5000 });
        });

        and('debería ver la tarjeta de Usuarios', async () => {
            await page.waitForSelector('[data-testid="admin-users-card"]', { timeout: 5000 });
        });

        and('debería ver la tarjeta de Estadísticas', async () => {
            await page.waitForSelector('[data-testid="admin-stats-card"]', { timeout: 5000 });
        });

        and('debería ver la tarjeta de Preguntas', async () => {
            await page.waitForSelector('[data-testid="admin-questions-card"]', { timeout: 5000 });
        });
    });

    test('Acceder a la gestión de usuarios', ({ given, when, then, and }) => {

        given('he iniciado sesión como admin', async () => {
            await loginAsAdmin();
            await page.waitForSelector('[data-testid="admin-dashboard"]', { timeout: 5000 });
        });

        when('hago clic en la tarjeta de Usuarios', async () => {
            await page.waitForSelector('[data-testid="admin-users-button"]', { timeout: 5000 });
            await page.click('[data-testid="admin-users-button"]');
            await page.waitForTimeout(2000);
        });

        then('debería ver la página de gestión de usuarios', async () => {
            const pageContent = await page.content();
            expect(pageContent).toContain('Gestión de Usuarios');
        });

        and('debería ver una tabla de usuarios', async () => {
            // Buscar el elemento table en la página
            const table = await page.$('table');
            expect(table).toBeTruthy();
        });

        and('debería ver el botón de volver', async () => {
            const buttons = await page.$$('button');
            let volverFound = false;
            for (const button of buttons) {
                const text = await page.evaluate(el => el.textContent, button);
                if (text.includes('Volver')) {
                    volverFound = true;
                    break;
                }
            }
            expect(volverFound).toBe(true);
        });
    });

    test('Acceder a estadísticas globales', ({ given, when, then, and }) => {

        given('he iniciado sesión como admin', async () => {
            await loginAsAdmin();
            await page.waitForSelector('[data-testid="admin-dashboard"]', { timeout: 5000 });
        });

        when('hago clic en la tarjeta de Estadísticas', async () => {
            await page.waitForSelector('[data-testid="admin-stats-button"]', { timeout: 5000 });
            await page.click('[data-testid="admin-stats-button"]');
            await page.waitForTimeout(3000);
        });

        then('debería ver la página de estadísticas', async () => {
            await page.waitForSelector('[data-testid="admin-global-stats"]', { timeout: 10000 });
        });

        and('debería ver las estadísticas globales', async () => {
            const statsBox = await page.$('[data-testid="admin-global-stats"]');
            expect(statsBox).toBeTruthy();
        });

        and('debería ver el total de partidas', async () => {
            await page.waitForSelector('[data-testid="admin-total-games-card"]', { timeout: 5000 });
            const card = await page.$('[data-testid="admin-total-games-card"]');
            expect(card).toBeTruthy();
        });

        and('debería ver el total de jugadores', async () => {
            await page.waitForSelector('[data-testid="admin-total-players-card"]', { timeout: 5000 });
            const card = await page.$('[data-testid="admin-total-players-card"]');
            expect(card).toBeTruthy();
        });
    });

    test('Filtrar estadísticas por usuario específico', ({ given, when, and, then }) => {

        given('he iniciado sesión como admin', async () => {
            await loginAsAdmin();
            await page.waitForSelector('[data-testid="admin-dashboard"]', { timeout: 5000 });
        });

        and('estoy en la página de estadísticas', async () => {
            await page.waitForSelector('[data-testid="admin-stats-button"]', { timeout: 5000 });
            await page.click('[data-testid="admin-stats-button"]');
            await page.waitForTimeout(3000);
            await page.waitForSelector('[data-testid="admin-global-stats"]', { timeout: 10000 });
        });

        when('selecciono el filtro de usuario', async () => {
            await page.waitForSelector('[data-testid="user-filter-dropdown"]', { timeout: 5000 });
            await page.click('[data-testid="user-filter-dropdown"]');
            await page.waitForTimeout(500);
        });

        and(/^selecciono el usuario "([^"]*)"$/, async (username) => {
            // Buscar la opción en el menú desplegable
            const optionSelector = `[data-testid="user-filter-${username}"]`;
            await page.waitForSelector(optionSelector, { timeout: 5000 });
            await page.click(optionSelector);
            await page.waitForTimeout(1000);
        });

        then('debería ver las estadísticas filtradas', async () => {
            // Verificar que el título cambia para mostrar el usuario
            const pageContent = await page.content();
            expect(pageContent).toContain('chetis');
        });
    });

    test('Acceder a gestión de preguntas', ({ given, when, then, and }) => {

        given('he iniciado sesión como admin', async () => {
            await loginAsAdmin();
            await page.waitForSelector('[data-testid="admin-dashboard"]', { timeout: 5000 });
        });

        when('hago clic en la tarjeta de Preguntas', async () => {
            await page.waitForSelector('[data-testid="admin-questions-button"]', { timeout: 5000 });
            await page.click('[data-testid="admin-questions-button"]');
            await page.waitForTimeout(2000);
        });

        then('debería ver la página de gestión de preguntas', async () => {
            const pageContent = await page.content();
            expect(pageContent).toContain('Gestión de Preguntas');
        });

        and('debería ver el panel de generación de preguntas', async () => {
            const pageContent = await page.content();
            expect(pageContent).toContain('Generar Nuevas Preguntas');
        });

        and('debería ver la lista de preguntas existentes', async () => {
            const pageContent = await page.content();
            expect(pageContent).toContain('Preguntas Existentes');
        });
    });

    afterAll(async () => {
        await browser.close();
    });

});
