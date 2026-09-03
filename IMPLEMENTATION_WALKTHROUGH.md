# Super Store Portal Implementation Walkthrough

This document explains the implementation completed from the remaining-modules specification for the Super Store Portal.

The project is a single-store ERP and POS application built with:

- React and Vite for the frontend
- Express for the backend API
- MongoDB and Mongoose for persistence
- Stripe for card-payment processing
- JWT-based authentication and role-based access control
- Cloudinary-backed product images

The implementation covered the first three priority modules and the purchase/supplier frontend needed for Module 1.

## Implementation Status

| Module | Status | Summary |
| --- | --- | --- |
| Module 0 | Implemented | Atomic sale completion across Sale, Payment, Product, StockMovement, and Income |
| Module 1 | Implemented | Purchase orders, supplier balances, supplier payments, and admin UI |
| Module 2 | Implemented | Signed Stripe webhook with idempotent sale reconciliation |
| Module 3 | Not implemented | User management CRUD |
| Module 4 | Not implemented | Expenses and Income management UI/API |
| Module 5 | Not implemented | Dedicated reports and date filtering |
| Module 6 | Not implemented | Sales charts |
| Module 7 | Not implemented | Validation, rate limiting, and API documentation |

The later modules should be implemented after the first three are tested against a real MongoDB replica set or MongoDB Atlas deployment.

## Module 0: Atomic Sale Completion

### Problem addressed

Sale completion originally updated several MongoDB collections independently:

- Sale
- Product stock
- StockMovement
- Payment
- Income

If one write failed after another write had already succeeded, the database could contain partial sale data. Stock could be reduced without a matching movement, or a completed payment could exist without a completed Sale.

### Shared service

The central implementation is in:

- `backend/src/services/saleService.js`

The service exports:

- `completeSale(saleId, session)`
- `completeSaleInTransaction(saleId)`

`completeSale` performs the business operation using a caller-provided Mongoose session. `completeSaleInTransaction` creates a session, starts a transaction, calls the shared function, and closes the session.

### Transaction behavior

For each Sale item, the service performs a conditional atomic stock decrement:

```js
Product.findOneAndUpdate(
  { _id: productId, stockQuantity: { $gte: quantity } },
  { $inc: { stockQuantity: -quantity } },
  { session, returnDocument: 'before' }
)
```

This provides two protections:

1. Stock cannot become negative.
2. Two competing checkouts cannot both successfully consume the same final unit.

The returned product document represents the stock before the decrement. That value is used to create one `StockMovement` record per Sale item with:

- `type: 'SALE'`
- `quantity`
- `previousStock`
- `newStock`
- `referenceType: 'SALE'`
- `referenceId`
- the Sale cashier as `createdBy`

If the conditional update returns `null`, the service throws an insufficient-stock error. The transaction aborts, so all writes in that transaction are rolled back.

After all items are successfully decremented, the service:

1. Sets `Sale.status` to `completed`.
2. Sets `Sale.paymentStatus` to `paid`.
3. Sets `Payment.status` to `succeeded`.
4. Sets `Payment.paidAt` to the completion time.
5. Creates one Income record for the Sale.
6. Skips Income creation if the Sale already has a Sale-linked Income record.

The Income record uses:

```js
{
  title: `Sale ${sale.invoiceNumber}`,
  category: 'Sales',
  amount: sale.total,
  referenceType: 'sale',
  referenceId: sale._id,
  date: completionTime,
  createdBy: sale.cashierId
}
```

That reference makes Sale-generated Income distinguishable from future manual Income entries.

### POS flow

The POS endpoint is implemented in:

- `backend/src/controllers/saleController.js`
- `backend/src/routes/saleRoutes.js`

`POST /api/sales` now:

1. Validates the submitted product IDs.
2. Calculates the subtotal and line totals from current Product prices.
3. Snapshots each product's purchase price into `Sale.items[].purchaseCost`.
4. Creates a pending Sale.
5. Creates its Payment record, using `method: 'stripe'` when a Stripe PaymentIntent ID is supplied and `method: 'cash'` otherwise.
6. Calls `completeSale` inside the same transaction.
7. Returns the completed Sale.

