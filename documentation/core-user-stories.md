# Bezz AI – Core User Stories

## Epic: Brand Brief Creation

### US-01: Intake Form Submission  
**As a** Founder  
**I want** to complete a short brand-brief form (company name, sector, audience, tone, region, language)  
**So that** the system can capture my business context and generate tailored branding assets.

**Acceptance Criteria**  
- Form fields for: company name (required), sector (dropdown), primary audience (text), tone (select), region (select), language (multi-select).  
- “Submit” button only enabled when required fields are valid.  
- On submission, the user sees a loading indicator and then confirmation that the brief was received.  
- A new “Brief” record is created in Firestore linked to the user’s UID.

**Sub-Tasks**  
1. Create React form component & validation with React Hook Form.  
2. Wire `POST /api/briefs` call with Firebase JWT.  
3. Implement Firestore write in Go handler.  
4. Add UI loading + success/error states.

---

### US-02: View Brief Status  
**As a** Founder  
**I want** to see the status of my brief (Pending, In Progress, Complete)  
**So that** I know when my brand assets will be ready.

**Acceptance Criteria**  
- A “My Briefs” list shows each brief with its current status badge.  
- Status updates in real-time or on page refresh (poll every 5s).  
- Clicking a brief row navigates to its results page.

**Sub-Tasks**  
1. Define `GET /api/briefs` and `GET /api/briefs/{id}` endpoints.  
2. Implement polling in React hook.  
3. Render status badges (Pending, Processing, Completed, Error).  
4. Add error handling for failed generations.

---

## Epic: AI-Driven Branding

### US-03: Generate Brand Strategy  
**As a** Founder  
**I want** the system to produce a strategic brief (positioning, tagline, personas)  
**So that** I have clear guidance on how to position and market my brand.

**Acceptance Criteria**  
- Once the brief is received, backend calls “Brief-GPT” and “Strategist-GPT” in sequence.  
- The strategy JSON is saved and returned by `GET /api/briefs/{id}`.  
- The dashboard shows: positioning statement, 3 ICP cards, campaign angle list.

**Sub-Tasks**  
1. Embed system prompts for Brief-GPT & Strategist-GPT.  
2. Implement Go service calls to OpenAI.  
3. Persist strategy JSON in Firestore.  
4. Build React components to render strategy elements.

---

### US-04: Generate Ad Copy & Images  
**As a** Founder  
**I want** three ad variations (headline, body, image)  
**So that** I can immediately use them in social media campaigns.

**Acceptance Criteria**  
- Backend calls “Creative-Director-GPT” and then DALL·E 3 for each prompt.  
- Three ads (image URLs + copy) are saved and shown on the results page.  
- Each ad card has a download button (low-res PNG + watermark for free tier).

**Sub-Tasks**  
1. Add Creative-Director-GPT prompt constants.  
2. Implement concurrent DALL·E calls with Go goroutines.  
3. Store image URLs in GCS and metadata in Firestore.  
4. Create AdCard React component with copy, image preview, and download link.

---

## Epic: Payment & Usage

### US-05: Free Trial Credit Tracking  
**As a** Founder  
**I want** a credit-based trial (e.g. 5 credits to generate ads)  
**So that** I can explore the platform before subscribing.

**Acceptance Criteria**  
- New users start with a predefined credit balance (e.g. 5).  
- Each API call (strategy = 2 credits, ad gen = 1 credit/image) deducts credits.  
- Dashboard shows current balance; actions are blocked when credits ≤ 0.  
- “Upgrade” button appears when trial credits are exhausted.

**Sub-Tasks**  
1. Define credit costs per operation in config.  
2. Implement credit balance storage & deduction in Go middleware.  
3. Build React credit-balance indicator and gating logic.  
4. Add “Upgrade” modal linking to Stripe Checkout.

---

### US-06: Subscription & Webhook Handling  
**As a** Founder  
**I want** to upgrade my plan via Stripe or MoMo  
**So that** I can get more credits and higher-res assets.

**Acceptance Criteria**  
- Stripe Checkout session can be created from the frontend.  
- Webhooks update Firestore to change user’s plan and credit allocation.  
- After successful payment, the UI reflects the new plan immediately.

**Sub-Tasks**  
1. Integrate Stripe SDK in React.  
2. Create `POST /api/payments/checkout` and webhook handler in Go.  
3. Write tests for webhook events (“payment_intent.succeeded”).  
4. Update user document in Firestore with new plan metadata.

---

## Next Steps

1. Review and refine these stories—add any missing edge cases or personas.  
2. Select a story (e.g. US-01) to flesh out into detailed development tasks in Cursor.  
3. Once agreed, I can generate the exact folder structure, stub code, and prompts for Claude AI to implement that story.

