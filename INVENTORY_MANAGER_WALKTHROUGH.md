# Inventory Manager Role Walkthrough

## Overview

The `Inventory_Manager` role was added to the Super Store Portal ERP system. It gives inventory staff access to products, categories, suppliers, purchases, inventory controls, and inventory reporting without exposing sales, POS, finance, customer, or user-administration features.

## Role Setup by an Admin

An administrator can add an Inventory Manager from the **Staff Users** screen:

1. Sign in as an `Admin`.
2. Open **Users** from the main navigation.
3. Enter the staff member's name, email, and password.
4. Select **Inventory Manager** in the Role field.
5. Select **Add User**.

The role is also available when editing an existing staff account. The backend normalizes the display-name variants `Inventory Manager`, `Inventory-Manager`, and `Inventory_Manager` to the stored value `Inventory_Manager`.

## Inventory Manager Access

| Area | Access |
| --- | --- |
| Dashboard | Inventory-focused operational dashboard |
| Products | View, create, edit, and delete products |
| Categories | View, create, edit, and delete categories |
| Suppliers | View, create, edit, and delete suppliers |
| Purchases | View, create, edit, and delete purchases |
| Inventory | View stock, adjust stock, and view movements |
| Reports | View purchase and inventory reports |
| Users | Not available |
| POS and sales | Not available |
| Expenses and income | Not available |
| Customers | Not available |

## Backend Changes

### User model

The allowed user-role enum in `backend/src/models/User.js` now includes:

```text
Inventory_Manager
```

The user controller accepts both the database value and common display-name formats, so role creation and updates remain consistent.

### Protected API routes

Inventory Manager permissions were added to the relevant protected routes:

- `productRoutes.js`: product creation, updates, and deletion.
- `categoryRoutes.js`: category creation, updates, and deletion.
- `inventoryRoutes.js`: inventory listing, low-stock listing, stock adjustments, and stock movements.
- `supplierRoutes.js`: supplier management, supplier products, supplier payments, and supplier payment creation.
- `reportRoutes.js`: dashboard, purchase reports, and inventory reports.

Read-only inventory and supplier history endpoints also support `Auditor` where appropriate. Stock adjustments and supplier payments remain limited to operational roles that can make changes, including `Inventory_Manager`.

## Frontend Changes

### User management

The role selector in `frontend/src/pages/Users.jsx` now displays **Inventory Manager** and sends the canonical `Inventory_Manager` value to the API. Existing users whose role is stored using a display-name variant are rendered and edited correctly.

### Navigation

Inventory Managers receive a dedicated sidebar containing:

- Dashboard
- Products
- Categories
- Suppliers
- Purchases
- Inventory
- Reports

The section is labeled **Inventory**. Finance-only navigation and administrative operations remain hidden.

### Route protection

`frontend/src/routes/AppRoutes.jsx` allows `Inventory_Manager` into the authenticated application layout and protects each permitted inventory route with the same role. Restricted routes remain guarded by their existing role lists.

### Inventory-aware screens

The Products, Categories, and Purchases pages enable their management actions for Inventory Managers. The Inventory page uses inventory-specific heading and supporting text for this role, while retaining the existing stock table, adjustment modal, and movement list.

The main dashboard is available to Inventory Managers and uses the title **Inventory Dashboard** with the subtitle **Stock levels, supplier flow, and purchase activity**. The existing dashboard endpoint supplies the current operational metrics and inventory-related activity; the dedicated inventory report remains available from Reports for detailed stock totals, product values, low-stock items, and out-of-stock items.

## Relevant Files

- `backend/src/models/User.js`
- `backend/src/controllers/userController.js`
- `backend/src/routes/productRoutes.js`
- `backend/src/routes/categoryRoutes.js`
- `backend/src/routes/inventoryRoutes.js`
- `backend/src/routes/supplierRoutes.js`
- `backend/src/routes/reportRoutes.js`
- `frontend/src/pages/Users.jsx`
- `frontend/src/layouts/AdminLayout.jsx`
- `frontend/src/routes/AppRoutes.jsx`
- `frontend/src/pages/Dashboard.jsx`
- `frontend/src/pages/Inventory.jsx`
- `frontend/src/pages/Products.jsx`
- `frontend/src/pages/Categories.jsx`
- `frontend/src/pages/Purchases.jsx`

## Verification

The following checks were completed:

- Backend model and role middleware loaded successfully.
- Frontend production build completed successfully with `npm --prefix frontend run build`.
- Route permissions and frontend role guards were reviewed for the new role.