The Sale and Payment creation were deliberately placed in the same transaction as stock and accounting writes. This prevents an insufficient-stock failure from leaving orphaned pending records in the POS path.

### Self-checkout flow

Self-checkout preparation remains in:

- `backend/src/controllers/cartController.js`
- `backend/src/routes/cartRoutes.js`

The existing finalize operation still performs the pre-payment workflow:

1. Loads the submitted Cart.
2. Revalidates product availability and the stored price snapshot.
3. Creates a pending self-checkout Sale.
4. Marks the Cart as finalized.
5. Creates a Stripe PaymentIntent containing the Sale ID in metadata.
6. Creates a pending Payment record.

The existing cleanup for PaymentIntent creation failure is preserved. If Stripe PaymentIntent creation fails, the newly created Sale is deleted and the Cart is cancelled.

A protected completion endpoint was added:

```text
POST /api/cart/sales/:saleId/complete
```

It calls `completeSaleInTransaction` for the existing pending self-checkout Sale.

A general protected completion endpoint was also added:

```text
POST /api/sales/:id/complete
```

Both endpoints use the same shared completion service rather than duplicating stock, movement, payment, and Income logic.

### Role Access for Completion Endpoints

| Endpoint | Access | Scope |
| --- | --- | --- |
| `POST /api/cart/sales/:saleId/complete` | Customer token only | `Sale.customerId` must match `req.user._id` |
| `POST /api/sales/:id/complete` | Admin or Cashier token | Admin may complete any Sale; Cashier may complete only a Sale whose `cashierId` matches `req.user._id` |

This repository uses `Admin` and `Cashier` for staff roles. Customer tokens are identified by the existing `protect` middleware because they do not contain the staff JWT `role` claim. The cart completion route uses customer-only middleware and an ownership check; staff tokens and customers attempting another customer's Sale receive HTTP 403.

The POS completion route uses the existing Admin/Cashier role middleware and performs the Cashier ownership check before invoking the transaction service.

### Payment Record Creation

Every active Payment creation path includes a required method:

```js
{
  saleId: sale._id,
  amount: sale.total,
  method: stripePaymentIntentId ? 'stripe' : 'cash',
  status: 'pending',
  stripePaymentIntentId,
  createdBy: req.user._id
}
```

Self-checkout creates the same record with `method: 'stripe'` and the Stripe PaymentIntent ID. The Payment schema requires the lowercase methods `stripe` or `cash`.

### Relevant schemas

The shared service uses the existing models:

- `backend/src/models/Sale.js`
- `backend/src/models/Payment.js`
- `backend/src/models/Product.js`
- `backend/src/models/StockMovement.js`
- `backend/src/models/Income.js`

No Sale item purchase-cost snapshots are recalculated during completion. The historical value stored on the Sale remains unchanged.

## Module 1: Purchases and Supplier Payments

### Supplier balance fields

The Supplier schema was extended in:

- `backend/src/models/Supplier.js`

New fields:

```js
openingBalance: { type: Number, default: 0, min: 0 }
currentBalance: { type: Number, default: 0, min: 0 }
```

`currentBalance` is not intended to be directly edited by the Supplier form. It changes through recorded purchases and recorded supplier payments.

### Purchase schema extension

The existing Purchase schema is in:

- `backend/src/models/Purchase.js`

The schema already stored purchase lines using `unitCost`. A `createdBy` reference was added. The API accepts the specification's `purchasePrice` field and stores it as `unitCost` in the Purchase document.

Each stored item contains:

- `productId`
- `quantity`
- `unitCost`
- `total`

### SupplierPayment model

A new model was added:

- `backend/src/models/SupplierPayment.js`

Fields:

- `supplierId`
- `amount`
- `date`
- `method`
- `reference`
- `createdBy`
- timestamps

The amount must be greater than zero, and the supplier, date, method, and creating user are required.

### Purchase API

The purchase controller is:

- `backend/src/controllers/purchaseController.js`

The routes are:

- `backend/src/routes/purchaseRoutes.js`

