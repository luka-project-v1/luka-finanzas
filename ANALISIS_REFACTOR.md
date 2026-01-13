# 📊 Análisis del Código Post-Refactor de Base de Datos

**Fecha:** Enero 2025  
**Estado:** Después del refactor de la base de datos a modelo ledger-based

---

## 🎯 Resumen Ejecutivo

El código ha sido refactorizado para usar un modelo **ledger-based** (libro contable) donde los balances se calculan desde las transacciones. Sin embargo, **gran parte del código frontend y acciones del servidor aún usan el modelo antiguo**, causando múltiples incompatibilidades.

### Estado General
- ✅ **Schema de Prisma:** Correcto y alineado con el nuevo modelo
- ⚠️ **Repositorios:** Parcialmente funcionales (algunos usan el nuevo modelo)
- ❌ **Actions/Server Actions:** Mayoría usa campos que no existen
- ❌ **Componentes UI:** Casi todos usan el modelo antiguo
- ❌ **Validaciones:** Algunas incompatibles con el nuevo schema

---

## ✅ LO QUE ESTÁ FUNCIONAL

### 1. Schema de Prisma (`prisma/schema.prisma`)
✅ **Completamente funcional**
- Modelos correctos: `Account`, `AccountType`, `Transaction`, `Transfer`, `Reconciliation`
- Relaciones bien definidas
- Enums correctos
- Tablas de detalles 1:1 (`BankAccountDetails`, `CreditCardDetails`)

### 2. Repositorios Base
✅ **Parcialmente funcionales**

**`account-repository.ts`:**
- ✅ Usa el nuevo modelo correctamente
- ✅ Calcula balances desde transacciones (`calculateBalance`)
- ✅ Maneja `AccountType` correctamente
- ✅ Soporta `BankAccountDetails` y `CreditCardDetails`

**`credit-card-repository.ts`:**
- ✅ Usa el nuevo modelo
- ✅ Crea cuentas con tipo `CREDIT_CARD`
- ✅ Maneja `CreditCardDetails` correctamente

**`transaction-repository.ts`:**
- ✅ Usa el nuevo modelo con `signed_amount`
- ✅ Filtra por `status` y `kind` correctamente
- ✅ Calcula resúmenes excluyendo `TRANSFER` y `ADJUSTMENT`

### 3. Acciones de Categorías y Monedas
✅ **Funcionales**
- `categories.ts`: Funciona correctamente
- `currencies.ts`: Funciona correctamente

---

## ❌ LO QUE NO ESTÁ FUNCIONAL

### 1. **Tablas de Loans NO EXISTEN en el Schema**

**Problema Crítico:**
El schema de Prisma **NO tiene** las siguientes tablas que el código intenta usar:
- `loans_given`
- `loans_received`
- `loan_given_payments`
- `loan_received_payments`

**Archivos afectados:**
- ❌ `src/lib/repositories/loan-repository.ts` - **TODO el archivo fallará**
- ❌ `src/lib/actions/credits.ts` - Funciones de loans fallarán
- ❌ `src/lib/validations/loan-schema.ts` - Validaciones para tablas inexistentes
- ❌ `src/app/(dashboard)/credits/page.tsx` - UI de loans no funcionará

**Impacto:** 
- Las funciones de préstamos (dados/recibidos) **NO funcionarán**
- El código intentará hacer queries a tablas que no existen
- Errores en runtime: `relation "loans_given" does not exist`

---

### 2. **Actions de Accounts - Campos Inexistentes**

**Archivo:** `src/lib/actions/accounts.ts`

**Problemas:**
- ❌ **Falta función:** `setMonthlyInitialBalance` - Referenciada en `accounts/page.tsx` pero no existe
- ⚠️ El código usa el nuevo modelo correctamente, pero falta esta función

**Campos que el código intenta usar pero NO existen en el schema:**
- `current_balance` - El balance se calcula, no se guarda
- `monthly_initial_balance` - No existe en el nuevo modelo
- `account_type` (string) - Debería ser `account_type_id` (UUID)
- `is_active` - Debería ser `status` (enum: ACTIVE/CLOSED)

---

### 3. **Actions de Credits - Funciones Faltantes**

**Archivo:** `src/lib/actions/credits.ts`

