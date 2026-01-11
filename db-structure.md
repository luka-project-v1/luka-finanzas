// ================================
// PERSONAL FINANCE DATABASE (ROBUST)
// ================================
// - Ledger-based (balances come from transactions)
// - Account types are ENTITIES
// - Supports reconciliation (sync with real balance)
// - Supports transfers between own accounts
// ================================


// ---------- ENUMS ----------
Enum balance_nature {
  ASSET
  LIABILITY
}

Enum account_status {
  ACTIVE
  CLOSED
}

Enum transaction_status {
  PENDING
  POSTED
  VOID
}

Enum transaction_kind {
  NORMAL
  TRANSFER
  ADJUSTMENT
  FEE
  INTEREST
}

Enum bank_account_kind {
  SAVINGS
  CHECKING
}


// ---------- USERS ----------
Table users {
  id uuid [pk]
  email varchar [not null, unique]
  full_name varchar
  created_at timestamp [not null]
  updated_at timestamp [not null]
}


// ---------- ACCOUNT TYPES (ENTITY) ----------
Table account_types {
  id uuid [pk]
  code varchar [not null, unique]          // BANK_ACCOUNT, CREDIT_CARD, CASH
  name varchar [not null]
  balance_nature balance_nature [not null] // ASSET or LIABILITY
  created_at timestamp [not null]
  updated_at timestamp [not null]
}


// ---------- ACCOUNTS ----------
Table accounts {
  id uuid [pk]
  user_id uuid [not null, ref: > users.id]
  account_type_id uuid [not null, ref: > account_types.id]

  name varchar [not null]                  // "Bancolombia Ahorros"
  currency_code varchar(3) [not null]      // "COP"
  status account_status [not null, default: 'ACTIVE']

  institution_name varchar                 // optional
  external_id varchar                      // optional (future integrations)

  opened_at date
  closed_at date

  created_at timestamp [not null]
  updated_at timestamp [not null]

  Indexes {
    (user_id)
    (account_type_id)
    (user_id, name) [unique]
  }
}


// ---------- BANK ACCOUNT DETAILS (1:1) ----------
Table bank_account_details {
  account_id uuid [pk, ref: - accounts.id]

  kind bank_account_kind [not null]        // SAVINGS / CHECKING
  bank_name varchar
  masked_number varchar                    // ****1234

  interest_rate_annual numeric(8,5)
  monthly_fee numeric(18,2)
  overdraft_limit numeric(18,2)

  created_at timestamp [not null]
  updated_at timestamp [not null]
}


// ---------- CREDIT CARD DETAILS (1:1) ----------
Table credit_card_details {
  account_id uuid [pk, ref: - accounts.id]

  issuer varchar                           // Visa, MasterCard
  bank_name varchar
  last4 varchar(4)

  credit_limit numeric(18,2)
  management_fee numeric(18,2)             // cuota de manejo
  management_fee_period varchar            // MONTHLY / ANNUAL

  interest_rate_annual numeric(8,5)
  interest_rate_monthly numeric(8,5)

  billing_cycle_day int
  payment_due_day int
  last_statement_date date

  created_at timestamp [not null]
  updated_at timestamp [not null]
}


// ---------- CATEGORIES ----------
Table categories {
  id uuid [pk]
  user_id uuid [not null, ref: > users.id]
  name varchar [not null]
  parent_id uuid
  created_at timestamp [not null]
  updated_at timestamp [not null]

  Indexes {
    (user_id, name) [unique]
  }
}

Ref: categories.parent_id > categories.id


// ---------- RECONCILIATIONS (SYNC BALANCE) ----------
Table reconciliations {
  id uuid [pk]
  user_id uuid [not null, ref: > users.id]
  account_id uuid [not null, ref: > accounts.id]

  entered_balance numeric(18,2) [not null]          // saldo real ingresado
  calculated_balance_before numeric(18,2) [not null]
  delta numeric(18,2) [not null]                    // entered - calculated

  occurred_at timestamp [not null]
  note varchar

  created_at timestamp [not null]

  Indexes {
    (account_id, occurred_at)
    (user_id, occurred_at)
  }
}


