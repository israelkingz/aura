# Aura

**Dress the skin you have today.**

Aura is a skin-state styling studio for fashion retail. It uses YouCam **Skin AI** to read redness, oil, moisture, and texture from a selfie, then uses YouCam **Apparel VTO (cloth-v3)** to render only the garments that will not clash with that skin *today*. The cart bundles the winning look with a 60-second care SKU.

This is a submission for the [YouCam API Skin AI & Apparel VTO Hackathon](https://youcam-api.devpost.com/). Topic: **Skin AI + Apparel VTO**.

## Why this is not a wrapper

Most try-on demos ask “how does this jacket look on me?” Aura asks a more expensive retail question: **should you buy this jacket on the skin you actually have this morning?**

- Product-page models almost never share your flush, shine, or texture.
- A magenta leather jacket on a high-redness day looks like a different SKU than the one in the hero image — and that mismatch is a return.
- Aura scores every garment against live Skin AI `ui_score` fields, shows **wear** and **do not wear today**, then renders the keeper with cloth-v3.

## YouCam APIs used

| API | Endpoint | Role in Aura |
| --- | --- | --- |
| AI Skin Analysis | `POST/GET /s2s/v2.0/task/skin-analysis` | Face selfie → UI scores + overlay masks (SD: wrinkle, redness, oiliness, acne, moisture, radiance, texture, pore) |
| File API | `POST /s2s/v2.0/file/skin-analysis` and `/file/cloth-v3` | Presigned upload of the two photos the two models actually need |
| AI Clothes V3 | `POST/GET /s2s/v2.0/task/cloth-v3` | Body photo + garment reference → wear image |

Skin AI wants a close, front-facing face. Clothes V3 wants shoulders and torso. Aura captures **two shots** instead of forcing one photo to serve both models.

## Run it

```bash
npm install
cp .env.example .env.local
# paste YOUCAM_API_KEY after you redeem hackathon units
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Without a key, the studio runs in **demo mode** with a realistic skin-state and the same wear/skip agent so you can walk the UX. With a key, `/api/analyze` and `/api/tryon` call live YouCam.

## Flow

1. Pick the room you are walking into (interview, date, weekend, wedding, work).
2. Capture a Skin AI selfie.
3. Read scores and the agent’s wear / skip list.
4. Capture a VTO body frame.
5. Render cloth-v3.
6. Add look + targeted care to cart.

## Stack

Next.js 15, TypeScript, YouCam REST v2. API key stays on the server.
