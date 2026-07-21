# Ruru POS — Beauty Care Feature Design

> **Scope**: Full feature plan for a mobile-first, offline-first POS system targeting beauty care businesses (facial skincare, manicure, pedicure, body treatments, etc.). Hosted entirely on free-tier infrastructure.

> **Approach**: Domain-First (Approach A) — 6 sequential sub-projects, each building on the previous one's data model.

---

## Infrastructure Stack ($0 — All Free Tier)

| Layer | Technology | Free Tier Limits |
|-------|-----------|--------------------|
| Frontend Hosting | **Cloudflare Pages** | Unlimited bandwidth, unlimited requests |
| Backend Hosting | **Render Free** | 750h/mo, sleeps after 15min idle (mitigated with cron keep-alive) |
| Database | **Supabase Postgres Free** | 500 MB storage, no compute-hour limit, 2 projects |
| Email (Invites) | **Resend** | 100 emails/day — only used for employee invite links, not daily login |
| Photo Storage | **Cloudflare R2** | 10 GB storage, 1M Class B requests/mo |
| Offline Storage | **Dexie.js (IndexedDB)** | Local, free |

### Backend Keep-Alive Strategy

Render free tier spins down after 15 minutes of no traffic. To mitigate:
- Use a free cron service (e.g., cron-job.org) to ping a `/health` endpoint every 14 minutes
- The offline-first architecture means the app works instantly from local data even if the backend is briefly cold-starting
- Sync operations happen in the background — users are never blocked by cold starts

### Paid Upgrade Path (When Budget Allows)

| Layer | Upgrade To | Cost | Benefit |
|-------|-----------|------|---------|
| Backend | Render Starter | $7/mo | Always-on, no cold starts |
| Database | Supabase Pro | $25/mo | 8 GB storage, daily backups, no project limits |
| Email | Resend Pro | $20/mo | 50,000 emails/mo |

### Existing Stack (Unchanged)

- **Backend**: .NET 10 Clean Architecture (Domain → Application → Infrastructure → WebApi), Carter, MediatR, FluentValidation, Mapster, EF Core
- **Frontend**: Angular 21 + PrimeNG 19 + Taiga UI + Tailwind CSS
- **Offline DB**: Dexie.js (IndexedDB) — already established with sync patterns

---

## Multi-Store Readiness

Every store-scoped entity includes a `StoreId` (UUID) column. A single default store is created at setup. When multi-store is added later, the data is already partitioned — no schema migration required.

---

## Offline Sync Strategy (Global)

Extends the existing Dexie pattern established for Products:

1. **Write locally first** → Dexie (IndexedDB)
2. **Queue for sync** → mark as `syncStatus: 'pending'`
3. **When online** → push to backend API → on success, mark `synced`
4. **Conflict resolution** → server-wins for shared data (catalog, roles), last-write-wins with timestamps for customer/treatment records
5. **Pending deletions** → tracked in separate Dexie tables (existing pattern)

---

## Sub-project 1: Employee Management & Auth

### Purpose

Admin-only employee management with invite-based registration. TOTP-only authentication (Google Authenticator) optimized for a shared counter device — no passwords, no SSO.

