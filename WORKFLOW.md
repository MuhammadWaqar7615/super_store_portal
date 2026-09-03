# Super Store Portal Workflow

This document explains the end-to-end workflow of the Super Store Portal, from login and role-based routing to POS, inventory, purchases, finance, reports, and data persistence.

## 1. Project Summary

Super Store Portal is a MERN-style ERP application for retail operations. It combines:

- A React + Vite frontend in `frontend/`
- An Express + MongoDB backend in `backend/src/`
- JWT-based authentication
- Role-based access control
- Cloudinary image uploads for products
- Stripe card payments for POS checkout

Stock follows two locations: `INVENTORY` is the back room and `STORE` is the sales floor.

The app is designed around five active staff roles:

- `Admin`
- `Store_Manager`
- `Inventory_Manager`
- `Cashier`
- `Accounts/Finance`

Only `Admin` can access the Settings module. It provides links to staff/role management, individual catalog product deletion, database counts, and confirmation-protected cleanup actions for inventory, catalog, suppliers, purchases, sales, finance, customers, carts, payments, and staff users.

## 2. High-Level Request Flow

1. The user opens the frontend app.
2. `frontend/src/context/AuthContext.jsx` loads any stored `user` and `token` from `localStorage`.
3. `frontend/src/routes/AppRoutes.jsx` blocks unauthenticated access and sends logged-out users to `/login`.
4. After login, the app stores the JWT and user payload in `localStorage`.
5. `frontend/src/layouts/AdminLayout.jsx` renders the sidebar and menu items according to the user role.
6. Screens call the API through `frontend/src/services/api.js`.
7. The Axios client attaches the JWT automatically to every request.
8. The backend verifies the token with `backend/src/middleware/authMiddleware.js`.
9. Role checks are enforced with `backend/src/middleware/roleMiddleware.js`.
10. Controllers read or write MongoDB models and return JSON responses.
11. The frontend updates the UI state from the returned data.

## 3. Key Files

- `frontend/src/App.jsx`
- `frontend/src/context/AuthContext.jsx`
- `frontend/src/routes/AppRoutes.jsx`
- `frontend/src/layouts/AdminLayout.jsx`
- `frontend/src/services/api.js`
- `backend/src/app.js`
- `backend/src/server.js`
- `backend/src/middleware/authMiddleware.js`
- `backend/src/middleware/roleMiddleware.js`
- `backend/src/controllers/*`
- `backend/src/models/*`

## 4. Authentication Workflow

### Login

1. The user enters email and password on `frontend/src/pages/Login.jsx`.
2. The frontend sends `POST /api/auth/login`.
3. The backend checks the password with bcrypt in `backend/src/controllers/authController.js`.
4. If credentials are valid, the backend returns:
   - user id
   - email
   - role
   - JWT token
5. The frontend stores the response in `localStorage`.
6. The app navigates to `/staff`, which redirects to the main dashboard route.

### Session restore

On refresh, `AuthContext` reads the stored `user` and `token` and restores the session without requiring a new login.

### Logout

1. The sidebar logout action calls `POST /api/auth/logout`.
2. The frontend clears `localStorage`.
3. The app redirects to `/login`.

### Token handling

`frontend/src/services/api.js` attaches `Authorization: Bearer <token>` to every request.
If the backend returns `401`, the frontend clears auth data and emits an auth error event so the app can recover cleanly.

## 5. Role and Access Workflow

The frontend route tree and sidebar are built around the current user role.

| Role | Main Access | Notes |
| --- | --- | --- |
| `Admin` | Full operational access, POS, users, catalog, suppliers, purchases, inventory, finance, reports | Can manage all staff and all business modules |
| `Store_Manager` | Dashboard, catalog, suppliers, purchases, inventory, customers, sales, receipts, expenses, income, reports | Strong operational access, but not staff admin or POS checkout |
| `Inventory_Manager` | Inventory-focused dashboard, products, categories, suppliers, purchases, inventory, reports | No POS, no finance writes, no user administration |
| `Cashier` | Cashier dashboard, POS, products, categories, customers, sales, receipts | Can perform checkout and limited customer management |
| `Accounts/Finance` | Financial dashboard, expenses, income, sales review, purchases review, reports | No POS and no operational catalog/inventory management |

Note: a few backend read routes still include legacy `Auditor` checks, but the active role enum and UI currently expose the five roles above.

## 6. Dashboard Workflow

### Operational dashboard

Used by `Admin`, `Store_Manager`, and `Inventory_Manager`.

1. The dashboard page calls `GET /api/reports/dashboard`.
2. The backend aggregates sales, COGS, income, expenses, recent sales, recent purchases, recent expenses, low-stock items, and top-selling products.
3. The frontend renders summary cards and recent activity panels.