All purchase endpoints are Admin-only.

#### Create purchase

```text
POST /api/purchases
```

Expected request shape:

```json
{
  "supplierId": "supplier-object-id",
  "items": [
    {
      "productId": "product-object-id",
      "quantity": 10,
      "purchasePrice": 125
    }
  ]
}
```

The server does not trust a frontend total. It calculates every line total and the complete `totalAmount` itself.

The operation runs in one MongoDB transaction:

1. Validate the Supplier.
2. Validate every Product.
3. Validate quantity and purchase price.
4. Calculate each line total.
5. Create a `RECEIVED` Purchase with `UNPAID` payment status.
6. Increase `Product.stockQuantity` for every line.
7. Replace each Product's current `purchasePrice` with the latest purchase price.
8. Create one `StockMovement` with `type: 'PURCHASE'` per line.
9. Increase `Supplier.currentBalance` by the purchase total.

The operation does not modify existing Sale documents or their `purchaseCost` snapshots.

#### List purchases

```text
GET /api/purchases
```

The response includes the supplier name through Mongoose population and returns newest purchases first.

#### Get purchase detail

```text
GET /api/purchases/:id
```

The response populates the supplier and product names for read-only detail display.

### Supplier payment API

The controller is:

- `backend/src/controllers/supplierPaymentController.js`

The endpoints are mounted through:

- `backend/src/routes/supplierRoutes.js`

All supplier payment endpoints are Admin-only.

#### Record payment

```text
POST /api/suppliers/:id/payments
```

Expected request shape:

```json
{
  "amount": 5000,
  "date": "2026-09-03",
  "method": "Bank transfer",
  "reference": "TXN-1001"
}
```

The request runs in a transaction:

1. Load the Supplier.
2. Validate the amount, date, and method.
3. Reject a payment greater than `currentBalance`.
4. Create the SupplierPayment record.
5. Decrease `Supplier.currentBalance` by the payment amount.

#### Payment history

```text
GET /api/suppliers/:id/payments
```

Payments are sorted newest first and include the creating user's name where available.

### Supplier deletion protection

Supplier deletion logic remains in:

- `backend/src/services/supplierService.js`

Deletion is rejected when:

- Products are still linked to the Supplier.
- Any Purchase history exists.
- Any SupplierPayment history exists.

This preserves supplier traceability and prevents historical accounting records from being orphaned.

### Purchase frontend

The frontend additions are:

- `frontend/src/pages/Purchases.jsx`
- `frontend/src/services/purchaseService.js`

The route is registered in:

- `frontend/src/routes/AppRoutes.jsx`

The page is added to the Admin navigation in:

- `frontend/src/layouts/AdminLayout.jsx`

The Purchases page provides:

- Active supplier picker
- Product picker for each line
- Quantity input
- Purchase price input
- Add-line control
- Remove-line control
- Running total
- Save Purchase action
- Purchase history table

The page sends line items to the backend and uses the server response as the source of truth for the saved Purchase.

### Supplier payment frontend

The existing supplier page was extended rather than creating a second supplier detail page:

- `frontend/src/pages/Suppliers.jsx`
- `frontend/src/services/supplierService.js`

The supplier traceability modal now includes:

- Current supplier balance
- Payment amount input
- Payment date input
- Payment method input
- Reference input
- Record Payment action
- Payment history list

After a payment is recorded, the page reloads the payment history, reloads the supplier balance, and refreshes the supplier list.

## Module 2: Stripe Webhook Handler

### Raw request body handling

The webhook route is:

- `backend/src/routes/webhookRoutes.js`

The controller is:

- `backend/src/controllers/webhookController.js`

The route is mounted before `express.json()` in:

- `backend/src/app.js`

That order is required because Stripe signature verification needs the original raw request body.

The route uses a scoped parser:

```js
express.raw({ type: 'application/json' })
```

The endpoint is:

```text
POST /api/webhooks/stripe
```

It does not use the application's JWT middleware. Stripe authentication is provided by signature verification.

### Signature verification

The controller calls:

