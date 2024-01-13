# mykitchenrecipes-images
A Cloudflare Worker (and Cloudflare Pages) project that strips out the background of an image using imgly.

## Setup
A KV namespace and R2 bucket is needed for this to function. Additionally, access to Durable Objects and the browser rendering API is needed.

Configure fields appropriately in the `./app/worker/wrangler.toml` file and then deploy the pages app using `npm run build:pages` and `npm run deploy:pages`, copy the URL for the pages app to the `wrangler.toml` configuration, then deploy the worker app using `npm run deploy:worker`.
