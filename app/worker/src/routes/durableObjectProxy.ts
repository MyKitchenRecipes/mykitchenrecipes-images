import { CloudflareRequest } from "@nora-soderlund/cloudflare-router";
import { Env } from "..";

export default async function durableObjectProxyHandler(request: CloudflareRequest<Env>) {
  const durableObjectNames = [ "browser-1", "browser-2" ];
  const durableObjectName = durableObjectNames[Math.floor(Math.random() * durableObjectNames.length)];

  const durableObjectId = request.env.DURABLE_OBJECT.idFromName(durableObjectName);
  const durableObject = request.env.DURABLE_OBJECT.get(durableObjectId);

  console.log({ url: request.url.toString() });
  
  return durableObject.fetch(request.url.toString());
}