**Problemas:**
- ❌ **Falta función:** `setCreditCardMonthlyInitialBalance` - Referenciada en `credits/page.tsx` pero no existe
- ❌ Funciones de loans intentan usar tablas que no existen (ver sección 1)

---

### 4. **Actions de Transactions - Modelo Antiguo**

**Archivo:** `src/lib/actions/transactions.ts`

**Estado:** ✅ **Funcional** - Usa el nuevo modelo correctamente

**Nota:** El código está bien, pero el frontend espera campos diferentes.

---

### 5. **Componente Accounts Page - Modelo Antiguo**

**Archivo:** `src/app/(dashboard)/accounts/page.tsx`

**Campos que usa pero NO existen:**
- ❌ `account.current_balance` → Debería calcularse desde transacciones
- ❌ `account.monthly_initial_balance` → No existe en el nuevo modelo
- ❌ `account.monthly_initial_balance_date` → No existe
- ❌ `account.account_type` (string) → Debería ser `account.account_types.code`
- ❌ `account.is_active` → Debería ser `account.status === 'ACTIVE'`
- ❌ `account.currencies` → La relación no existe directamente, debería venir de otra forma

**Funciones que llama pero NO existen:**
- ❌ `setMonthlyInitialBalance()` - No existe en `accounts.ts`

**Lógica incorrecta:**
- ❌ Usa `transaction_type` ('income'/'expense') → Debería usar `signed_amount` y `balance_nature`
- ❌ Usa `tx.is_paid` → Debería usar `tx.status === 'POSTED'`
- ❌ Usa `tx.amount` → Debería usar `tx.signed_amount`

---

### 6. **Componente Credits Page - Modelo Antiguo**

**Archivo:** `src/app/(dashboard)/credits/page.tsx`

**Campos que usa pero NO existen:**
- ❌ `creditCard.current_balance` → Debería calcularse
- ❌ `creditCard.monthly_initial_balance` → No existe
- ❌ `creditCard.currencies` → Relación no existe directamente
- ❌ `creditCard.closing_day` → Debería ser `creditCard.credit_card_details.billing_cycle_day`
- ❌ `creditCard.payment_due_day` → Debería ser `creditCard.credit_card_details.payment_due_day`
- ❌ `creditCard.annual_interest_rate` → Debería ser `creditCard.credit_card_details.interest_rate_annual`

**Funciones que llama pero NO existen:**
- ❌ `setCreditCardMonthlyInitialBalance()` - No existe

**Lógica incorrecta:**
- ❌ Usa `tx.is_paid` → Debería usar `tx.status === 'POSTED'`
- ❌ Usa `tx.account_id` para detectar pagos → Lógica incorrecta para el nuevo modelo
- ❌ Usa `tx.credit_card_id` → Las transacciones tienen `account_id`, no `credit_card_id`

**Problemas con Loans:**
- ❌ Todo el código de loans (dados/recibidos) fallará porque las tablas no existen

---

### 7. **Componente Transactions Page - Modelo Antiguo**

**Archivo:** `src/app/(dashboard)/transactions/page.tsx`

**Campos que usa pero NO existen:**
- ❌ `transaction.transaction_type` ('income'/'expense') → No existe, debería inferirse de `signed_amount` y `balance_nature`
- ❌ `transaction.is_paid` → Debería ser `transaction.status === 'POSTED'`
- ❌ `transaction.amount` → Debería ser `transaction.signed_amount`
- ❌ `transaction.transaction_date` → Debería ser `transaction.occurred_at`
- ❌ `transaction.credit_cards` → Relación no existe, debería venir de `accounts` con `account_types.code === 'CREDIT_CARD'`
- ❌ `transaction.bank_accounts` → Debería ser `transaction.accounts`

**Lógica incorrecta:**
- ❌ Filtra por `transaction_type` → Debería filtrar por `kind` y calcular según `signed_amount`
- ❌ Calcula ingresos/gastos basándose en `transaction_type` → Debería usar `signed_amount` y `balance_nature`

---

### 8. **Validaciones - Incompatibilidades**

**Archivo:** `src/lib/validations/transaction-schema.ts`