```js
stripe.webhooks.constructEvent(
  req.body,
  req.headers['stripe-signature'],
  process.env.STRIPE_WEBHOOK_SECRET
)
```

If verification fails, the endpoint returns HTTP 400 and does not process the event.

Required environment configuration:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Supported events

#### `payment_intent.succeeded`

The handler:

1. Finds the Payment by `stripePaymentIntentId`.
2. Checks the stored webhook event ID.
3. Stores the current event ID and processing time.
4. Calls the shared `completeSale` service using the same MongoDB session.
5. Lets the shared service update stock, movements, Sale, Payment, and Income atomically.

#### `payment_intent.payment_failed`

The handler:

1. Finds the Payment by Stripe PaymentIntent ID.
2. Stores the event ID and processing time.
3. Sets Payment status to `failed`.
4. Leaves inventory untouched.
5. Leaves the Sale pending rather than falsely completing it.

### Idempotency

Stripe may deliver an event more than once. The handler stores `event.id` in `Payment.webhookEventId` and skips an event already recorded for that Payment.

The shared completion service also returns immediately when a Sale is already completed. Together these protections prevent duplicate stock decrements, duplicate movements, and duplicate Income records.

## Backend Route Summary

The routes added or changed for the implemented modules are:

```text
POST /api/sales/:id/complete
POST /api/cart/sales/:saleId/complete
GET  /api/purchases
POST /api/purchases
GET  /api/purchases/:id
GET  /api/suppliers/:id/payments
POST /api/suppliers/:id/payments
POST /api/webhooks/stripe
```

Completion access verification:

- Customer self-checkout completion requires a Customer token and matching `Sale.customerId`.
- Cashier POS completion requires matching `Sale.cashierId`.
- Admin POS completion is not ownership restricted.

The existing routes that now use the shared completion behavior include:

```text
POST /api/sales
POST /api/cart/:id/finalize
```

## Files Added

Backend:

- `backend/src/services/saleService.js`
- `backend/src/models/SupplierPayment.js`
- `backend/src/controllers/purchaseController.js`
- `backend/src/controllers/supplierPaymentController.js`
- `backend/src/controllers/webhookController.js`
- `backend/src/routes/purchaseRoutes.js`
- `backend/src/routes/webhookRoutes.js`

Frontend:

- `frontend/src/pages/Purchases.jsx`
- `frontend/src/services/purchaseService.js`

## Files Updated

Backend:

- `backend/src/app.js`
- `backend/src/controllers/cartController.js`
- `backend/src/controllers/saleController.js`
- `backend/src/models/Purchase.js`
- `backend/src/models/Supplier.js`
- `backend/src/routes/cartRoutes.js`
- `backend/src/routes/saleRoutes.js`
- `backend/src/routes/supplierRoutes.js`
- `backend/src/services/supplierService.js`

Frontend:

- `frontend/src/layouts/AdminLayout.jsx`
- `frontend/src/pages/Suppliers.jsx`
- `frontend/src/routes/AppRoutes.jsx`
- `frontend/src/services/supplierService.js`

## Validation Performed

The following checks were completed:

### Backend syntax checks

The changed backend controllers, services, models, and routes were checked with Node's syntax checker.

Example:

```bash
node --check backend/src/controllers/purchaseController.js
node --check backend/src/controllers/webhookController.js
```

### Backend application loading

The Express application was loaded successfully:

```bash
node -e "require('./backend/src/app'); console.log('backend app loaded')"
```

### Frontend production build

The frontend production build completed successfully:

```bash
npm run build
```

The build transformed the Vite application and generated the production bundle without build errors.

### Workspace diagnostics

Diagnostics reported no JavaScript or JSX errors in the new Module 0, Module 1, and Module 2 implementation files.

Existing Tailwind modernization suggestions remain in legacy frontend files. They are suggestions such as replacing `flex-shrink-0` with `shrink-0`, not failures caused by the implemented modules.

### Diff formatting

The repository changes passed:

```bash
git diff --check
```

## Manual Verification Checklist

A real database-backed verification should cover these cases.

### Atomic Sale Completion