### Cashier dashboard

Used by `Cashier`.

1. The page calls `GET /api/reports/cashier-dashboard`.
2. The backend returns today’s cashier sales, total orders, and items sold.
3. The UI shows shift performance and recent sales.

### Financial dashboard

Used by `Accounts/Finance` and `Admin`.

1. The page calls `GET /api/reports/accountant-dashboard`.
2. The backend aggregates revenue, orders, expenses, COGS, and net profit.
3. The UI shows recent income, recent expenses, expense by category, and income by type.

## 7. Product and Category Workflow

### Categories

1. The category screen loads all categories from `GET /api/categories`.
2. Authorized roles can create, edit, and delete categories.
3. Category changes immediately affect product filtering and product creation.

### Products

1. The products screen loads products from `GET /api/products`.
2. If the user can manage the catalog, the UI also loads categories and suppliers for dropdowns.
3. Product create/update requests use `FormData` because image uploads are supported.
4. The backend uses Cloudinary storage through `backend/src/middleware/uploadMiddleware.js`.
5. The product document stores:
   - name
   - description
   - category
   - supplier
   - purchase price
   - selling price
   - inventory quantity
   - store quantity
   - minimum stock
   - unit
   - image URL
   - active flag

### Product lifecycle

- Products can be searched, edited, deactivated, or deleted.
- A product belongs to one category and may belong to one supplier.
- Inventory and store quantities are tracked separately across POS, purchases, inventory, and reports.

## 8. Supplier Workflow

1. The supplier page loads suppliers from `GET /api/suppliers`.
2. Operational roles can create, edit, and delete suppliers.
3. The backend aggregates supplier metrics such as product count, total stock, and inventory cost.
4. The supplier traceability view calls `GET /api/suppliers/:id/products`.
5. The payments tab calls:
   - `GET /api/suppliers/:id/payments`
   - `POST /api/suppliers/:id/payments`
6. A supplier payment reduces the supplier current balance.
7. Supplier deletion is blocked if products, purchases, or payment history are still attached.

## 9. Purchase Workflow

1. The purchase screen loads suppliers, products, and purchase history.
2. Authorized roles choose a supplier and add one or more product lines.
3. The frontend sends `POST /api/purchases`.
4. The backend validates the supplier and each line item inside a MongoDB transaction.
5. A `Purchase` document is created with:
   - supplier id
   - item list
   - total amount
   - status
   - payment status
6. For every purchased item:
   - product `inventoryQuantity` increases
   - product `storeQuantity` remains unchanged
   - product purchase price is updated
   - a `StockMovement` record of type `PURCHASE` is created at `INVENTORY`
7. The supplier current balance increases by the purchase total.
8. The purchase is saved as received and appears in purchase reports and dashboards.

## 10. Inventory Workflow

1. The inventory screen loads products from `GET /api/inventory`.
2. A low-stock view is available from `GET /api/inventory/low-stock`.
3. The movement list loads from `GET /api/inventory/movements`.
4. Authorized staff can submit `POST /api/inventory/adjustment` for either `INVENTORY` or `STORE`.
5. Authorized staff can submit `POST /api/inventory/enlist` to move stock from inventory to store.
6. Enlistment atomically decrements `inventoryQuantity`, increments `storeQuantity`, and creates paired `TRANSFER` movement records.
7. The backend rejects adjustments that would make either location negative.
6. Inventory data feeds:
   - low stock alerts
   - dashboard metrics
   - inventory reports
   - supplier traceability

Purchases update back-room stock, enlistment moves stock to the sales floor, and sales update store stock only.

## 11. POS and Sales Workflow

The POS is the most important real-time workflow in the app.

### POS order building

1. The cashier loads the POS page.
2. The screen fetches available products from `GET /api/store/products`.
3. The cashier searches products and adds them to a local cart.
4. Quantity can be increased, decreased, removed, or cleared.
5. A customer must be selected before checkout.
6. Registered customers are loaded from `GET /api/customers`.
7. If needed, the cashier can quick-add a walk-in customer from the POS customer modal.

### Checkout validation

1. Before payment, the POS calls `POST /api/sales/validate`.
2. The backend checks that each item exists and enough `storeQuantity` is available.
3. The backend returns a validated item snapshot with prices and subtotal.
4. If validation fails, checkout stops before payment starts.

### Cash payment

1. The payment modal submits the sale as a cash transaction.
2. The frontend sends `POST /api/sales`.
3. The backend creates the sale, creates a payment record, and completes the sale in a transaction.
4. Stock is deducted.
5. `saleService.completeSale()` atomically decrements `storeQuantity` and creates a `SALE` movement at `STORE` for each item.
6. A sale-linked income record is created automatically.
7. The receipt modal can print the completed invoice.