### Employee Registration Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Admin opens │     │  Admin fills │     │  Admin       │     │  Employee    │
│  Employee    │────▸│  in employee │────▸│  generates   │────▸│  scans QR   │
│  Management  │     │  details &   │     │  TOTP QR     │     │  with Google │
│  (Admin only)│     │  assigns     │     │  code on     │     │  Authenticator│
│              │     │  roles       │     │  screen      │     │  → Ready!    │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
```

1. **Admin** opens Employee Management page (Admin-only access)
2. Admin fills in employee details (name, email, phone, roles)
3. Admin saves the employee record
4. Admin clicks **"Set Up TOTP"** → system generates a TOTP secret and displays a QR code on screen
5. Employee scans the QR code with Google Authenticator on their phone
6. Employee enters a verification code to confirm setup
7. Account is active — employee can now log in at the counter

**If employee is remote** (not physically present):
- Admin clicks **"Send Invite"** → system emails a one-time invite URL
- Employee clicks the link → sees the TOTP QR code to scan
- Employee verifies with a code → setup complete

### Domain Entities

#### Employee (replaces existing `User`)

| Field | Type | Notes |
|-------|------|-------|
| `Id` | UUID | PK |
| `StoreId` | UUID | FK, multi-store ready |
| `EmployeeCode` | string | Unique per store (e.g., `EMP-001`) |
| `FirstName` | string | |
| `LastName` | string | |
| `Email` | string | Unique, used for invite emails |
| `Phone` | string? | Optional |
| `TotpSecret` | string | Encrypted TOTP shared secret (for Google Authenticator) |
| `IsTotpSetUp` | bool | False until employee completes TOTP setup |
| `IsActive` | bool | Soft disable without deletion |
| `ProfilePhotoUrl` | string? | Optional |
| `CreatedAt` | DateTime | |
| `UpdatedAt` | DateTime | |

#### Role (seeded)

| Field | Type | Notes |
|-------|------|-------|
| `Id` | int | PK |
| `Name` | string | `Admin`, `Manager`, `Therapist`, `Cashier` |
| `Description` | string | |

#### EmployeeRole (many-to-many)

| Field | Type |
|-------|------|
| `EmployeeId` | UUID FK |
| `RoleId` | int FK |

#### InviteToken (for remote TOTP setup)

| Field | Type | Notes |
|-------|------|-------|
| `Id` | UUID | PK |
| `EmployeeId` | UUID | FK |
| `Token` | string | One-time use, hashed |
| `ExpiresAt` | DateTime | 24 hours from creation |
| `IsUsed` | bool | |
| `CreatedAt` | DateTime | |

#### RefreshToken

| Field | Type | Notes |
|-------|------|-------|
| `Id` | UUID | PK |
| `EmployeeId` | UUID | FK |
| `Token` | string | Hashed |
| `ExpiresAt` | DateTime | 7 days |
| `DeviceInfo` | string? | Browser/device identifier |
| `CreatedAt` | DateTime | |
| `RevokedAt` | DateTime? | Null = active |

### Auth Flow (TOTP — Shared Counter Login)

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Employee    │     │  Enter       │     │  Logged in   │
│  selects     │────▸│  6-digit     │────▸│  JWT issued  │
│  their name  │     │  TOTP code   │     │  Session     │
│  or code     │     │  from Google │     │  starts      │
│              │     │  Authenticator│     │              │
└──────────────┘     └──────────────┘     └──────────────┘
```

1. Shared device shows a list of **active employees** (names/codes)
2. Employee selects their name (or types their employee code)
3. Employee enters 6-digit TOTP code from Google Authenticator
4. Backend verifies TOTP → issues JWT `accessToken` (15min) + `refreshToken` (7 days)
5. Access token claims: `employeeId`, `storeId`, `roles[]`
6. Refresh token rotation: each refresh invalidates old token, issues new pair

**Why TOTP for POS:**
- ⚡ **Fast** — select name + 6 digits, done in seconds (like clocking in)
- 🔐 **No passwords** — nothing to remember, nothing to phish
- 📴 **Works offline** — TOTP codes are generated locally on the phone, verification can happen locally from cached `TotpSecret`
- 💰 **Free** — no SMS costs, no email sending for daily logins
- 📱 **Shared device friendly** — no browser OAuth redirects, no personal accounts on the counter device

### Offline Auth Strategy

TOTP is inherently offline-compatible:
- On successful login, **TOTP secret + employee profile + roles** are cached in Dexie (encrypted)
- When offline, TOTP verification happens **locally** — the app computes expected TOTP from the cached secret and compares
- No network needed for daily login — employees can clock in even without internet
- All offline actions queued and synced when back online, attributed to the verified employee

### RBAC Permissions Matrix