1. Connect the backend to MongoDB Atlas or a replica-set deployment.
2. Set a Product stock quantity to `1`.
3. Attempt to complete a Sale containing quantity `2`.
4. Confirm the request is rejected.
5. Confirm no Sale completion, Payment success, StockMovement, or Income record was committed.
6. Run two near-simultaneous completions for the last unit.
7. Confirm only one completion succeeds.
8. Confirm a successful multi-item Sale creates exactly one StockMovement per item and one Sale-linked Income record.

### Purchases

1. Create a Purchase with multiple product lines.
2. Confirm stock increases by each line quantity.
3. Confirm each Product's `purchasePrice` becomes the latest purchase price.
4. Confirm one `PURCHASE` StockMovement exists per line.
5. Confirm Supplier.currentBalance increases by the calculated total.
6. Confirm a previous Sale's `purchaseCost` remains unchanged.

### Supplier Payments

1. Record a payment within the current balance.
2. Confirm a SupplierPayment record is created.
3. Confirm Supplier.currentBalance decreases by the exact amount.
4. Try to overpay and confirm the request is rejected.
5. Try deleting a supplier with payment or purchase history and confirm deletion is blocked.

### Stripe Webhooks

With the Stripe CLI installed:

```bash
stripe listen --forward-to localhost:5000/api/webhooks/stripe
```

Then verify:

1. A valid signed `payment_intent.succeeded` event completes the related Sale.
2. A repeated event does not create duplicate movements or Income.
3. A `payment_intent.payment_failed` event marks Payment as failed without changing stock.
4. A tampered signature receives HTTP 400 and performs no database writes.

## Important Runtime Prerequisite

MongoDB transactions require a replica set or MongoDB Atlas deployment. A standalone local MongoDB server may reject `withTransaction` operations.

For local transaction testing, use either:

- MongoDB Atlas
- A local MongoDB replica-set configuration

The frontend and backend build checks can run without a live database, but transaction behavior cannot be fully verified until a transaction-capable MongoDB connection is available.

## Additional Implementation Update

The following work was completed after the initial walkthrough.

## Module 3: User Management CRUD

### Backend

The User model in `backend/src/models/User.js` now supports:

- `name`
- `email`
- `password`
- `role` (`Admin`, `Store_Manager`, or `Cashier`; the UI displays `Store_Manager` as `Store Manager`)
- `isActive`

The `name` field has a default value so existing seeded accounts remain compatible.

The auth controller now exports a shared `hashPassword` helper. User creation and password updates reuse this helper instead of duplicating bcrypt configuration.

New files:

- `backend/src/controllers/userController.js`
- `backend/src/routes/userRoutes.js`

The Admin-only endpoints are:

```text
GET    /api/users
POST   /api/users
PUT    /api/users/:id
DELETE /api/users/:id
```

Security behavior:

- Cashiers cannot access any User endpoint.
- Passwords are never returned in API responses.
- Duplicate email addresses are rejected.
- An Admin cannot deactivate their own account.
- An Admin cannot delete their own account.
- Inactive users cannot log in.

### Frontend

New files:

- `frontend/src/pages/Users.jsx`
- `frontend/src/services/userService.js`

The page is routed at `/users` and is visible only to Admin users. It provides account creation, editing, active-status control, password updates, and deletion. The current Admin account cannot be deleted or deactivated from its own row. The create form requires Name, Email, Password, and Role, and supports selecting `Cashier`, `Store Manager`, or `Admin`. The API stores the Store Manager role as `Store_Manager`; it also accepts the space and hyphen spellings for compatibility.

## Module 4: Expenses and Income

### Model corrections

`backend/src/models/Expense.js` now validates:

```text
Electricity, Rent, Internet, Maintenance, Marketing, Transport, Other
```

Expense amounts must be non-negative.

`backend/src/models/Income.js` now uses `source` instead of `category` and requires:

```text
referenceType: sale | manual
```

Sale completion now writes `source: 'Sales'`, matching the attached specification.

### Finance API

New files:

- `backend/src/controllers/financeController.js`
- `backend/src/routes/financeRoutes.js`