// ---------- TRANSACTIONS (LEDGER) ----------
Table transactions {
  id uuid [pk]
  user_id uuid [not null, ref: > users.id]
  account_id uuid [not null, ref: > accounts.id]

  // Ledger rule:
  // ASSET: income + / expense -
  // LIABILITY: charge + / payment -
  signed_amount numeric(18,2) [not null]

  status transaction_status [not null, default: 'POSTED']
  kind transaction_kind [not null, default: 'NORMAL']

  category_id uuid [ref: > categories.id]
  description varchar

  occurred_at timestamp [not null]
  posted_at timestamp

  // Transfer & reconciliation linkage
  transfer_id uuid
  reconciliation_id uuid [ref: > reconciliations.id]

  // Optional audit fields
  balance_after numeric(18,2)               // saldo objetivo tras ajuste
  source varchar                            // MANUAL, IMPORT, CSV, etc.

  created_at timestamp [not null]
  updated_at timestamp [not null]

  Indexes {
    (account_id, status, occurred_at)
    (user_id, occurred_at)
    (category_id)
    (transfer_id)
    (reconciliation_id)
  }
}


// ---------- TRANSFERS ----------
Table transfers {
  id uuid [pk]
  user_id uuid [not null, ref: > users.id]

  from_account_id uuid [not null, ref: > accounts.id]
  to_account_id uuid [not null, ref: > accounts.id]

  amount numeric(18,2) [not null]
  currency_code varchar(3) [not null]

  from_transaction_id uuid [unique]
  to_transaction_id uuid [unique]

  status transaction_status [not null, default: 'POSTED']
  occurred_at timestamp [not null]

  created_at timestamp [not null]
  updated_at timestamp [not null]

  Indexes {
    (from_account_id, occurred_at)
    (to_account_id, occurred_at)
  }
}

Ref: transfers.from_transaction_id - transactions.id
Ref: transfers.to_transaction_id - transactions.id
Ref: transactions.transfer_id > transfers.id


// ---------- TAGS (OPTIONAL BUT POWERFUL) ----------
Table tags {
  id uuid [pk]
  user_id uuid [not null, ref: > users.id]
  name varchar [not null]
  created_at timestamp [not null]

  Indexes {
    (user_id, name) [unique]
  }
}

Table transaction_tags {
  transaction_id uuid [not null, ref: > transactions.id]
  tag_id uuid [not null, ref: > tags.id]

  Indexes {
    (transaction_id, tag_id) [unique]
  }
}


Contexto y diseño de la base de datos (Finanzas personales robustas)
Objetivo

Esta base de datos está diseñada para que un usuario pueda:

Registrar ingresos, gastos, pagos, cargos y movimientos internos

Manejar múltiples cuentas (banco, efectivo, billeteras, tarjetas)

Tener reportes confiables por cuenta, categoría y tiempo

Mantener un sistema auditable y fácil de corregir cuando el usuario olvida registrar movimientos

El modelo NO busca construir un banco. Busca un sistema personal robusto y consistente.

Principio base: Ledger (libro contable) como fuente de verdad

El sistema sigue una regla simple:

El saldo de una cuenta no se guarda ni se “edita”.
El saldo es la suma de las transacciones (ledger).

Esto significa:

No existe un campo balance en accounts

El saldo se obtiene con:

SUM(transactions.signed_amount) filtrando por status='POSTED'

Ventajas:

Audit trail completo

Recalcular saldos siempre es posible

El historial es consistente (no hay “magia”)

Conceptos principales
1) User

users representa el dueño de la data financiera.

Todo en el sistema pertenece a un usuario:

accounts

categories

transactions

transfers

reconciliations

2) Account Type (entidad)

account_types no es un enum: es una entidad configurable.

Sirve para:

Definir clases de cuenta sin tocar código (ej: BANK_ACCOUNT, CREDIT_CARD, CASH)

Determinar cómo se interpreta el saldo (activo vs pasivo)

Campo clave:

balance_nature:

ASSET: dinero que el usuario posee (banco, efectivo, billeteras)

LIABILITY: deuda (tarjetas de crédito)

Ejemplos:

BANK_ACCOUNT → ASSET

CASH → ASSET

CREDIT_CARD → LIABILITY

3) Account (cuenta)

accounts es la entidad base para cualquier “contenedor” financiero.

Campos comunes:

user_id, type, moneda, status, nombre

No contiene campos específicos de un producto (ej: tasa de tarjeta, cuota de manejo), porque eso cambia según el tipo de cuenta.

4) Detalles por tipo (1:1)

Para evitar columnas nulas y mantener normalización, se usan tablas 1:1:

bank_account_details para cuentas bancarias:

SAVINGS/CHECKING, cuota mensual, tasa anual, sobregiro, etc.

credit_card_details para tarjetas:

cuota de manejo, tasas, cupo, ciclo y fecha de pago, etc.

Regla:

Una fila de details existe solo si corresponde al tipo.

