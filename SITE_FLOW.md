# Super Store Portal: Simple Site Flow

This is the short, user-friendly flow of the Super Store Portal.

## Main Site Flow

```mermaid
flowchart TD
    A[Open Super Store Portal] --> B{Logged in?}
    B -- No --> C[Login Page]
    C --> D{Valid credentials?}
    D -- No --> C
    D -- Yes --> E[Load User Role]
    B -- Yes --> E

    E --> F[Role-Based Dashboard]
    F --> G{Choose a module}

    G --> H[Products and Categories]
    G --> I[Suppliers and Purchases]
    G --> J[Inventory]
    G --> K[Point of Sale]
    G --> L[Customers]
    G --> M[Finance and Reports]
    G --> N[User Management]
    G --> N2[Admin Settings]

    H --> O[View or Update Catalog]
    I --> P[Receive Stock into Inventory]
    J --> Q[Enlist Inventory to Store]
    J --> R2[Adjust Inventory or Store Stock]
    K --> R[Build Cart from Store Products]
    R --> S[Select Customer]
    S --> T[Validate Store Stock]
    T --> U{Choose Payment}
    U -- Cash --> V[Complete Sale]
    U -- Card --> W[Pay with Stripe]
    W --> V
    V --> X[Deduct Store Stock, Record Payment, Create Income]
    X --> Y[Print Receipt]
    L --> Z[Create or Manage Customer]
    M --> AA[View Sales, Income, Expenses, and Profit]
    N --> AB[Manage Staff and Roles]
    N2 --> AD[View Counts, Delete Products, or Clear Module Data]

    O --> F
    P --> F
    Q --> F
    R2 --> F
    Y --> F
    Z --> F
    AA --> F
    AB --> F
    AD --> F

    F --> AE[Logout]
    AE --> C
```

## Role-Based Start Pages

After login, the user sees only the modules allowed for their role:

| Role | Main Starting Area |
| --- | --- |
| Admin | Full dashboard and all modules |
| Store Manager | Operational dashboard |
| Inventory Manager | Inventory dashboard |
| Cashier | Cashier dashboard and POS |
| Accounts/Finance | Financial dashboard |

## Common User Flows

### Login

`Open site -> Login -> Verify credentials -> Load role -> Show dashboard`

### Add a Product

`Products -> Add product -> Select category and supplier -> Upload image -> Save -> Product appears in catalog`

### Receive a Purchase

`Purchases -> Select supplier -> Add products -> Save purchase -> Increase inventoryQuantity -> Record INVENTORY movement -> Update supplier balance`

### Adjust Inventory

`Inventory -> Select product -> Enlist quantity to store -> Decrease inventoryQuantity -> Increase storeQuantity -> Record TRANSFER movements`

### Complete a Sale

`POS -> Load store products -> Add products to cart -> Select customer -> Validate storeQuantity -> Choose cash or card -> Complete sale -> Deduct storeQuantity -> Create income -> Print receipt`

### Review Business Performance

`Dashboard or Reports -> Select report -> Load sales, purchases, stock, income, expenses, and profit data -> Review results`

## Simple System Flow

```text
User
  -> React Frontend
  -> API Request
  -> Authentication Check
  -> Role Permission Check
  -> Controller
  -> MongoDB Data
  -> JSON Response
  -> Updated Screen
```

## Important Rule

Every important stock-changing action is recorded:

```text
Purchase   -> inventoryQuantity increases
Enlistment -> inventoryQuantity decreases and storeQuantity increases
Sale       -> storeQuantity decreases
Adjustment -> selected location changes
```

These changes are used by the inventory screen, dashboards, supplier information, and reports.