Admin-only endpoints:

```text
GET    /api/expenses
POST   /api/expenses
PUT    /api/expenses/:id
DELETE /api/expenses/:id

GET    /api/income
POST   /api/income
PUT    /api/income/:id
DELETE /api/income/:id
```

Expense list requests support:

```text
?from=YYYY-MM-DD&to=YYYY-MM-DD&category=Rent
```

Manual Income creation always forces `referenceType: 'manual'` and removes any submitted reference ID.

Sale-linked Income is protected at the backend:

- It can be listed.
- It cannot be edited.
- It cannot be deleted.
- The API returns a conflict response when modification is attempted.

### Frontend

New files:

- `frontend/src/pages/Expenses.jsx`
- `frontend/src/pages/Income.jsx`
- `frontend/src/services/financeService.js`

The Admin navigation and routes now expose `/expenses` and `/income`. Expenses include category and date-range filtering. Income displays manual and Sale-linked records together, while edit and delete controls are available only for manual records.

## Module 5: Reports

The existing report controller and routes were extended with live MongoDB aggregation endpoints. No report totals are cached or calculated by pulling all documents into Node.js.

Admin-only endpoints:

```text
GET /api/reports/sales?from=&to=
GET /api/reports/purchases?from=&to=
GET /api/reports/inventory
GET /api/reports/payments?from=&to=
GET /api/reports/expenses?from=&to=
GET /api/reports/income?from=&to=
GET /api/reports/profit-loss?from=&to=
```

Report behavior:

- Sales are restricted to `status: 'completed'`.
- Sales are grouped by channel and date.
- Purchases are grouped by supplier and product.
- Inventory reports current units, inventory value, low-stock products, and out-of-stock products.
- Payment reports group amounts by payment status.
- Expense reports group by category and date.
- Income reports group by Sale-linked versus manual entries and date.
- Profit/loss calculates Revenue, COGS, Expenses, and Net Profit.

COGS is calculated from each Sale item's historical `purchaseCost` snapshot. It never reads the current Product purchase price.

### Reports frontend

New file:

- `frontend/src/pages/Reports.jsx`

The page is routed at `/reports` and is Admin-only. It provides report tabs and shared `from`/`to` date inputs. Changing either date causes the currently selected report to be fetched again.

## Dashboard Update

The Admin dashboard was updated in:

- `backend/src/controllers/reportController.js`
- `frontend/src/pages/Dashboard.jsx`

Dashboard sales and order totals now use completed sales only. The API also supplies:

- Top-selling products
- Recent purchases
- Recent expenses

The Admin dashboard renders those three additional activity sections alongside recent sales and low-stock products.

The existing Cashier dashboard remains scoped to the logged-in Cashier and the current day.

## Updated Navigation and Routes

Admin-only frontend routes now include:

```text
/users
/expenses
/income
/reports
```

The corresponding navigation entries are added to `frontend/src/layouts/AdminLayout.jsx`.

## Updated Files Added

Backend:

- `backend/src/controllers/userController.js`
- `backend/src/routes/userRoutes.js`
- `backend/src/controllers/financeController.js`
- `backend/src/routes/financeRoutes.js`

Frontend:

- `frontend/src/pages/Users.jsx`
- `frontend/src/pages/Expenses.jsx`
- `frontend/src/pages/Income.jsx`
- `frontend/src/pages/Reports.jsx`
- `frontend/src/services/userService.js`
- `frontend/src/services/financeService.js`

## Updated Validation

After implementing Modules 3 through 5 and the dashboard changes:

```bash
node --check backend/src/controllers/userController.js
node --check backend/src/controllers/financeController.js
node --check backend/src/controllers/reportController.js
node -e "require('./backend/src/app'); console.log('backend loaded')"
npm run build
git diff --check
```

All executable checks passed. The frontend production build completed successfully. Diagnostics for the newly added pages reported no errors. Existing Tailwind modernization suggestions remain in legacy dashboard/layout files.

## Current Remaining Work

### Module 6: Charts

- Optional Recharts or Chart.js sales visualization using the Reports response.

