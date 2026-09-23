import { z } from "zod";
import { InfraiClient } from "./infrai_client.js";

export const orderSchema = z.object({
  orderId: z.string().min(1),
  customerEmail: z.string().email(),
  imageBase64: z.string().min(1),
  filename: z.string().min(1)
});
export type OrderRequest = z.infer<typeof orderSchema>;

export async function prepareReceipt(input: unknown, client = new InfraiClient()) {
  const order = orderSchema.parse(input);
  const uploaded = await client.request<{ image_id: string }>("/v1/image/upload", { file: order.imageBase64, filename: order.filename });
  const compressed = await client.request<{ image_id?: string; url?: string }>("/v1/image/compress", { image: { image_id: uploaded.image_id } });
  return { orderId: order.orderId, customerEmail: order.customerEmail, imageId: compressed.image_id ?? uploaded.image_id, status: "ready" as const };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const input = { orderId: "ord_demo", customerEmail: "buyer@example.com", imageBase64: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lXcAAAAASUVORK5CYII=", filename: "product.png" };
  prepareReceipt(input).then((receipt) => console.log(JSON.stringify(receipt))).catch((error: Error) => { console.error(error.message); process.exitCode = 1; });
}
