# Sistema de Control Financiero Personal

## Requerimientos Funcionales con Criterios de Aceptación

### 1. Gestión de Usuarios y Autenticación

**Requerimiento 1.1: Autenticación de Usuarios**
- **Descripción**: Sistema de registro e inicio de sesión usando Supabase Auth
- **Criterios de Aceptación**:
  - Usuario puede registrarse con email y contraseña
  - Usuario puede iniciar sesión con credenciales válidas
  - Usuario puede cerrar sesión
  - Usuario puede recuperar contraseña mediante email
  - Sesión persiste entre reinicios de la aplicación (PWA)
  - Datos de cada usuario están aislados y protegidos

---

### 2. Gestión de Cuentas Financieras

**Requerimiento 2.1: Cuentas de Ahorro y Corrientes**
- **Descripción**: Registro y seguimiento de cuentas bancarias operativas
- **Criterios de Aceptación**:
  - Usuario puede crear cuenta con: nombre, banco, tipo (ahorro/corriente), moneda, saldo inicial
  - Usuario puede ver lista de todas sus cuentas
  - Usuario puede editar información de cuenta
  - Usuario puede eliminar cuenta (con confirmación)
  - Saldo se actualiza automáticamente con transacciones
  - Usuario puede marcar cuenta como "activa" o "inactiva"

**Requerimiento 2.2: Tarjetas de Crédito**
- **Descripción**: Gestión de tarjetas de crédito con cálculos automáticos
- **Criterios de Aceptación**:
  - Usuario puede crear tarjeta con: nombre, banco, límite de crédito, tasa de interés anual, cuota de manejo, fecha de corte, fecha de pago, moneda
  - Sistema calcula intereses sobre saldo pendiente mensualmente
  - Sistema calcula cuota de manejo según periodicidad configurada
  - Usuario ve saldo disponible (límite - saldo usado)
  - Usuario ve próxima fecha de pago y monto mínimo
  - Sistema alerta cuando se acerca fecha de pago

**Requerimiento 2.3: Ahorros e Inversiones**
- **Descripción**: Registro flexible de instrumentos de ahorro e inversión
- **Criterios de Aceptación**:
  - Usuario puede crear ahorro/inversión con los siguientes campos base:
    - Nombre/descripción
    - Tipo de instrumento (lista customizable: CDT, Fondo de inversión, Acción, Bono, Criptomoneda, Ahorro programado, Otro)
    - Institución/plataforma
    - Monto invertido
    - Moneda
    - Fecha de inicio
  - Usuario puede agregar campos opcionales según tipo:
    - Fecha de vencimiento
    - Tasa de interés (para registrar, sin cálculo automático)
    - Rendimiento esperado (%)
    - Notas/observaciones adicionales
  - Usuario puede registrar aportes adicionales con fecha
  - Usuario puede registrar retiros parciales con fecha
  - Sistema calcula balance actual (inversión inicial + aportes - retiros)
  - Usuario puede adjuntar documentos relacionados (certificados, contratos, etc.)
  - Usuario puede marcar como "activa" o "liquidada"
  - Usuario puede agregar tags personalizados (ej: "largo plazo", "renta fija", "alto riesgo")
  - Usuario ve lista de todas sus inversiones con filtros por tipo y estado

**Requerimiento 2.4: Soporte Multi-moneda**
- **Descripción**: Todas las cuentas soportan diferentes monedas
- **Criterios de Aceptación**:
  - Sistema soporta al menos: USD, COP, EUR
  - Usuario puede agregar monedas personalizadas
  - Usuario puede definir tasa de cambio entre monedas
  - Dashboard muestra resumen en moneda preferida del usuario
  - Conversiones se realizan usando tasas actuales configuradas
  - Usuario puede actualizar tasas de cambio manualmente

---

### 3. Gestión de Categorías

**Requerimiento 3.1: Categorías de Gastos e Ingresos**
- **Descripción**: Sistema de categorización flexible
- **Criterios de Aceptación**:
  - Usuario puede crear categorías personalizadas
  - Sistema incluye categorías predefinidas (Alimentación, Transporte, Entretenimiento, Salud, etc.)
  - Usuario puede asignar color e ícono a cada categoría
  - Usuario puede editar y eliminar categorías personalizadas
  - Categorías se pueden marcar como "Ingreso" o "Egreso"
  - Usuario puede crear subcategorías

