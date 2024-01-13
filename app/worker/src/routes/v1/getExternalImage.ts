import { CloudflareRequest } from "@nora-soderlund/cloudflare-router";
import { Env } from "../..";
import { Buffer } from 'node:buffer';
import getExternalImageResult from "../../browser/getExternalImageResult";
import durableObjectProxyHandler from "../durableObjectProxy";

export type GetExternalImageRequest = {
  query: {
    url?: string;
    imageId?: string;
  }
}

export default async function getExternalImageHandler(request: CloudflareRequest<Env, GetExternalImageRequest>) {
  if(!request.env.PUPPETEER_BROWSER) {
    const { url } = request.query;

    if(!url) {
      throw new Error("Missing url query parameter from request.");
    }

    const existingImageId = await request.env.KV.get(url);
    
    if(existingImageId) {
      const existingImagePath = `external/${existingImageId}.png`;

      const existingImage = await request.env.BUCKET.get(existingImagePath);

      if(existingImage) {
        const redirectUrl = new URL(existingImagePath, request.env.BUCKET_URL).toString();

        return Response.redirect(redirectUrl, 303);
      }

      await request.env.KV.delete(url);
    }

    const newImageId = crypto.randomUUID();
    const newImagePath = `external/${newImageId}.png`;
    
    await request.env.KV.put(url, newImageId);

    const response = await fetch(url);
    const responseArrayBuffer = await response.arrayBuffer();
    const responseContentType = response.headers.get("Content-Type");

    await request.env.BUCKET.put(newImagePath, responseArrayBuffer, {
      httpMetadata: {
        contentType: responseContentType
      }
    });

    const durableObjectUrl = new URL("v1/external", request.env.WORKER_URL);

    durableObjectUrl.searchParams.set("imageId", newImageId);

    request.context.waitUntil(durableObjectProxyHandler(request.env, durableObjectUrl));

    const redirectUrl = new URL(newImagePath, request.env.BUCKET_URL).toString();

    return Response.redirect(redirectUrl, 303);
  }

  const { imageId } = request.query;

  if(!imageId) {
    throw new Error("Missing imageId query parameter from request.");
  }

  const imagePath = `external/${imageId}.png`;

  const imageUrl = new URL(imagePath, request.env.BUCKET_URL);

  console.debug("Creating a new page");

  const page = await request.env.PUPPETEER_BROWSER.newPage();

  const pagesUrl = new URL("/", request.env.PAGES_URL);

  pagesUrl.searchParams.set("url", imageUrl.toString());

  console.debug("Navigating to the pages project", { url: pagesUrl });

  await page.goto(pagesUrl.toString());

  await page.waitForSelector("img", {
    timeout: 120_000
  });

  const base64String = (await page.evaluate(getExternalImageResult, imageUrl.toString())) as string;

  await page.close();

  const imageBuffer = Buffer.from(base64String.split(',')[1], 'base64');

  await request.env.BUCKET.put(imagePath, imageBuffer);
}