**Problemas:**
- ⚠️ Usa `account_id` correctamente ✅
- ⚠️ Usa `signed_amount` correctamente ✅
- ⚠️ Usa `kind` y `status` correctamente ✅
- ⚠️ Usa `occurred_at` correctamente ✅
- ✅ **Este archivo está bien**

**Archivo:** `src/lib/validations/account-schema.ts`
- ✅ **Está bien** - Usa campos correctos del nuevo modelo

**Archivo:** `src/lib/validations/credit-card-schema.ts`
- ✅ **Está bien** - Usa campos correctos del nuevo modelo

**Archivo:** `src/lib/validations/loan-schema.ts`
- ❌ **No funcional** - Valida campos para tablas que no existen

---

### 9. **Database Types - Desactualizado**

**Archivo:** `src/lib/types/database.types.ts`

**Problemas:**
- ⚠️ Este archivo parece ser generado desde Supabase
- ⚠️ Contiene enums que no están en Prisma (ej: `HistoryStatus`, `PaymentMethod`, `Role`, `RoomStatus`, `ServiceType`)
- ⚠️ Estos enums parecen ser de otro proyecto o versión antigua
- ⚠️ **No tiene** tipos para `loans_given`, `loans_received`, etc. (lo cual es correcto porque no existen)

---

## 🔍 INCONSISTENCIAS DETALLADAS

### Inconsistencia 1: Modelo de Transacciones

**Modelo Nuevo (Schema):**
```prisma
Transaction {
  signed_amount: Decimal  // Positivo/negativo según balance_nature
  status: POSTED | PENDING | VOID
  kind: NORMAL | TRANSFER | ADJUSTMENT | FEE | INTEREST
  occurred_at: DateTime
  account_id: UUID
}
```

**Modelo Antiguo (Código Frontend):**
```typescript
Transaction {
  transaction_type: 'income' | 'expense'  // ❌ No existe
  is_paid: boolean                        // ❌ No existe
  amount: number                           // ❌ Debería ser signed_amount
  transaction_date: string                 // ❌ Debería ser occurred_at
}
```

### Inconsistencia 2: Modelo de Cuentas

**Modelo Nuevo (Schema):**
```prisma
Account {
  account_type_id: UUID
  status: ACTIVE | CLOSED
  currency_code: String(3)
  // Balance se calcula desde transactions
}
```

**Modelo Antiguo (Código Frontend):**
```typescript
Account {
  account_type: 'savings' | 'checking'    // ❌ No existe
  current_balance: number                  // ❌ No existe
  monthly_initial_balance: number          // ❌ No existe
  is_active: boolean                       // ❌ Debería ser status
  currencies: { ... }                      // ❌ Relación no existe directamente
}
```

### Inconsistencia 3: Modelo de Tarjetas de Crédito

**Modelo Nuevo (Schema):**
```prisma
Account {
  credit_card_details: {
    billing_cycle_day: Int?
    payment_due_day: Int?
    interest_rate_annual: Decimal?
    ...
  }
}
```

**Modelo Antiguo (Código Frontend):**
```typescript
CreditCard {
  closing_day: number                      // ❌ Debería ser billing_cycle_day
  payment_due_day: number                  // ✅ Existe pero en details
  annual_interest_rate: number             // ❌ Debería ser interest_rate_annual
  current_balance: number                  // ❌ No existe
}
```

---

## 📋 CHECKLIST DE PROBLEMAS

### Críticos (Rompen la aplicación)
- [ ] ❌ Tablas de loans no existen - Todo el código de loans fallará
- [ ] ❌ `setMonthlyInitialBalance()` no existe - Accounts page fallará
- [ ] ❌ `setCreditCardMonthlyInitialBalance()` no existe - Credits page fallará
- [ ] ❌ Transactions page usa campos que no existen
- [ ] ❌ Accounts page usa campos que no existen
- [ ] ❌ Credits page usa campos que no existen

### Importantes (Funcionalidad limitada)
- [ ] ⚠️ Database types tiene enums de otro proyecto
- [ ] ⚠️ Cálculo de balances en frontend usa lógica antigua
- [ ] ⚠️ Filtros de transacciones usan campos antiguos

### Menores (Mejoras)
- [ ] ⚠️ Algunos tipos TypeScript podrían mejorarse
- [ ] ⚠️ Validaciones de loans no se pueden usar

---

