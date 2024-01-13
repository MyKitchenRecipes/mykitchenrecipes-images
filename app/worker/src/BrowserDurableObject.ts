import puppeteer, { Browser } from "@cloudflare/puppeteer";
import { Env } from ".";
import { CloudflareRouter } from "@nora-soderlund/cloudflare-router";
import getExternalImageHandler from "./routes/v1/getExternalImage";

const router = new CloudflareRouter();

router.addRequestHandler("GET", "/v1/external", getExternalImageHandler);

export class BrowserDurableObject {
  private browser?: Browser;
  private keptAliveInSeconds = 0;

	constructor(
    private readonly state: DurableObjectState,
    private readonly env: Env
  ) {
	}

	async alarm() {
		this.keptAliveInSeconds += 10;

		if (this.keptAliveInSeconds < 60) {
		  console.log(`Browser DO: has been kept alive for ${this.keptAliveInSeconds} seconds. Extending lifespan.`);
		  
      await this.state.storage.setAlarm(Date.now() + 10 * 1000);
		} else {
			console.log(`Browser DO: exceeded life of 60s.`);

      if (this.browser) {
				console.log(`Closing browser.`);

				await this.browser.close();
			}
		}
  }


	async fetch(request: Request) {
		if (!this.browser || !this.browser.isConnected()) {
			console.log(`Browser DO: Starting new instance`);

			try {
			  this.browser = await puppeteer.launch(this.env.BROWSER);
			} catch (e) {
			  console.log(`Browser DO: Could not start browser instance. Error: ${e}`);
			}
    }

		this.keptAliveInSeconds = 0;

    const response = await router.handleRequest(request, {
			...this.env,
			PUPPETEER_BROWSER: this.browser
		}, null);

		this.keptAliveInSeconds = 0;

		const currentAlarm = await this.state.storage.getAlarm();
		
    if (currentAlarm == null) {
			console.log(`Browser DO: setting alarm`);

			await this.state.storage.setAlarm(Date.now() + (10 * 1000));
		}

		return response;
  }
}