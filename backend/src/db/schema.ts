import { create } from "domain";
import { jsonb } from "drizzle-orm/pg-core";
import { boolean } from "drizzle-orm/pg-core";
import {pgTable, uuid,text, timestamp, integer} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm/relations";


export type OrderStatus = "pending" | "paid" | "failed";
export type userRole = "customer"|"support" | "admin";
export type checkoutSessionLine = {
    productId: string;
    quantity: number;
    unitPriceCents: number;
}

export const users = pgTable("users",{
    id: uuid('id').defaultRandom().primaryKey(),
    clerkUserId: text('clerk_user_id').notNull().unique(),
    email: text('email').notNull().unique(),
    displayName: text('display_name'),
    role: text('role').$type<userRole>().notNull().default('customer'),
    createdAt : timestamp('created_at',{withTimezone: true}).defaultNow().notNull(),
    updatedAt : timestamp('updated_at',{withTimezone: true}).defaultNow().notNull(),
})

export const products = pgTable("products",{
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    description: text('description').notNull().unique(),
    priceCents: integer('price_cents').notNull(),
    category: text('category').notNull().default('General'),
    createdAt : timestamp('created_at',{withTimezone: true}).defaultNow().notNull(),
    updatedAt : timestamp('updated_at',{withTimezone: true}).defaultNow().notNull(),
    currency: text('currency').notNull().default('USD'),
    imageKitFieldId: text('imagekit_file_id').notNull(),
    imageUrl: text('image_url').notNull(),
    active: boolean('active').notNull().default(true),
})

export const checkoutSessions = pgTable("checkout_sessions",{
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
    .notNull()
    .references(()=>users.id, {onDelete: 'cascade'}),
    polarChecoutId: text('polar_checkout_id').notNull().unique(),
    lines: jsonb('lines').$type<checkoutSessionLine[]>().notNull(),
    totalCents: integer('total_cents').notNull(),
    currency: text('currency').notNull().default('USD'),
    createdAt : timestamp('created_at',{withTimezone: true}).defaultNow().notNull(),
})

export const orders = pgTable("orders",{
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
     .notNull()
     .references(()=>users.id, {onDelete: 'cascade'}),
    polarCheckoutId: text('polar_checkout_id').notNull().unique(),
    polarOrderId: text('polar_order_id').notNull().unique(),
    status: text('status').$type<OrderStatus>().notNull().default('pending'),
    createdAt : timestamp('created_at',{withTimezone: true}).defaultNow().notNull(),
    totalCents: integer('total_cents').notNull().default(0),
    updatedAt : timestamp('updated_at',{withTimezone: true}).defaultNow().notNull(),
})

export const orderItems = pgTable("order_items",{
    id: uuid('id').defaultRandom().primaryKey(),
    orderId: uuid('order_id')
        .notNull()
        .references(()=>orders.id, {onDelete: 'cascade'}),
    productId: uuid('product_id')
        .notNull()
        .references(()=>products.id, {onDelete: 'restrict'}),
    quantity: integer('quantity').notNull(),
    unitPriceCents: integer('unit_price_cents').notNull(),
})

export const userRelations = relations(users, ({many}) => ({
    checkoutSessions: many(checkoutSessions),
    orders: many(orders),
}))
export const productRelations = relations(products, ({many}) => ({
    orderItems: many(orderItems),
}))

export const orderRelations = relations(orders, ({many, one}) => ({
    user: one(users, {
        fields: [orders.userId], references: [users.id]
    }),
    orderItems: many(orderItems),
}))

export const orderItemRelations = relations(orderItems, ({one}) => ({
    order: one(orders, {
        fields: [orderItems.orderId], references: [orders.id]
    }),
    product: one(products, {
        fields: [orderItems.productId], references: [products.id]
    })
}))