### Module 7: Hardening

- Request validation with `express-validator` or an equivalent library.
- Login rate limiting with `express-rate-limit`.
- Swagger/OpenAPI documentation.

The POS sidebar is available to Admin and Cashier users only. Store Managers retain Sales and Receipts visibility but cannot open the POS or submit POS transactions.

## Latest Fixes: Income, Roles, and Payment Methods

The latest correction pass addressed three implementation/documentation issues.

### 1. Income Field Correction

Sale-generated Income records now use the `source` field required by the Income schema:

```js
{
  title: `Sale ${sale.invoiceNumber}`,
  source: 'Sales',
  amount: sale.total,
  referenceType: 'sale',
  referenceId: sale._id,
  date: completionTime,
  createdBy: sale.cashierId
}
```

Updated files:

- `backend/src/models/Income.js` requires `source`.
- `backend/src/services/saleService.js` writes `source: 'Sales'`.

The old `category: 'Sales'` field is no longer used for Sale-linked Income.

### 2. Completion Endpoint Access Control

The completion endpoints now enforce both role and ownership:

| Endpoint | Allowed user | Ownership rule |
| --- | --- | --- |
| `POST /api/cart/sales/:saleId/complete` | Customer only | `Sale.customerId` must equal `req.user._id` |
| `POST /api/sales/:id/complete` | Admin or Cashier | Cashier must own the Sale; Admin can complete any Sale |

Implementation details:

- `backend/src/routes/cartRoutes.js` uses Customer-only middleware.
- `backend/src/controllers/cartController.js` verifies the Customer owns the Sale.
- `backend/src/routes/saleRoutes.js` allows only Admin/Cashier staff tokens.
- `backend/src/controllers/saleController.js` rejects a Cashier completing another Cashier's Sale.

This project now represents staff roles as `Admin`, `Store_Manager`, and `Cashier`. The frontend displays `Store_Manager` as `Store Manager`. Customer tokens are identified by the existing authentication middleware because they do not contain the staff JWT `role` claim.

Expected access behavior:

- A Customer can complete their own self-checkout Sale.
- A Customer cannot complete another Customer's Sale.
- A Store Manager can manage catalog and inventory operations and access the operational dashboard, but cannot use the POS.
- A Cashier can complete only their own POS Sale.
- A Cashier cannot complete another Cashier's Sale.
- An Admin can complete any Sale.

Unauthorized ownership attempts return HTTP 403. Missing Sales return HTTP 404.

### 3. Payment Method Contract

The Payment schema now requires one of the two active lowercase methods:

```js
method: {
  type: String,
  enum: ['stripe', 'cash'],
  required: true
}
```

POS Payment creation uses:

```js
method: stripePaymentIntentId ? 'stripe' : 'cash'
```

Self-checkout Payment creation uses:

```js
method: 'stripe'
```

Payment records also include `saleId`, `amount`, `status`, Stripe identifiers where applicable, `createdBy`, and webhook idempotency fields. Active payment records start with `status: 'pending'`; successful completion changes the status to `succeeded` and sets `paidAt`.

Updated files:

- `backend/src/models/Payment.js`
- `backend/src/controllers/saleController.js`
- `backend/src/controllers/cartController.js`

### Latest Fix Verification

1. Complete a Sale and inspect the Income collection. Confirm it contains `source: 'Sales'` and no Sale-generated `category` field.
2. Attempt Customer completion for the Customer's own Sale and a different Customer's Sale. Confirm only the owned Sale succeeds.
3. Attempt Cashier completion for an owned and unowned Sale. Confirm only the owned Sale succeeds.
4. Attempt Admin completion for another user's Sale. Confirm it succeeds.
5. Inspect POS Stripe, POS cash, and self-checkout Payment documents. Confirm their methods are `stripe` or `cash`.
6. Send a duplicate Stripe webhook and confirm no duplicate StockMovement or Income record is created.

The latest backend validation passed with Node syntax checks, Express application loading, workspace diagnostics, and `git diff --check`. Full transaction behavior still requires MongoDB Atlas or a replica-set deployment.