| Permission | Admin | Manager | Therapist | Cashier |
|-----------|-------|---------|-----------|---------|
| Manage employees | ✅ | ❌ | ❌ | ❌ |
| Manage roles | ✅ | ❌ | ❌ | ❌ |
| Manage vouchers | ✅ | ❌ | ❌ | ❌ |
| View all reports | ✅ | ✅ | ❌ | ❌ |
| Manage catalog | ✅ | ✅ | ❌ | ❌ |
| Manage inventory | ✅ | ✅ | ❌ | ❌ |
| Manage customers | ✅ | ✅ | ✅ | ✅ |
| View appointments | ✅ | ✅ | ✅ (own) | ✅ |
| Manage appointments | ✅ | ✅ | ✅ (own) | ❌ |
| Checkout / POS | ✅ | ✅ | ✅ | ✅ |
| Record treatments | ✅ | ✅ | ✅ (own) | ❌ |
| Process payments | ✅ | ✅ | ❌ | ✅ |
| Top-up wallet | ✅ | ✅ | ❌ | ✅ |

### Frontend Components

| Component | Route | Description |
|-----------|-------|-------------|
| `LoginComponent` | `/auth/login` | Employee selector + TOTP code input, mobile-first |
| `TotpSetupComponent` | `/auth/totp-setup` | QR code display + verification (used during invite flow) |
| `EmployeeListComponent` | `/employees` | **Admin-only**, list/search employees |
| `EmployeeFormComponent` | `/employees/new`, `/employees/:id/edit` | **Admin-only**, create/edit employee, assign roles, set up TOTP |
| `VoucherListComponent` | `/vouchers` | **Admin-only**, list/manage discount vouchers |
| `VoucherFormComponent` | `/vouchers/new`, `/vouchers/:id/edit` | **Admin-only**, create/edit discount vouchers |
| `ProfileComponent` | `/profile` | Employee views/edits own profile |

### Backend Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/login` | None | Verify employee code + TOTP, issue tokens |
| POST | `/auth/refresh` | None | Refresh access token |
| POST | `/auth/logout` | Bearer | Revoke refresh token |
| GET | `/employees` | Admin | List employees |
| GET | `/employees/{id}` | Admin,Self | Get employee details |
| POST | `/employees` | Admin | Create employee |
| PUT | `/employees/{id}` | Admin | Update employee |
| PATCH | `/employees/{id}/status` | Admin | Activate/deactivate |
| POST | `/employees/{id}/totp-setup` | Admin | Generate TOTP secret + QR code |
| POST | `/employees/{id}/totp-verify` | None | Verify TOTP setup (first code) |
| POST | `/employees/{id}/invite` | Admin | Send invite email with setup link |
| GET | `/invite/{token}` | None | Validate invite token, show TOTP setup |
| GET | `/roles` | Admin | List available roles |
| PUT | `/employees/{id}/roles` | Admin | Assign roles |
| GET | `/vouchers` | Admin | List all vouchers |
| POST | `/vouchers` | Admin | Create a new voucher |
| PUT | `/vouchers/{id}` | Admin | Update a voucher |
| DELETE | `/vouchers/{id}` | Admin | Delete a voucher |
| POST | `/vouchers/validate` | Bearer | Validate code and calculate discount |

### Migration from Existing User Entity

- **Replace** `User` with `Employee` — new entity is a superset (drops `PasswordHash`, adds `TotpSecret`)
- EF Core migration renames table and adds new columns
- Update Angular `DbService` to add Dexie tables: `employees`, `roles`, `vouchers`

---

## Sub-project 2: Service / Product / Care Package Catalog & Vouchers

### Purpose

Define what the beauty care business sells — individual services categorized by beauty features (each with predefined SOP steps), retail products, optional care packages, and discount vouchers.

### Domain Entities

#### Service

| Field | Type | Notes |
|-------|------|-------|
| `Id` | UUID | PK |
| `StoreId` | UUID | FK |
| `Name` | string | e.g., "Deep Cleansing Facial" |
| `Description` | string | |
| `Category` | string | Seeded beauty categories: "Facial Skincare", "Manicure & Pedicure", "Body Therapy", "Eye Treatment", "Hair Care", etc. |
| `DurationMinutes` | int | Used for appointment slot sizing |
| `BasePrice` | decimal | |
| `IsActive` | bool | |
| `CreatedAt` | DateTime | |
| `UpdatedAt` | DateTime | |

#### ServiceStep (SOP — Standard Operating Procedure)

Ordered steps that define the procedure for performing a service. Displayed to therapists during treatment as a guided checklist.

