// ===== TYPES DE BASE =====

export interface BaseEntity {
  id: string
  createdAt: string
  updatedAt: string
}

// ===== TYPES UTILISATEUR =====

export interface User extends BaseEntity {
  email: string
  username: string
  firstName?: string
  lastName?: string
  avatar?: string
  bio?: string
  location?: string
  website?: string
  phone?: string
  role: UserRole
  status: UserStatus
  verified: boolean
  emailVerified?: string
  
  // OAuth fields
  googleId?: string
  appleId?: string
  
  // Pro-specific fields
  businessName?: string
  businessAddress?: string
  siret?: string
  vatNumber?: string
  hourlyRate?: number
  specialties: string[]
  portfolio: string[]
  coverImage?: string
  profileTheme?: ProfileTheme
  
  // Stripe fields
  stripeCustomerId?: string
  stripeAccountId?: string
  
  // Stats
  lastLoginAt?: string
}

export type UserRole = 'CLIENT' | 'PRO' | 'ADMIN'
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING'

export interface ProfileTheme {
  primaryColor: string
  secondaryColor: string
  accentColor: string
  backgroundColor: string
  textColor: string
  fontFamily: string
}

export interface UserStats {
  postsCount: number
  followersCount: number
  followingCount: number
  totalLikes: number
  totalViews: number
}

// ===== TYPES DE CONVERSATION =====

export interface Conversation extends BaseEntity {
  members: ConversationMember[]
  lastMessage?: Message
  unreadCount: number
  isActive: boolean
  type: ConversationType
}

export interface ConversationMember {
  id: string
  conversationId: string
  userId: string
  joinedAt: string
  lastReadAt?: string
  user: User
}

export type ConversationType = 'DIRECT' | 'GROUP' | 'COLLABORATION'

// ===== TYPES DE MESSAGE =====

export interface Message extends BaseEntity {
  content: string
  type: MessageType
  mediaUrl?: string
  isFromUser: boolean
  conversationId: string
  senderId: string
  readBy: string[]
  replyTo?: string
}

export type MessageType = 'TEXT' | 'IMAGE' | 'FILE' | 'AUDIO' | 'VIDEO'

// ===== TYPES DE POST =====

export interface Post extends BaseEntity {
  content: string
  images: string[]
  hashtags: string[]
  authorId: string
  status: PostStatus
  likesCount: number
  commentsCount: number
  viewsCount: number
  publishedAt?: string
  isCollaboration: boolean
  collaborationId?: string
}

export type PostStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

// ===== TYPES DE NAVIGATION =====

export interface NavItem {
  href: string
  label: string
  icon?: React.ComponentType<unknown>
  badge?: number
  disabled?: boolean
  children?: NavItem[]
}

export interface NavConfig {
  base: NavItem[]
  pro: NavItem[]
  client: NavItem[]
  admin: NavItem[]
}

// ===== TYPES DE FORMULAIRES =====

export interface FormField {
  name: string
  label: string
  type: 'text' | 'email' | 'password' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'file'
  placeholder?: string
  required?: boolean
  validation?: ValidationRule[]
  options?: SelectOption[]
}

export interface ValidationRule {
  type: 'required' | 'email' | 'minLength' | 'maxLength' | 'pattern' | 'custom'
  value?: unknown
  message: string
}

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

// ===== TYPES DE NOTIFICATIONS =====

export interface Notification extends BaseEntity {
  type: NotificationType
  title: string
  message: string
  userId: string
  read: boolean
  data?: Record<string, any>
  actionUrl?: string
}

export type NotificationType = 
  | 'MESSAGE' 
  | 'BOOKING' 
  | 'PAYMENT' 
  | 'REMINDER' 
  | 'SYSTEM' 
  | 'COLLABORATION_INVITE' 
  | 'COLLABORATION_ACCEPTED' 
  | 'COLLABORATION_REJECTED' 
  | 'MENTION'

// ===== TYPES DE RÉSERVATION =====

export interface Appointment extends BaseEntity {
  id: string
  conversationId: string
  proId: string
  clientId: string
  postId?: string
  status: AppointmentStatus
  type: AppointmentType
  title: string
  description: string
  startDate: string
  endDate: string
  duration: number // en minutes
  price: number
  currency: string
  location: string
  notes?: string
  requirements?: string[]
  cancellationPolicy?: string
  depositRequired: boolean
  depositAmount?: number
  payments?: Payment[]
  client?: {
    id: string
    username: string
    firstName: string | null
    lastName: string | null
    avatar: string | null
    email: string
    phone: string | null
  }
  pro?: {
    id: string
    username: string
    firstName: string | null
    lastName: string | null
    avatar: string | null
    businessName: string | null
    businessAddress: string | null
    phone: string | null
    email: string
  }
}

