// app-core/src/types.ts

// --- TIPOS ENUM Y LITERALES ---

/** Roles de usuario para el sistema de acceso (Authentication) */
export type UserRole = 'GUEST' | 'USER' | 'AFFILIATE' | 'SUPERADMIN';

/** Etiquetas para clasificar los gastos (Urgency Vitality) */
export type ExpenseTag = 'RED' | 'YELLOW' | 'GREEN'; 

/** Regímenes fiscales de México para el Tax Calculator */
export type TaxRegime = 'RESICO' | 'ACT_EMPRESARIAL';

/** Niveles de membresía del sistema */
export type MembershipTier = 'BASIC' | 'PREMIUM';

// --- ESTRUCTURAS DE DATOS PRINCIPALES ---

/** Definición completa del objeto Usuario */
export interface User {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  businessType: string;
  financialGoals: FinancialGoal[];
  credits: number; // Créditos Carmelita (CC) restantes
  createdAt: Date;
  lastLogin: Date;
}

/** Objeto para registrar metas financieras (Savings Seeds) */
export interface FinancialGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  progress: number; // (0.0 a 1.0)
  isCompleted: boolean;
  wateringCount: number; // Mecánica de 'Watering'
}

/** Objeto para registrar ingresos o gastos (Financial Register) */
export interface FinancialRecord {
  id: string;
  userId: string;
  type: 'INCOME' | 'EXPENSE';
  description: string;
  amount: number;
  date: Date;
  tag: ExpenseTag; // Aplicable solo a EXPENSE
}

/** Objeto para registrar las transacciones de compra/canje de créditos */
export interface CreditTransaction {
  id: string;
  userId: string;
  type: 'PURCHASE' | 'CANJE'; // Compra vía Stripe o Canje por servicio
  amount: number; // Cantidad de CC
  cost: number; // Costo en CC si es CANJE, o USD si es PURCHASE
  serviceUsed: string; // Ej: 'AI_COPYWRITING', 'TAX_CALC'
  date: Date;
}

/** Objeto para definir el precio de los créditos (Monetization) */
export interface CreditPricing {
  id: string;
  name: string; // Ej: 'Paquete Básico', 'Paquete Premium'
  priceUSD: number;
  creditsAmount: number; // Cantidad de CC que recibe el usuario
  stripePriceId: string; // ID del precio en Stripe
}