---

### 4. Transacciones (Ingresos y Egresos)

**Requerimiento 4.1: Registro de Transacciones Únicas**
- **Descripción**: Registro de ingresos y egresos esporádicos
- **Criterios de Aceptación**:
  - Usuario puede registrar transacción con: tipo (ingreso/egreso), monto, fecha, categoría, cuenta origen/destino, descripción opcional
  - Usuario puede adjuntar foto de recibo/comprobante
  - Usuario puede marcar transacción como "pagada" o "pendiente"
  - Usuario puede editar transacción antes de marcarla como pagada
  - Usuario puede eliminar transacción

**Requerimiento 4.2: Transacciones Recurrentes**
- **Descripción**: Gastos e ingresos con periodicidad customizable
- **Criterios de Aceptación**:
  - Usuario puede crear transacción recurrente con periodicidad: diaria, semanal, quincenal, mensual, bimestral, trimestral, semestral, anual, personalizada
  - Sistema genera automáticamente transacciones según periodicidad
  - Usuario puede pausar/reanudar recurrencia
  - Usuario puede editar instancia individual sin afectar recurrencia
  - Usuario puede editar recurrencia completa (afecta futuras instancias)
  - Usuario puede definir fecha de finalización de recurrencia

**Requerimiento 4.3: Filtrado y Búsqueda de Transacciones**
- **Descripción**: Herramientas para encontrar transacciones
- **Criterios de Aceptación**:
  - Usuario puede filtrar por: rango de fechas, categoría, cuenta, tipo, estado (pagado/pendiente)
  - Usuario puede buscar por descripción
  - Usuario puede ordenar por: fecha, monto, categoría
  - Usuario puede exportar resultados filtrados

---

### 5. Planificación y Presupuesto Mensual

**Requerimiento 5.1: Creación de Presupuesto Mensual**
- **Descripción**: Planificación de gastos por categoría
- **Criterios de Aceptación**:
  - Usuario puede definir presupuesto mensual por categoría
  - Sistema sugiere presupuesto basado en histórico (meses anteriores)
  - Usuario puede copiar presupuesto de mes anterior
  - Usuario ve progreso de gasto vs presupuesto en tiempo real
  - Sistema alerta cuando se supera 80% del presupuesto de una categoría

**Requerimiento 5.2: Control de Pagos Planificados**
- **Descripción**: Seguimiento de gastos planeados vs ejecutados
- **Criterios de Aceptación**:
  - Usuario ve lista de gastos planificados del mes
  - Usuario puede marcar gastos como "pagados"
  - Sistema muestra qué gastos están pendientes de pago
  - Usuario ve total pagado vs total planificado
  - Sistema muestra próximos pagos (7 días siguientes)

---

### 6. Gestión de Deudas y Préstamos

**Requerimiento 6.1: Préstamos Otorgados (Yo presté)**
- **Descripción**: Registro de dinero prestado a terceros
- **Criterios de Aceptación**:
  - Usuario puede registrar préstamo con: nombre del deudor, monto, fecha, moneda, fecha límite de pago, interés (opcional)
  - Usuario puede marcar como pagado (total o parcial)
  - Sistema muestra lista de préstamos activos
  - Usuario puede agregar pagos parciales con fecha
  - Sistema calcula saldo pendiente automáticamente
  - Usuario puede agregar notas/recordatorios

**Requerimiento 6.2: Préstamos Recibidos (Me prestaron)**
- **Descripción**: Registro de dinero prestado por terceros
- **Criterios de Aceptación**:
  - Usuario puede registrar préstamo con: nombre del acreedor, monto, fecha, moneda, fecha límite de pago, interés (opcional)
  - Usuario puede marcar como pagado (total o parcial)
  - Sistema muestra lista de deudas activas
  - Usuario puede agregar pagos realizados con fecha
  - Sistema calcula saldo pendiente automáticamente
  - Sistema alerta sobre próximos vencimientos

---

