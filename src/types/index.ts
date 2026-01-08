// ============ Auth Types ============
export interface SignInRequest {
  username: string;
  password: string;
}

export interface CustomerCreate {
  email: string;
  username: string;
  password: string;
}

export interface Token {
  access_token: string;
  refresh_token: string;
}

export interface CustomerRead {
  id: string;
  email: string;
  username: string;
  created_at: string;
  shop_limit: number;
}

export interface ForgetPasswordRequest {
  email: string;
  username: string;
}

export interface RefreshTokenPayload {
  refresh_token: string;
}

// ============ Response Types ============
export interface ResponseSchema<T> {
  success: boolean;
  data: T | null;
  message?: string | null;
  error?: string | null;
}

export interface PaginatedResponse<T> {
  total: number;
  items: T[];
  page: number;
  size: number;
}

// ============ Shop Types ============
export type ShopStatus = "active" | "inactive" | "suspended";

export interface Shop {
  id: string;
  customer_id: string;
  name: string;
  description?: string | null;
  support_channel?: string | null;
  support_group?: string | null;
  policy?: string | null;
  bot_token: string;
  status: ShopStatus;
  is_active: boolean;
}

export interface ShopCreate {
  name: string;
  description?: string | null;
  support_channel?: string | null;
  support_group?: string | null;
  policy?: string | null;
  bot_token: string;
}

export interface ShopUpdate {
  name?: string | null;
  description?: string | null;
  support_channel?: string | null;
  support_group?: string | null;
  policy?: string | null;
  bot_token?: string | null;
  status?: ShopStatus | null;
  is_active?: boolean | null;
}

// ============ Category Types ============
export interface Category {
  id: string;
  shop_id: string;
  name: string;
  description?: string | null;
  resources?: Resource[]; // populated when fetching single category
}

export interface CategoryCreate {
  shop_id: string;
  name: string;
  description?: string | null;
}

export interface CategoryUpdate {
  name?: string | null;
  description?: string | null;
}

// ============ Resource Types ============
export interface Resource {
  id: string;
  shop_id: string;
  name: string;
  category_id?: string | null;
  category?: Category | null;
  description?: string | null;
  price: number;
  is_active: boolean;
}

export interface ResourceCreate {
  shop_id: string;
  name: string;
  category_id?: string | null;
  description?: string | null;
  price: number;
  is_active?: boolean;
}

export interface ResourceUpdate {
  name?: string | null;
  category_id?: string | null;
  description?: string | null;
  price?: number | null;
  is_active?: boolean | null;
}

// ============ Inventory Types ============
export interface Inventory {
  id: string;
  resource_id: string;
  content: string;
  is_sold: boolean;
}

export interface InventoryCreate {
  resource_id: string;
  content: string;
  is_sold?: boolean;
}

export interface InventoryUpdate {
  content?: string | null;
  is_sold?: boolean | null;
}

export interface BulkUploadResponse {
  total_created: number;
  inventories: Inventory[];
}

// ============ Bank Types ============
export type BankType =
  | "tpb"
  | "vcb"
  | "acb"
  | "mb"
  | "bidv"
  | "vtb"
  | "seabank"
  | "viettel"
  | "tsr"
  | "msb"
  | "tcb"
  | "timo"
  | "vab";
export type BankTransactionStatus = "pending" | "completed" | "failed";
export type TransactionDirection = "in" | "out";

export interface BankTransaction {
  id: string;
  payment_id?: string | null;
  transaction_id: string;
  bank_type: BankType;
  bank_name: string;
  bank_number: string;
  amount: number;
  direction: TransactionDirection;
  description?: string | null;
  content?: string | null;
  transaction_date?: string | null;
  status: BankTransactionStatus;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface BankTransactionList {
  total: number;
  items: BankTransaction[];
}

// ============ Bot Types ============
export interface BotRegisterRequest {
  shop_id: string;
  bot_token: string;
}

export interface BotRegisterResponse {
  shop_id: string;
  webhook_url: string;
  message: string;
}

export interface BotStatusResponse {
  shop_id: string;
  is_registered: boolean;
  webhook_url?: string | null;
}

export interface BotListResponse {
  bots: string[];
  total: number;
}

// ============ Payment Types ============
export type PaymentStatus = "pending" | "working" | "invalid" | "suspended";

export interface Payment {
  id: string;
  shop_id: string;
  bank_type: BankType;
  bank_number: string;
  bank_name?: string | null;
  account_name?: string | null;
  status: PaymentStatus;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface PaymentWithToken extends Payment {
  token?: string | null;
}

export interface PaymentCreate {
  bank_type: BankType;
  bank_number: string;
  bank_name?: string | null;
  account_name?: string | null;
  token: string;
}

export interface PaymentUpdate {
  bank_type?: BankType | null;
  bank_number?: string | null;
  bank_name?: string | null;
  account_name?: string | null;
  token?: string | null;
  status?: PaymentStatus | null;
}

// ============ Order Types ============
export interface OrderItem {
  id: string;
  order_id: string;
  inventory_id: string;
  created_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  resource_id: string;
  price_at_purchase: number;
  created_at: string;
  updated_at: string;
  user_telegram_id?: string | null;
  user_username?: string | null;
  resource_name?: string | null;
  resource_type?: string | null;
  shop_id?: string | null;
  shop_name?: string | null;
  order_items: OrderItem[];
}

export interface OrderListParams {
  shop_id: string;
  skip?: number;
  limit?: number;
  user_telegram_id?: string;
  resource_id?: string;
}