| Field | Type | Notes |
|-------|------|-------|
| `Id` | UUID | PK |
| `ServiceId` | UUID | FK |
| `StepOrder` | int | 1-based sequential order |
| `Title` | string | e.g., "Cleanse skin" |
| `Description` | string? | Detailed instructions for this step |
| `DurationMinutes` | int? | Optional estimated time for this step |

#### Product (extends existing)

Existing `Product` entity gains:

| New Field | Type | Notes |
|-----------|------|-------|
| `StoreId` | UUID | FK, multi-store ready |
| `IsRetail` | bool | Sold to customer at checkout |
| `IsConsumable` | bool | Used during treatments (deducted from stock) |

#### CarePackage (Optional)

| Field | Type | Notes |
|-------|------|-------|
| `Id` | UUID | PK |
| `StoreId` | UUID | FK |
| `Name` | string | e.g., "Premium Facial Package (10 sessions)" |
| `Description` | string | |
| `TotalPrice` | decimal | Package price (discounted vs individual) |
| `ValidityDays` | int | Expiry period from purchase date |
| `IsActive` | bool | |
| `CreatedAt` | DateTime | |
| `UpdatedAt` | DateTime | |

#### CarePackageItem (Optional)

| Field | Type | Notes |
|-------|------|-------|
| `Id` | UUID | PK |
| `CarePackageId` | UUID | FK |
| `ServiceId` | UUID? | FK, null if product-only item |
| `ProductId` | UUID? | FK, null if service-only item |
| `Quantity` | int | How many of this item included |

#### ServiceProduct (service-product consumption)

Defines which products a service consumes by default when performed. When a therapist completes a service, these products are auto-suggested for stock deduction.

| Field | Type | Notes |
|-------|------|-------|
| `Id` | UUID | PK |
| `ServiceId` | UUID | FK |
| `ProductId` | UUID | FK (must be a consumable product) |
| `DefaultQuantity` | int | Default quantity consumed per session |

#### Voucher (Admin-only creation)

| Field | Type | Notes |
|-------|------|-------|
| `Id` | UUID | PK |
| `StoreId` | UUID | FK |
| `Code` | string | Unique code (e.g., "WELCOME10", "FACIAL15") |
| `Type` | enum | `FixedAmount` or `Percentage` |
| `Value` | decimal | Discount amount (e.g., 10.00 for Fixed or 15.00 for 15% Percentage) |
| `MinOrderSubtotal` | decimal | Minimum subtotal required to apply voucher |
| `ExpiresAt` | DateTime? | Optional expiry date/time |
| `UsageLimit` | int? | Optional limit on total times this voucher can be used |
| `UsedCount` | int | Number of times this voucher has been used |
| `IsActive` | bool | |
| `CreatedAt` | DateTime | |
| `UpdatedAt` | DateTime | |

### Frontend Components

| Component | Route | Description |
|-----------|-------|-------------|
| `ServiceListComponent` | `/services` | **Admin-only**, list/search services by category |
| `ServiceFormComponent` | `/services/new`, `/services/:id/edit` | **Admin-only**, create/edit service details, define SOP steps, assign default products |

### Backend Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/services` | Bearer | List services (filterable by category) |
| GET | `/services/{id}` | Bearer | Get service details including SOP steps and default products |
| POST | `/services` | Admin | Create service with SOP steps |
| PUT | `/services/{id}` | Admin | Update service and SOP steps |
| DELETE | `/services/{id}` | Admin | Soft-delete (deactivate) a service |

### Key Behaviors

- **Beauty Feature Categorization**: Services are grouped into beauty feature categories (e.g., Facial Skincare, Manicure & Pedicure, Body Therapy, Eye Treatment).
- **SOP Steps**: Each service contains an ordered list of procedure steps. During treatment, therapists see these steps as a guided checklist to ensure consistency and quality. Admin creates and maintains the SOP via the Service form.
- **Optional Care Packages**: Care packages are entirely optional. Businesses can choose to offer only standalone services/products.
- **Services consume products**: `ServiceProduct` defines the default consumables. When a service is performed, the linked products are deducted from stock.
- **Admin-only Service & Voucher Management**: Services and vouchers can only be created and maintained by Admins.
- **Voucher validation**: Can be entered during payment, applying a fixed or percentage deduction to the final price.
- **Offline Catalog & Voucher verification**: Catalog items (including SOP steps) and active vouchers are synced to Dexie for offline browsing, validation, and usage during checkout.