### 7. Dashboard y Reportes

**Requerimiento 7.1: Dashboard Principal**
- **Descripción**: Vista general de situación financiera
- **Criterios de Aceptación**:
  - Muestra balance total en moneda preferida
  - Muestra resumen de cuentas (ahorro, crédito, inversiones)
  - Muestra gráfico de gastos por categoría (mes actual)
  - Muestra próximos pagos (7 días)
  - Muestra alertas importantes (vencimientos, sobregiros, etc.)
  - Muestra comparativo ingreso vs egreso del mes
  - Responsive y optimizado para mobile

**Requerimiento 7.2: Reportes Analíticos**
- **Descripción**: Análisis detallado de finanzas
- **Criterios de Aceptación**:
  - Usuario puede generar reporte de ingresos vs egresos por período
  - Usuario puede ver tendencias mensuales (últimos 6-12 meses)
  - Usuario puede ver distribución de gastos por categoría (pie chart)
  - Usuario puede comparar períodos (mes actual vs mes anterior)
  - Usuario puede exportar reportes en PDF
  - Gráficos son interactivos y responsive

---

### 8. PWA (Progressive Web App)

**Requerimiento 8.1: Funcionalidad Offline**
- **Descripción**: Aplicación funcional sin conexión
- **Criterios de Aceptación**:
  - Aplicación se puede instalar en dispositivo móvil/desktop
  - Usuario puede ver datos previamente cargados offline
  - Usuario puede registrar transacciones offline (se sincronizan al reconectar)
  - Aplicación muestra indicador de estado de conexión
  - Service worker cachea assets estáticos

**Requerimiento 8.2: Notificaciones Push**
- **Descripción**: Recordatorios y alertas
- **Criterios de Aceptación**:
  - Usuario puede activar notificaciones
  - Sistema envía recordatorio de próximos pagos
  - Sistema alerta sobre vencimientos de deudas
  - Sistema notifica cuando se supera presupuesto
  - Usuario puede personalizar qué notificaciones recibir

---

### 9. UX/UI - Theme Amigable

**Requerimiento 9.1: Interfaz Intuitiva con shadcn/ui**
- **Descripción**: Diseño limpio y accesible
- **Criterios de Aceptación**:
  - Uso de componentes shadcn/ui consistentes
  - Paleta de colores amigable y accesible (contraste adecuado)
  - Modo claro y oscuro disponibles
  - Iconografía clara y consistente
  - Formularios con validación en tiempo real
  - Feedback visual inmediato en todas las acciones
  - Animaciones sutiles y no invasivas
  - Diseño mobile-first completamente responsive

**Requerimiento 9.2: Onboarding Inicial**
- **Descripción**: Guía para nuevos usuarios
- **Criterios de Aceptación**:
  - Tour inicial explica funcionalidades principales
  - Wizard de configuración inicial (moneda preferida, primera cuenta, categorías)
  - Tooltips contextuales en funciones avanzadas
  - Usuario puede saltear onboarding
  - Usuario puede reactivar tour desde configuración

---

## Stack Tecnológico

- **Frontend**: Next.js 14+ (App Router)
- **Backend**: Next.js Server Actions
- **Base de Datos**: Supabase (PostgreSQL)
- **Autenticación**: Supabase Auth
- **UI Components**: shadcn/ui
- **PWA**: next-pwa
- **Gráficos**: Recharts o Chart.js
- **Validación**: Zod
- **Forms**: React Hook Form

---

## Priorización Sugerida (MVP)

### Fase 1 - Core Funcional (MVP)
1. Autenticación básica
2. Gestión de cuentas de ahorro
3. Registro de transacciones únicas
4. Categorías básicas
5. Dashboard simple
6. Soporte multi-moneda básico

### Fase 2 - Funcionalidades Intermedias
1. Tarjetas de crédito con cálculos
2. Transacciones recurrentes
3. Presupuesto mensual
4. Gestión de deudas (préstamos)
5. Reportes básicos

### Fase 3 - Funcionalidades Avanzadas
1. Ahorros e inversiones completo
2. PWA completa con offline
3. Notificaciones push
4. Reportes avanzados
5. Exportaciones

