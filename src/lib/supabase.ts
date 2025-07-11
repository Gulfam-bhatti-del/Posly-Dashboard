import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!



export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
})


// Types for our database

// user-management/users/page.tsx
export interface User {
  id: string
  full_name: string
  email: string
  password_hash: string
  status: "Active" | "Inactive"
  role: "admin" | "manager" | "employee" | "viewer"
  avatar_url?: string
  all_warehouses: boolean
  selected_warehouses: string[]
  created_at: string
  updated_at: string
}

export interface Warehouse {
  id: string
  name: string
  location?: string
  is_active: boolean
  created_at: string
}

export interface Permissions {
  id: string
  role_name: string
  description: string
  action: string
  created_at: string
}

export interface Client {
  id: number
  code: string
  full_name: string
  phone: string
  email?: string
  address?: string
  total_sale_due: number
  total_sell_return_due: number
  status: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface ClientTransaction {
  id: number
  client_id: number
  transaction_type: "sale" | "return" | "payment"
  amount: number
  description?: string
  transaction_date: string
  created_at: string
}

export type Supplier = {
  id: number
  code: string
  name: string
  email?: string
  phone?: string
  country?: string
  city?: string
  address?: string
  total_purchase_due: number
  total_purchase_return_due: number
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  name: string
  code: string
  category: string
  brand: string | null
  product_cost: number
  product_price: number
  current_stock: number
  minimum_sale_quantity: number
  stock_alert: number
  order_tax: number
  tax_method: string
  product_type: string
  unit_product: string | null
  unit_sale: string | null
  unit_purchase: string | null
  image_url: string | null
  details: string | null
  has_imei_serial: boolean
  created_at: string
  updated_at: string
}


export type Category = {
  id: string
  name: string
}

export type Brand = {
  id: string
  name: string
}

// Types for better TypeScript support
export interface Purchase {
  id: string
  date: string
  ref: string
  supplier: string
  warehouse: string
  products: any[]
  subtotal: number
  order_tax: number
  discount: number
  discount_type: string
  shipping: number
  grand_total: number
  paid: number
  due: number
  payment_status: string
  details: string
  created_at: string
  updated_at: string
}

export interface Sales {
  id: string
  date: string
  ref: string
  customer: string
  warehouse: string
  products: any[]
  subtotal: number
  order_tax: number
  discount: number
  discount_type: string
  shipping: number
  grand_total: number
  paid: number
  due: number
  payment_status: string
  details: string
  created_at: string
  updated_at: string
  created_by: string
}

export type Deposit = {
  id: string
  account_name: string
  category: string
  deposit_ref: string
  date: string
  amount: number
  payment_method: string
  attachment_url?: string
  attachment_name?: string
  details?: string
  created_at: string
  updated_at: string
}

export type Expense = {
  id: string
  account_name: string
  expense_ref: string
  date: string
  amount: number
  category: string
  payment_method: string
  attachment_url?: string
  details?: string
  created_at: string
}

export type Expense_Deposit_Category = {
  id: string
  title: string
  created_at: string
}

export type Database = {
  public: {
    Tables: {
      products: {
        Row: {
          id: string
          name: string
          code: string
          category: string
          brand: string | null
          order_tax: number
          tax_method: string
          details: string | null
          type: string
          cost: number
          price: number
          unit_product: string
          unit_sale: string
          unit_purchase: string
          minimum_quantity: number
          stock_alert: number
          has_imei: boolean
          current_stock: number
          image_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          code: string
          category: string
          brand?: string | null
          order_tax?: number
          tax_method?: string
          details?: string | null
          type?: string
          cost: number
          price: number
          unit_product: string
          unit_sale: string
          unit_purchase: string
          minimum_quantity?: number
          stock_alert?: number
          has_imei?: boolean
          current_stock?: number
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          code?: string
          category?: string
          brand?: string | null
          order_tax?: number
          tax_method?: string
          details?: string | null
          type?: string
          cost?: number
          price?: number
          unit_product?: string
          unit_sale?: string
          unit_purchase?: string
          minimum_quantity?: number
          stock_alert?: number
          has_imei?: boolean
          current_stock?: number
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

export type Unit = {
  id: string
  name: string
  short_name: string
  base_unit: string | null
  operator: string
  operation_value: number
  created_at: string
  updated_at: string
}


export type Product_Brand = {
  id: string
  name: string
  description: string
  image_url?: string
  created_at: string
  updated_at: string
}
