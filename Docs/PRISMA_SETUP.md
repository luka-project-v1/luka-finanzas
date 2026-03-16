# Configuración de Prisma ORM

## Instalación

1. **Instalar dependencias**:
   ```bash
   npm install
   ```

   Esto instalará:
   - `@prisma/client`: Cliente de Prisma para TypeScript
   - `prisma`: CLI de Prisma (dev dependency)
   - `tsx`: Para ejecutar scripts TypeScript (dev dependency)

2. **Configurar DATABASE_URL en `.env.local`**:
   
   Obtén la connection string de Supabase:
   - Ve a tu proyecto en Supabase
   - Settings → Database
   - Busca "Connection string" → "URI"
   - Copia la URI y reemplaza `[YOUR-PASSWORD]` con tu contraseña de base de datos
   
   Agrega a tu `.env.local`:
   ```env
   DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
   ```
   
   O para conexión directa (recomendado para migraciones):
   ```env
   DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
   ```

3. **Generar el cliente de Prisma**:
   ```bash
   npm run db:generate
   ```

4. **Crear y aplicar la migración inicial**:
   ```bash
   npm run db:migrate
   ```
   
   Esto creará la migración inicial basada en el schema y la aplicará a tu base de datos.

## Comandos Disponibles

- `npm run db:generate` - Genera el cliente de Prisma
- `npm run db:migrate` - Crea y aplica una nueva migración
- `npm run db:migrate:deploy` - Aplica migraciones pendientes (producción)
- `npm run db:push` - Sincroniza schema sin crear migraciones (prototipado)
- `npm run db:studio` - Abre Prisma Studio (GUI para la BD)

## Uso en el Código

```typescript
import { prisma } from '@/lib/prisma/client'

// Ejemplo: Obtener todas las cuentas de un usuario
const accounts = await prisma.account.findMany({
  where: { userId: 'user-id' },
  include: {
    bankDetails: true,
    creditCardDetails: true,
  }
})
```

## Migraciones

Las migraciones se guardan en `prisma/migrations/`. Cada migración incluye:
- El SQL para aplicar los cambios
- El SQL para revertir los cambios

**Importante**: 
- Nunca edites migraciones ya aplicadas
- Siempre crea nuevas migraciones para cambios de schema
- Después de cambios, ejecuta `npm run db:generate`

## Notas

- El schema está basado en el modelo ledger-based de `db-structure.md`
- Prisma puede coexistir con Supabase Client (para auth y storage)
- Las migraciones de Prisma se aplican directamente a PostgreSQL