export type AppointmentStatus = 'DRAFT' | 'PROPOSED' | 'ACCEPTED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
export type AppointmentType = 'TATTOO' | 'PIERCING' | 'CONSULTATION' | 'COVER_UP' | 'TOUCH_UP' | 'CUSTOM_DESIGN' | 'OTHER'

export interface AppointmentProposal extends BaseEntity {
  id: string
  appointmentId: string
  proId: string
  clientId: string
  postId?: string
  title: string
  description: string
  proposedDates: string[]
  duration: number
  price: number
  currency: string
  location: string
  requirements?: string[]
  notes?: string
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED'
  expiresAt: string
}

// ===== TYPES DE PAIEMENT =====

export interface Payment extends BaseEntity {
  id: string
  appointmentId: string
  amount: number
  currency: string
  status: PaymentStatus
  stripePaymentIntentId?: string
  stripeTransferId?: string
  description?: string
  paymentMethod?: string
  paidAt?: string
  refundedAt?: string
  refundAmount?: number
}

export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED'

// ===== TYPES DE FACTURATION =====

export interface Invoice extends BaseEntity {
  id: string
  invoiceNumber: string
  appointmentId: string
  issuerId: string
  receiverId: string
  amount: number
  currency: string
  vatAmount?: number
  vatRate?: number
  description: string
  dueDate: string
  paidAt?: string
  status: InvoiceStatus
  items: InvoiceItem[]
  paymentTerms?: string
  notes?: string
}

export interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  totalPrice: number
  vatRate?: number
  vatAmount?: number
}

export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED'

// ===== TYPES DE TRANSACTION STRIPE =====

export interface StripePaymentIntent {
  id: string
  amount: number
  currency: string
  status: string
  clientSecret: string
  paymentMethodTypes: string[]
  metadata: Record<string, string>
}

export interface StripeCheckoutSession {
  id: string
  url: string
  amount: number
  currency: string
  status: string
  metadata: Record<string, string>
}

// ===== TYPES DE COLLABORATION =====

export interface Collaboration extends BaseEntity {
  initiatorId: string
  recipientId: string
  status: CollaborationStatus
  title: string
  description: string
  projectType: string
  budget?: number
  deadline?: string
}

export type CollaborationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED'

// ===== TYPES DE RECHERCHE =====

export interface SearchFilters {
  query?: string
  category?: string
  location?: string
  priceRange?: [number, number]
  rating?: number
  availability?: string[]
  tags?: string[]
}

export interface SearchResult<T> {
  items: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

// ===== TYPES DE COMPOSANTS =====

export interface BaseComponentProps {
  className?: string
  children?: React.ReactNode
}

export interface LoadingState {
  isLoading: boolean
  error: string | null
  data: unknown | null
}

export interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  showFirstLast?: boolean
  showPrevNext?: boolean
}

// ===== TYPES D'API =====

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface ApiError {
  code: string
  message: string
  details?: Record<string, any>
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// ===== TYPES DE CONFIGURATION =====

export interface AppConfig {
  name: string
  version: string
  environment: 'development' | 'staging' | 'production'
  apiUrl: string
  features: Record<string, boolean>
}

export interface FeatureFlags {
  chat: boolean
  payments: boolean
  collaborations: boolean
  notifications: boolean
  search: boolean
}

// ===== TYPES D'ÉVÉNEMENTS =====

export interface AppEvent {
  type: string
  payload: unknown
  timestamp: string
  userId?: string
}

export interface WebSocketMessage {
  type: string
  data: unknown
  timestamp: string
}

// ===== TYPES DE MÉTADONNÉES =====

export interface MetaData {
  title?: string
  description?: string
  keywords?: string[]
  image?: string
  url?: string
}

export interface SeoData extends MetaData {
  canonical?: string
  robots?: string
  ogType?: string
  twitterCard?: string
}

// ===== TYPES DE VALIDATION =====

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings?: string[]
}

export interface FormValidation {
  [fieldName: string]: ValidationResult
}

// ===== TYPES DE GESTION D'ÉTAT =====

export interface AppState {
  user: User | null
  theme: 'light' | 'dark' | 'system'
  language: string
  notifications: Notification[]
  unreadCount: number
}

export interface Action {
  type: string
  payload?: unknown
  meta?: Record<string, any>
}

// ===== TYPES DE HOOKS =====

export interface UseApiOptions {
  immediate?: boolean
  retry?: number
  retryDelay?: number
  onSuccess?: (data: unknown) => void
  onError?: (error: unknown) => void
}

export interface UseLocalStorageOptions {
  defaultValue?: unknown
  serializer?: (value: unknown) => string
  deserializer?: (value: string) => any
}

// ===== TYPES DE TESTS =====

export interface TestConfig {
  timeout: number
  retries: number
  environment: 'jsdom' | 'node'
}

export interface MockData {
  users: User[]
  conversations: Conversation[]
  messages: Message[]
  posts: Post[]
  notifications: Notification[]
} 