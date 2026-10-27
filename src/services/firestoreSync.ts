/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, User } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  collection, 
  onSnapshot, 
  setDoc, 
  deleteDoc, 
  getDocs, 
  getDocFromServer,
  writeBatch
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { ExpenseTicket, ExpenseCategory, FamilyMember } from '../types/expense';
import { Deuda } from '../types/debt';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export const PRIMARY_AUTHORIZED_EMAIL = 'guerramirez1122@gmail.com';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test initial connection to Firestore
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore connection: Client is offline or initializing.');
      return false;
    }
    // Permissions error on /test/connection is normal because catch-all rule blocks unknown paths
    return true;
  }
}

// Base household collection path
export const HOUSEHOLD_ID = 'family_default';
const BASE_PATH = `households/${HOUSEHOLD_ID}`;

// Check if user is one of the 2 authorized family accounts
export function isUserAuthorized(email: string | null | undefined, secondaryEmail?: string | null): boolean {
  if (!email) return false;
  const cleanEmail = email.toLowerCase().trim();
  if (cleanEmail === PRIMARY_AUTHORIZED_EMAIL.toLowerCase().trim()) return true;
  if (secondaryEmail && cleanEmail === secondaryEmail.toLowerCase().trim()) return true;
  return false;
}

// ---------------------------------------------------------------------------
// Real-time Listeners (onSnapshot)
// ---------------------------------------------------------------------------

