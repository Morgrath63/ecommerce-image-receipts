import assert from "node:assert/strict";
import { prepareReceipt } from "../src/receipt_sender.js";

class FakeClient {
  calls: Array<{ path: string; body: Record<string, unknown> }> = [];
  async request<T>(path: string, body: Record<string, unknown>): Promise<T> {
    this.calls.push({ path, body });
    return (path.endsWith("upload") ? { image_id: "img_uploaded" } : { image_id: "img_compressed" }) as T;
  }
}

const client = new FakeClient();
const receipt = await prepareReceipt({ orderId: "ord_42", customerEmail: "buyer@example.com", imageBase64: "raw", filename: "shoe.jpg" }, client as never);
assert.deepEqual(receipt, { orderId: "ord_42", customerEmail: "buyer@example.com", imageId: "img_compressed", status: "ready" });
assert.deepEqual(client.calls.map((call) => call.path), ["/v1/image/upload", "/v1/image/compress"]);
assert.deepEqual(client.calls[1].body.image, { image_id: "img_uploaded" });
console.log("order workflow: upload -> compress -> receipt ready");
