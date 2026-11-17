# Webhook handler

Use this when the user wants Ampersand to deliver records to their own backend. The handler checks
each message's signature, gets the records, and stores them. See
[webhook destinations](https://docs.withampersand.com/destinations/webhooks) for the full message
format.

## What the handler must do

1. **Verify the signature.** Ampersand signs webhook messages with Svix. Check the signature against
   the raw request body with the destination's signing secret, kept in an environment variable.
   Parsing the body as JSON first breaks the check.
2. **Get the records.** Small results arrive inline in the message. Large ones arrive as a download
   URL instead, which expires after 15 minutes, so fetch it right away.
3. **Store them per customer.** Each message carries the `groupRef` the app passed to the install
   UI. Store records under that customer.
4. **Upsert by record ID.** Messages can repeat, so writing the same record twice must not create a
   duplicate.
5. **Respond quickly.** Return a 2xx once the message is stored, and do slow work afterwards.

## Example (Express)

```ts
import express from 'express';
import { Webhook } from 'svix';

const app = express();
// The destination's webhook signing secret, from the Ampersand dashboard
const wh = new Webhook(process.env.AMPERSAND_WEBHOOK_SECRET!);

// Use the raw body: the signature check fails on parsed JSON
app.post('/ampersand/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  let msg: any;
  try {
    msg = wh.verify(req.body, req.headers as Record<string, string>);
  } catch {
    return res.status(400).send('Invalid signature');
  }

  // Inline results are in msg.result; large ones are at msg.resultInfo.downloadUrl
  const records = msg.resultInfo?.type === 'url'
    ? await fetchResult(msg.resultInfo.downloadUrl)
    : msg.result;

  // Store by customer and upsert by record ID
  await saveRecords(msg.groupRef, records);
  res.sendStatus(200);
});
```

`fetchResult` and `saveRecords` stand in for the user's own code. Adapt the example to their
framework and storage, and check field names against the webhook docs before relying on them.

## Testing locally

The destination needs a public URL. While the user develops locally, use a tunnel they already have,
point the destination at it, then ask them to create or change a record in their test account and
confirm it was stored.

## If something fails

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Every message fails the signature check | Wrong secret, or the body was parsed before checking | Use the destination's secret and the raw body |
| Large syncs arrive empty | The handler only reads inline results | Fetch `downloadUrl` when the result type is a URL |
| The same record appears twice | Inserts instead of upserts | Upsert by record ID |
| Nothing arrives | The destination points at the wrong URL, or the tunnel is down | Check the destination's URL and the tunnel |
