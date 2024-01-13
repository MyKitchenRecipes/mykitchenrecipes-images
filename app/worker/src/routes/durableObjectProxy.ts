import { Env } from "..";

export default async function durableObjectProxyHandler(env: Env, url: URL | string) {
  const durableObjectNames = [ "browser-1", "browser-2" ];
  const durableObjectName = durableObjectNames[Math.floor(Math.random() * durableObjectNames.length)];

  const durableObjectId = env.DURABLE_OBJECT.idFromName(durableObjectName);
  const durableObject = env.DURABLE_OBJECT.get(durableObjectId);

  
  return durableObject.fetch(url.toString());
}