export function subscribeToTickets(
  onUpdate: (tickets: ExpenseTicket[]) => void,
  onError?: (err: Error) => void
) {
  const path = `${BASE_PATH}/tickets`;
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const tickets: ExpenseTicket[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        tickets.push({
          id: data.id || docSnap.id,
          date: data.date,
          time: data.time || '12:00',
          merchant: data.merchant,
          category: data.category,
          amount: Number(data.amount) || 0,
          taxAmount: Number(data.taxAmount) || 0,
          tipAmount: Number(data.tipAmount) || 0,
          paidByMemberId: data.paidByMemberId,
          splitType: data.splitType || 'equal_all',
          splitWithMemberIds: data.splitWithMemberIds || [],
          items: data.items || [],
          aiConfidence: Number(data.aiConfidence) || 95,
          status: data.status || 'verified',
          source: data.source || 'manual',
          sheetRowIndex: data.sheetRowIndex,
          tags: data.tags || [],
          aiNotes: data.aiNotes || '',
        });
      });
      // Sort newest date first
      tickets.sort((a, b) => b.date.localeCompare(a.date));
      onUpdate(tickets);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export function subscribeToCategories(
  onUpdate: (categories: ExpenseCategory[]) => void,
  onError?: (err: Error) => void
) {
  const path = `${BASE_PATH}/categories`;
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const categories: ExpenseCategory[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        categories.push({
          id: data.id || docSnap.id,
          name: data.name,
          monthlyBudget: Number(data.monthlyBudget) || 0,
          color: data.color || '#6366f1',
          description: data.description || '',
        });
      });
      if (categories.length > 0) {
        onUpdate(categories);
      }
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export function subscribeToDebts(
  onUpdate: (debts: Deuda[]) => void,
  onError?: (err: Error) => void
) {
  const path = `${BASE_PATH}/debts`;
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const debts: Deuda[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        debts.push({
          id_deuda: data.id_deuda || docSnap.id,
          acreedor: data.acreedor,
          tipo_deuda: data.tipo_deuda || 'estatica_interes',
          moneda: data.moneda || 'ARS',
          saldo_actual: Number(data.saldo_actual) || 0,
          tasa_interes_anual: Number(data.tasa_interes_anual) || 0,
          pago_minimo: Number(data.pago_minimo) || 0,
          cuotas_restantes: Number(data.cuotas_restantes) || 1,
          incluir_riesgo_cambiario: Boolean(data.incluir_riesgo_cambiario),
        });
      });
      onUpdate(debts);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export function subscribeToFamilyMembers(
  onUpdate: (members: FamilyMember[]) => void,
  onError?: (err: Error) => void
) {
  const path = `${BASE_PATH}/members`;
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const members: FamilyMember[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        members.push({
          id: data.id || docSnap.id,
          name: data.name,
          role: data.role || 'Parent',
          avatarUrl: data.avatarUrl || '',
          email: data.email || '',
          color: data.color || '#6366f1',
          monthlyTargetSpend: Number(data.monthlyTargetSpend) || 0,
        });
      });
      if (members.length > 0) {
        onUpdate(members);
      }
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export function subscribeToSecurityConfig(
  onUpdate: (config: { primaryEmail: string; secondaryEmail?: string }) => void,
  onError?: (err: Error) => void
) {
  const path = `${BASE_PATH}/config/security`;
  return onSnapshot(
    doc(db, path),
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        onUpdate({
          primaryEmail: data.primaryEmail || PRIMARY_AUTHORIZED_EMAIL,
          secondaryEmail: data.secondaryEmail || '',
        });
      } else {
        onUpdate({
          primaryEmail: PRIMARY_AUTHORIZED_EMAIL,
          secondaryEmail: '',
        });
      }
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

// ---------------------------------------------------------------------------
// Mutation Helpers
// ---------------------------------------------------------------------------

export async function saveTicketToFirestore(ticket: ExpenseTicket): Promise<void> {
  const path = `${BASE_PATH}/tickets/${ticket.id}`;
  try {
    const payload = {
      id: ticket.id,
      date: ticket.date,
      time: ticket.time,
      merchant: ticket.merchant,
      category: ticket.category,
      amount: Number(ticket.amount),
      taxAmount: Number(ticket.taxAmount || 0),
      tipAmount: Number(ticket.tipAmount || 0),
      paidByMemberId: ticket.paidByMemberId,
      splitType: ticket.splitType,
      status: ticket.status,
      source: ticket.source,
      aiConfidence: ticket.aiConfidence,
      sheetRowIndex: ticket.sheetRowIndex || 0,
      aiNotes: ticket.aiNotes || '',
      updatedAt: new Date().toISOString(),
    };
    await setDoc(doc(db, `${BASE_PATH}/tickets`, ticket.id), payload);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteTicketFromFirestore(ticketId: string): Promise<void> {
  const path = `${BASE_PATH}/tickets/${ticketId}`;
  try {
    await deleteDoc(doc(db, `${BASE_PATH}/tickets`, ticketId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function saveDebtToFirestore(debt: Deuda): Promise<void> {
  const path = `${BASE_PATH}/debts/${debt.id_deuda}`;
  try {
    const payload = {
      id_deuda: debt.id_deuda,
      acreedor: debt.acreedor,
      tipo_deuda: debt.tipo_deuda,
      moneda: debt.moneda,
      saldo_actual: Number(debt.saldo_actual),
      tasa_interes_anual: Number(debt.tasa_interes_anual || 0),
      pago_minimo: Number(debt.pago_minimo),
      cuotas_restantes: Number(debt.cuotas_restantes || 1),
      incluir_riesgo_cambiario: Boolean(debt.incluir_riesgo_cambiario),
      updatedAt: new Date().toISOString(),
    };
    await setDoc(doc(db, `${BASE_PATH}/debts`, debt.id_deuda), payload);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteDebtFromFirestore(debtId: string): Promise<void> {
  const path = `${BASE_PATH}/debts/${debtId}`;
  try {
    await deleteDoc(doc(db, `${BASE_PATH}/debts`, debtId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function saveCategoryToFirestore(category: ExpenseCategory): Promise<void> {
  const path = `${BASE_PATH}/categories/${category.id}`;
  try {
    const payload = {
      id: category.id,
      name: category.name,
      monthlyBudget: Number(category.monthlyBudget),
      color: category.color,
      description: category.description || '',
    };
    await setDoc(doc(db, `${BASE_PATH}/categories`, category.id), payload);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function saveMemberToFirestore(member: FamilyMember): Promise<void> {
  const path = `${BASE_PATH}/members/${member.id}`;
  try {
    const payload = {
      id: member.id,
      name: member.name,
      role: member.role,
      avatarUrl: member.avatarUrl || '',
      email: member.email || '',
      color: member.color,
      monthlyTargetSpend: Number(member.monthlyTargetSpend || 0),
    };
    await setDoc(doc(db, `${BASE_PATH}/members`, member.id), payload);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function saveSecurityConfig(secondaryEmail: string): Promise<void> {
  const path = `${BASE_PATH}/config/security`;
  try {
    await setDoc(doc(db, `${BASE_PATH}/config`, 'security'), {
      primaryEmail: PRIMARY_AUTHORIZED_EMAIL,
      secondaryEmail: secondaryEmail.trim(),
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// Seed initial sample data to Firestore if cloud collection is currently empty
export async function seedInitialDataIfEmpty(
  initialTickets: ExpenseTicket[],
  initialCategories: ExpenseCategory[],
  initialDebts: Deuda[],
  initialMembers: FamilyMember[]
): Promise<boolean> {
  try {
    const ticketsSnap = await getDocs(collection(db, `${BASE_PATH}/tickets`));
    if (ticketsSnap.empty && initialTickets.length > 0) {
      const batch = writeBatch(db);

      // Seed tickets
      initialTickets.forEach((t) => {
        const ref = doc(db, `${BASE_PATH}/tickets`, t.id);
        batch.set(ref, {
          id: t.id,
          date: t.date,
          time: t.time || '12:00',
          merchant: t.merchant,
          category: t.category,
          amount: Number(t.amount),
          taxAmount: Number(t.taxAmount || 0),
          tipAmount: Number(t.tipAmount || 0),
          paidByMemberId: t.paidByMemberId,
          splitType: t.splitType,
          status: t.status,
          source: t.source,
          aiConfidence: t.aiConfidence,
          sheetRowIndex: t.sheetRowIndex || 0,
          aiNotes: t.aiNotes || '',
          updatedAt: new Date().toISOString(),
        });
      });

      // Seed categories
      initialCategories.forEach((c) => {
        const ref = doc(db, `${BASE_PATH}/categories`, c.id);
        batch.set(ref, {
          id: c.id,
          name: c.name,
          monthlyBudget: Number(c.monthlyBudget),
          color: c.color,
          description: c.description || '',
        });
      });

      // Seed debts
      initialDebts.forEach((d) => {
        const ref = doc(db, `${BASE_PATH}/debts`, d.id_deuda);
        batch.set(ref, {
          id_deuda: d.id_deuda,
          acreedor: d.acreedor,
          tipo_deuda: d.tipo_deuda,
          moneda: d.moneda,
          saldo_actual: Number(d.saldo_actual),
          tasa_interes_anual: Number(d.tasa_interes_anual || 0),
          pago_minimo: Number(d.pago_minimo),
          cuotas_restantes: Number(d.cuotas_restantes || 1),
          incluir_riesgo_cambiario: Boolean(d.incluir_riesgo_cambiario),
          updatedAt: new Date().toISOString(),
        });
      });

      // Seed members
      initialMembers.forEach((m) => {
        const ref = doc(db, `${BASE_PATH}/members`, m.id);
        batch.set(ref, {
          id: m.id,
          name: m.name,
          role: m.role,
          avatarUrl: m.avatarUrl || '',
          email: m.email || '',
          color: m.color,
          monthlyTargetSpend: Number(m.monthlyTargetSpend || 0),
        });
      });

      // Seed default security config
      const secRef = doc(db, `${BASE_PATH}/config`, 'security');
      batch.set(secRef, {
        primaryEmail: PRIMARY_AUTHORIZED_EMAIL,
        secondaryEmail: '',
        updatedAt: new Date().toISOString(),
      });

      await batch.commit();
      return true;
    }
    return false;
  } catch (err) {
    console.warn('Initial seeding notice (may be offline or awaiting auth):', err);
    return false;
  }
}