---

## Sub-project 3: Customer Management

### Purpose

Register customers, manage wallet balance and prepaid package credits, maintain profile with beauty-care-specific fields.

### Domain Entities

#### Customer

| Field | Type | Notes |
|-------|------|-------|
| `Id` | UUID | PK |
| `StoreId` | UUID | FK |
| `FirstName` | string | |
| `LastName` | string | |
| `Phone` | string | Primary identifier (unique per store) |
| `Email` | string? | Optional |
| `DateOfBirth` | DateOnly? | Optional |
| `Gender` | string? | Optional |
| `SkinType` | string? | Oily, Dry, Combination, Sensitive, Normal |
| `Allergies` | string? | Free text, beauty-care-specific |
| `Notes` | string? | General notes |
| `IsActive` | bool | |
| `CreatedAt` | DateTime | |
| `UpdatedAt` | DateTime | |

#### Wallet

| Field | Type | Notes |
|-------|------|-------|
| `Id` | UUID | PK |
| `CustomerId` | UUID | FK, one-to-one |
| `Balance` | decimal | Current balance |
| `UpdatedAt` | DateTime | |

#### WalletTransaction

| Field | Type | Notes |
|-------|------|-------|
| `Id` | UUID | PK |
| `WalletId` | UUID | FK |
| `Type` | enum | TopUp, Deduction, Refund |
| `Amount` | decimal | Always positive; type indicates direction |
| `ReferenceId` | UUID? | Links to Order (for deductions) |
| `Description` | string | Human-readable reason |
| `CreatedBy` | UUID | Employee who processed it |
| `CreatedAt` | DateTime | |

#### CustomerPackageCredit

| Field | Type | Notes |
|-------|------|-------|
| `Id` | UUID | PK |
| `CustomerId` | UUID | FK |
| `CarePackageId` | UUID | FK |
| `RemainingCredits` | JSON | Per-service-item remaining counts |
| `PurchasedAt` | DateTime | |
| `ExpiresAt` | DateTime | Based on CarePackage.ValidityDays |
| `OrderId` | UUID | FK, the order where package was purchased |

### Key Behaviors

- Phone number is the primary customer identifier (walk-in customers give phone number)
- `SkinType` and `Allergies` are beauty-care-specific profile fields
- Wallet has full audit trail via `WalletTransaction`
- Package credits decremented per service consumed
- Customer data synced to Dexie for offline lookup

---

## Sub-project 4: Service Orders & Appointments

### Purpose

The core POS workflow. When a customer walks in, they select from available services (the offerings). An order is created. The therapist performs the service (consuming products). When treatment is completed, the order is completed and saved as customer history. Appointments provide optional advance scheduling.

