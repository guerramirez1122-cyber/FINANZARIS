# Integración de Datos en Tiempo Real con Firestore & Seguridad Estricta Familiar

Plan de integración para conectar **FamilyLedger** a la base de datos Firestore en la nube (`ai-studio-familyledgeraiti-f1a7d005-9513-4c30-9d35-c94b456f9a67`) con sincronización bidireccional en tiempo real y reglas de seguridad de acceso exclusivo para ustedes dos (`guerramirez1122@gmail.com` y su pareja/co-administrador).

## Decisiones Confirmadas y Preguntas Abiertas

> [!IMPORTANT]
> **Decisiones Confirmadas:**
> 1. **Tipo de integración:** Base de datos Firestore con sincronización en tiempo real (`onSnapshot`) para gastos, categorías, deudas y presupuestos.
> 2. **Modelo de acceso y seguridad:** Acceso exclusivo y estricto para ustedes dos ("Seguridad, seguridad, seguridad"). Solo los dos correos autorizados podrán leer o escribir datos en la nube.
>
> **Decisión de Arquitectura Recomendada:**
> - **Acceso Híbrido Seguro (Zero-Leak Sandbox):** La aplicación carga inmediatamente en modo local/pruebas con datos de muestra para navegar fluidamente, pero los datos reales en Firestore se protegen criptográficamente mediante Google Auth y reglas `firestore.rules` que verifican `request.auth.token.email` contra la lista blanca estricta de 2 miembros.

---

## 1. Visión General & Modelo de Seguridad

- **Propósito:** Proporcionar una experiencia en tiempo real donde cualquier gasto registrado, ticket escaneado o ajuste en la avalancha de deudas se refleje instantáneamente en los teléfonos de ambos miembros.
- **Defensa en Profundidad (Zero-Trust):**
  - **Identidad Verificada:** Google Sign-In con token verificado (`request.auth.token.email_verified == true`).
  - **Lista Blanca de 2 Miembros:** Acceso a la colección familiar restringido a `guerramirez1122@gmail.com` y un segundo correo designado configurable por el usuario principal.
  - **Default Deny:** Regla raíz `match /{document=**} { allow read, write: if false; }` que bloquea cualquier intento de lectura o escritura de terceros.
  - **Manejo Estructurado de Errores:** Interceptor `handleFirestoreError` conforme a los estándares de auditoría de seguridad para registrar diagnósticos claros.

---

## 2. Experiencia de Usuario & Flujos de Datos

```
┌─────────────────────────────────────────────────────────────────┐
│                    FamilyLedger PWA (Móvil)                     │
│                                                                 │
│  ┌───────────────────────┐             ┌─────────────────────┐  │
│  │ Modo Seguro Firestore │ ◄─────────► │ Modo Pruebas Local  │  │
│  │ (2 Correos Exclusivos)│  onSnapshot │ (Sin Cuenta / Demo) │  │
│  └──────────┬────────────┘             └─────────────────────┘  │
└─────────────┼───────────────────────────────────────────────────┘
              │ SSL / gRPC
              ▼
┌─────────────────────────────────────────────────────────────────┐
│      Firestore Database: ai-studio-familyledgeraiti-...         │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐  │
│  │   tickets    │  │  categories  │  │         debts         │  │
│  │ (Gastos/OCR) │  │ (Presupuesto)│  │ (Avalancha Multidiv.) │  │
│  └──────────────┘  └──────────────┘  └───────────────────────┘  │
│                                                                 │
│  🔒 firestore.rules: Solo guerramirez1122@gmail.com y Pareja    │
└─────────────────────────────────────────────────────────────────┘
```

### Flujo de Acceso para los Dos Usuarios:
1. **Inicio Inmediato:** La aplicación abre al instante sin pantallas de bloqueo obligatorias, permitiendo explorar la interfaz y probar funcionalidades.
2. **Badge de Seguridad en Ajustes:** Un indicador visual ("🔒 Bóveda Familiar Protegida") muestra el estado de conexión con Firestore y los correos autorizados.
3. **Inicio de Sesión en 1 Clic:** Con un solo toque en "Vincular Bóveda Segura", el usuario inicia sesión con Google. Si el correo coincide con uno de los dos autorizados, la sincronización en vivo se activa en milisegundos.
4. **Sincronización Bidireccional en Vivo:** Cuando uno de ustedes suba un ticket o registre una deuda, el teléfono del otro se actualiza automáticamente vía WebSockets/gRPC sin tener que recargar.

---

## 3. Decisiones Técnicas y Reglas de Seguridad

### Estructura de Colecciones en Firestore:
- `/households/family_default/tickets/{ticketId}`: Tickets de gastos con montos, comercio, fecha, miembro pagador y estado de auditoría.
- `/households/family_default/categories/{categoryId}`: Límites de presupuesto mensual y colores.
- `/households/family_default/debts/{debtId}`: Deudas bimonetarias (ARS/EUR), tasas y cálculo de avalancha.
- `/households/family_default/plan/settings`: Plan financiero, metas de ahorro y configuración de miembros.
- `/households/family_default/config/authorized_users`: Documento con los 2 correos autorizados.

### Matriz de Reglas de Seguridad (`firestore.rules`):
- Validación de correo verificado mediante `request.auth.token.email in ['guerramirez1122@gmail.com', secondaryEmail]`.
- Esquema estricto: Validación de tipos numéricos y límites de texto (`isValidTicket`, `isValidDebt`, etc.) para evitar inyecciones de datos no estructurados.
- Inmutabilidad de identificadores y marcas de tiempo (`createdAt == request.time`).

---

## 4. Plan de Ejecución Paso a Paso

1. **Configuración de Firestore & Blueprint (`firebase-blueprint.json`):**
   - Definir el esquema JSON estricto para tickets, deudas, categorías y plan familiar.
2. **Despliegue de Reglas de Seguridad (`firestore.rules`):**
   - Redactar y validar las reglas con la restricción de los 2 correos autorizados.
   - Desplegar las reglas mediante `DeployRules`.
3. **Servicio de Sincronización en Tiempo Real (`src/services/firestoreSync.ts`):**
   - Configurar listeners `onSnapshot` con reconexión automática y soporte offline de Firestore.
   - Implementar el interceptor de errores `handleFirestoreError`.
4. **Integración en la UI & Panel de Control de Seguridad:**
   - Añadir en `SettingsView` la gestión del segundo correo autorizado y el estado de la sincronización en la nube.
   - Sincronizar el estado de React con Firestore de manera transparente para el usuario.
5. **Verificación y Pruebas:**
   - Validar compilación (`compile_applet`) y pruebas de conexión activa.