Transacciones: el corazón del sistema
5) Transactions (ledger)

transactions representa cualquier movimiento que impacta el saldo de una cuenta.

Campos clave:

account_id: cuenta afectada

signed_amount: monto con signo (positivo/negativo)

kind: tipo lógico de transacción (NORMAL, TRANSFER, ADJUSTMENT, FEE, INTEREST)

status: POSTED / PENDING / VOID

occurred_at: fecha del evento real

category_id: clasificación (opcional)

transfer_id y reconciliation_id: trazabilidad cuando aplica

Regla central: signed_amount

Para simplificar el balance, se usa un monto con signo.

ASSET (dinero tuyo):

Ingreso → +

Gasto → -

LIABILITY (deuda, tarjeta):

Cargo/compra → + (aumenta deuda)

Pago → - (reduce deuda)

Con esta regla:

El saldo es siempre:

SUM(signed_amount) (POSTED)

Transfers: mover plata entre tus cuentas (sin ensuciar reportes)
6) Transfers

Una transferencia es un movimiento interno:

No es ingreso ni gasto real

Solo mueve dinero entre cuentas del usuario

Por consistencia, una transferencia siempre genera:

1 transacción negativa en la cuenta origen

1 transacción positiva en la cuenta destino

Ambas quedan ligadas por transfer_id

transfers guarda el contexto (from/to, amount, etc.)

Beneficios:

No se puede “olvidar” uno de los lados

Reportes limpios: se pueden excluir transfers del análisis de ingresos/gastos

Regla de reportes recomendada:

Excluir kind = TRANSFER de ingresos/gastos reales

Reconciliations: “ponerme al día” con mi saldo real
7) Reconciliations

Cuando el usuario olvida registrar movimientos, se produce una desincronización:

La app dice un saldo

La cuenta real tiene otro

La reconciliación permite:

ingresar el saldo real actual

calcular automáticamente la diferencia (delta)

guardar un evento de reconciliación + una transacción de ajuste

Ejemplo:

Saldo app: 400.000

Saldo real: 500.000

Delta: +100.000

Se guarda:

reconciliations:

entered_balance = 500.000

calculated_balance_before = 400.000

delta = +100.000

transactions con:

kind = ADJUSTMENT

signed_amount = delta

reconciliation_id = (id)

Beneficios:

No “editas” el pasado

Ajustas de forma auditable

Reportes pueden excluir ADJUSTMENT para no mezclarlo con ingresos reales

Regla de reportes recomendada:

Excluir kind = ADJUSTMENT de ingresos/gastos reales

Mantenerlo visible como “ajuste”

Categorías y Tags
8) Categories

Clasificación de movimientos:

Comida, transporte, salario, arriendo…
Son por usuario para evitar colisiones.

Soporta jerarquía con parent_id (opcional):

Hogar → Arriendo, Servicios

9) Tags (opcional)

Etiquetas múltiples por transacción:

“Trabajo”, “Viaje”, “Familia”, “Deducible”
Se implementa con transaction_tags (many-to-many)

Consultas base (conceptuales)
Saldo de una cuenta

saldo contable:

suma de transacciones POSTED

saldo “incluyendo pendientes”:

suma de POSTED + PENDING

Reporte de gastos reales por mes

filtrar:

kind NOT IN ('TRANSFER','ADJUSTMENT')

y signed_amount < 0 (si cuenta ASSET)

agrupar por categoría y mes

Flujos principales (resumen)
Crear una cuenta

Insert en accounts

Insert details 1:1 si aplica (bank_account_details o credit_card_details)

(Opcional) si se quiere registrar saldo inicial:

crear transactions con kind=ADJUSTMENT y signed_amount = saldo_inicial

Registrar un gasto o ingreso

Determinar naturaleza del tipo (ASSET/LIABILITY)

Calcular signed_amount según regla

Insert en transactions con kind=NORMAL

Transferencia entre cuentas

Insert en transfers

Insert 2 transactions con kind=TRANSFER y mismo transfer_id

Reconciliar saldo (“ponerme al día”)

Calcular saldo actual del ledger

Usuario ingresa saldo real

Crear reconciliations con delta

Crear transactions ADJUSTMENT con delta y link a reconciliation

Reglas de consistencia (recomendadas)

Transfers deben tener siempre 2 transacciones ligadas (origen/destino)

Reconciliations deben crear exactamente 1 transacción ADJUSTMENT por cuenta

Reportes de ingresos/gastos deben excluir TRANSFER y ADJUSTMENT