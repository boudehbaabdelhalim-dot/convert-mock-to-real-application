import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
  pgEnum,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ─── Enums ────────────────────────────────────────────────────────────────────
export const userRoleEnum = pgEnum("user_role", ["admin", "manager", "staff"]);
export const inventoryStatusEnum = pgEnum("inventory_status", [
  "healthy",
  "low_stock",
  "critical",
  "dead_stock",
]);
export const supplierStatusEnum = pgEnum("supplier_status", [
  "active",
  "review",
  "paused",
]);
export const customerTierEnum = pgEnum("customer_tier", [
  "bronze",
  "silver",
  "gold",
  "platinum",
]);
export const churnRiskEnum = pgEnum("churn_risk", ["low", "medium", "high"]);
export const decisionStatusEnum = pgEnum("decision_status", [
  "pending",
  "approved",
  "rejected",
]);
export const decisionPriorityEnum = pgEnum("decision_priority", [
  "low",
  "medium",
  "high",
  "critical",
]);
export const stockMovementTypeEnum = pgEnum("stock_movement_type", [
  "purchase",
  "sale",
  "adjustment",
  "waste",
  "return",
]);

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    role: userRoleEnum("role").notNull().default("staff"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("users_email_idx").on(t.email)]
);

// ─── Categories ───────────────────────────────────────────────────────────────
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Suppliers ────────────────────────────────────────────────────────────────
export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }),
  contactEmail: varchar("contact_email", { length: 255 }),
  contactPhone: varchar("contact_phone", { length: 50 }),
  leadTimeDays: integer("lead_time_days").default(7),
  paymentTerms: varchar("payment_terms", { length: 50 }).default("Net 30"),
  defectRate: numeric("defect_rate", { precision: 5, scale: 2 }).default("0"),
  priceScore: integer("price_score").default(70),
  reliabilityScore: integer("reliability_score").default(70),
  deliveryScore: integer("delivery_score").default(70),
  totalSpend: numeric("total_spend", { precision: 12, scale: 2 }).default("0"),
  status: supplierStatusEnum("status").default("active"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Products ─────────────────────────────────────────────────────────────────
export const products = pgTable(
  "products",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    sku: varchar("sku", { length: 100 }).notNull(),
    barcode: varchar("barcode", { length: 100 }),
    brand: varchar("brand", { length: 100 }),
    categoryId: integer("category_id").references(() => categories.id),
    supplierId: integer("supplier_id").references(() => suppliers.id),
    price: numeric("price", { precision: 10, scale: 2 }).notNull(),
    cost: numeric("cost", { precision: 10, scale: 2 }).notNull(),
    stock: integer("stock").default(0).notNull(),
    minStock: integer("min_stock").default(10).notNull(),
    maxStock: integer("max_stock").default(200).notNull(),
    unit: varchar("unit", { length: 30 }).default("unit"),
    image: varchar("image", { length: 10 }).default("📦"),
    status: inventoryStatusEnum("status").default("healthy"),
    dailySales: numeric("daily_sales", { precision: 8, scale: 2 }).default("0"),
    healthScore: integer("health_score").default(80),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("products_sku_idx").on(t.sku),
    index("products_status_idx").on(t.status),
    index("products_category_idx").on(t.categoryId),
  ]
);

// ─── Stock Movements ──────────────────────────────────────────────────────────
export const stockMovements = pgTable("stock_movements", {
  id: serial("id").primaryKey(),
  productId: integer("product_id")
    .references(() => products.id)
    .notNull(),
  type: stockMovementTypeEnum("type").notNull(),
  quantity: integer("quantity").notNull(),
  reason: varchar("reason", { length: 255 }),
  referenceId: integer("reference_id"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Customers ────────────────────────────────────────────────────────────────
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  loyaltyTier: customerTierEnum("loyalty_tier").default("bronze"),
  churnRisk: churnRiskEnum("churn_risk").default("low"),
  totalOrders: integer("total_orders").default(0),
  totalSpend: numeric("total_spend", { precision: 12, scale: 2 }).default("0"),
  ltv: numeric("ltv", { precision: 12, scale: 2 }).default("0"),
  avgOrderValue: numeric("avg_order_value", { precision: 10, scale: 2 }).default("0"),
  loyaltyPoints: integer("loyalty_points").default(0),
  daysSinceLastVisit: integer("days_since_last_visit").default(0),
  lastVisitAt: timestamp("last_visit_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Sales / Transactions ─────────────────────────────────────────────────────
export const sales = pgTable("sales", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customers.id),
  userId: integer("user_id").references(() => users.id),
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
  discount: numeric("discount", { precision: 10, scale: 2 }).default("0"),
  total: numeric("total", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: varchar("payment_method", { length: 50 }).default("cash"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const saleItems = pgTable("sale_items", {
  id: serial("id").primaryKey(),
  saleId: integer("sale_id")
    .references(() => sales.id)
    .notNull(),
  productId: integer("product_id")
    .references(() => products.id)
    .notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
  unitCost: numeric("unit_cost", { precision: 10, scale: 2 }).notNull(),
  total: numeric("total", { precision: 10, scale: 2 }).notNull(),
});

// ─── Purchase Orders ──────────────────────────────────────────────────────────
export const purchaseOrders = pgTable("purchase_orders", {
  id: serial("id").primaryKey(),
  supplierId: integer("supplier_id")
    .references(() => suppliers.id)
    .notNull(),
  userId: integer("user_id").references(() => users.id),
  status: varchar("status", { length: 50 }).default("pending"),
  total: numeric("total", { precision: 12, scale: 2 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  receivedAt: timestamp("received_at"),
});

export const purchaseOrderItems = pgTable("purchase_order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .references(() => purchaseOrders.id)
    .notNull(),
  productId: integer("product_id")
    .references(() => products.id)
    .notNull(),
  quantity: integer("quantity").notNull(),
  unitCost: numeric("unit_cost", { precision: 10, scale: 2 }).notNull(),
  total: numeric("total", { precision: 10, scale: 2 }).notNull(),
});

// ─── AI Decisions ─────────────────────────────────────────────────────────────
export const aiDecisions = pgTable("ai_decisions", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  agent: varchar("agent", { length: 100 }).notNull(),
  priority: decisionPriorityEnum("priority").default("medium"),
  status: decisionStatusEnum("status").default("pending"),
  recommendation: text("recommendation"),
  expectedImpact: varchar("expected_impact", { length: 100 }),
  confidence: integer("confidence").default(80),
  risk: varchar("risk", { length: 20 }).default("low"),
  dataUsed: text("data_used"),
  approvedBy: integer("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Expenses / Cash Flow ─────────────────────────────────────────────────────
export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  category: varchar("category", { length: 100 }),
  type: varchar("type", { length: 50 }).default("fixed"),
  dueDay: integer("due_day"),
  isPaid: boolean("is_paid").default(false),
  paidAt: timestamp("paid_at"),
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