### Card payment with Stripe

1. The cashier selects card payment.
2. The frontend calls `POST /api/payments/create-intent`.
3. Stripe returns a client secret.
4. The frontend confirms the card payment with Stripe Elements.
5. After payment succeeds, the frontend sends `POST /api/sales` with the Stripe payment intent id.
6. The backend records the sale and payment, then completes the sale transaction.
7. Store stock, payments, income, and stock movements are updated together.

### Store product access

`GET /api/store/products` returns only active products where `storeQuantity > 0`.
`Admin`, `Cashier`, `Store_Manager`, and `Inventory_Manager` may access it. `Accounts/Finance` is explicitly blocked.

Customer product requests also filter to active products with `storeQuantity > 0`.

### Pending carts and self-checkout queue

1. The POS can also display pending carts from `GET /api/cart/pending`.
2. Each cart belongs to a customer and expires after 30 minutes if not processed.
3. The cashier can finalize or reject the cart.
4. Finalization re-validates product availability and price against live product data.
5. If the cart is finalized, the backend creates a sale and Stripe payment intent.
6. If the cart is rejected, the cart status becomes cancelled.

### Sale completion internals

The shared sale completion service:

- deducts product `storeQuantity` only
- creates stock movement rows
- marks the sale as completed
- marks the payment as succeeded
- creates sale-linked income if it does not already exist

This logic is centralized in `backend/src/services/saleService.js` so card sales, cash sales, webhooks, and cart finalization all produce consistent results.

## 12. Customer Workflow

1. Customers are loaded through the customer routes.
2. Cashiers, admins, and store managers can create walk-in customer records with name and phone.
3. The POS requires a selected customer before payment.
4. Registered customers can also be browsed in the dedicated customer directory.
5. The customer model stores:
   - name
   - phone
   - optional email
   - optional address
   - registration flag

Customer records are used both for retail checkout and for customer-facing cart workflows.

## 13. Finance Workflow

### Expenses

1. The expense screen loads expense data from `GET /api/expenses`.
2. Authorized roles can create, edit, and delete expenses.
3. Each expense stores:
   - title
   - category
   - amount
   - description
   - payment method
   - date
4. The backend records the creating user in `createdBy`.

### Income

1. The income screen loads data from `GET /api/income`.
2. Manual income can be created, edited, and deleted by authorized roles.
3. Sale-linked income is generated automatically when sales are completed.
4. Sale-linked income is read-only and cannot be edited or deleted.

### Finance rules

- Manual income has `referenceType = manual`
- Sale-linked income has `referenceType = sale`
- Sale-linked income is protected so accounting data stays consistent

## 14. Reports Workflow

The reports page uses grouped MongoDB aggregations and accepts date filtering.

Available report views:

- Sales
- Purchases
- Inventory
- Payments
- Expenses
- Income
- Profit and Loss

Workflow:

1. The user selects a report type.
2. The user can choose a `from` and `to` date.
3. The frontend calls `GET /api/reports/:type`.
4. The backend returns grouped totals and summary data.
5. The UI renders totals, grouped rows, and inventory or profit/loss summary cards when needed.

The profit and loss report calculates:

- revenue from completed sales
- COGS from sale item purchase costs
- total expenses
- net profit

## 15. User Management Workflow

1. Only `Admin` can access the staff users page.
2. The admin creates a new staff user with:
   - name
   - email
   - password
   - role
3. The backend hashes passwords before saving.
4. The backend normalizes role labels such as `Store Manager` and `Inventory Manager` to canonical stored values.
5. Existing users can be edited, reactivated, deactivated, or deleted.
6. The app blocks self-deletion and self-deactivation.

## 16. Core Backend Models

| Model | Purpose | Main Links |
| --- | --- | --- |
| `User` | Staff accounts and roles | Auth, sales, purchases, finance, inventory, admin |
| `Customer` | Walk-in and registered customers | POS, carts, sales |
| `Category` | Product grouping | Products, reports |
| `Supplier` | Vendor records | Products, purchases, supplier payments |
| `Product` | Catalog item and stock source of truth | Categories, suppliers, sales, purchases, inventory |
| `Cart` | Submitted customer cart with TTL expiry | POS pending queue, self-checkout flow |
| `Sale` | Completed or pending retail sale | Payments, income, stock movements |
| `Purchase` | Stock acquisition record | Suppliers, products, stock movements |
| `Payment` | Sale payment record | Stripe or cash payments |
| `SupplierPayment` | Payment made to supplier | Supplier balance tracking |
| `Income` | Manual or sale-linked income | Finance and profit reporting |
| `Expense` | Operating expense record | Finance and profit reporting |
| `StockMovement` | Audit trail for inventory changes | Purchases, sales, adjustments |

