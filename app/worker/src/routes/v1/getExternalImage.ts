import { CloudflareRequest } from "@nora-soderlund/cloudflare-router";
import { Env } from "../..";
import { Buffer } from 'node:buffer';
import getExternalImageResult from "../../browser/getExternalImageResult";
import durableObjectProxyHandler from "../durableObjectProxy";

export type GetExternalImageRequest = {
  query: {
    url?: string;
  }
}

export default async function getExternalImageHandler(request: CloudflareRequest<Env, GetExternalImageRequest>) {
  const { url } = request.query;

  if(!url) {
    throw new Error("Missing url query parameter from request.");
  }

  const imageKeyValue = await request.env.KV.get(url);

  if(imageKeyValue) {
    const image = await request.env.BUCKET.get(`external-images/${imageKeyValue}.png`);

    if(image) {
      return new Response(await image.arrayBuffer(), {
        headers: {
          "Content-Type": "image/png"
        }
      });
    }

    const response = await fetch(url);

    return new Response(await response.arrayBuffer(), {
      headers: {
        "Content-Type": response.headers.get("Content-Type")
      }
    });
  }

  if(!request.env.PUPPETEER_BROWSER) {
    request.context.waitUntil(durableObjectProxyHandler(request));

    const response = await fetch(url);

    return new Response(await response.arrayBuffer(), {
      headers: {
        "Content-Type": response.headers.get("Content-Type")
      }
    });
  }

  const page = await request.env.PUPPETEER_BROWSER.newPage();

  const pagesUrl = new URL("/", request.env.PAGES_URL);

  pagesUrl.searchParams.set("url", url);

  await page.goto(pagesUrl.toString());

  await page.waitForSelector("img", {
    timeout: 120_000
  });

  const base64String = (await page.evaluate(getExternalImageResult, url)) as string;

  // Logs nothing
  console.log({ base64String });
  
  // Logs the object
  console.log("base64String", { base64String });

  const imageBuffer = Buffer.from(base64String.split(',')[1], 'base64');

  const imageId = crypto.randomUUID();
  await request.env.KV.put(url, imageId);

  await request.env.BUCKET.put(`external-images/${imageId}.png`, imageBuffer);

  return new Response(imageBuffer, {
    headers: {
      "Content-Type": "image/png"
    }
  });
}