### Core Business Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Customer    │     │  Browse      │     │  Create      │     │  Perform     │     │  Complete    │
│  walks in    │────▸│  available   │────▸│  Order       │────▸│  Treatment   │────▸│  Order       │
│  (or has     │     │  services    │     │  (Draft)     │     │  (products   │     │  (saved as   │
│  appointment)│     │              │     │              │     │   consumed)  │     │  history)    │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
```

**Walk-in flow (primary)**:
1. Customer arrives → identified by phone number (or registered on the spot)
2. Browse available services → select service(s) and/or care packages
3. Order created as `Draft` → assign therapist
4. Therapist performs treatment → products consumed (from `ServiceProduct` defaults, adjustable)
5. Treatment record saved → order status moves to `Completed`
6. Payment processed (SP5) → order finalized
7. Completed order saved as **customer visit history**

**Scheduled flow (secondary)**:
1. Appointment booked in advance (customer + service + therapist + time slot)
2. Customer arrives → appointment converted to an Order (Draft)
3. Same flow as walk-in from step 4 onward

### Domain Entities

#### Order

| Field | Type | Notes |
|-------|------|-------|
| `Id` | UUID | PK |
| `StoreId` | UUID | FK |
| `CustomerId` | UUID? | FK, null for anonymous walk-in |
| `EmployeeId` | UUID | FK (therapist performing the service) |
| `AppointmentId` | UUID? | FK, if order originates from appointment |
| `VoucherId` | UUID? | FK, optional applied voucher code |
| `OrderNumber` | string | Sequential, human-readable (e.g., `ORD-20260711-001`) |
| `Subtotal` | decimal | Sum of line items before discount/tax |
| `Discount` | decimal | Total discount applied (includes voucher deductions) |
| `Tax` | decimal | Tax amount |
| `Total` | decimal | Final amount due |
| `Status` | enum | Draft, InProgress, Completed, Voided, Refunded |
| `CreatedAt` | DateTime | |
| `UpdatedAt` | DateTime | |

#### OrderItem

| Field | Type | Notes |
|-------|------|-------|
| `Id` | UUID | PK |
| `OrderId` | UUID | FK |
| `ServiceId` | UUID? | FK |
| `ProductId` | UUID? | FK |
| `CarePackageId` | UUID? | FK (if purchasing a package) |
| `Description` | string | Line item description |
| `Quantity` | int | |
| `UnitPrice` | decimal | |
| `LineTotal` | decimal | |
| `IsPackageRedemption` | bool | If true, price = 0 (consuming credit) |

#### OrderProductConsumption

Tracks the actual products consumed during the service (auto-populated from `ServiceProduct` defaults, editable by therapist).

| Field | Type | Notes |
|-------|------|-------|
| `Id` | UUID | PK |
| `OrderId` | UUID | FK |
| `OrderItemId` | UUID | FK (which service line item) |
| `ProductId` | UUID | FK (consumable product) |
| `Quantity` | int | Actual quantity used |

#### Appointment (optional scheduling)

| Field | Type | Notes |
|-------|------|-------|
| `Id` | UUID | PK |
| `StoreId` | UUID | FK |
| `CustomerId` | UUID | FK |
| `EmployeeId` | UUID | FK (therapist) |
| `ServiceId` | UUID | FK |
| `Date` | DateOnly | |
| `StartTime` | TimeOnly | |
| `EndTime` | TimeOnly | Calculated from Service.DurationMinutes |
| `Status` | enum | Scheduled, ConvertedToOrder, Cancelled, NoShow |
| `OrderId` | UUID? | FK, set when appointment is converted to an order |
| `Notes` | string? | |
| `CreatedBy` | UUID | Employee who booked |
| `CreatedAt` | DateTime | |
| `UpdatedAt` | DateTime | |

#### EmployeeSchedule

| Field | Type | Notes |
|-------|------|-------|
| `Id` | UUID | PK |
| `EmployeeId` | UUID | FK |
| `DayOfWeek` | int | 0=Sunday...6=Saturday |
| `StartTime` | TimeOnly | Shift start |
| `EndTime` | TimeOnly | Shift end |
| `IsAvailable` | bool | |

#### BlockedSlot

| Field | Type | Notes |
|-------|------|-------|
| `Id` | UUID | PK |
| `EmployeeId` | UUID | FK |
| `Date` | DateOnly | |
| `StartTime` | TimeOnly | |
| `EndTime` | TimeOnly | |
| `Reason` | string? | Lunch, time off, etc. |

### Key Behaviors

- **Order is the central entity** — every customer interaction results in an order
- **Services are offerings** — the customer selects services; services consume products when performed
- **Product consumption** — auto-populated from `ServiceProduct` defaults, therapist can adjust actual quantities used. Stock is deducted on order completion.
- **Customer visit history** = their completed orders, each linking to treatment records and products consumed
- **Appointment → Order conversion**: when a scheduled customer arrives, the appointment becomes an Order (Draft) with the same service/therapist
- Time slot availability = `EmployeeSchedule` − `BlockedSlot` − existing `Appointments`
- Calendar view for therapists (daily schedule) and managers (all therapists)
- Offline orders queued in Dexie and synced when connectivity resumes

---

## Sub-project 5: Payment Processing

### Purpose

Process payments for completed orders with split payment support across cash, card, and wallet.

### Domain Entities

#### Payment

| Field | Type | Notes |
|-------|------|-------|
| `Id` | UUID | PK |
| `OrderId` | UUID | FK |
| `Method` | enum | Cash, Card, Wallet |
| `Amount` | decimal | Amount paid via this method |
| `Reference` | string? | Card last 4 digits, wallet tx ID |
| `CreatedAt` | DateTime | |

### Key Behaviors

- **Split payments**: One order can have multiple `Payment` records (e.g., $50 wallet + $30 cash)
- **Package redemption**: Service items with active package credits show as $0 on the order, decrement `CustomerPackageCredit.RemainingCredits`
- **Voucher deduction**: If a voucher code is applied during payment, the system validates the voucher (checking subtotal, expiration, status, limits), updates `Order.VoucherId`, calculates the discount, deducts it from the final price, and increments the voucher's usage count.
- Cash: calculates change automatically
- Card: manually recorded (no gateway integration)
- Wallet: deducts from `Wallet.Balance`, creates `WalletTransaction`
- Payment finalizes the order — moves status from `InProgress` → `Completed`
- Offline payments sync to backend when connectivity resumes

---

## Sub-project 6: Treatment Records

### Purpose

Structured clinical/treatment documentation per customer visit with photo support.

### Domain Entities

#### TreatmentRecord

| Field | Type | Notes |
|-------|------|-------|
| `Id` | UUID | PK |
| `StoreId` | UUID | FK |
| `CustomerId` | UUID | FK |
| `EmployeeId` | UUID | FK (therapist) |
| `AppointmentId` | UUID? | FK |
| `OrderId` | UUID? | FK |
| `ServiceId` | UUID | FK |
| `TreatmentDate` | DateOnly | |
| `Duration` | int | Actual minutes spent |
| `SkinConditionBefore` | string | |
| `SkinConditionAfter` | string | |
| `ProductsApplied` | JSON | Array of { productId, quantity } |
| `Technique` | string? | Treatment technique used |
| `Notes` | string? | Free-text notes |
| `CreatedAt` | DateTime | |
| `UpdatedAt` | DateTime | |

#### TreatmentPhoto

| Field | Type | Notes |
|-------|------|-------|
| `Id` | UUID | PK |
| `TreatmentRecordId` | UUID | FK |
| `PhotoUrl` | string | URL in Cloudflare R2 / Supabase Storage |
| `Caption` | string? | |
| `PhotoType` | enum | Before, After, During |
| `CreatedAt` | DateTime | |

### Key Behaviors

- Linked to appointment and order for full traceability
- Photos stored in Cloudflare R2 (free tier); offline photos queued locally, uploaded on sync
- Therapists view customer's full treatment timeline on subsequent visits
- `ProductsApplied` JSON array of product IDs + quantities used (deducted from consumable stock)

---

## Build Order & Dependencies

```
SP1 (Auth) → SP2 (Catalog) → SP3 (Customer) → SP4 (Service Orders & Appointments) → SP5 (Payment) → SP6 (Treatment)
```

Each sub-project gets its own spec → implementation plan → implementation → verification cycle.

---

## Summary of Key Design Decisions

1. **Free infrastructure only** — Render Free + Supabase Postgres Free + Cloudflare Pages + Resend SMTP + Cloudflare R2
2. **TOTP-only for MFA** — offline-friendly daily authentication via Google Authenticator, no password entry required
3. **RBAC with multi-role** — Admin, Manager, Therapist, Cashier; employees can hold multiple roles
4. **Single store first, multi-store ready** — `StoreId` on all entities
5. **Monetary wallet + optional packages** — monetary balance support and optional prepaid service packages
6. **Split payments** — cash + manual card + wallet per transaction
7. **Full offline** — all modules work offline via Dexie, sync on reconnect. Local TOTP verification supports fully offline authentication.
8. **Admin-only Voucher Management** — vouchers are maintained by admins and applied to orders during payment to deduct from the final price
9. **Structured treatment records** — predefined fields + photo uploads
10. **Order-centric workflow** — walk-in → service selection → order → treatment (products consumed) → complete → customer history
11. **Appointments as optional scheduling** — advance booking that converts to an order on arrival
12. **Service-product consumption** — services define default consumable products, tracked per order
