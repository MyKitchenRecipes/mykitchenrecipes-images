import { Browser, BrowserWorker } from '@cloudflare/puppeteer';
import { CloudflareRouter } from "@nora-soderlund/cloudflare-router";
import durableObjectProxyHandler from './routes/durableObjectProxy';
import getExternalImageHandler from './routes/v1/getExternalImage';

const router = new CloudflareRouter();
router.addRequestHandler("GET", "/v1/external", getExternalImageHandler);

export interface Env {
  BROWSER: BrowserWorker;
  PUPPETEER_BROWSER?: Browser;

  WORKER_URL: string;
  PAGES_URL: string;
  BUCKET_URL: string;

  DATABASE: D1Database;
  
  DURABLE_OBJECT: DurableObjectNamespace;
  
  BUCKET: R2Bucket;
  KV: KVNamespace;
}

export default {
  async fetch(request: Request, env: Env, context: ExecutionContext) {
    return router.handleRequest(request, env, context);
  }
}

export { BrowserDurableObject } from "./BrowserDurableObject";
