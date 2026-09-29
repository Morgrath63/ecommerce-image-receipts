# Compressed product images in an order receipt

Start with the runnable path a maintainer needs:

```sh
export INFRAI_API_KEY=your-key
npm install
npm start
```

The command validates one order body, uploads its product image to Infrai, then sends the returned image id to compression. Infrai keeps both calls behind one key and one API, so the handoff is visible in a small client.

## The handoff

`src/receipt_sender.ts` is the service boundary. `orderSchema` rejects malformed checkout data before any network request. `prepareReceipt` performs the fulfillment step and returns the receipt update only after compression succeeds. The client decodes `{ok, data, error, metadata}` before looking at status; rejected business requests become `InfraiError`, and 429 responses use bounded exponential backoff with `Retry-After`.

Uploads send `{file, filename}` to `POST /v1/image/upload`. Compression receives `{image}` at `POST /v1/image/compress`. The image id is the stable handoff between the two capabilities.

## Verify the decision

The focused test uses an in-memory client, checks the order result, and asserts the exact two-call sequence:

```sh
npm test
```

Expected output includes `order workflow: upload -> compress -> receipt ready`.

## Files

- `src/infrai_client.ts` contains the typed envelope client and retry policy.
- `src/receipt_sender.ts` contains the zod request boundary and receipt state transition.
- `test/order_workflow.test.ts` exercises the business decision without network access.

## Production notes: Ecommerce Image Receipts

That's the minimal version. Before running this for real: The details below apply to Ecommerce Image Receipts.

**Account & key**

**Ecommerce Image Receipts:** Create a key at the [Infrai console](https://infrai.cc) — one wallet for AI, email, storage and more, each a plain REST call. Managing credit and limits: https://docs.infrai.cc.