## 17. Data Change Rules

### Product creation

- product creation stores catalog information only
- `inventoryQuantity` is `0`
- `storeQuantity` is `0`
- initial stock must come through a supplier purchase

### When a sale completes

- sale status becomes `completed`
- payment status becomes `succeeded` or `paid`
- product `storeQuantity` decreases atomically
- stock movement rows are written
- income is created if missing

### When a purchase is recorded

- purchase status becomes `RECEIVED`
- product `inventoryQuantity` increases
- product `storeQuantity` is unchanged
- purchase price is updated
- supplier current balance increases
- stock movement rows are written

### When stock is adjusted

- the selected location quantity is increased or decreased manually
- a stock movement row records the adjustment reason

### When a supplier payment is recorded

- supplier current balance decreases
- supplier payment history is saved

## 18. API and Infrastructure Notes

### Express app wiring

The backend mounts these route groups in `backend/src/app.js`:

- `/api/auth`
- `/api/customers`
- `/api/categories`
- `/api/products`
- `/api/reports`
- `/api/inventory`
- `/api/store/products`
- `/api/sales`
- `/api/payments`
- `/api/cart`
- `/api/suppliers`
- `/api/purchases`
- `/api/users`
- `/api`
- `/api/webhooks`
- `/api/settings`

Inventory migration script:

- `backend/src/scripts/migrateStock.js` copies legacy `stockQuantity` to `storeQuantity`
- it sets `inventoryQuantity` to `0`
- it removes the legacy `stockQuantity` field

### Admin Settings flow

1. Admin opens `/settings`.
2. The frontend loads module record counts from `GET /api/settings/summary`.
3. Admin can open `/users` to manage staff roles using canonical backend values.
4. Admin can delete an individual catalog product after confirmation.
5. Admin can clear a module through `POST /api/settings/clear/:module` after accepting the browser confirmation dialog. The response reports deleted records by collection.
6. The backend protects all settings endpoints with `Admin` authorization and performs cleanup inside a MongoDB transaction.

There is also a health endpoint at `/api/health`.

### MongoDB startup

`backend/src/server.js` connects to MongoDB first and then starts the Express server.

### Cloudinary uploads

Product images are uploaded through Multer and stored in Cloudinary.

### Stripe webhook flow

The Stripe webhook route uses a raw JSON body so Stripe can verify the signature.
When Stripe sends a payment success event, the backend completes the sale in a transaction.

### Cart expiry

Submitted carts have a TTL index and expire automatically after 30 minutes if they are not processed.

## 19. Typical End-to-End Scenarios

### Scenario 1: Cashier sells stock at the counter

1. Cashier opens POS.
2. Cashier searches products and adds items.
3. Cashier selects a customer or adds a walk-in customer.
4. POS validates store stock.
5. Cash payment is submitted.
6. Sale is recorded.
7. `storeQuantity` drops.
8. Receipt is printed.

### Scenario 2: Store receives new stock from a supplier

1. Store staff opens Purchases.
2. Staff selects a supplier and adds purchase lines.
3. Purchase is saved.
4. `inventoryQuantity` increases.
5. Supplier balance increases.
6. Movement history records the purchase.

### Scenario 3: Inventory manager fixes stock counts

1. Inventory manager opens Inventory.
2. Manager selects a product.
3. Manager selects a location and adds or subtracts stock with a reason.
4. The selected location quantity updates.
5. The movement list records the adjustment.

### Scenario 4: Finance team reviews month-end performance

1. Finance opens the financial dashboard.
2. Finance reviews revenue, expenses, COGS, and profit.
3. Finance opens reports with date filters.
4. Manual expense or income entries are added if needed.
5. Sale-linked income stays read-only.

## 20. Setup and Run Flow

From the root project:

- `npm run dev` starts the backend server
- `npm run start` also starts the backend server
- `npm run build` builds the frontend through the root script

Frontend-only scripts in `frontend/package.json`:

- `npm run dev`
- `npm run build`
- `npm run preview`

## 21. Summary

The project workflow is built around one shared source of truth in MongoDB:

- `inventoryQuantity` drives back-room inventory and purchase receiving
- `storeQuantity` drives POS availability and completed sales
- sales drive payments, stock movements, and income
- purchases drive stock replenishment and supplier balances
- finance records drive the financial dashboard and profit/loss reporting
- role-based routing decides who can see and change each part of the system

If you want, the next step can be a shorter `README.md` overview or a flowchart version of this document.
