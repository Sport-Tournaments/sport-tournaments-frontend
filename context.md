# Football Tournament Platform - Frontend Development Prompt (API-Driven)

## Next.js 14 + React 18

---

## Project Context

You are building a **production-ready frontend** for the Football Tournament Platform that  **consumes a fully documented REST API** . All pages, components, and functionality must be implemented **strictly according to the API specification** available at `http://localhost:3001/api/swagger-json`.

**Key Principle:** The API is the source of truth. Every endpoint, request/response format, field name, validation rule, and error handling must match the Swagger/OpenAPI documentation exactly.

**Frontend must support:**

* 🎯 Tournament Organizers (create/manage tournaments)
* 👥 Participants/Clubs (search, filter, register)
* ⚙️ Admin Panel (user management, moderation)
* 🌍 Multi-language (RO/EN)
* 📱 Responsive Design (mobile-first)

---

## Technology Stack

* **Framework:** Next.js 14 (App Router)
* **UI Library:** React 18
* **Styling:** Tailwind CSS
* **State Management:** React Context API or Zustand
* **HTTP Client:** Axios with interceptors
* **Form Handling:** React Hook Form + Zod validation
* **Maps:** Google Maps API (react-google-maps)
* **i18n:** next-i18n-router
* **Tables:** TanStack React Table
* **Testing:** Jest + React Testing Library

---

## Implementation Workflow

## Step 1: Extract API Specification

Before building ANY page or component:

1. **Access the Swagger documentation:**
   <pre class="not-prose w-full rounded font-mono text-sm font-extralight"><div class="codeWrapper text-light selection:text-super selection:bg-super/10 my-md relative flex flex-col rounded-lg font-mono text-sm font-normal bg-subtler"><div class="translate-y-xs -translate-x-xs bottom-xl mb-xl flex h-0 items-start justify-end sm:sticky sm:top-xs"><div class="overflow-hidden rounded-full border-subtlest ring-subtlest divide-subtlest bg-base"><div class="border-subtlest ring-subtlest divide-subtlest bg-subtler"></div></div></div><div class="-mt-xl"><div><div data-testid="code-language-indicator" class="text-quiet bg-subtle py-xs px-sm inline-block rounded-br rounded-tl-lg text-xs font-thin">bash</div></div><div><span><code><span><span class="token token">curl</span><span> http://localhost:3001/api/swagger-json </span><span class="token token operator">></span><span> swagger.json
   </span></span><span></span></code></span></div></div></div></pre>
2. **Document all endpoints by category:**
   * Authentication endpoints (`/auth/**`)
   * Tournament endpoints (`/tournaments/**`)
   * Registration endpoints (`/registrations/**`)
   * User endpoints (`/users/**`)
   * Admin endpoints (`/admin/**`)
   * Payment endpoints (`/payments/**`)
   * Notification endpoints (`/notifications/**`)
3. **For each endpoint, extract:**
   * HTTP method (GET, POST, PUT, PATCH, DELETE)
   * Full path with parameters
   * Required/optional request body fields
   * Response format and field types
   * Error responses and status codes
   * Authentication requirements
   * Query parameter specifications

## Step 2: Generate API Service Layer

Create TypeScript service files that match the API spec exactly.

---

## API-Driven Page Implementation Guide

## Authentication Pages

## `/auth/login` - POST /auth/login

**API Specification to Implement:**

<pre class="not-prose w-full rounded font-mono text-sm font-extralight"><div class="codeWrapper text-light selection:text-super selection:bg-super/10 my-md relative flex flex-col rounded-lg font-mono text-sm font-normal bg-subtler"><div class="translate-y-xs -translate-x-xs bottom-xl mb-xl flex h-0 items-start justify-end sm:sticky sm:top-xs"><div class="overflow-hidden rounded-full border-subtlest ring-subtlest divide-subtlest bg-base"><div class="border-subtlest ring-subtlest divide-subtlest bg-subtler"></div></div></div><div class="-mt-xl"><div><div data-testid="code-language-indicator" class="text-quiet bg-subtle py-xs px-sm inline-block rounded-br rounded-tl-lg text-xs font-thin">text</div></div><div><span><code><span><span>Endpoint: POST /auth/login
</span></span><span>Body: { email: string, password: string }
</span><span>Response: { 
</span><span>  success: boolean,
</span><span>  data: { 
</span><span>    accessToken: string,
</span><span>    refreshToken: string,
</span><span>    user: { 
</span><span>      id, email, firstName, lastName, role, isVerified, createdAt 
</span><span>    } 
</span><span>  },
</span><span>  message: string
</span><span>}
</span><span>Error: { success: false, error: { code, message, details } }
</span><span></span></code></span></div></div></div></pre>

**Component Implementation:**

* Form fields: email, password, "remember me" checkbox
* Validate against Zod schema derived from API spec
* Handle response: store tokens in httpOnly cookies
* Handle errors: display API error messages
* Redirect on success to appropriate dashboard

**Example Service Call:**

<pre class="not-prose w-full rounded font-mono text-sm font-extralight"><div class="codeWrapper text-light selection:text-super selection:bg-super/10 my-md relative flex flex-col rounded-lg font-mono text-sm font-normal bg-subtler"><div class="translate-y-xs -translate-x-xs bottom-xl mb-xl flex h-0 items-start justify-end sm:sticky sm:top-xs"><div class="overflow-hidden rounded-full border-subtlest ring-subtlest divide-subtlest bg-base"><div class="border-subtlest ring-subtlest divide-subtlest bg-subtler"></div></div></div><div class="-mt-xl"><div><div data-testid="code-language-indicator" class="text-quiet bg-subtle py-xs px-sm inline-block rounded-br rounded-tl-lg text-xs font-thin">typescript</div></div><div><span><code><span><span class="token token">// services/auth.service.ts</span><span>
</span></span><span><span></span><span class="token token">export</span><span></span><span class="token token">async</span><span></span><span class="token token">function</span><span></span><span class="token token">login</span><span class="token token punctuation">(</span><span>email</span><span class="token token operator">:</span><span></span><span class="token token">string</span><span class="token token punctuation">,</span><span> password</span><span class="token token operator">:</span><span></span><span class="token token">string</span><span class="token token punctuation">)</span><span></span><span class="token token punctuation">{</span><span>
</span></span><span><span></span><span class="token token">const</span><span> response </span><span class="token token operator">=</span><span></span><span class="token token">await</span><span> api</span><span class="token token punctuation">.</span><span class="token token">post</span><span class="token token punctuation">(</span><span class="token token">'/auth/login'</span><span class="token token punctuation">,</span><span></span><span class="token token punctuation">{</span><span> email</span><span class="token token punctuation">,</span><span> password </span><span class="token token punctuation">}</span><span class="token token punctuation">)</span><span class="token token punctuation">;</span><span>
</span></span><span><span></span><span class="token token">// Response structure must match API spec exactly</span><span>
</span></span><span><span></span><span class="token token">return</span><span> response</span><span class="token token punctuation">.</span><span>data</span><span class="token token punctuation">.</span><span>data</span><span class="token token punctuation">;</span><span></span><span class="token token">// { accessToken, refreshToken, user }</span><span>
</span></span><span><span></span><span class="token token punctuation">}</span><span>
</span></span><span></span></code></span></div></div></div></pre>

## `/auth/register` - POST /auth/register

**API Specification:**

<pre class="not-prose w-full rounded font-mono text-sm font-extralight"><div class="codeWrapper text-light selection:text-super selection:bg-super/10 my-md relative flex flex-col rounded-lg font-mono text-sm font-normal bg-subtler"><div class="translate-y-xs -translate-x-xs bottom-xl mb-xl flex h-0 items-start justify-end sm:sticky sm:top-xs"><div class="overflow-hidden rounded-full border-subtlest ring-subtlest divide-subtlest bg-base"><div class="border-subtlest ring-subtlest divide-subtlest bg-subtler"></div></div></div><div class="-mt-xl"><div><div data-testid="code-language-indicator" class="text-quiet bg-subtle py-xs px-sm inline-block rounded-br rounded-tl-lg text-xs font-thin">text</div></div><div><span><code><span><span>Endpoint: POST /auth/register
</span></span><span>Body: { 
</span><span>  email: string,
</span><span>  password: string,
</span><span>  firstName: string,
</span><span>  lastName: string,
</span><span>  phone?: string,
</span><span>  country: string,
</span><span>  role: 'ORGANIZER' | 'PARTICIPANT'
</span><span>}
</span><span>Response: { success: true, data: { user }, message: string }
</span><span></span></code></span></div></div></div></pre>

**Component Implementation:**

* Form fields match API spec exactly
* Client-side validation using Zod
* Email uniqueness validation (check via API before submit)
* Password strength indicator
* Role selection radio buttons
* Terms & conditions checkbox
* Handle validation errors from API
* Redirect to email verification page on success

## `/auth/verify-email` - POST /auth/verify-email

**API Specification:**

<pre class="not-prose w-full rounded font-mono text-sm font-extralight"><div class="codeWrapper text-light selection:text-super selection:bg-super/10 my-md relative flex flex-col rounded-lg font-mono text-sm font-normal bg-subtler"><div class="translate-y-xs -translate-x-xs bottom-xl mb-xl flex h-0 items-start justify-end sm:sticky sm:top-xs"><div class="overflow-hidden rounded-full border-subtlest ring-subtlest divide-subtlest bg-base"><div class="border-subtlest ring-subtlest divide-subtlest bg-subtler"></div></div></div><div class="-mt-xl"><div><div data-testid="code-language-indicator" class="text-quiet bg-subtle py-xs px-sm inline-block rounded-br rounded-tl-lg text-xs font-thin">text</div></div><div><span><code><span><span>Endpoint: POST /auth/verify-email
</span></span><span>Body: { email: string, verificationCode: string }
</span><span>Response: { success: true, data: { isVerified: boolean } }
</span><span></span></code></span></div></div></div></pre>

**Component Implementation:**

* Input field for 6-digit verification code
* Resend code button with countdown timer (60 seconds)
* Display email for verification context
* Handle code expiration errors
* Redirect to login on success

## `/auth/forgot-password` - POST /auth/forgot-password

**API Specification:**

<pre class="not-prose w-full rounded font-mono text-sm font-extralight"><div class="codeWrapper text-light selection:text-super selection:bg-super/10 my-md relative flex flex-col rounded-lg font-mono text-sm font-normal bg-subtler"><div class="translate-y-xs -translate-x-xs bottom-xl mb-xl flex h-0 items-start justify-end sm:sticky sm:top-xs"><div class="overflow-hidden rounded-full border-subtlest ring-subtlest divide-subtlest bg-base"><div class="border-subtlest ring-subtlest divide-subtlest bg-subtler"></div></div></div><div class="-mt-xl"><div><div data-testid="code-language-indicator" class="text-quiet bg-subtle py-xs px-sm inline-block rounded-br rounded-tl-lg text-xs font-thin">text</div></div><div><span><code><span><span>Endpoint: POST /auth/forgot-password
</span></span><span>Body: { email: string }
</span><span>Response: { success: true, message: "Reset link sent to email" }
</span><span>
</span><span>Endpoint: POST /auth/reset-password
</span><span>Body: { token: string, newPassword: string, confirmPassword: string }
</span><span>Response: { success: true, data: { user } }
</span><span></span></code></span></div></div></div></pre>

**Component Implementation:**

* Step 1: Email input form
* Step 2: Display reset link in email message
* Step 3: Password reset form with token from URL
* Password strength indicator
* Confirm password match validation
* Handle token expiration

---

## Tournament Pages

## `/tournaments` - GET /tournaments with filters

**API Specification to Extract:**

<pre class="not-prose w-full rounded font-mono text-sm font-extralight"><div class="codeWrapper text-light selection:text-super selection:bg-super/10 my-md relative flex flex-col rounded-lg font-mono text-sm font-normal bg-subtler"><div class="translate-y-xs -translate-x-xs bottom-xl mb-xl flex h-0 items-start justify-end sm:sticky sm:top-xs"><div class="overflow-hidden rounded-full border-subtlest ring-subtlest divide-subtlest bg-base"><div class="border-subtlest ring-subtlest divide-subtlest bg-subtler"></div></div></div><div class="-mt-xl"><div><div data-testid="code-language-indicator" class="text-quiet bg-subtle py-xs px-sm inline-block rounded-br rounded-tl-lg text-xs font-thin">text</div></div><div><span><code><span><span>Endpoint: GET /tournaments
</span></span><span>Query Parameters: (derive from API spec)
</span><span>  - page?: number (default 1)
</span><span>  - pageSize?: number (default 20)
</span><span>  - ageCategory?: string[]
</span><span>  - level?: string[] (I, II, III)
</span><span>  - country?: string
</span><span>  - distance?: number
</span><span>  - latitude?: number
</span><span>  - longitude?: number
</span><span>  - dateRangeStart?: date
</span><span>  - dateRangeEnd?: date
</span><span>  - gameSystem?: string[]
</span><span>  - participationFeeMin?: number
</span><span>  - participationFeeMax?: number
</span><span>  - search?: string
</span><span>  - sortBy?: 'date' | 'popularity' | 'distance'
</span><span>
</span><span>Response: {
</span><span>  success: boolean,
</span><span>  data: [ /* tournament objects */ ],
</span><span>  pagination: { total, page, pageSize, totalPages }
</span><span>}
</span><span></span></code></span></div></div></div></pre>

**Page Component Implementation:**

**Header:**

* Search bar (real-time filtering with debounce)
* Results counter: "Showing X of Y tournaments"
* Sort dropdown (Date, Popularity, Distance)

**Left Sidebar - Filters:**

* Build filter UI components for EACH API query parameter
* Age Category: Multi-select (get values from API enum/endpoint)
* Level: Multi-select checkboxes
* Country: Dropdown with search
* Date Range: Calendar picker (dateRangeStart, dateRangeEnd)
* Distance: Slider (if latitude/longitude provided)
* Game System: Multi-select
* Participation Fee: Range slider (participationFeeMin, participationFeeMax)
* Search: Text input (search parameter)
* Apply Filters button
* Clear Filters link

**Main Content:**

* Tournament cards in grid (3 columns desktop, 1 mobile)
* Each card displays:
  * name, organizerName, ageCategory, level, location
  * startDate, endDate, currentTeams/maxTeams
  * participationFee, gameSystem
  * "View Details" button
  * Favorite/bookmark icon

**Pagination:**

* Show results per page (pageSize)
* Pagination controls or "Load More"
* Display total count and current page

**Implementation Details:**

