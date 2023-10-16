import puppeteer from 'puppeteer';
import fs from 'node:fs';

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        devtools: true,
        defaultViewport: null,
        args: ['--start-maximized']
    });


    const allResults = []
    let currentPage = 'https://www.imoveisbrito.com.br/comprar-imoveis'

    while (true) {
        const page = await browser.newPage();

        await page.goto(currentPage);
        await page.waitForSelector('.listings-container');

        const results = await page.evaluate(async () => {
            const container = document.querySelector('.listings-container')
            const children = container.querySelectorAll('.listing-item')

            return Array.from(children).map(child => {
                return {
                    title: child.querySelector('.titulo-limite').innerText,
                    value: child.querySelector('.listing-price').innerText,
                    address: child.querySelector('.neighborhood-and-city').innerText,
                    bedroom: child.querySelector('.dorm-suite')?.innerText || null,
                    garage: child.querySelector('.vagas')?.innerText || null,
                }
            })
        })

        allResults.push(...results)

        const nextPageLink = await page.evaluate(() => {
            const element = document.querySelector('a.next')
            return element?.href ?? null
        })

        await page.close()

        if (nextPageLink) {
            currentPage = nextPageLink
        } else {
            break
        }
    }


    fs.writeFileSync('./output/imoveisbrito.json', JSON.stringify(allResults))

    await browser.close();
})();