## 🛠️ RECOMENDACIONES DE ARREGLO

### Prioridad 1: Crítico - Arreglar Inmediatamente

1. **Decidir sobre Loans:**
   - Opción A: Eliminar toda la funcionalidad de loans del código
   - Opción B: Agregar las tablas de loans al schema de Prisma
   - **Recomendación:** Opción B si los loans son importantes, Opción A si no

2. **Crear funciones faltantes:**
   - Implementar `setMonthlyInitialBalance()` en `accounts.ts`
   - Implementar `setCreditCardMonthlyInitialBalance()` en `credits.ts`
   - **Nota:** Estas funciones deberían crear transacciones de tipo `ADJUSTMENT` en lugar de guardar balances

3. **Actualizar Transactions Page:**
   - Cambiar `transaction_type` → calcular desde `signed_amount` y `balance_nature`
   - Cambiar `is_paid` → `status === 'POSTED'`
   - Cambiar `amount` → `signed_amount`
   - Cambiar `transaction_date` → `occurred_at`
   - Actualizar relaciones: `bank_accounts` → `accounts`, `credit_cards` → filtrar por `account_types`

4. **Actualizar Accounts Page:**
   - Eliminar referencias a `current_balance`, `monthly_initial_balance`
   - Calcular balances desde transacciones usando `accountRepository.calculateBalance()`
   - Cambiar `account_type` → `account_types.code`
   - Cambiar `is_active` → `status === 'ACTIVE'`
   - Actualizar lógica de transacciones para usar `signed_amount` y `status`

5. **Actualizar Credits Page:**
   - Similar a Accounts Page
   - Cambiar campos de `credit_card_details`
   - Actualizar lógica de pagos para usar el nuevo modelo

### Prioridad 2: Importante - Arreglar Pronto

6. **Limpiar Database Types:**
   - Eliminar enums que no pertenecen al proyecto
   - Regenerar tipos desde Supabase si es necesario

7. **Actualizar Dashboard:**
   - Revisar `DashboardContent.tsx` para usar el nuevo modelo

### Prioridad 3: Mejoras

8. **Mejorar tipos TypeScript:**
   - Crear tipos helper para calcular `transaction_type` desde `signed_amount`
   - Crear tipos para balances calculados

9. **Documentación:**
   - Documentar cómo calcular balances
   - Documentar cómo determinar si una transacción es ingreso/gasto

---

## 📝 NOTAS ADICIONALES

### Sobre el Modelo Ledger-Based

El nuevo modelo es **ledger-based**, lo que significa:
- Los balances **NO se guardan**, se **calculan** desde transacciones
- Para establecer un balance inicial, se debe crear una transacción de tipo `ADJUSTMENT`
- Las transacciones usan `signed_amount`:
  - **ASSET accounts:** `+` = ingreso, `-` = gasto
  - **LIABILITY accounts:** `+` = cargo (aumenta deuda), `-` = pago (reduce deuda)

### Sobre Account Types

Los tipos de cuenta son **entidades** (no enums):
- `BANK_ACCOUNT` → `balance_nature: ASSET`
- `CREDIT_CARD` → `balance_nature: LIABILITY`
- `CASH` → `balance_nature: ASSET`

Esto permite agregar nuevos tipos sin cambiar código.

### Sobre Transfers

Las transferencias entre cuentas:
- Crean 2 transacciones ligadas por `transfer_id`
- Tienen `kind: TRANSFER`
- Se excluyen de reportes de ingresos/gastos

### Sobre Reconciliations

Las reconciliaciones:
- Permiten sincronizar el saldo real con el calculado
- Crean transacciones de tipo `ADJUSTMENT`
- Tienen un `delta` calculado automáticamente

---

## 🎯 CONCLUSIÓN

El refactor del schema está **bien hecho** y sigue buenas prácticas (ledger-based). Sin embargo, **el código de aplicación no ha sido actualizado** para usar el nuevo modelo, causando múltiples incompatibilidades.

**Estado actual:** ~30% funcional (solo repositorios base y algunas acciones)

**Para hacer funcional:** Se requiere actualizar todos los componentes UI y la mayoría de las server actions.

**Tiempo estimado de arreglo:** 2-3 días de desarrollo enfocado.

---

**Generado automáticamente el:** 2025-01-XX
