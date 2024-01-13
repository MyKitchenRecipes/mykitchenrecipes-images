declare const document: any;
declare const OffscreenCanvas: any;

export default async function getExternalImageResult(): Promise<string> {
  const image = document.querySelector("img");

  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;

  const context = canvas.getContext("2d");

  context.drawImage(image, 0, 0);

  return canvas.toDataURL("image/png");
}
