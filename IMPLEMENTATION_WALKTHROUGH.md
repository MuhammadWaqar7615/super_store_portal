# Accounts/Finance Role Walkthrough

## Overview

An `Accounts/Finance` role was added to the Super Store Portal ERP system. This role is designed for users who manage financial records and review business transactions without accessing operational or administrative areas.

## Access Provided

Accounts/Finance users can:

- Open a dedicated financial dashboard.
- View financial summaries, revenue, expenses, cost of goods sold, and net profit.
- Review recent income and expense activity.
- Create, edit, and delete manual income records.
- Create, edit, and delete expense records.
- View income automatically generated from completed sales.
- View sales and purchase records.
- Open financial reports.

## Access Restricted

Accounts/Finance users cannot access:

- Point of Sale
- Products
- Categories
- Inventory
- Suppliers
- Customers
- User administration

## Financial Dashboard

A dedicated financial dashboard was added for the Accounts/Finance role. It displays key financial information, including revenue, order count, expenses, cost of goods sold, and net profit.

The dashboard also provides recent expense and income activity, expense totals grouped by category, income grouped by type, and quick links to the main finance functions.

## Income Management

Manual income records can be managed normally by Accounts/Finance users.

Income records created automatically from completed sales are available for review but cannot be edited or deleted. This protection was applied both in the user interface and on the backend so that sale-linked accounting records remain consistent.

## Expense Management

Expense management was enabled for the new role. The available expense categories were aligned with the required finance categories:

- Salary
- Rent
- Utilities
- Stationery
- Inventory Purchase
- Transportation
- Marketing
- Maintenance
- Other

## Reports and Transaction Review

Accounts/Finance users can review sales, purchases, and financial reports. The required report and dashboard access was added while keeping operational management features unavailable to the role.

## User Role Setup

The new role was added to the system role list and made available in the user-management role selection. Administrators can assign the Accounts/Finance role when creating or updating a user.

## Navigation

Accounts/Finance users receive a dedicated navigation menu containing:

- Financial Dashboard
- Expenses
- Income
- Reports
- Sales
- Purchases

After login, the role is directed to the financial dashboard instead of the general operational dashboard.

## Verification

The frontend production build completed successfully after the implementation. The backend test command was not available as a working test suite in the repository, so the backend role permissions, routes, and finance behavior were checked through the connected implementation files.