<pre class="not-prose w-full rounded font-mono text-sm font-extralight"><div class="codeWrapper text-light selection:text-super selection:bg-super/10 my-md relative flex flex-col rounded-lg font-mono text-sm font-normal bg-subtler"><div class="translate-y-xs -translate-x-xs bottom-xl mb-xl flex h-0 items-start justify-end sm:sticky sm:top-xs"><div class="overflow-hidden rounded-full border-subtlest ring-subtlest divide-subtlest bg-base"><div class="border-subtlest ring-subtlest divide-subtlest bg-subtler"></div></div></div><div class="-mt-xl"><div><div data-testid="code-language-indicator" class="text-quiet bg-subtle py-xs px-sm inline-block rounded-br rounded-tl-lg text-xs font-thin">typescript</div></div><div><span><code><span><span class="token token">// pages/tournaments/page.tsx</span><span>
</span></span><span><span></span><span class="token token">const</span><span> searchParams </span><span class="token token operator">=</span><span></span><span class="token token">useSearchParams</span><span class="token token punctuation">(</span><span class="token token punctuation">)</span><span class="token token punctuation">;</span><span>
</span></span><span><span></span><span class="token token">const</span><span> filters </span><span class="token token operator">=</span><span></span><span class="token token punctuation">{</span><span>
</span></span><span><span>  page</span><span class="token token operator">:</span><span></span><span class="token token">parseInt</span><span class="token token punctuation">(</span><span>searchParams</span><span class="token token punctuation">.</span><span class="token token">get</span><span class="token token punctuation">(</span><span class="token token">'page'</span><span class="token token punctuation">)</span><span class="token token punctuation">)</span><span></span><span class="token token operator">||</span><span></span><span class="token token">1</span><span class="token token punctuation">,</span><span>
</span></span><span><span>  pageSize</span><span class="token token operator">:</span><span></span><span class="token token">20</span><span class="token token punctuation">,</span><span>
</span></span><span><span>  ageCategory</span><span class="token token operator">:</span><span> searchParams</span><span class="token token punctuation">.</span><span class="token token">getAll</span><span class="token token punctuation">(</span><span class="token token">'ageCategory'</span><span class="token token punctuation">)</span><span class="token token punctuation">,</span><span>
</span></span><span><span>  level</span><span class="token token operator">:</span><span> searchParams</span><span class="token token punctuation">.</span><span class="token token">getAll</span><span class="token token punctuation">(</span><span class="token token">'level'</span><span class="token token punctuation">)</span><span class="token token punctuation">,</span><span>
</span></span><span><span>  country</span><span class="token token operator">:</span><span> searchParams</span><span class="token token punctuation">.</span><span class="token token">get</span><span class="token token punctuation">(</span><span class="token token">'country'</span><span class="token token punctuation">)</span><span class="token token punctuation">,</span><span>
</span></span><span><span></span><span class="token token">// ... map all search params to API filters</span><span>
</span></span><span><span></span><span class="token token punctuation">}</span><span class="token token punctuation">;</span><span>
</span></span><span>
</span><span><span></span><span class="token token">const</span><span> response </span><span class="token token operator">=</span><span></span><span class="token token">await</span><span> api</span><span class="token token punctuation">.</span><span class="token token">get</span><span class="token token punctuation">(</span><span class="token token">'/tournaments'</span><span class="token token punctuation">,</span><span></span><span class="token token punctuation">{</span><span> params</span><span class="token token operator">:</span><span> filters </span><span class="token token punctuation">}</span><span class="token token punctuation">)</span><span class="token token punctuation">;</span><span>
</span></span><span><span></span><span class="token token">const</span><span></span><span class="token token punctuation">{</span><span> data</span><span class="token token operator">:</span><span> tournaments</span><span class="token token punctuation">,</span><span> pagination </span><span class="token token punctuation">}</span><span></span><span class="token token operator">=</span><span> response</span><span class="token token punctuation">.</span><span>data</span><span class="token token punctuation">;</span><span>
</span></span><span></span></code></span></div></div></div></pre>

## `/tournaments/[id]` - GET /tournaments/

**API Specification:**

<pre class="not-prose w-full rounded font-mono text-sm font-extralight"><div class="codeWrapper text-light selection:text-super selection:bg-super/10 my-md relative flex flex-col rounded-lg font-mono text-sm font-normal bg-subtler"><div class="translate-y-xs -translate-x-xs bottom-xl mb-xl flex h-0 items-start justify-end sm:sticky sm:top-xs"><div class="overflow-hidden rounded-full border-subtlest ring-subtlest divide-subtlest bg-base"><div class="border-subtlest ring-subtlest divide-subtlest bg-subtler"></div></div></div><div class="-mt-xl"><div><div data-testid="code-language-indicator" class="text-quiet bg-subtle py-xs px-sm inline-block rounded-br rounded-tl-lg text-xs font-thin">text</div></div><div><span><code><span><span>Endpoint: GET /tournaments/{id}
</span></span><span>Response: {
</span><span>  success: boolean,
</span><span>  data: {
</span><span>    id, name, description, ageCategory, level, gameSystem,
</span><span>    organizerId, organizerName, organizerEmail,
</span><span>    startDate, endDate, location, latitude, longitude,
</span><span>    maxTeams, currentTeams, participationFee, currency,
</span><span>    status, isPublished, isPremium, isFeatured,
</span><span>    regulationsDocument, regulationsDownloadCount,
</span><span>    tags, createdAt, updatedAt
</span><span>  }
</span><span>}
</span><span></span></code></span></div></div></div></pre>

**Page Component Implementation:**

**Header Section:**

* Tournament name (H1)
* Organizer profile card (name, avatar, contact)
* Status badge (DRAFT, PUBLISHED, ONGOING, COMPLETED)
* Share button
* Bookmark button

**Left Column (60%):**

**Tournament Info Section:**

* Description (render as rich text if HTML)
* Key details grid:
  * Age: {ageCategory}
  * Level: {level}
  * Game System: {gameSystem}
  * Matches: {numberOfMatches}
  * Start Date: {startDate} (format per locale)
  * End Date: {endDate}

**Location Section:**

* Google Map embed (latitude, longitude)
* Location name: {location}
* Get directions link
* Nearby accommodations (external link)

**Regulations Section:**

* Document preview/download link
* Download button (links to regulationsDocument)
* Download count: "{regulationsDownloadCount} downloads"

**Groups & Brackets (conditional):**

* Only show if status = 'ONGOING' or 'COMPLETED'
* Call API: GET /tournaments/{id}/groups
* Display group assignments
* Call API: GET /tournaments/{id}/bracket
* Display match schedule

**Right Column (40%):**

**Registration Card:**

