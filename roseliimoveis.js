import puppeteer from 'puppeteer';
import fs from 'node:fs';

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        devtools: true,
        defaultViewport: null,
        args: ['--start-maximized']
    });

    const page = await browser.newPage();

    await page.goto('https://roseliimoveis.com.br/');

    // Wait for the results to show up
    await page.waitForSelector('.WidgetBlock.IMOVEL_LISTA');

    const allResults = await page.evaluate(async () => {
        try {
            const buttons = document.querySelectorAll('.ListaModo.ModoListaSimples')
            Array.from(buttons).forEach(button => button.click())

            await new Promise(resolve => setTimeout(resolve, 500))

            const allResults = []

            const containers = document.querySelectorAll('.WidgetBlock.IMOVEL_LISTA')

            for (const mainContainer of containers) {
                const listContainer = mainContainer.querySelector('.UL_Imovel.ModoListaSimples')

                while(true) {
                    const children = listContainer.querySelectorAll('.ImovelItem.LI_Imovel')

                    const results = Array.from(children).map(child => {
                        const addressContainer = child.querySelector('.Endereco')
                        const neighborhood = addressContainer.querySelector('.Bairro')?.innerText || null
                        const city = addressContainer.querySelector('.cidade').innerText
                        const state = addressContainer.querySelector('.Estado').innerText

                        const bedroomContainer = child.querySelector('.ResumoItem.BEDROOM')
                        const bedroom = bedroomContainer.querySelector('.val').innerText

                        const bathroomContainer = child.querySelector('.ResumoItem.BATHROOM')
                        const bathroom = bathroomContainer.querySelector('.val').innerText

                        const garageContainer = child.querySelector('.ResumoItem.GARAGE')
                        const garage = garageContainer?.querySelector('.val')?.innerText || null

                        return {
                            title: child.querySelector('a.Title').innerText,
                            description: child.querySelector('.ResumoDescritivo').innerText,
                            link: child.querySelector('.Image.ImovelLinkClick').href,
                            value: child.querySelector('.Valor').innerText,
                            address: {
                                neighborhood,
                                city,
                                state
                            },
                            bedroom,
                            bathroom,
                            garage
                        }
                    })

                    allResults.push(...results)

                    const nextButton = document.querySelector('.btn.btn-primary.PageNumber.Setas.After')

                    if (nextButton) {
                        nextButton.click()
                        await new Promise(resolve => setTimeout(resolve, 500))
                    } else {
                        break
                    }
                }
            }

            return allResults
        } catch (e) {
            console.error(e)
        }

    })

    fs.writeFileSync('./output/roseliimoveis.json', JSON.stringify(allResults))

    await browser.close();
})();