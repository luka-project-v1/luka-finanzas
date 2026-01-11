# Prisma Migrations

Este directorio contiene el schema de Prisma y las migraciones de la base de datos.

## Configuración

1. **Configurar DATABASE_URL en `.env.local`**:
   ```env
   DATABASE_URL="postgresql://postgres:password@host:port/database?schema=public"
   ```
   
   Para Supabase, el formato es:
   ```env
   DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
   ```
   
   O usando la conexión directa:
   ```env
   DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
   ```

## Comandos Disponibles

### Generar el cliente de Prisma
```bash
npm run db:generate
```
Genera el cliente de Prisma basado en el schema.

### Crear una nueva migración
```bash
npm run db:migrate
```
Crea una nueva migración y la aplica al entorno de desarrollo.

### Aplicar migraciones (producción)
```bash
npm run db:migrate:deploy
```
Aplica las migraciones pendientes sin crear nuevas (útil para producción).

### Sincronizar schema sin migraciones
```bash
npm run db:push
```
Sincroniza el schema directamente con la base de datos sin crear archivos de migración (útil para prototipado).

### Abrir Prisma Studio
```bash
npm run db:studio
```
Abre una interfaz visual para explorar y editar datos en la base de datos.

## Estructura del Schema

El schema está basado en el modelo ledger-based descrito en `db-structure.md`:

- **Users**: Perfiles de usuario
- **AccountType**: Tipos de cuenta (BANK_ACCOUNT, CREDIT_CARD, CASH)
- **Account**: Cuentas base (activos y pasivos)
- **BankAccountDetails**: Detalles específicos de cuentas bancarias
- **CreditCardDetails**: Detalles específicos de tarjetas de crédito
- **Category**: Categorías de transacciones (con jerarquía)
- **Transaction**: Transacciones (ledger principal)
- **Transfer**: Transferencias entre cuentas
- **Reconciliation**: Reconciliaciones de saldos
- **Tag**: Etiquetas para transacciones
- **TransactionTag**: Relación many-to-many entre transacciones y tags

## Principios del Modelo

1. **Ledger-based**: Los saldos se calculan desde las transacciones, no se almacenan directamente
2. **signed_amount**: Montos con signo para simplificar cálculos
   - ASSET: ingresos +, gastos -
   - LIABILITY: cargos +, pagos -
3. **Transfers**: Movimientos internos que no afectan ingresos/gastos reales
4. **Reconciliations**: Ajustes auditable cuando hay desincronización

## Notas Importantes

- Las migraciones se guardan en `prisma/migrations/`
- Nunca edites migraciones ya aplicadas
- Siempre crea nuevas migraciones para cambios de schema
- Después de cambios, ejecuta `npm run db:generate` para actualizar el cliente