* Check if user is authenticated
* Check if user already registered: GET /registrations?tournamentId={id}&userId={userId}
* If registered: Show registration status, withdrawal button
* If not registered and isPublished:
  * Registration form with fields from API spec
  * Team/Club dropdown (from user's clubs)
  * numberOfPlayers
  * coachName, coachPhone
  * emergencyContact
  * notes
  * Display participationFee
  * Register button

**Tournament Stats:**

* totalTeamsRegistered: {currentTeams}/{maxTeams}
* availableSpots: {maxTeams - currentTeams}
* Teams by group (if draw completed)

**Organizer Info:**

* Profile card with organizerName, organizerEmail
* Contact button (optional)

---

## `/tournaments/[id]/register` - POST /tournaments//register

**API Specification:**

<pre class="not-prose w-full rounded font-mono text-sm font-extralight"><div class="codeWrapper text-light selection:text-super selection:bg-super/10 my-md relative flex flex-col rounded-lg font-mono text-sm font-normal bg-subtler"><div class="translate-y-xs -translate-x-xs bottom-xl mb-xl flex h-0 items-start justify-end sm:sticky sm:top-xs"><div class="overflow-hidden rounded-full border-subtlest ring-subtlest divide-subtlest bg-base"><div class="border-subtlest ring-subtlest divide-subtlest bg-subtler"></div></div></div><div class="-mt-xl"><div><div data-testid="code-language-indicator" class="text-quiet bg-subtle py-xs px-sm inline-block rounded-br rounded-tl-lg text-xs font-thin">text</div></div><div><span><code><span><span>Endpoint: POST /tournaments/{id}/register
</span></span><span>Authentication: Required (JWT Bearer)
</span><span>Body: {
</span><span>  clubId: string (UUID),
</span><span>  numberOfPlayers: number,
</span><span>  coachName: string,
</span><span>  coachPhone: string,
</span><span>  emergencyContact: string,
</span><span>  notes?: string
</span><span>}
</span><span>Response: {
</span><span>  success: boolean,
</span><span>  data: {
</span><span>    id, tournamentId, clubId, status, registrationDate,
</span><span>    paymentStatus, groupAssignment
</span><span>  }
</span><span>}
</span><span>Error responses: { code, message } (extract from API spec)
</span><span></span></code></span></div></div></div></pre>

**Page/Modal Implementation:**

* Form with fields matching API request body
* Team/Club selection dropdown (GET /user/clubs)
* Validation: all required fields per API spec
* Submit button triggers POST request
* Handle errors: display API error messages
* On success: redirect to registration details page
* Show registration ID and next steps

---

## Dashboard Pages

## `/dashboard/organizer` - GET /user/tournaments + GET /tournaments//registrations

**Tab 1: My Tournaments**

**API Calls:**

<pre class="not-prose w-full rounded font-mono text-sm font-extralight"><div class="codeWrapper text-light selection:text-super selection:bg-super/10 my-md relative flex flex-col rounded-lg font-mono text-sm font-normal bg-subtler"><div class="translate-y-xs -translate-x-xs bottom-xl mb-xl flex h-0 items-start justify-end sm:sticky sm:top-xs"><div class="overflow-hidden rounded-full border-subtlest ring-subtlest divide-subtlest bg-base"><div class="border-subtlest ring-subtlest divide-subtlest bg-subtler"></div></div></div><div class="-mt-xl"><div><div data-testid="code-language-indicator" class="text-quiet bg-subtle py-xs px-sm inline-block rounded-br rounded-tl-lg text-xs font-thin">text</div></div><div><span><code><span><span>Endpoint: GET /user/tournaments
</span></span><span>Response: { data: [ { id, name, status, createdDate, teams registered/max, fee, ... } ] }
</span><span>
</span><span>Endpoint: GET /tournaments/{id}/registrations (for each tournament)
</span><span>Response: { data: [ registrations ] }
</span><span></span></code></span></div></div></div></pre>

**Component:**

* Table with columns: name, status, created date, teams registered, fee, actions
* Filter by status (DRAFT, PUBLISHED, ONGOING, COMPLETED)
* Search by tournament name
* Actions: Edit (PUT /tournaments/{id}), View, Delete, Publish
* Create Tournament button (prominent, top-right)

**Tab 2: Create Tournament**

**API Specification:**

<pre class="not-prose w-full rounded font-mono text-sm font-extralight"><div class="codeWrapper text-light selection:text-super selection:bg-super/10 my-md relative flex flex-col rounded-lg font-mono text-sm font-normal bg-subtler"><div class="translate-y-xs -translate-x-xs bottom-xl mb-xl flex h-0 items-start justify-end sm:sticky sm:top-xs"><div class="overflow-hidden rounded-full border-subtlest ring-subtlest divide-subtlest bg-base"><div class="border-subtlest ring-subtlest divide-subtlest bg-subtler"></div></div></div><div class="-mt-xl"><div><div data-testid="code-language-indicator" class="text-quiet bg-subtle py-xs px-sm inline-block rounded-br rounded-tl-lg text-xs font-thin">text</div></div><div><span><code><span><span>Endpoint: POST /tournaments
</span></span><span>Authentication: Required
</span><span>Body: {
</span><span>  name: string (required),
</span><span>  description: string,
</span><span>  ageCategory: string,
</span><span>  level: 'I' | 'II' | 'III',
</span><span>  gameSystem: string,
</span><span>  numberOfMatches: number,
</span><span>  location: string (required),
</span><span>  latitude: number,
</span><span>  longitude: number,
</span><span>  startDate: date (required),
</span><span>  endDate: date (required),
</span><span>  regulationsDocument: File (upload),
</span><span>  participationFee: number,
</span><span>  currency: string,
</span><span>  maxTeams: number,
</span><span>  isPremium?: boolean,
</span><span>  tags?: string[]
</span><span>}
</span><span>Response: { success: boolean, data: { id, name, status: 'DRAFT', ... } }
</span><span></span></code></span></div></div></div></pre>

**Form Implementation:**

* Step-by-step form OR single-page form
* Tournament name (required)
* Description (rich text editor)
* Age category (dropdown)
* Level (I, II, III radio buttons)
* Game system (dropdown)
* Number of matches (input)
* Location (text input with Google Maps autocomplete)
* Latitude/Longitude (auto-filled from Maps)
* Start date (date picker)
* End date (date picker)
* Regulations document (file upload)
* Participation fee (currency dropdown + amount)
* Max teams allowed
* Is premium (checkbox)
* Tags (multi-select)
* Submit button (POST /tournaments)
* Save as draft button (POST /tournaments with status: DRAFT)

**Tab 3: Registrations**

**API Specification:**

<pre class="not-prose w-full rounded font-mono text-sm font-extralight"><div class="codeWrapper text-light selection:text-super selection:bg-super/10 my-md relative flex flex-col rounded-lg font-mono text-sm font-normal bg-subtler"><div class="translate-y-xs -translate-x-xs bottom-xl mb-xl flex h-0 items-start justify-end sm:sticky sm:top-xs"><div class="overflow-hidden rounded-full border-subtlest ring-subtlest divide-subtlest bg-base"><div class="border-subtlest ring-subtlest divide-subtlest bg-subtler"></div></div></div><div class="-mt-xl"><div><div data-testid="code-language-indicator" class="text-quiet bg-subtle py-xs px-sm inline-block rounded-br rounded-tl-lg text-xs font-thin">text</div></div><div><span><code><span><span>Endpoint: GET /tournaments/{id}/registrations
</span></span><span>Query: page?, pageSize?, status?, search?
</span><span>Response: {
</span><span>  data: [
</span><span>    { id, clubId, clubName, registrationDate, status, coachName, paymentStatus, ... }
</span><span>  ],
</span><span>  pagination: { total, page, pageSize, totalPages }
</span><span>}
</span><span></span></code></span></div></div></div></pre>

**Component:**

* Table with columns: tournament name, team/club name, registration date, status, coach, payment status
* Filter by tournament dropdown
* Filter by status (PENDING, APPROVED, REJECTED)
* Search by team/club name
* Actions: Approve (PATCH /registrations/{id}, status: APPROVED), Reject, Download info, View details
* Export to CSV button (generate client-side)
* View details modal showing all registration info

**Tab 4: Analytics**

**API Specification:**

<pre class="not-prose w-full rounded font-mono text-sm font-extralight"><div class="codeWrapper text-light selection:text-super selection:bg-super/10 my-md relative flex flex-col rounded-lg font-mono text-sm font-normal bg-subtler"><div class="translate-y-xs -translate-x-xs bottom-xl mb-xl flex h-0 items-start justify-end sm:sticky sm:top-xs"><div class="overflow-hidden rounded-full border-subtlest ring-subtlest divide-subtlest bg-base"><div class="border-subtlest ring-subtlest divide-subtlest bg-subtler"></div></div></div><div class="-mt-xl"><div><div data-testid="code-language-indicator" class="text-quiet bg-subtle py-xs px-sm inline-block rounded-br rounded-tl-lg text-xs font-thin">text</div></div><div><span><code><span><span>Endpoint: GET /user/analytics
</span></span><span>Response: {
</span><span>  data: {
</span><span>    totalTournaments: number,
</span><span>    totalRegistrations: number,
</span><span>    totalRevenue: number,
</span><span>    pendingApprovals: number,
</span><span>    registrationsByStatus: { PENDING: count, APPROVED: count, ... },
</span><span>    registrationsTrend: [ { date, count } ],
</span><span>    populateTournaments: [ { name, count } ]
</span><span>  }
</span><span>}
</span><span></span></code></span></div></div></div></pre>

**Component:**

* Summary cards: Total tournaments, Total registrations, Total revenue, Pending approvals
* Charts:
  * Bar chart: Total tournaments created over time
  * Line chart: Total registrations trend
  * Pie chart: Registration status distribution
  * Top tournaments by registration count

---

## `/dashboard/participant` - GET /user/registrations + GET /user/clubs + GET /notifications

**Tab 1: My Registrations**

**API Specification:**

<pre class="not-prose w-full rounded font-mono text-sm font-extralight"><div class="codeWrapper text-light selection:text-super selection:bg-super/10 my-md relative flex flex-col rounded-lg font-mono text-sm font-normal bg-subtler"><div class="translate-y-xs -translate-x-xs bottom-xl mb-xl flex h-0 items-start justify-end sm:sticky sm:top-xs"><div class="overflow-hidden rounded-full border-subtlest ring-subtlest divide-subtlest bg-base"><div class="border-subtlest ring-subtlest divide-subtlest bg-subtler"></div></div></div><div class="-mt-xl"><div><div data-testid="code-language-indicator" class="text-quiet bg-subtle py-xs px-sm inline-block rounded-br rounded-tl-lg text-xs font-thin">text</div></div><div><span><code><span><span>Endpoint: GET /user/registrations
</span></span><span>Query: page?, pageSize?, status?
</span><span>Response: {
</span><span>  data: [
</span><span>    { id, tournamentId, tournamentName, status, registrationDate, 
</span><span>      groupAssignment, paymentStatus, clubName, ... }
</span><span>  ],
</span><span>  pagination: { ... }
</span><span>}
</span><span></span></code></span></div></div></div></pre>

**Component:**

* Card view OR table view
* Each registration shows:
  * Tournament name, date range, location
  * Registration status, team name, group assignment
  * Payment status
  * Withdraw button (DELETE /registrations/{id})
  * View details button
* Filter by status
* Search by tournament name

**Tab 2: My Clubs**

**API Specification:**

<pre class="not-prose w-full rounded font-mono text-sm font-extralight"><div class="codeWrapper text-light selection:text-super selection:bg-super/10 my-md relative flex flex-col rounded-lg font-mono text-sm font-normal bg-subtler"><div class="translate-y-xs -translate-x-xs bottom-xl mb-xl flex h-0 items-start justify-end sm:sticky sm:top-xs"><div class="overflow-hidden rounded-full border-subtlest ring-subtlest divide-subtlest bg-base"><div class="border-subtlest ring-subtlest divide-subtlest bg-subtler"></div></div></div><div class="-mt-xl"><div><div data-testid="code-language-indicator" class="text-quiet bg-subtle py-xs px-sm inline-block rounded-br rounded-tl-lg text-xs font-thin">text</div></div><div><span><code><span><span>Endpoint: GET /user/clubs
</span></span><span>Response: { data: [ { id, name, logo, city, foundedYear, isVerified, isPremium, ... } ] }
</span><span>
</span><span>Endpoint: DELETE /clubs/{id} (with validation: no active registrations)
</span><span></span></code></span></div></div></div></pre>

**Component:**

* List of clubs (card view)
* Each club card:
  * Club name, logo, city
  * Founded year, verification status
  * Number of tournaments participated (calculated from registrations)
  * Edit button (PATCH /clubs/{id})
  * Delete button (DELETE /clubs/{id}) with confirmation
* Add new club button (POST /clubs)

**Tab 3: Notifications**

**API Specification:**

<pre class="not-prose w-full rounded font-mono text-sm font-extralight"><div class="codeWrapper text-light selection:text-super selection:bg-super/10 my-md relative flex flex-col rounded-lg font-mono text-sm font-normal bg-subtler"><div class="translate-y-xs -translate-x-xs bottom-xl mb-xl flex h-0 items-start justify-end sm:sticky sm:top-xs"><div class="overflow-hidden rounded-full border-subtlest ring-subtlest divide-subtlest bg-base"><div class="border-subtlest ring-subtlest divide-subtlest bg-subtler"></div></div></div><div class="-mt-xl"><div><div data-testid="code-language-indicator" class="text-quiet bg-subtle py-xs px-sm inline-block rounded-br rounded-tl-lg text-xs font-thin">text</div></div><div><span><code><span><span>Endpoint: GET /notifications
</span></span><span>Query: page?, pageSize?, type?, isRead?
</span><span>Response: {
</span><span>  data: [
</span><span>    { id, type, title, message, relatedTournamentId, isRead, createdAt }
</span><span>  ],
</span><span>  pagination: { ... }
</span><span>}
</span><span>
</span><span>Endpoint: PATCH /notifications/{id}
</span><span>Body: { isRead: boolean }
</span><span>
</span><span>Endpoint: DELETE /notifications/{id}
</span><span></span></code></span></div></div></div></pre>

**Component:**

* List of notifications (paginated)
* Each notification:
  * Icon (based on type)
  * Title and message
  * Time ago (relative formatting)
  * Related tournament link (if relatedTournamentId present)
  * Mark as read/unread button (PATCH /notifications/{id})
  * Delete button (DELETE /notifications/{id})
* Filter by notification type
* Mark all as read button

---

## Admin Dashboard

## `/admin` - GET /admin/analytics + GET /admin/users + GET /admin/tournaments + GET /admin/payments

**Access Control:**

* Protected route: only users with role = 'ADMIN'
* Redirect unauthorized users to login

**API Specification:**

<pre class="not-prose w-full rounded font-mono text-sm font-extralight"><div class="codeWrapper text-light selection:text-super selection:bg-super/10 my-md relative flex flex-col rounded-lg font-mono text-sm font-normal bg-subtler"><div class="translate-y-xs -translate-x-xs bottom-xl mb-xl flex h-0 items-start justify-end sm:sticky sm:top-xs"><div class="overflow-hidden rounded-full border-subtlest ring-subtlest divide-subtlest bg-base"><div class="border-subtlest ring-subtlest divide-subtlest bg-subtler"></div></div></div><div class="-mt-xl"><div><div data-testid="code-language-indicator" class="text-quiet bg-subtle py-xs px-sm inline-block rounded-br rounded-tl-lg text-xs font-thin">text</div></div><div><span><code><span><span>Endpoint: GET /admin/analytics
</span></span><span>Response: {
</span><span>  data: {
</span><span>    totalUsers: number,
</span><span>    totalTournaments: number,
</span><span>    totalRegistrations: number,
</span><span>    totalRevenue: number,
</span><span>    usersByRole: { ORGANIZER, PARTICIPANT, ADMIN },
</span><span>    tournamentsByStatus: { DRAFT, PUBLISHED, ONGOING, COMPLETED },
</span><span>    userGrowthTrend: [ { date, count } ],
</span><span>    tournamentTrend: [ { date, count } ],
</span><span>    revenueTrend: [ { date, amount } ]
</span><span>  }
</span><span>}
</span><span></span></code></span></div></div></div></pre>

**Overview Section:**

* Summary cards: Total users, Total tournaments, Total registrations, Total revenue
* Charts:
  * Line chart: User growth over time
  * Line chart: Tournament creation trend
  * Line chart: Revenue trend
  * Pie chart: Tournaments by status
  * Pie chart: Users by role

**Users Section:**

**API Specification:**

<pre class="not-prose w-full rounded font-mono text-sm font-extralight"><div class="codeWrapper text-light selection:text-super selection:bg-super/10 my-md relative flex flex-col rounded-lg font-mono text-sm font-normal bg-subtler"><div class="translate-y-xs -translate-x-xs bottom-xl mb-xl flex h-0 items-start justify-end sm:sticky sm:top-xs"><div class="overflow-hidden rounded-full border-subtlest ring-subtlest divide-subtlest bg-base"><div class="border-subtlest ring-subtlest divide-subtlest bg-subtler"></div></div></div><div class="-mt-xl"><div><div data-testid="code-language-indicator" class="text-quiet bg-subtle py-xs px-sm inline-block rounded-br rounded-tl-lg text-xs font-thin">text</div></div><div><span><code><span><span>Endpoint: GET /admin/users
</span></span><span>Query: page?, pageSize?, role?, status?, search?
</span><span>Response: {
</span><span>  data: [
</span><span>    { id, email, firstName, lastName, role, status, createdAt, ... }
</span><span>  ],
</span><span>  pagination: { ... }
</span><span>}
</span><span>
</span><span>Endpoint: PATCH /admin/users/{id}
</span><span>Body: { status?: 'ACTIVE' | 'SUSPENDED', role?: 'ORGANIZER' | 'PARTICIPANT' | 'ADMIN' }
</span><span>Response: { success: boolean, data: { user } }
</span><span></span></code></span></div></div></div></pre>

**Component:**

* Table: ID, Name, Email, Role, Status, Created Date, Actions
* Filter by role (ORGANIZER, PARTICIPANT, ADMIN)
* Filter by status (ACTIVE, SUSPENDED)
* Search by name/email
* Bulk actions: Suspend, Activate
* Edit user modal: Change role, Change status
* Delete user button

**Tournaments Section:**

**API Specification:**

<pre class="not-prose w-full rounded font-mono text-sm font-extralight"><div class="codeWrapper text-light selection:text-super selection:bg-super/10 my-md relative flex flex-col rounded-lg font-mono text-sm font-normal bg-subtler"><div class="translate-y-xs -translate-x-xs bottom-xl mb-xl flex h-0 items-start justify-end sm:sticky sm:top-xs"><div class="overflow-hidden rounded-full border-subtlest ring-subtlest divide-subtlest bg-base"><div class="border-subtlest ring-subtlest divide-subtlest bg-subtler"></div></div></div><div class="-mt-xl"><div><div data-testid="code-language-indicator" class="text-quiet bg-subtle py-xs px-sm inline-block rounded-br rounded-tl-lg text-xs font-thin">text</div></div><div><span><code><span><span>Endpoint: GET /admin/tournaments
</span></span><span>Query: page?, pageSize?, status?, search?
</span><span>Response: {
</span><span>  data: [
</span><span>    { id, name, organizerName, status, teams, createdDate, ... }
</span><span>  ],
</span><span>  pagination: { ... }
</span><span>}
</span><span>
</span><span>Endpoint: PATCH /admin/tournaments/{id}
</span><span>Body: { status?: 'PUBLISHED' | 'REJECTED' | 'CANCELLED' }
</span><span>Response: { success: boolean }
</span><span>
</span><span>Endpoint: DELETE /admin/tournaments/{id}
</span><span>Response: { success: boolean }
</span><span></span></code></span></div></div></div></pre>

**Component:**

* Table: Name, Organizer, Status, Teams, Created Date, Actions
* Filter by status
* Search by tournament name
* Actions: Approve (PATCH status: PUBLISHED), Reject, Delete
* Moderate button: Modal showing tournament details for review
* Delete with confirmation

**Payments Section:**

**API Specification:**

<pre class="not-prose w-full rounded font-mono text-sm font-extralight"><div class="codeWrapper text-light selection:text-super selection:bg-super/10 my-md relative flex flex-col rounded-lg font-mono text-sm font-normal bg-subtler"><div class="translate-y-xs -translate-x-xs bottom-xl mb-xl flex h-0 items-start justify-end sm:sticky sm:top-xs"><div class="overflow-hidden rounded-full border-subtlest ring-subtlest divide-subtlest bg-base"><div class="border-subtlest ring-subtlest divide-subtlest bg-subtler"></div></div></div><div class="-mt-xl"><div><div data-testid="code-language-indicator" class="text-quiet bg-subtle py-xs px-sm inline-block rounded-br rounded-tl-lg text-xs font-thin">text</div></div><div><span><code><span><span>Endpoint: GET /admin/payments
</span></span><span>Query: page?, pageSize?, status?, dateRangeStart?, dateRangeEnd?
</span><span>Response: {
</span><span>  data: [
</span><span>    { id, registrationId, amount, currency, status, transactionDate, ... }
</span><span>  ],
</span><span>  pagination: { ... }
</span><span>}
</span><span>
</span><span>Endpoint: GET /admin/payments/summary
</span><span>Response: {
</span><span>  data: {
</span><span>    totalRevenue: number,
</span><span>    completedPayments: number,
</span><span>    failedPayments: number,
</span><span>    refundedPayments: number,
</span><span>    pendingPayments: number
</span><span>  }
</span><span>}
</span><span></span></code></span></div></div></div></pre>

**Component:**

* Summary card: Total revenue, Completed, Failed, Refunded, Pending
* Table: ID, Amount, Currency, Status, Transaction Date, Actions
* Filter by status (COMPLETED, FAILED, REFUNDED, PENDING)
* Filter by date range
* Search by transaction ID
* Export reports button (CSV)
* Refund button (for COMPLETED payments)

---

## API Service Layer Implementation

Create service files that  **exactly match the API specification** .

## Authentication Service

<pre class="not-prose w-full rounded font-mono text-sm font-extralight"><div class="codeWrapper text-light selection:text-super selection:bg-super/10 my-md relative flex flex-col rounded-lg font-mono text-sm font-normal bg-subtler"><div class="translate-y-xs -translate-x-xs bottom-xl mb-xl flex h-0 items-start justify-end sm:sticky sm:top-xs"><div class="overflow-hidden rounded-full border-subtlest ring-subtlest divide-subtlest bg-base"><div class="border-subtlest ring-subtlest divide-subtlest bg-subtler"></div></div></div><div class="-mt-xl"><div><div data-testid="code-language-indicator" class="text-quiet bg-subtle py-xs px-sm inline-block rounded-br rounded-tl-lg text-xs font-thin">typescript</div></div><div><span><code><span><span class="token token">// src/services/auth.service.ts</span><span>
</span></span><span><span></span><span class="token token">export</span><span></span><span class="token token">interface</span><span></span><span class="token token">LoginRequest</span><span></span><span class="token token punctuation">{</span><span>
</span></span><span><span>  email</span><span class="token token operator">:</span><span></span><span class="token token">string</span><span class="token token punctuation">;</span><span>
</span></span><span><span>  password</span><span class="token token operator">:</span><span></span><span class="token token">string</span><span class="token token punctuation">;</span><span>
</span></span><span><span></span><span class="token token punctuation">}</span><span>
</span></span><span>
</span><span><span></span><span class="token token">export</span><span></span><span class="token token">interface</span><span></span><span class="token token">LoginResponse</span><span></span><span class="token token punctuation">{</span><span>
</span></span><span><span>  accessToken</span><span class="token token operator">:</span><span></span><span class="token token">string</span><span class="token token punctuation">;</span><span>
</span></span><span><span>  refreshToken</span><span class="token token operator">:</span><span></span><span class="token token">string</span><span class="token token punctuation">;</span><span>
</span></span><span><span>  user</span><span class="token token operator">:</span><span></span><span class="token token punctuation">{</span><span>
</span></span><span><span>    id</span><span class="token token operator">:</span><span></span><span class="token token">string</span><span class="token token punctuation">;</span><span>
</span></span><span><span>    email</span><span class="token token operator">:</span><span></span><span class="token token">string</span><span class="token token punctuation">;</span><span>
</span></span><span><span>    firstName</span><span class="token token operator">:</span><span></span><span class="token token">string</span><span class="token token punctuation">;</span><span>
</span></span><span><span>    lastName</span><span class="token token operator">:</span><span></span><span class="token token">string</span><span class="token token punctuation">;</span><span>
</span></span><span><span>    role</span><span class="token token operator">:</span><span></span><span class="token token">'ORGANIZER'</span><span></span><span class="token token operator">|</span><span></span><span class="token token">'PARTICIPANT'</span><span></span><span class="token token operator">|</span><span></span><span class="token token">'ADMIN'</span><span class="token token punctuation">;</span><span>
</span></span><span><span>    isVerified</span><span class="token token operator">:</span><span></span><span class="token token">boolean</span><span class="token token punctuation">;</span><span>
</span></span><span><span>    createdAt</span><span class="token token operator">:</span><span></span><span class="token token">string</span><span class="token token punctuation">;</span><span>
</span></span><span><span></span><span class="token token punctuation">}</span><span class="token token punctuation">;</span><span>
</span></span><span><span></span><span class="token token punctuation">}</span><span>
</span></span><span>
</span><span><span></span><span class="token token">export</span><span></span><span class="token token">async</span><span></span><span class="token token">function</span><span></span><span class="token token">login</span><span class="token token punctuation">(</span><span>payload</span><span class="token token operator">:</span><span> LoginRequest</span><span class="token token punctuation">)</span><span class="token token operator">:</span><span></span><span class="token token">Promise</span><span class="token token operator"><</span><span>LoginResponse</span><span class="token token operator">></span><span></span><span class="token token punctuation">{</span><span>
</span></span><span><span></span><span class="token token">const</span><span> response </span><span class="token token operator">=</span><span></span><span class="token token">await</span><span> api</span><span class="token token punctuation">.</span><span class="token token">post</span><span class="token token punctuation">(</span><span class="token token">'/auth/login'</span><span class="token token punctuation">,</span><span> payload</span><span class="token token punctuation">)</span><span class="token token punctuation">;</span><span>
</span></span><span><span></span><span class="token token">return</span><span> response</span><span class="token token punctuation">.</span><span>data</span><span class="token token punctuation">.</span><span>data</span><span class="token token punctuation">;</span><span>
</span></span><span><span></span><span class="token token punctuation">}</span><span>
</span></span><span>
</span><span><span></span><span class="token token">export</span><span></span><span class="token token">async</span><span></span><span class="token token">function</span><span></span><span class="token token">register</span><span class="token token punctuation">(</span><span>payload</span><span class="token token operator">:</span><span> RegisterRequest</span><span class="token token punctuation">)</span><span class="token token operator">:</span><span></span><span class="token token">Promise</span><span class="token token operator"><</span><span class="token token">any</span><span class="token token operator">></span><span></span><span class="token token punctuation">{</span><span>
</span></span><span><span></span><span class="token token">const</span><span> response </span><span class="token token operator">=</span><span></span><span class="token token">await</span><span> api</span><span class="token token punctuation">.</span><span class="token token">post</span><span class="token token punctuation">(</span><span class="token token">'/auth/register'</span><span class="token token punctuation">,</span><span> payload</span><span class="token token punctuation">)</span><span class="token token punctuation">;</span><span>
</span></span><span><span></span><span class="token token">return</span><span> response</span><span class="token token punctuation">.</span><span>data</span><span class="token token punctuation">.</span><span>data</span><span class="token token punctuation">;</span><span>
</span></span><span><span></span><span class="token token punctuation">}</span><span>
</span></span><span>
</span><span><span></span><span class="token token">export</span><span></span><span class="token token">async</span><span></span><span class="token token">function</span><span></span><span class="token token">verifyEmail</span><span class="token token punctuation">(</span><span>email</span><span class="token token operator">:</span><span></span><span class="token token">string</span><span class="token token punctuation">,</span><span> code</span><span class="token token operator">:</span><span></span><span class="token token">string</span><span class="token token punctuation">)</span><span class="token token operator">:</span><span></span><span class="token token">Promise</span><span class="token token operator"><</span><span class="token token">any</span><span class="token token operator">></span><span></span><span class="token token punctuation">{</span><span>
</span></span><span><span></span><span class="token token">const</span><span> response </span><span class="token token operator">=</span><span></span><span class="token token">await</span><span> api</span><span class="token token punctuation">.</span><span class="token token">post</span><span class="token token punctuation">(</span><span class="token token">'/auth/verify-email'</span><span class="token token punctuation">,</span><span></span><span class="token token punctuation">{</span><span> email</span><span class="token token punctuation">,</span><span> verificationCode</span><span class="token token operator">:</span><span> code </span><span class="token token punctuation">}</span><span class="token token punctuation">)</span><span class="token token punctuation">;</span><span>
</span></span><span><span></span><span class="token token">return</span><span> response</span><span class="token token punctuation">.</span><span>data</span><span class="token token punctuation">.</span><span>data</span><span class="token token punctuation">;</span><span>
</span></span><span><span></span><span class="token token punctuation">}</span><span>
</span></span><span>
</span><span><span></span><span class="token token">// ... add all auth endpoints from API spec</span><span>
</span></span><span></span></code></span></div></div></div></pre>

## Tournaments Service

<pre class="not-prose w-full rounded font-mono text-sm font-extralight"><div class="codeWrapper text-light selection:text-super selection:bg-super/10 my-md relative flex flex-col rounded-lg font-mono text-sm font-normal bg-subtler"><div class="translate-y-xs -translate-x-xs bottom-xl mb-xl flex h-0 items-start justify-end sm:sticky sm:top-xs"><div class="overflow-hidden rounded-full border-subtlest ring-subtlest divide-subtlest bg-base"><div class="border-subtlest ring-subtlest divide-subtlest bg-subtler"></div></div></div><div class="-mt-xl"><div><div data-testid="code-language-indicator" class="text-quiet bg-subtle py-xs px-sm inline-block rounded-br rounded-tl-lg text-xs font-thin">typescript</div></div><div><span><code><span><span class="token token">// src/services/tournaments.service.ts</span><span>
</span></span><span><span></span><span class="token token">export</span><span></span><span class="token token">interface</span><span></span><span class="token token">TournamentFilters</span><span></span><span class="token token punctuation">{</span><span>
</span></span><span><span>  page</span><span class="token token operator">?</span><span class="token token operator">:</span><span></span><span class="token token">number</span><span class="token token punctuation">;</span><span>
</span></span><span><span>  pageSize</span><span class="token token operator">?</span><span class="token token operator">:</span><span></span><span class="token token">number</span><span class="token token punctuation">;</span><span>
</span></span><span><span>  ageCategory</span><span class="token token operator">?</span><span class="token token operator">:</span><span></span><span class="token token">string</span><span class="token token punctuation">[</span><span class="token token punctuation">]</span><span class="token token punctuation">;</span><span>
</span></span><span><span>  level</span><span class="token token operator">?</span><span class="token token operator">:</span><span></span><span class="token token">string</span><span class="token token punctuation">[</span><span class="token token punctuation">]</span><span class="token token punctuation">;</span><span>
</span></span><span><span>  country</span><span class="token token operator">?</span><span class="token token operator">:</span><span></span><span class="token token">string</span><span class="token token punctuation">;</span><span>
</span></span><span><span>  distance</span><span class="token token operator">?</span><span class="token token operator">:</span><span></span><span class="token token">number</span><span class="token token punctuation">;</span><span>
</span></span><span><span>  latitude</span><span class="token token operator">?</span><span class="token token operator">:</span><span></span><span class="token token">number</span><span class="token token punctuation">;</span><span>
</span></span><span><span>  longitude</span><span class="token token operator">?</span><span class="token token operator">:</span><span></span><span class="token token">number</span><span class="token token punctuation">;</span><span>
</span></span><span><span>  dateRangeStart</span><span class="token token operator">?</span><span class="token token operator">:</span><span></span><span class="token token">string</span><span class="token token punctuation">;</span><span>
</span></span><span><span>  dateRangeEnd</span><span class="token token operator">?</span><span class="token token operator">:</span><span></span><span class="token token">string</span><span class="token token punctuation">;</span><span>
</span></span><span><span>  gameSystem</span><span class="token token operator">?</span><span class="token token operator">:</span><span></span><span class="token token">string</span><span class="token token punctuation">[</span><span class="token token punctuation">]</span><span class="token token punctuation">;</span><span>
</span></span><span><span>  participationFeeMin</span><span class="token token operator">?</span><span class="token token operator">:</span><span></span><span class="token token">number</span><span class="token token punctuation">;</span><span>
</span></span><span><span>  participationFeeMax</span><span class="token token operator">?</span><span class="token token operator">:</span><span></span><span class="token token">number</span><span class="token token punctuation">;</span><span>
</span></span><span><span>  search</span><span class="token token operator">?</span><span class="token token operator">:</span><span></span><span class="token token">string</span><span class="token token punctuation">;</span><span>
</span></span><span><span>  sortBy</span><span class="token token operator">?</span><span class="token token operator">:</span><span></span><span class="token token">'date'</span><span></span><span class="token token operator">|</span><span></span><span class="token token">'popularity'</span><span></span><span class="token token operator">|</span><span></span><span class="token token">'distance'</span><span class="token token punctuation">;</span><span>
</span></span><span><span></span><span class="token token punctuation">}</span><span>
</span></span><span>
</span><span><span></span><span class="token token">export</span><span></span><span class="token token">async</span><span></span><span class="token token">function</span><span></span><span class="token token">searchTournaments</span><span class="token token punctuation">(</span><span>filters</span><span class="token token operator">:</span><span> TournamentFilters</span><span class="token token punctuation">)</span><span></span><span class="token token punctuation">{</span><span>
</span></span><span><span></span><span class="token token">const</span><span> response </span><span class="token token operator">=</span><span></span><span class="token token">await</span><span> api</span><span class="token token punctuation">.</span><span class="token token">get</span><span class="token token punctuation">(</span><span class="token token">'/tournaments'</span><span class="token token punctuation">,</span><span></span><span class="token token punctuation">{</span><span> params</span><span class="token token operator">:</span><span> filters </span><span class="token token punctuation">}</span><span class="token token punctuation">)</span><span class="token token punctuation">;</span><span>
</span></span><span><span></span><span class="token token">return</span><span> response</span><span class="token token punctuation">.</span><span>data</span><span class="token token punctuation">;</span><span>
</span></span><span><span></span><span class="token token punctuation">}</span><span>
</span></span><span>
</span><span><span></span><span class="token token">export</span><span></span><span class="token token">async</span><span></span><span class="token token">function</span><span></span><span class="token token">getTournamentById</span><span class="token token punctuation">(</span><span>id</span><span class="token token operator">:</span><span></span><span class="token token">string</span><span class="token token punctuation">)</span><span></span><span class="token token punctuation">{</span><span>
</span></span><span><span></span><span class="token token">const</span><span> response </span><span class="token token operator">=</span><span></span><span class="token token">await</span><span> api</span><span class="token token punctuation">.</span><span class="token token">get</span><span class="token token punctuation">(</span><span class="token token template-string template-punctuation">`</span><span class="token token template-string">/tournaments/</span><span class="token token template-string interpolation interpolation-punctuation punctuation">${</span><span class="token token template-string interpolation">id</span><span class="token token template-string interpolation interpolation-punctuation punctuation">}</span><span class="token token template-string template-punctuation">`</span><span class="token token punctuation">)</span><span class="token token punctuation">;</span><span>
</span></span><span><span></span><span class="token token">return</span><span> response</span><span class="token token punctuation">.</span><span>data</span><span class="token token punctuation">.</span><span>data</span><span class="token token punctuation">;</span><span>
</span></span><span><span></span><span class="token token punctuation">}</span><span>
</span></span><span>
</span><span><span></span><span class="token token">export</span><span></span><span class="token token">async</span><span></span><span class="token token">function</span><span></span><span class="token token">createTournament</span><span class="token token punctuation">(</span><span>data</span><span class="token token operator">:</span><span> CreateTournamentRequest</span><span class="token token punctuation">)</span><span></span><span class="token token punctuation">{</span><span>
</span></span><span><span></span><span class="token token">const</span><span> response </span><span class="token token operator">=</span><span></span><span class="token token">await</span><span> api</span><span class="token token punctuation">.</span><span class="token token">post</span><span class="token token punctuation">(</span><span class="token token">'/tournaments'</span><span class="token token punctuation">,</span><span> data</span><span class="token token punctuation">)</span><span class="token token punctuation">;</span><span>
</span></span><span><span></span><span class="token token">return</span><span> response</span><span class="token token punctuation">.</span><span>data</span><span class="token token punctuation">.</span><span>data</span><span class="token token punctuation">;</span><span>
</span></span><span><span></span><span class="token token punctuation">}</span><span>
</span></span><span>
</span><span><span></span><span class="token token">// ... add all tournament endpoints from API spec</span><span>
</span></span><span></span></code></span></div></div></div></pre>

## Registrations Service

<pre class="not-prose w-full rounded font-mono text-sm font-extralight"><div class="codeWrapper text-light selection:text-super selection:bg-super/10 my-md relative flex flex-col rounded-lg font-mono text-sm font-normal bg-subtler"><div class="translate-y-xs -translate-x-xs bottom-xl mb-xl flex h-0 items-start justify-end sm:sticky sm:top-xs"><div class="overflow-hidden rounded-full border-subtlest ring-subtlest divide-subtlest bg-base"><div class="border-subtlest ring-subtlest divide-subtlest bg-subtler"></div></div></div><div class="-mt-xl"><div><div data-testid="code-language-indicator" class="text-quiet bg-subtle py-xs px-sm inline-block rounded-br rounded-tl-lg text-xs font-thin">typescript</div></div><div><span><code><span><span class="token token">// src/services/registrations.service.ts</span><span>
</span></span><span><span></span><span class="token token">export</span><span></span><span class="token token">interface</span><span></span><span class="token token">RegistrationRequest</span><span></span><span class="token token punctuation">{</span><span>
</span></span><span><span>  clubId</span><span class="token token operator">:</span><span></span><span class="token token">string</span><span class="token token punctuation">;</span><span>
</span></span><span><span>  numberOfPlayers</span><span class="token token operator">:</span><span></span><span class="token token">number</span><span class="token token punctuation">;</span><span>
</span></span><span><span>  coachName</span><span class="token token operator">:</span><span></span><span class="token token">string</span><span class="token token punctuation">;</span><span>
</span></span><span><span>  coachPhone</span><span class="token token operator">:</span><span></span><span class="token token">string</span><span class="token token punctuation">;</span><span>
</span></span><span><span>  emergencyContact</span><span class="token token operator">:</span><span></span><span class="token token">string</span><span class="token token punctuation">;</span><span>
</span></span><span><span>  notes</span><span class="token token operator">?</span><span class="token token operator">:</span><span></span><span class="token token">string</span><span class="token token punctuation">;</span><span>
</span></span><span><span></span><span class="token token punctuation">}</span><span>
</span></span><span>
</span><span><span></span><span class="token token">export</span><span></span><span class="token token">async</span><span></span><span class="token token">function</span><span></span><span class="token token">registerTeam</span><span class="token token punctuation">(</span><span>
</span></span><span><span>  tournamentId</span><span class="token token operator">:</span><span></span><span class="token token">string</span><span class="token token punctuation">,</span><span>
</span></span><span><span>  data</span><span class="token token operator">:</span><span> RegistrationRequest
</span></span><span><span></span><span class="token token punctuation">)</span><span></span><span class="token token punctuation">{</span><span>
</span></span><span><span></span><span class="token token">const</span><span> response </span><span class="token token operator">=</span><span></span><span class="token token">await</span><span> api</span><span class="token token punctuation">.</span><span class="token token">post</span><span class="token token punctuation">(</span><span class="token token template-string template-punctuation">`</span><span class="token token template-string">/tournaments/</span><span class="token token template-string interpolation interpolation-punctuation punctuation">${</span><span class="token token template-string interpolation">tournamentId</span><span class="token token template-string interpolation interpolation-punctuation punctuation">}</span><span class="token token template-string">/register</span><span class="token token template-string template-punctuation">`</span><span class="token token punctuation">,</span><span> data</span><span class="token token punctuation">)</span><span class="token token punctuation">;</span><span>
</span></span><span><span></span><span class="token token">return</span><span> response</span><span class="token token punctuation">.</span><span>data</span><span class="token token punctuation">.</span><span>data</span><span class="token token punctuation">;</span><span>
</span></span><span><span></span><span class="token token punctuation">}</span><span>
</span></span><span>
</span><span><span></span><span class="token token">export</span><span></span><span class="token token">async</span><span></span><span class="token token">function</span><span></span><span class="token token">getUserRegistrations</span><span class="token token punctuation">(</span><span>filters</span><span class="token token operator">?</span><span class="token token operator">:</span><span></span><span class="token token punctuation">{</span><span>
</span></span><span><span>  page</span><span class="token token operator">?</span><span class="token token operator">:</span><span></span><span class="token token">number</span><span class="token token punctuation">;</span><span>
</span></span><span><span>  pageSize</span><span class="token token operator">?</span><span class="token token operator">:</span><span></span><span class="token token">number</span><span class="token token punctuation">;</span><span>
</span></span><span><span>  status</span><span class="token token operator">?</span><span class="token token operator">:</span><span></span><span class="token token">string</span><span class="token token punctuation">;</span><span>
</span></span><span><span></span><span class="token token punctuation">}</span><span class="token token punctuation">)</span><span></span><span class="token token punctuation">{</span><span>
</span></span><span><span></span><span class="token token">const</span><span> response </span><span class="token token operator">=</span><span></span><span class="token token">await</span><span> api</span><span class="token token punctuation">.</span><span class="token token">get</span><span class="token token punctuation">(</span><span class="token token">'/user/registrations'</span><span class="token token punctuation">,</span><span></span><span class="token token punctuation">{</span><span> params</span><span class="token token operator">:</span><span> filters </span><span class="token token punctuation">}</span><span class="token token punctuation">)</span><span class="token token punctuation">;</span><span>
</span></span><span><span></span><span class="token token">return</span><span> response</span><span class="token token punctuation">.</span><span>data</span><span class="token token punctuation">;</span><span>
</span></span><span><span></span><span class="token token punctuation">}</span><span>
</span></span><span>
</span><span><span></span><span class="token token">// ... add all registration endpoints from API spec</span><span>
</span></span><span></span></code></span></div></div></div></pre>

---

## Form Validation Schemas (Zod)

Create Zod schemas  **derived from API request body specifications** .

<pre class="not-prose w-full rounded font-mono text-sm font-extralight"><div class="codeWrapper text-light selection:text-super selection:bg-super/10 my-md relative flex flex-col rounded-lg font-mono text-sm font-normal bg-subtler"><div class="translate-y-xs -translate-x-xs bottom-xl mb-xl flex h-0 items-start justify-end sm:sticky sm:top-xs"><div class="overflow-hidden rounded-full border-subtlest ring-subtlest divide-subtlest bg-base"><div class="border-subtlest ring-subtlest divide-subtlest bg-subtler"></div></div></div><div class="-mt-xl"><div><div data-testid="code-language-indicator" class="text-quiet bg-subtle py-xs px-sm inline-block rounded-br rounded-tl-lg text-xs font-thin">typescript</div></div><div><span><code><span><span class="token token">// src/schemas/auth.schema.ts</span><span>
</span></span><span><span></span><span class="token token">import</span><span></span><span class="token token punctuation">{</span><span> z </span><span class="token token punctuation">}</span><span></span><span class="token token">from</span><span></span><span class="token token">'zod'</span><span class="token token punctuation">;</span><span>
</span></span><span>
</span><span><span></span><span class="token token">export</span><span></span><span class="token token">const</span><span> loginSchema </span><span class="token token operator">=</span><span> z</span><span class="token token punctuation">.</span><span class="token token">object</span><span class="token token punctuation">(</span><span class="token token punctuation">{</span><span>
</span></span><span><span>  email</span><span class="token token operator">:</span><span> z</span><span class="token token punctuation">.</span><span class="token token">string</span><span class="token token punctuation">(</span><span class="token token punctuation">)</span><span class="token token punctuation">.</span><span class="token token">email</span><span class="token token punctuation">(</span><span class="token token">'Invalid email address'</span><span class="token token punctuation">)</span><span class="token token punctuation">,</span><span>
</span></span><span><span>  password</span><span class="token token operator">:</span><span> z</span><span class="token token punctuation">.</span><span class="token token">string</span><span class="token token punctuation">(</span><span class="token token punctuation">)</span><span class="token token punctuation">.</span><span class="token token">min</span><span class="token token punctuation">(</span><span class="token token">8</span><span class="token token punctuation">,</span><span></span><span class="token token">'Password must be at least 8 characters'</span><span class="token token punctuation">)</span><span class="token token punctuation">,</span><span>
</span></span><span><span></span><span class="token token punctuation">}</span><span class="token token punctuation">)</span><span class="token token punctuation">;</span><span>
</span></span><span>
</span><span><span></span><span class="token token">export</span><span></span><span class="token token">const</span><span> registerSchema </span><span class="token token operator">=</span><span> z</span><span class="token token punctuation">.</span><span class="token token">object</span><span class="token token punctuation">(</span><span class="token token punctuation">{</span><span>
</span></span><span><span>  email</span><span class="token token operator">:</span><span> z</span><span class="token token punctuation">.</span><span class="token token">string</span><span class="token token punctuation">(</span><span class="token token punctuation">)</span><span class="token token punctuation">.</span><span class="token token">email</span><span class="token token punctuation">(</span><span class="token token">'Invalid email address'</span><span class="token token punctuation">)</span><span class="token token punctuation">,</span><span>
</span></span><span><span>  password</span><span class="token token operator">:</span><span> z</span><span class="token token punctuation">.</span><span class="token token">string</span><span class="token token punctuation">(</span><span class="token token punctuation">)</span><span class="token token punctuation">.</span><span class="token token">min</span><span class="token token punctuation">(</span><span class="token token">8</span><span class="token token punctuation">,</span><span></span><span class="token token">'Password must be at least 8 characters'</span><span class="token token punctuation">)</span><span class="token token punctuation">,</span><span>
</span></span><span><span>  firstName</span><span class="token token operator">:</span><span> z</span><span class="token token punctuation">.</span><span class="token token">string</span><span class="token token punctuation">(</span><span class="token token punctuation">)</span><span class="token token punctuation">.</span><span class="token token">min</span><span class="token token punctuation">(</span><span class="token token">2</span><span class="token token punctuation">,</span><span></span><span class="token token">'First name is required'</span><span class="token token punctuation">)</span><span class="token token punctuation">,</span><span>
</span></span><span><span>  lastName</span><span class="token token operator">:</span><span> z</span><span class="token token punctuation">.</span><span class="token token">string</span><span class="token token punctuation">(</span><span class="token token punctuation">)</span><span class="token token punctuation">.</span><span class="token token">min</span><span class="token token punctuation">(</span><span class="token token">2</span><span class="token token punctuation">,</span><span></span><span class="token token">'Last name is required'</span><span class="token token punctuation">)</span><span class="token token punctuation">,</span><span>
</span></span><span><span>  phone</span><span class="token token operator">:</span><span> z</span><span class="token token punctuation">.</span><span class="token token">string</span><span class="token token punctuation">(</span><span class="token token punctuation">)</span><span class="token token punctuation">.</span><span class="token token">optional</span><span class="token token punctuation">(</span><span class="token token punctuation">)</span><span class="token token punctuation">,</span><span>
</span></span><span><span>  country</span><span class="token token operator">:</span><span> z</span><span class="token token punctuation">.</span><span class="token token">string</span><span class="token token punctuation">(</span><span class="token token punctuation">)</span><span class="token token punctuation">.</span><span class="token token">min</span><span class="token token punctuation">(</span><span class="token token">1</span><span class="token token punctuation">,</span><span></span><span class="token token">'Country is required'</span><span class="token token punctuation">)</span><span class="token token punctuation">,</span><span>
</span></span><span><span>  role</span><span class="token token operator">:</span><span> z</span><span class="token token punctuation">.</span><span class="token token">enum</span><span class="token token punctuation">(</span><span class="token token punctuation">[</span><span class="token token">'ORGANIZER'</span><span class="token token punctuation">,</span><span></span><span class="token token">'PARTICIPANT'</span><span class="token token punctuation">]</span><span class="token token punctuation">)</span><span class="token token punctuation">,</span><span>
</span></span><span><span></span><span class="token token punctuation">}</span><span class="token token punctuation">)</span><span class="token token punctuation">;</span><span>
</span></span><span>
</span><span><span></span><span class="token token">export</span><span></span><span class="token token">const</span><span> tournamentSchema </span><span class="token token operator">=</span><span> z</span><span class="token token punctuation">.</span><span class="token token">object</span><span class="token token punctuation">(</span><span class="token token punctuation">{</span><span>
</span></span><span><span>  name</span><span class="token token operator">:</span><span> z</span><span class="token token punctuation">.</span><span class="token token">string</span><span class="token token punctuation">(</span><span class="token token punctuation">)</span><span class="token token punctuation">.</span><span class="token token">min</span><span class="token token punctuation">(</span><span class="token token">3</span><span class="token token punctuation">,</span><span></span><span class="token token">'Tournament name is required'</span><span class="token token punctuation">)</span><span class="token token punctuation">,</span><span>
</span></span><span><span>  description</span><span class="token token operator">:</span><span> z</span><span class="token token punctuation">.</span><span class="token token">string</span><span class="token token punctuation">(</span><span class="token token punctuation">)</span><span class="token token punctuation">.</span><span class="token token">optional</span><span class="token token punctuation">(</span><span class="token token punctuation">)</span><span class="token token punctuation">,</span><span>
</span></span><span><span>  ageCategory</span><span class="token token operator">:</span><span> z</span><span class="token token punctuation">.</span><span class="token token">string</span><span class="token token punctuation">(</span><span class="token token punctuation">)</span><span class="token token punctuation">.</span><span class="token token">min</span><span class="token token punctuation">(</span><span class="token token">1</span><span class="token token punctuation">,</span><span></span><span class="token token">'Age category is required'</span><span class="token token punctuation">)</span><span class="token token punctuation">,</span><span>
</span></span><span><span>  level</span><span class="token token operator">:</span><span> z</span><span class="token token punctuation">.</span><span class="token token">enum</span><span class="token token punctuation">(</span><span class="token token punctuation">[</span><span class="token token">'I'</span><span class="token token punctuation">,</span><span></span><span class="token token">'II'</span><span class="token token punctuation">,</span><span></span><span class="token token">'III'</span><span class="token token punctuation">]</span><span class="token token punctuation">)</span><span class="token token punctuation">,</span><span>
</span></span><span><span>  gameSystem</span><span class="token token operator">:</span><span> z</span><span class="token token punctuation">.</span><span class="token token">string</span><span class="token token punctuation">(</span><span class="token token punctuation">)</span><span class="token token punctuation">.</span><span class="token token">min</span><span class="token token punctuation">(</span><span class="token token">1</span><span class="token token punctuation">,</span><span></span><span class="token token">'Game system is required'</span><span class="token token punctuation">)</span><span class="token token punctuation">,</span><span>
</span></span><span><span>  numberOfMatches</span><span class="token token operator">:</span><span> z</span><span class="token token punctuation">.</span><span class="token token">number</span><span class="token token punctuation">(</span><span class="token token punctuation">)</span><span class="token token punctuation">.</span><span class="token token">min</span><span class="token token punctuation">(</span><span class="token token">1</span><span class="token token punctuation">)</span><span class="token token punctuation">,</span><span>
</span></span><span><span>  location</span><span class="token token operator">:</span><span> z</span><span class="token token punctuation">.</span><span class="token token">string</span><span class="token token punctuation">(</span><span class="token token punctuation">)</span><span class="token token punctuation">.</span><span class="token token">min</span><span class="token token punctuation">(</span><span class="token token">5</span><span class="token token punctuation">,</span><span></span><span class="token token">'Location is required'</span><span class="token token punctuation">)</span><span class="token token punctuation">,</span><span>
</span></span><span><span>  latitude</span><span class="token token operator">:</span><span> z</span><span class="token token punctuation">.</span><span class="token token">number</span><span class="token token punctuation">(</span><span class="token token punctuation">)</span><span class="token token punctuation">,</span><span>
</span></span><span><span>  longitude</span><span class="token token operator">:</span><span> z</span><span class="token token punctuation">.</span><span class="token token">number</span><span class="token token punctuation">(</span><span class="token token punctuation">)</span><span class="token token punctuation">,</span><span>
</span></span><span><span>  startDate</span><span class="token token operator">:</span><span> z</span><span class="token token punctuation">.</span><span class="token token">string</span><span class="token token punctuation">(</span><span class="token token punctuation">)</span><span class="token token punctuation">.</span><span class="token token">datetime</span><span class="token token punctuation">(</span><span class="token token punctuation">)</span><span class="token token punctuation">,</span><span>
</span></span><span><span>  endDate</span><span class="token token operator">:</span><span> z</span><span class="token token punctuation">.</span><span class="token token">string</span><span class="token token punctuation">(</span><span class="token token punctuation">)</span><span class="token token punctuation">.</span><span class="token token">datetime</span><span class="token token punctuation">(</span><span class="token token punctuation">)</span><span class="token token punctuation">,</span><span>
</span></span><span><span>  participationFee</span><span class="token token operator">:</span><span> z</span><span class="token token punctuation">.</span><span class="token token">number</span><span class="token token punctuation">(</span><span class="token token punctuation">)</span><span class="token token punctuation">.</span><span class="token token">min</span><span class="token token punctuation">(</span><span class="token token">0</span><span class="token token punctuation">)</span><span class="token token punctuation">,</span><span>
</span></span><span><span>  currency</span><span class="token token operator">:</span><span> z</span><span class="token token punctuation">.</span><span class="token token">string</span><span class="token token punctuation">(</span><span class="token token punctuation">)</span><span class="token token punctuation">,</span><span>
</span></span><span><span>  maxTeams</span><span class="token token operator">:</span><span> z</span><span class="token token punctuation">.</span><span class="token token">number</span><span class="token token punctuation">(</span><span class="token token punctuation">)</span><span class="token token punctuation">.</span><span class="token token">min</span><span class="token token punctuation">(</span><span class="token token">1</span><span class="token token punctuation">)</span><span class="token token punctuation">,</span><span>
</span></span><span><span>  isPremium</span><span class="token token operator">:</span><span> z</span><span class="token token punctuation">.</span><span class="token token">boolean</span><span class="token token punctuation">(</span><span class="token token punctuation">)</span><span class="token token punctuation">.</span><span class="token token">optional</span><span class="token token punctuation">(</span><span class="token token punctuation">)</span><span class="token token punctuation">,</span><span>
</span></span><span><span>  tags</span><span class="token token operator">:</span><span> z</span><span class="token token punctuation">.</span><span class="token token">array</span><span class="token token punctuation">(</span><span>z</span><span class="token token punctuation">.</span><span class="token token">string</span><span class="token token punctuation">(</span><span class="token token punctuation">)</span><span class="token token punctuation">)</span><span class="token token punctuation">.</span><span class="token token">optional</span><span class="token token punctuation">(</span><span class="token token punctuation">)</span><span class="token token punctuation">,</span><span>
</span></span><span><span></span><span class="token token punctuation">}</span><span class="token token punctuation">)</span><span class="token token punctuation">;</span><span>
</span></span><span></span></code></span></div></div></div></pre>

---

## Axios Instance with Interceptors

<pre class="not-prose w-full rounded font-mono text-sm font-extralight"><div class="codeWrapper text-light selection:text-super selection:bg-super/10 my-md relative flex flex-col rounded-lg font-mono text-sm font-normal bg-subtler"><div class="translate-y-xs -translate-x-xs bottom-xl mb-xl flex h-0 items-start justify-end sm:sticky sm:top-xs"><div class="overflow-hidden rounded-full border-subtlest ring-subtlest divide-subtlest bg-base"><div class="border-subtlest ring-subtlest divide-subtlest bg-subtler"></div></div></div><div class="-mt-xl"><div><div data-testid="code-language-indicator" class="text-quiet bg-subtle py-xs px-sm inline-block rounded-br rounded-tl-lg text-xs font-thin">typescript</div></div><div><span><code><span><span class="token token">// src/services/api.ts</span><span>
</span></span><span><span></span><span class="token token">import</span><span> axios </span><span class="token token">from</span><span></span><span class="token token">'axios'</span><span class="token token punctuation">;</span><span>
</span></span><span><span></span><span class="token token">import</span><span></span><span class="token token punctuation">{</span><span> getTokenFromCookie</span><span class="token token punctuation">,</span><span> setTokenCookie</span><span class="token token punctuation">,</span><span> removeTokenCookie </span><span class="token token punctuation">}</span><span></span><span class="token token">from</span><span></span><span class="token token">'@/utils/auth'</span><span class="token token punctuation">;</span><span>
</span></span><span>
</span><span><span></span><span class="token token">export</span><span></span><span class="token token">const</span><span> api </span><span class="token token operator">=</span><span> axios</span><span class="token token punctuation">.</span><span class="token token">create</span><span class="token token punctuation">(</span><span class="token token punctuation">{</span><span>
</span></span><span><span>  baseURL</span><span class="token token operator">:</span><span> process</span><span class="token token punctuation">.</span><span>env</span><span class="token token punctuation">.</span><span class="token token constant">NEXT_PUBLIC_API_URL</span><span></span><span class="token token operator">||</span><span></span><span class="token token">'http://localhost:3001/api'</span><span class="token token punctuation">,</span><span>
</span></span><span><span>  withCredentials</span><span class="token token operator">:</span><span></span><span class="token token boolean">true</span><span class="token token punctuation">,</span><span>
</span></span><span><span></span><span class="token token punctuation">}</span><span class="token token punctuation">)</span><span class="token token punctuation">;</span><span>
</span></span><span>
</span><span><span></span><span class="token token">// Request interceptor: Add JWT token</span><span>
</span></span><span><span>api</span><span class="token token punctuation">.</span><span>interceptors</span><span class="token token punctuation">.</span><span>request</span><span class="token token punctuation">.</span><span class="token token">use</span><span class="token token punctuation">(</span><span class="token token punctuation">(</span><span>config</span><span class="token token punctuation">)</span><span></span><span class="token token operator">=></span><span></span><span class="token token punctuation">{</span><span>
</span></span><span><span></span><span class="token token">const</span><span> token </span><span class="token token operator">=</span><span></span><span class="token token">getTokenFromCookie</span><span class="token token punctuation">(</span><span class="token token">'accessToken'</span><span class="token token punctuation">)</span><span class="token token punctuation">;</span><span>
</span></span><span><span></span><span class="token token">if</span><span></span><span class="token token punctuation">(</span><span>token</span><span class="token token punctuation">)</span><span></span><span class="token token punctuation">{</span><span>
</span></span><span><span>    config</span><span class="token token punctuation">.</span><span>headers</span><span class="token token punctuation">.</span><span>Authorization </span><span class="token token operator">=</span><span></span><span class="token token template-string template-punctuation">`</span><span class="token token template-string">Bearer </span><span class="token token template-string interpolation interpolation-punctuation punctuation">${</span><span class="token token template-string interpolation">token</span><span class="token token template-string interpolation interpolation-punctuation punctuation">}</span><span class="token token template-string template-punctuation">`</span><span class="token token punctuation">;</span><span>
</span></span><span><span></span><span class="token token punctuation">}</span><span>
</span></span><span><span></span><span class="token token">return</span><span> config</span><span class="token token punctuation">;</span><span>
</span></span><span><span></span><span class="token token punctuation">}</span><span class="token token punctuation">)</span><span class="token token punctuation">;</span><span>
</span></span><span>
</span><span><span></span><span class="token token">// Response interceptor: Handle 401, refresh token</span><span>
</span></span><span><span>api</span><span class="token token punctuation">.</span><span>interceptors</span><span class="token token punctuation">.</span><span>response</span><span class="token token punctuation">.</span><span class="token token">use</span><span class="token token punctuation">(</span><span>
</span></span><span><span></span><span class="token token punctuation">(</span><span>response</span><span class="token token punctuation">)</span><span></span><span class="token token operator">=></span><span> response</span><span class="token token punctuation">,</span><span>
</span></span><span><span></span><span class="token token">async</span><span></span><span class="token token punctuation">(</span><span>error</span><span class="token token punctuation">)</span><span></span><span class="token token operator">=></span><span></span><span class="token token punctuation">{</span><span>
</span></span><span><span></span><span class="token token">const</span><span> originalRequest </span><span class="token token operator">=</span><span> error</span><span class="token token punctuation">.</span><span>config</span><span class="token token punctuation">;</span><span>
</span></span><span>
</span><span><span></span><span class="token token">if</span><span></span><span class="token token punctuation">(</span><span>error</span><span class="token token punctuation">.</span><span>response</span><span class="token token operator">?.</span><span>status </span><span class="token token operator">===</span><span></span><span class="token token">401</span><span></span><span class="token token operator">&&</span><span></span><span class="token token operator">!</span><span>originalRequest</span><span class="token token punctuation">.</span><span>_retry</span><span class="token token punctuation">)</span><span></span><span class="token token punctuation">{</span><span>
</span></span><span><span>      originalRequest</span><span class="token token punctuation">.</span><span>_retry </span><span class="token token operator">=</span><span></span><span class="token token boolean">true</span><span class="token token punctuation">;</span><span>
</span></span><span>
</span><span><span></span><span class="token token">try</span><span></span><span class="token token punctuation">{</span><span>
</span></span><span><span></span><span class="token token">const</span><span> refreshToken </span><span class="token token operator">=</span><span></span><span class="token token">getTokenFromCookie</span><span class="token token punctuation">(</span><span class="token token">'refreshToken'</span><span class="token token punctuation">)</span><span class="token token punctuation">;</span><span>
</span></span><span><span></span><span class="token token">const</span><span> response </span><span class="token token operator">=</span><span></span><span class="token token">await</span><span> api</span><span class="token token punctuation">.</span><span class="token token">post</span><span class="token token punctuation">(</span><span class="token token">'/auth/refresh-token'</span><span class="token token punctuation">,</span><span></span><span class="token token punctuation">{</span><span>
</span></span><span><span>          refreshToken</span><span class="token token punctuation">,</span><span>
</span></span><span><span></span><span class="token token punctuation">}</span><span class="token token punctuation">)</span><span class="token token punctuation">;</span><span>
</span></span><span>
</span><span><span></span><span class="token token">const</span><span></span><span class="token token punctuation">{</span><span> accessToken</span><span class="token token punctuation">,</span><span> refreshToken</span><span class="token token operator">:</span><span> newRefreshToken </span><span class="token token punctuation">}</span><span></span><span class="token token operator">=</span><span> response</span><span class="token token punctuation">.</span><span>data</span><span class="token token punctuation">.</span><span>data</span><span class="token token punctuation">;</span><span>
</span></span><span><span></span><span class="token token">setTokenCookie</span><span class="token token punctuation">(</span><span class="token token">'accessToken'</span><span class="token token punctuation">,</span><span> accessToken</span><span class="token token punctuation">)</span><span class="token token punctuation">;</span><span>
</span></span><span><span></span><span class="token token">setTokenCookie</span><span class="token token punctuation">(</span><span class="token token">'refreshToken'</span><span class="token token punctuation">,</span><span> newRefreshToken</span><span class="token token punctuation">)</span><span class="token token punctuation">;</span><span>
</span></span><span>
</span><span><span>        originalRequest</span><span class="token token punctuation">.</span><span>headers</span><span class="token token punctuation">.</span><span>Authorization </span><span class="token token operator">=</span><span></span><span class="token token template-string template-punctuation">`</span><span class="token token template-string">Bearer </span><span class="token token template-string interpolation interpolation-punctuation punctuation">${</span><span class="token token template-string interpolation">accessToken</span><span class="token token template-string interpolation interpolation-punctuation punctuation">}</span><span class="token token template-string template-punctuation">`</span><span class="token token punctuation">;</span><span>
</span></span><span><span></span><span class="token token">return</span><span></span><span class="token token">api</span><span class="token token punctuation">(</span><span>originalRequest</span><span class="token token punctuation">)</span><span class="token token punctuation">;</span><span>
</span></span><span><span></span><span class="token token punctuation">}</span><span></span><span class="token token">catch</span><span></span><span class="token token punctuation">(</span><span>err</span><span class="token token punctuation">)</span><span></span><span class="token token punctuation">{</span><span>
</span></span><span><span></span><span class="token token">removeTokenCookie</span><span class="token token punctuation">(</span><span class="token token">'accessToken'</span><span class="token token punctuation">)</span><span class="token token punctuation">;</span><span>
</span></span><span><span></span><span class="token token">removeTokenCookie</span><span class="token token punctuation">(</span><span class="token token">'refreshToken'</span><span class="token token punctuation">)</span><span class="token token punctuation">;</span><span>
</span></span><span><span>        window</span><span class="token token punctuation">.</span><span>location</span><span class="token token punctuation">.</span><span>href </span><span class="token token operator">=</span><span></span><span class="token token">'/auth/login'</span><span class="token token punctuation">;</span><span>
</span></span><span><span></span><span class="token token">return</span><span></span><span class="token token">Promise</span><span class="token token punctuation">.</span><span class="token token">reject</span><span class="token token punctuation">(</span><span>err</span><span class="token token punctuation">)</span><span class="token token punctuation">;</span><span>
</span></span><span><span></span><span class="token token punctuation">}</span><span>
</span></span><span><span></span><span class="token token punctuation">}</span><span>
</span></span><span>
</span><span><span></span><span class="token token">return</span><span></span><span class="token token">Promise</span><span class="token token punctuation">.</span><span class="token token">reject</span><span class="token token punctuation">(</span><span>error</span><span class="token token punctuation">)</span><span class="token token punctuation">;</span><span>
</span></span><span><span></span><span class="token token punctuation">}</span><span>
</span></span><span><span></span><span class="token token punctuation">)</span><span class="token token punctuation">;</span><span>
</span></span><span>
</span><span><span></span><span class="token token">export</span><span></span><span class="token token">default</span><span> api</span><span class="token token punctuation">;</span><span>
</span></span><span></span></code></span></div></div></div></pre>

---

## Error Handling Strategy

All API responses follow this format (extract from Swagger):

<pre class="not-prose w-full rounded font-mono text-sm font-extralight"><div class="codeWrapper text-light selection:text-super selection:bg-super/10 my-md relative flex flex-col rounded-lg font-mono text-sm font-normal bg-subtler"><div class="translate-y-xs -translate-x-xs bottom-xl mb-xl flex h-0 items-start justify-end sm:sticky sm:top-xs"><div class="overflow-hidden rounded-full border-subtlest ring-subtlest divide-subtlest bg-base"><div class="border-subtlest ring-subtlest divide-subtlest bg-subtler"></div></div></div><div class="-mt-xl"><div><div data-testid="code-language-indicator" class="text-quiet bg-subtle py-xs px-sm inline-block rounded-br rounded-tl-lg text-xs font-thin">typescript</div></div><div><span><code><span><span class="token token">interface</span><span></span><span class="token token">ApiErrorResponse</span><span></span><span class="token token punctuation">{</span><span>
</span></span><span><span>  success</span><span class="token token operator">:</span><span></span><span class="token token boolean">false</span><span class="token token punctuation">;</span><span>
</span></span><span><span>  error</span><span class="token token operator">:</span><span></span><span class="token token punctuation">{</span><span>
</span></span><span><span>    code</span><span class="token token operator">:</span><span></span><span class="token token">string</span><span class="token token punctuation">;</span><span></span><span class="token token">// e.g., 'INVALID_INPUT', 'TOURNAMENT_NOT_FOUND'</span><span>
</span></span><span><span>    message</span><span class="token token operator">:</span><span></span><span class="token token">string</span><span class="token token punctuation">;</span><span>
</span></span><span><span>    details</span><span class="token token operator">?</span><span class="token token operator">:</span><span> Record</span><span class="token token operator"><</span><span class="token token">string</span><span class="token token punctuation">,</span><span></span><span class="token token">any</span><span class="token token operator">></span><span class="token token punctuation">;</span><span>
</span></span><span><span></span><span class="token token punctuation">}</span><span class="token token punctuation">;</span><span>
</span></span><span><span></span><span class="token token punctuation">}</span><span>
</span></span><span></span></code></span></div></div></div></pre>

**Implementation:**

<pre class="not-prose w-full rounded font-mono text-sm font-extralight"><div class="codeWrapper text-light selection:text-super selection:bg-super/10 my-md relative flex flex-col rounded-lg font-mono text-sm font-normal bg-subtler"><div class="translate-y-xs -translate-x-xs bottom-xl mb-xl flex h-0 items-start justify-end sm:sticky sm:top-xs"><div class="overflow-hidden rounded-full border-subtlest ring-subtlest divide-subtlest bg-base"><div class="border-subtlest ring-subtlest divide-subtlest bg-subtler"></div></div></div><div class="-mt-xl"><div><div data-testid="code-language-indicator" class="text-quiet bg-subtle py-xs px-sm inline-block rounded-br rounded-tl-lg text-xs font-thin">typescript</div></div><div><span><code><span><span class="token token">try</span><span></span><span class="token token punctuation">{</span><span>
</span></span><span><span></span><span class="token token">const</span><span> result </span><span class="token token operator">=</span><span></span><span class="token token">await</span><span> api</span><span class="token token punctuation">.</span><span class="token token">post</span><span class="token token punctuation">(</span><span class="token token">'/tournaments'</span><span class="token token punctuation">,</span><span> data</span><span class="token token punctuation">)</span><span class="token token punctuation">;</span><span>
</span></span><span><span></span><span class="token token">// Handle success: response.data.success === true</span><span>
</span></span><span><span></span><span class="token token punctuation">}</span><span></span><span class="token token">catch</span><span></span><span class="token token punctuation">(</span><span>error</span><span class="token token punctuation">)</span><span></span><span class="token token punctuation">{</span><span>
</span></span><span><span></span><span class="token token">if</span><span></span><span class="token token punctuation">(</span><span>axios</span><span class="token token punctuation">.</span><span class="token token">isAxiosError</span><span class="token token punctuation">(</span><span>error</span><span class="token token punctuation">)</span><span class="token token punctuation">)</span><span></span><span class="token token punctuation">{</span><span>
</span></span><span><span></span><span class="token token">const</span><span> apiError </span><span class="token token operator">=</span><span> error</span><span class="token token punctuation">.</span><span>response</span><span class="token token operator">?.</span><span>data </span><span class="token token">as</span><span> ApiErrorResponse</span><span class="token token punctuation">;</span><span>
</span></span><span><span></span><span class="token token">// Display apiError.error.message to user</span><span>
</span></span><span><span></span><span class="token token">// Handle specific error codes: INVALID_INPUT, DUPLICATE_EMAIL, etc.</span><span>
</span></span><span><span></span><span class="token token punctuation">}</span><span>
</span></span><span><span></span><span class="token token punctuation">}</span><span>
</span></span><span></span></code></span></div></div></div></pre>

---

## Pages & Routes (Next.js App Router)

Organize pages to match API structure:

<pre class="not-prose w-full rounded font-mono text-sm font-extralight"><div class="codeWrapper text-light selection:text-super selection:bg-super/10 my-md relative flex flex-col rounded-lg font-mono text-sm font-normal bg-subtler"><div class="translate-y-xs -translate-x-xs bottom-xl mb-xl flex h-0 items-start justify-end sm:sticky sm:top-xs"><div class="overflow-hidden rounded-full border-subtlest ring-subtlest divide-subtlest bg-base"><div class="border-subtlest ring-subtlest divide-subtlest bg-subtler"></div></div></div><div class="-mt-xl"><div><div data-testid="code-language-indicator" class="text-quiet bg-subtle py-xs px-sm inline-block rounded-br rounded-tl-lg text-xs font-thin">text</div></div><div><span><code><span><span>app/
</span></span><span>├── page.tsx                    # Homepage
</span><span>├── auth/
</span><span>│   ├── login/page.tsx
</span><span>│   ├── register/page.tsx
</span><span>│   ├── verify-email/page.tsx
</span><span>│   └── forgot-password/page.tsx
</span><span>├── tournaments/
</span><span>│   ├── page.tsx                # GET /tournaments (search & filter)
</span><span>│   ├── [id]/
</span><span>│   │   ├── page.tsx            # GET /tournaments/{id}
</span><span>│   │   └── register/page.tsx   # POST /tournaments/{id}/register
</span><span>│   └── create/page.tsx         # POST /tournaments (create)
</span><span>├── dashboard/
</span><span>│   ├── organizer/
</span><span>│   │   ├── page.tsx            # Organizer dashboard (GET /user/tournaments)
</span><span>│   │   ├── create/page.tsx     # Create tournament
</span><span>│   │   └── [id]/
</span><span>│   │       ├── edit/page.tsx   # Edit tournament
</span><span>│   │       └── registrations/page.tsx
</span><span>│   └── participant/
</span><span>│       ├── page.tsx            # GET /user/registrations
</span><span>│       ├── clubs/page.tsx      # GET /user/clubs
</span><span>│       └── notifications/page.tsx # GET /notifications
</span><span>├── admin/
</span><span>│   ├── page.tsx                # GET /admin/analytics
</span><span>│   ├── users/page.tsx          # GET /admin/users
</span><span>│   ├── tournaments/page.tsx    # GET /admin/tournaments
</span><span>│   └── payments/page.tsx       # GET /admin/payments
</span><span>└── api/
</span><span>    └── auth/                   # Next.js API routes for auth
</span><span></span></code></span></div></div></div></pre>

---

## Component Architecture

All components must have:

1. **Type definitions** matching API response/request formats
2. **Props interfaces** with clear documentation
3. **Error handling** for API calls
4. **Loading states** during async operations
5. **Accessibility** (ARIA labels, semantic HTML)

**Example Component:**

<pre class="not-prose w-full rounded font-mono text-sm font-extralight"><div class="codeWrapper text-light selection:text-super selection:bg-super/10 my-md relative flex flex-col rounded-lg font-mono text-sm font-normal bg-subtler"><div class="translate-y-xs -translate-x-xs bottom-xl mb-xl flex h-0 items-start justify-end sm:sticky sm:top-xs"><div class="overflow-hidden rounded-full border-subtlest ring-subtlest divide-subtlest bg-base"><div class="border-subtlest ring-subtlest divide-subtlest bg-subtler"></div></div></div><div class="-mt-xl"><div><div data-testid="code-language-indicator" class="text-quiet bg-subtle py-xs px-sm inline-block rounded-br rounded-tl-lg text-xs font-thin">typescript</div></div><div><span><code><span><span class="token token">// src/components/tournaments/TournamentCard.tsx</span><span>
</span></span><span><span></span><span class="token token">import</span><span></span><span class="token token punctuation">{</span><span> Tournament </span><span class="token token punctuation">}</span><span></span><span class="token token">from</span><span></span><span class="token token">'@/types/tournaments'</span><span class="token token punctuation">;</span><span>
</span></span><span>
</span><span><span></span><span class="token token">interface</span><span></span><span class="token token">TournamentCardProps</span><span></span><span class="token token punctuation">{</span><span>
</span></span><span><span>  tournament</span><span class="token token operator">:</span><span> Tournament</span><span class="token token punctuation">;</span><span>
</span></span><span><span>  onViewDetails</span><span class="token token operator">?</span><span class="token token operator">:</span><span></span><span class="token token punctuation">(</span><span>id</span><span class="token token operator">:</span><span></span><span class="token token">string</span><span class="token token punctuation">)</span><span></span><span class="token token operator">=></span><span></span><span class="token token">void</span><span class="token token punctuation">;</span><span>
</span></span><span><span>  onRegister</span><span class="token token operator">?</span><span class="token token operator">:</span><span></span><span class="token token punctuation">(</span><span>id</span><span class="token token operator">:</span><span></span><span class="token token">string</span><span class="token token punctuation">)</span><span></span><span class="token token operator">=></span><span></span><span class="token token">void</span><span class="token token punctuation">;</span><span>
</span></span><span><span></span><span class="token token punctuation">}</span><span>
</span></span><span>
</span><span><span></span><span class="token token">export</span><span></span><span class="token token">function</span><span></span><span class="token token">TournamentCard</span><span class="token token punctuation">(</span><span class="token token punctuation">{</span><span>
</span></span><span><span>  tournament</span><span class="token token punctuation">,</span><span>
</span></span><span><span>  onViewDetails</span><span class="token token punctuation">,</span><span>
</span></span><span><span>  onRegister</span><span class="token token punctuation">,</span><span>
</span></span><span><span></span><span class="token token punctuation">}</span><span class="token token operator">:</span><span> TournamentCardProps</span><span class="token token punctuation">)</span><span></span><span class="token token punctuation">{</span><span>
</span></span><span><span></span><span class="token token">return</span><span></span><span class="token token punctuation">(</span><span>
</span></span><span><span></span><span class="token token operator"><</span><span>div className</span><span class="token token operator">=</span><span class="token token">"rounded-lg border p-4"</span><span class="token token operator">></span><span>
</span></span><span><span></span><span class="token token operator"><</span><span>h3 className</span><span class="token token operator">=</span><span class="token token">"text-lg font-semibold"</span><span class="token token operator">></span><span class="token token punctuation">{</span><span>tournament</span><span class="token token punctuation">.</span><span>name</span><span class="token token punctuation">}</span><span class="token token operator"><</span><span class="token token operator">/</span><span>h3</span><span class="token token operator">></span><span>
</span></span><span><span></span><span class="token token operator"><</span><span>p className</span><span class="token token operator">=</span><span class="token token">"text-sm text-gray-500"</span><span class="token token operator">></span><span class="token token punctuation">{</span><span>tournament</span><span class="token token punctuation">.</span><span>organizerName</span><span class="token token punctuation">}</span><span class="token token operator"><</span><span class="token token operator">/</span><span>p</span><span class="token token operator">></span><span>
</span></span><span><span></span><span class="token token punctuation">{</span><span class="token token">/* Render tournament data exactly as per API spec */</span><span class="token token punctuation">}</span><span>
</span></span><span><span></span><span class="token token operator"><</span><span>button onClick</span><span class="token token operator">=</span><span class="token token punctuation">{</span><span class="token token punctuation">(</span><span class="token token punctuation">)</span><span></span><span class="token token operator">=></span><span> onViewDetails</span><span class="token token operator">?.</span><span class="token token punctuation">(</span><span>tournament</span><span class="token token punctuation">.</span><span>id</span><span class="token token punctuation">)</span><span class="token token punctuation">}</span><span class="token token operator">></span><span>
</span></span><span>        View Details
</span><span><span></span><span class="token token operator"><</span><span class="token token operator">/</span><span>button</span><span class="token token operator">></span><span>
</span></span><span><span></span><span class="token token operator"><</span><span class="token token operator">/</span><span>div</span><span class="token token operator">></span><span>
</span></span><span><span></span><span class="token token punctuation">)</span><span class="token token punctuation">;</span><span>
</span></span><span><span></span><span class="token token punctuation">}</span><span>
</span></span><span></span></code></span></div></div></div></pre>

---

## Type Definitions (From API Spec)

<pre class="not-prose w-full rounded font-mono text-sm font-extralight"><div class="codeWrapper text-light selection:text-super selection:bg-super/10 my-md relative flex flex-col rounded-lg font-mono text-sm font-normal bg-subtler"><div class="translate-y-xs -translate-x-xs bottom-xl mb-xl flex h-0 items-start justify-end sm:sticky sm:top-xs"><div class="overflow-hidden rounded-full border-subtlest ring-subtlest divide-subtlest bg-base"><div class="border-subtlest ring-subtlest divide-subtlest bg-subtler"></div></div></div><div class="-mt-xl"><div><div data-testid="code-language-indicator" class="text-quiet bg-subtle py-xs px-sm inline-block rounded-br rounded-tl-lg text-xs font-thin">typescript</div></div><div><span><code><span><span class="token token">// src/types/tournaments.ts</span><span>
</span></span><span><span></span><span class="token token">export</span><span></span><span class="token token">interface</span><span></span><span class="token token">Tournament</span><span></span><span class="token token punctuation">{</span><span>
</span></span><span><span>  id</span><span class="token token operator">:</span><span></span><span class="token token">string</span><span class="token token punctuation">;</span><span>
</span></span><span><span>  name</span><span class="token token operator">:</span><span></span><span class="token token">string</span><span class="token token punctuation">;</span><span>
</span></span><span><span>  description</span><span class="token token operator">:</span><span></span><span class="token token">string</span><span class="token token punctuation">;</span><span>
</span></span><span><span>  ageCategory</span><span class="token token operator">:</span><span></span><span class="token token">string</span><span class="token token punctuation">;</span><span>
</span></span><span><span>  level</span><span class="token token operator">:</span><span></span><span class="token token">'I'</span><span></span><span class="token token operator">|</span><span></span><span class="token token">'II'</span><span></span><span class="token token operator">|</span><span></span><span class="token token">'III'</span><span class="token token punctuation">;</span><span>
</span></span><span><span>  gameSystem</span><span class="token token operator">:</span><span></span><span class="token token">string</span><span class="token token punctuation">;</span><span>
</span></span><span><span>  numberOfMatches</span><span class="token token operator">:</span><span></span><span class="token token">number</span><span class="token token punctuation">;</span><span>
</span></span><span><span>  organizerId</span><span class="token token operator">:</span><span></span><span class="token token">string</span><span class="token token punctuation">;</span><span>
</span></span><span><span>  organizerName</span><span class="token token operator">:</span><span></span><span class="token token">string</span><span class="token token punctuation">;</span><span>
</span></span><span><span>  organizerEmail</span><span class="token token operator">:</span><span></span><span class="token token">string</span><span class="token token punctuation">;</span><span>
</span></span><span><span>  startDate</span><span class="token token operator">:</span><span></span><span class="token token">string</span><span class="token token punctuation">;</span><span>
</span></span><span><span>  endDate</span><span class="token token operator">:</span><span></span><span class="token token">string</span><span class="token token punctuation">;</span><span>
</span></span><span><span>  location</span><span class="token token operator">:</span><span></span><span class="token token">string</span><span class="token token punctuation">;</span><span>
</span></span><span><span>  latitude</span><span class="token token operator">:</span><span></span><span class="token token">number</span><span class="token token punctuation">;</span><span>
</span></span><span><span>  longitude</span><span class="token token operator">:</span><span></span><span class="token token">number</span><span class="token token punctuation">;</span><span>
</span></span><span><span>  maxTeams</span><span class="token token operator">:</span><span></span><span class="token token">number</span><span class="token token punctuation">;</span><span>
</span></span><span><span>  currentTeams</span><span class="token token operator">:</span><span></span><span class="token token">number</span><span class="token token punctuation">;</span><span>
</span></span><span><span>  participationFee</span><span class="token token operator">:</span><span></span><span class="token token">number</span><span class="token token punctuation">;</span><span>
</span></span><span><span>  currency</span><span class="token token operator">:</span><span></span><span class="token token">string</span><span class="token token punctuation">;</span><span>
</span></span><span><span>  status</span><span class="token token operator">:</span><span></span><span class="token token">'DRAFT'</span><span></span><span class="token token operator">|</span><span></span><span class="token token">'PUBLISHED'</span><span></span><span class="token token operator">|</span><span></span><span class="token token">'ONGOING'</span><span></span><span class="token token operator">|</span><span></span><span class="token token">'COMPLETED'</span><span class="token token punctuation">;</span><span>
</span></span><span><span>  isPublished</span><span class="token token operator">:</span><span></span><span class="token token">boolean</span><span class="token token punctuation">;</span><span>
</span></span><span><span>  isPremium</span><span class="token token operator">:</span><span></span><span class="token token">boolean</span><span class="token token punctuation">;</span><span>
</span></span><span><span>  isFeatured</span><span class="token token operator">:</span><span></span><span class="token token">boolean</span><span class="token token punctuation">;</span><span>
</span></span><span><span>  regulationsDocument</span><span class="token token operator">:</span><span></span><span class="token token">string</span><span class="token token punctuation">;</span><span>
</span></span><span><span>  regulationsDownloadCount</span><span class="token token operator">:</span><span></span><span class="token token">number</span><span class="token token punctuation">;</span><span>
</span></span><span><span>  tags</span><span class="token token operator">:</span><span></span><span class="token token">string</span><span class="token token punctuation">[</span><span class="token token punctuation">]</span><span class="token token punctuation">;</span><span>
</span></span><span><span>  createdAt</span><span class="token token operator">:</span><span></span><span class="token token">string</span><span class="token token punctuation">;</span><span>
</span></span><span><span>  updatedAt</span><span class="token token operator">:</span><span></span><span class="token token">string</span><span class="token token punctuation">;</span><span>
</span></span><span><span></span><span class="token token punctuation">}</span><span>
</span></span><span>
</span><span><span></span><span class="token token">export</span><span></span><span class="token token">interface</span><span></span><span class="token token">CreateTournamentRequest</span><span></span><span class="token token punctuation">{</span><span>
</span></span><span><span>  name</span><span class="token token operator">:</span><span></span><span class="token token">string</span><span class="token token punctuation">;</span><span>
</span></span><span><span>  description</span><span class="token token operator">?</span><span class="token token operator">:</span><span></span><span class="token token">string</span><span class="token token punctuation">;</span><span>
</span></span><span><span>  ageCategory</span><span class="token token operator">:</span><span></span><span class="token token">string</span><span class="token token punctuation">;</span><span>
</span></span><span><span>  level</span><span class="token token operator">:</span><span></span><span class="token token">'I'</span><span></span><span class="token token operator">|</span><span></span><span class="token token">'II'</span><span></span><span class="token token operator">|</span><span></span><span class="token token">'III'</span><span class="token token punctuation">;</span><span>
</span></span><span><span>  gameSystem</span><span class="token token operator">:</span><span></span><span class="token token">string</span><span class="token token punctuation">;</span><span>
</span></span><span><span>  numberOfMatches</span><span class="token token operator">:</span><span></span><span class="token token">number</span><span class="token token punctuation">;</span><span>
</span></span><span><span>  location</span><span class="token token operator">:</span><span></span><span class="token token">string</span><span class="token token punctuation">;</span><span>
</span></span><span><span>  latitude</span><span class="token token operator">:</span><span></span><span class="token token">number</span><span class="token token punctuation">;</span><span>
</span></span><span><span>  longitude</span><span class="token token operator">:</span><span></span><span class="token token">number</span><span class="token token punctuation">;</span><span>
</span></span><span><span>  startDate</span><span class="token token operator">:</span><span></span><span class="token token">string</span><span class="token token punctuation">;</span><span>
</span></span><span><span>  endDate</span><span class="token token operator">:</span><span></span><span class="token token">string</span><span class="token token punctuation">;</span><span>
</span></span><span><span>  regulationsDocument</span><span class="token token operator">?</span><span class="token token operator">:</span><span> File</span><span class="token token punctuation">;</span><span>
</span></span><span><span>  participationFee</span><span class="token token operator">:</span><span></span><span class="token token">number</span><span class="token token punctuation">;</span><span>
</span></span><span><span>  currency</span><span class="token token operator">:</span><span></span><span class="token token">string</span><span class="token token punctuation">;</span><span>
</span></span><span><span>  maxTeams</span><span class="token token operator">:</span><span></span><span class="token token">number</span><span class="token token punctuation">;</span><span>
</span></span><span><span>  isPremium</span><span class="token token operator">?</span><span class="token token operator">:</span><span></span><span class="token token">boolean</span><span class="token token punctuation">;</span><span>
</span></span><span><span>  tags</span><span class="token token operator">?</span><span class="token token operator">:</span><span></span><span class="token token">string</span><span class="token token punctuation">[</span><span class="token token punctuation">]</span><span class="token token punctuation">;</span><span>
</span></span><span><span></span><span class="token token punctuation">}</span><span>
</span></span><span>
</span><span><span></span><span class="token token">export</span><span></span><span class="token token">interface</span><span></span><span class="token token">TournamentFilters</span><span></span><span class="token token punctuation">{</span><span>
</span></span><span><span>  page</span><span class="token token operator">?</span><span class="token token operator">:</span><span></span><span class="token token">number</span><span class="token token punctuation">;</span><span>
</span></span><span><span>  pageSize</span><span class="token token operator">?</span><span class="token token operator">:</span><span></span><span class="token token">number</span><span class="token token punctuation">;</span><span>
</span></span><span><span>  ageCategory</span><span class="token token operator">?</span><span class="token token operator">:</span><span></span><span class="token token">string</span><span class="token token punctuation">[</span><span class="token token punctuation">]</span><span class="token token punctuation">;</span><span>
</span></span><span><span>  level</span><span class="token token operator">?</span><span class="token token operator">:</span><span></span><span class="token token">string</span><span class="token token punctuation">[</span><span class="token token punctuation">]</span><span class="token token punctuation">;</span><span>
</span></span><span><span>  country</span><span class="token token operator">?</span><span class="token token operator">:</span><span></span><span class="token token">string</span><span class="token token punctuation">;</span><span>
</span></span><span><span>  distance</span><span class="token token operator">?</span><span class="token token operator">:</span><span></span><span class="token token">number</span><span class="token token punctuation">;</span><span>
</span></span><span><span>  latitude</span><span class="token token operator">?</span><span class="token token operator">:</span><span></span><span class="token token">number</span><span class="token token punctuation">;</span><span>
</span></span><span><span>  longitude</span><span class="token token operator">?</span><span class="token token operator">:</span><span></span><span class="token token">number</span><span class="token token punctuation">;</span><span>
</span></span><span><span>  dateRangeStart</span><span class="token token operator">?</span><span class="token token operator">:</span><span></span><span class="token token">string</span><span class="token token punctuation">;</span><span>
</span></span><span><span>  dateRangeEnd</span><span class="token token operator">?</span><span class="token token operator">:</span><span></span><span class="token token">string</span><span class="token token punctuation">;</span><span>
</span></span><span><span>  gameSystem</span><span class="token token operator">?</span><span class="token token operator">:</span><span></span><span class="token token">string</span><span class="token token punctuation">[</span><span class="token token punctuation">]</span><span class="token token punctuation">;</span><span>
</span></span><span><span>  participationFeeMin</span><span class="token token operator">?</span><span class="token token operator">:</span><span></span><span class="token token">number</span><span class="token token punctuation">;</span><span>
</span></span><span><span>  participationFeeMax</span><span class="token token operator">?</span><span class="token token operator">:</span><span></span><span class="token token">number</span><span class="token token punctuation">;</span><span>
</span></span><span><span>  search</span><span class="token token operator">?</span><span class="token token operator">:</span><span></span><span class="token token">string</span><span class="token token punctuation">;</span><span>
</span></span><span><span>  sortBy</span><span class="token token operator">?</span><span class="token token operator">:</span><span></span><span class="token token">'date'</span><span></span><span class="token token operator">|</span><span></span><span class="token token">'popularity'</span><span></span><span class="token token operator">|</span><span></span><span class="token token">'distance'</span><span class="token token punctuation">;</span><span>
</span></span><span><span></span><span class="token token punctuation">}</span><span>
</span></span><span></span></code></span></div></div></div></pre>

---

## API Specification Extraction Checklist

Before implementing each page, verify:

* [ ] All endpoints documented in Swagger
* [ ] Request body formats extracted
* [ ] Response formats extracted
* [ ] Query parameters documented
* [ ] Error responses documented
* [ ] Authentication requirements noted
* [ ] Status codes documented
* [ ] Field types confirmed
* [ ] Enums/allowed values extracted
* [ ] Validation rules noted

---

## Implementation Priority

**Phase 1 (Week 1-2): Auth & Core Infra**

* Extract API spec and document
* Setup project (Next.js, Tailwind, Axios)
* Create API service layer from spec
* Implement auth pages (login, register, verify)
* Setup auth context and middleware

**Phase 2 (Week 3-4): Tournament Discovery**

* Tournament listing page with filters (GET /tournaments)
* Tournament details page (GET /tournaments/{id})
* Google Maps integration
* Search and filter implementation

**Phase 3 (Week 5-6): Registration & Dashboards**

* Team registration form (POST /tournaments/{id}/register)
* Organizer dashboard (GET /user/tournaments)
* Participant dashboard (GET /user/registrations)
* Create tournament form (POST /tournaments)

**Phase 4 (Week 7-8): Advanced Features**

* Group draw visualization (GET /tournaments/{id}/groups)
* Bracket view (GET /tournaments/{id}/bracket)
* Admin dashboard (GET /admin/analytics)
* Notifications system (GET /notifications)

**Phase 5 (Week 9-10): Polish & Testing**

* Performance optimization
* Accessibility audit
* Testing (unit, integration, E2E)
* Multi-language support (RO/EN)

**Phase 6 (Week 10.5): Deployment**

* Final responsive design review
* Documentation
* Production deployment

---

## Testing Strategy

All tests must mock API responses exactly as per Swagger spec:

<pre class="not-prose w-full rounded font-mono text-sm font-extralight"><div class="codeWrapper text-light selection:text-super selection:bg-super/10 my-md relative flex flex-col rounded-lg font-mono text-sm font-normal bg-subtler"><div class="translate-y-xs -translate-x-xs bottom-xl mb-xl flex h-0 items-start justify-end sm:sticky sm:top-xs"><div class="overflow-hidden rounded-full border-subtlest ring-subtlest divide-subtlest bg-base"><div class="border-subtlest ring-subtlest divide-subtlest bg-subtler"></div></div></div><div class="-mt-xl"><div><div data-testid="code-language-indicator" class="text-quiet bg-subtle py-xs px-sm inline-block rounded-br rounded-tl-lg text-xs font-thin">typescript</div></div><div><span><code><span><span class="token token">// __tests__/pages/tournaments.spec.tsx</span><span>
</span></span><span><span></span><span class="token token">import</span><span></span><span class="token token punctuation">{</span><span> render</span><span class="token token punctuation">,</span><span> screen </span><span class="token token punctuation">}</span><span></span><span class="token token">from</span><span></span><span class="token token">'@testing-library/react'</span><span class="token token punctuation">;</span><span>
</span></span><span><span></span><span class="token token">import</span><span> TournamentsPage </span><span class="token token">from</span><span></span><span class="token token">'@/app/tournaments/page'</span><span class="token token punctuation">;</span><span>
</span></span><span>
</span><span><span>jest</span><span class="token token punctuation">.</span><span class="token token">mock</span><span class="token token punctuation">(</span><span class="token token">'@/services/tournaments.service'</span><span class="token token punctuation">,</span><span></span><span class="token token punctuation">(</span><span class="token token punctuation">)</span><span></span><span class="token token operator">=></span><span></span><span class="token token punctuation">(</span><span class="token token punctuation">{</span><span>
</span></span><span><span>  searchTournaments</span><span class="token token operator">:</span><span> jest</span><span class="token token punctuation">.</span><span class="token token">fn</span><span class="token token punctuation">(</span><span class="token token punctuation">)</span><span class="token token punctuation">.</span><span class="token token">mockResolvedValue</span><span class="token token punctuation">(</span><span class="token token punctuation">{</span><span>
</span></span><span><span>    success</span><span class="token token operator">:</span><span></span><span class="token token boolean">true</span><span class="token token punctuation">,</span><span>
</span></span><span><span>    data</span><span class="token token operator">:</span><span></span><span class="token token punctuation">[</span><span></span><span class="token token">/* mock tournament data matching API spec */</span><span></span><span class="token token punctuation">]</span><span class="token token punctuation">,</span><span>
</span></span><span><span>    pagination</span><span class="token token operator">:</span><span></span><span class="token token punctuation">{</span><span> total</span><span class="token token operator">:</span><span></span><span class="token token">80</span><span class="token token punctuation">,</span><span> page</span><span class="token token operator">:</span><span></span><span class="token token">1</span><span class="token token punctuation">,</span><span> pageSize</span><span class="token token operator">:</span><span></span><span class="token token">20</span><span class="token token punctuation">,</span><span> totalPages</span><span class="token token operator">:</span><span></span><span class="token token">4</span><span></span><span class="token token punctuation">}</span><span class="token token punctuation">,</span><span>
</span></span><span><span></span><span class="token token punctuation">}</span><span class="token token punctuation">)</span><span class="token token punctuation">,</span><span>
</span></span><span><span></span><span class="token token punctuation">}</span><span class="token token punctuation">)</span><span class="token token punctuation">)</span><span class="token token punctuation">;</span><span>
</span></span><span>
</span><span><span></span><span class="token token">describe</span><span class="token token punctuation">(</span><span class="token token">'Tournaments Page'</span><span class="token token punctuation">,</span><span></span><span class="token token punctuation">(</span><span class="token token punctuation">)</span><span></span><span class="token token operator">=></span><span></span><span class="token token punctuation">{</span><span>
</span></span><span><span></span><span class="token token">it</span><span class="token token punctuation">(</span><span class="token token">'should display tournaments from API'</span><span class="token token punctuation">,</span><span></span><span class="token token">async</span><span></span><span class="token token punctuation">(</span><span class="token token punctuation">)</span><span></span><span class="token token operator">=></span><span></span><span class="token token punctuation">{</span><span>
</span></span><span><span></span><span class="token token">render</span><span class="token token punctuation">(</span><span class="token token">await</span><span></span><span class="token token">TournamentsPage</span><span class="token token punctuation">(</span><span class="token token punctuation">)</span><span class="token token punctuation">)</span><span class="token token punctuation">;</span><span>
</span></span><span><span></span><span class="token token">expect</span><span class="token token punctuation">(</span><span>screen</span><span class="token token punctuation">.</span><span class="token token">getByText</span><span class="token token punctuation">(</span><span class="token token regex-delimiter">/</span><span class="token token regex-source language-regex">tournaments</span><span class="token token regex-delimiter">/</span><span class="token token regex-flags">i</span><span class="token token punctuation">)</span><span class="token token punctuation">)</span><span class="token token punctuation">.</span><span class="token token">toBeInTheDocument</span><span class="token token punctuation">(</span><span class="token token punctuation">)</span><span class="token token punctuation">;</span><span>
</span></span><span><span></span><span class="token token punctuation">}</span><span class="token token punctuation">)</span><span class="token token punctuation">;</span><span>
</span></span><span><span></span><span class="token token punctuation">}</span><span class="token token punctuation">)</span><span class="token token punctuation">;</span><span>
</span></span><span></span></code></span></div></div></div></pre>

---

## Success Criteria

✅ All pages implemented from API spec
✅ All API endpoints consumed correctly
✅ Request/response formats match Swagger exactly
✅ Error handling for all API error codes
✅ Authentication flow secure and working
✅ Search/filter working for all parameters
✅ Forms validate before API submission
✅ Loading states during API calls
✅ Multi-language support (RO/EN)
✅ Responsive design (mobile-first)
✅ Accessibility standards met
✅ 80%+ test coverage
✅ Performance metrics achieved
✅ No console errors
✅ Complete documentation

---

## API Documentation Reference

**Always consult the API specification at:**

<pre class="not-prose w-full rounded font-mono text-sm font-extralight"><div class="codeWrapper text-light selection:text-super selection:bg-super/10 my-md relative flex flex-col rounded-lg font-mono text-sm font-normal bg-subtler"><div class="translate-y-xs -translate-x-xs bottom-xl mb-xl flex h-0 items-start justify-end sm:sticky sm:top-xs"><div class="overflow-hidden rounded-full border-subtlest ring-subtlest divide-subtlest bg-base"><div class="border-subtlest ring-subtlest divide-subtlest bg-subtler"></div></div></div><div class="-mt-xl"><div><div data-testid="code-language-indicator" class="text-quiet bg-subtle py-xs px-sm inline-block rounded-br rounded-tl-lg text-xs font-thin">text</div></div><div><span><code><span><span>http://localhost:3001/api/swagger-json
</span></span><span></span></code></span></div></div></div></pre>

Extract and document:

* Endpoint paths
* HTTP methods
* Request body schemas
* Response schemas
* Query parameters
* Error responses
* Authentication requirements
* Status codes

**Never assume API format.** If unsure, check the Swagger spec.
