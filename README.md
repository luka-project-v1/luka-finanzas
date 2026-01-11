# Luka - Personal Finance Control MVP

Sistema de control financiero personal construido con Next.js 14+, Supabase y TailwindCSS.

## 🚀 Características del MVP

- ✅ Autenticación con Supabase Auth
- ✅ Gestión de cuentas bancarias
- ✅ Registro de transacciones (ingresos y egresos)
- ✅ Dashboard con resumen financiero
- ✅ Soporte multi-moneda
- ✅ Sistema de categorías
- ✅ Row Level Security (RLS) habilitado

## 📋 Pre-requisitos

- Node.js 18+ 
- npm o pnpm
- Cuenta de Supabase

## 🛠️ Configuración

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto con el siguiente contenido:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://vvxdblsnookddrswbumi.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2eGRibHNub29rZGRyc3didW1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyOTgzNDcsImV4cCI6MjA3Mzg3NDM0N30.K9i1STyViPU8rJk_cbClFnSRF5WHg4Bim4twb-0-O9E

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Luka
```

### 3. Base de datos

Las migraciones ya están aplicadas en el proyecto de Supabase. Las tablas creadas son:

- `users` - Perfiles de usuario
- `currencies` - Monedas disponibles
- `categories` - Categorías de ingresos/gastos
- `bank_accounts` - Cuentas bancarias
- `transactions` - Transacciones financieras

### 4. Usuario de prueba

Puedes usar las siguientes credenciales para probar:

```
Email: luca@test.com
Password: admin123
```

O crear una cuenta nueva en `/signup`.

## 🎯 Desarrollo

### Iniciar servidor de desarrollo

```bash
npm run dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000)

### Estructura del proyecto

```
luca-v2/
├── src/
│   ├── app/
│   │   ├── (auth)/           # Páginas de autenticación
│   │   │   ├── login/
│   │   │   └── signup/
│   │   ├── (dashboard)/      # Páginas principales
│   │   │   ├── dashboard/
│   │   │   ├── accounts/
│   │   │   └── transactions/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/               # Componentes de UI base
│   │   └── shared/           # Componentes compartidos
│   ├── lib/
│   │   ├── actions/          # Server Actions
│   │   ├── repositories/     # Capa de acceso a datos
│   │   ├── validations/      # Schemas de Zod
│   │   ├── types/            # Tipos de TypeScript
│   │   ├── utils/            # Utilidades
│   │   ├── constants/        # Constantes
│   │   └── supabase/         # Cliente de Supabase
│   └── ...
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

## 🎨 Diseño

El diseño sigue la estética de Anthropic.com:
- Minimalista y espacioso
- Paleta de colores cálidos (crema #F5F3EE, terracota #D97757)
- Tipografía limpia (Inter)
- Micro-animaciones sutiles

## 🧪 Testing

```bash
npm run test        # Ejecutar tests
npm run test:watch  # Modo watch
```

## 🔒 Seguridad

- Row Level Security (RLS) habilitado en todas las tablas
- Validación de datos con Zod
- Autenticación requerida en todas las acciones
- Cálculos financieros con Decimal.js para precisión

## 📚 Tecnologías

- **Frontend**: Next.js 14+ (App Router), React, TailwindCSS
- **Backend**: Next.js Server Actions
- **Base de datos**: Supabase (PostgreSQL)
- **Autenticación**: Supabase Auth
- **Validación**: Zod
- **Cálculos**: Decimal.js
- **Fechas**: date-fns

## 🚧 Próximas características (Roadmap)

- [ ] Transacciones recurrentes
- [ ] Tarjetas de crédito
- [ ] Presupuestos mensuales
- [ ] Gestión de préstamos
- [ ] Inversiones
- [ ] Reportes y gráficos
- [ ] PWA y modo offline
- [ ] Notificaciones push

## 📝 Notas

- El proyecto sigue arquitectura feature-based
- TDD (Test-Driven Development) como metodología
- Precisión financiera con Decimal.js (nunca usar números nativos de JS)
- Todos los montos se almacenan como decimal(18,2)

## 🤝 Contribuir

Este es un proyecto en desarrollo activo. Las contribuciones son bienvenidas siguiendo las prácticas establecidas en CLAUDE.md y context.md.

## 📄 Licencia

MIT

---

**Luka** - Tu control financiero personal, simplificado. 💰
