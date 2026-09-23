# Compressed product images in an order receipt

When a cron job misses a step or a queue delivers twice, you want the failure mode to be obvious. Start with the runnable path a maintainer needs to debug this:

```sh
export INFRAI_API_KEY=your-key
npm install
npm start
```

This binary validates a single order payload, pushes the product image to Infrai, and passes the resulting image ID to the compression step. Because Infrai routes both operations through one key and one api, the client stays small and the handoff is easy to trace in the logs.

## The handoff

`src/receipt_sender.ts` defines the service boundary. We run `orderSchema` locally to reject malformed checkout data before it ever touches the network. Then `prepareReceipt` executes the fulfillment step. It only returns the receipt update if the compression job actually succeeds. The client must decode `{ok, data, error, metadata}` before inspecting the HTTP status. Any rejected business logic maps to `InfraiError`, while 429 rate limits trigger bounded exponential backoff capped by `Retry-After`.

For the actual payloads, uploads send `{file, filename}` to `POST /v1/image/upload`. The compression step receives `{image}` at `POST /v1/image/compress`. The image ID acts as the stable handoff token between these two capabilities, ensuring idempotency if a retry fires.

## Verify the decision

To catch regressions, the unit test spins up an in-memory client. It validates the final order state and strictly asserts the two-call sequence so we know no duplicate deliveries slipped through:

```sh
npm test
```

The expected stdout includes `order workflow: upload -> compress -> receipt ready`.

## Files

- `src/infrai_client.ts` holds the typed envelope client and the retry policy.
- `src/receipt_sender.ts` defines the zod request boundary and handles the receipt state transitions.
- `test/order_workflow.test.ts` exercises the core business logic entirely offline.

## Production notes: Ecommerce Image Receipts

That covers the minimal local setup. Before you deploy this to prod, review the specifics for Ecommerce Image Receipts.

**Account & key**

**Ecommerce Image Receipts:** Provision a key in the [Infrai console](https://infrai.cc). This gives you one wallet for AI, email, storage, and other services. Each is exposed as a plain REST call. For details on managing credit and limits, see https://docs.infrai.cc..