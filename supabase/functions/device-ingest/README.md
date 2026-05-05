# device-ingest

HTTP endpoint for future Raspberry Pi dispenser readings.

## Required Supabase secret

Set this before deploying the function:

```bash
supabase secrets set DEVICE_INGEST_SECRET="replace-with-a-long-random-secret"
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are provided by Supabase in deployed Edge Functions.

## Request

```bash
curl -X POST "https://YOUR_PROJECT.supabase.co/functions/v1/device-ingest" \
  -H "Content-Type: application/json" \
  -H "x-device-secret: replace-with-a-long-random-secret" \
  -d '{
    "device_id": "registered-device-uuid",
    "slot_number": 1,
    "weight_grams": 18.4,
    "pill_count": 12
  }'
```

If `pill_count` drops compared with the previous reading, the function records a `dose_taken` event, updates the slot count, updates the linked medication inventory, and marks today's scheduled dose as taken.
