# Sistema de Control de Facturas - Banco

Sistema web para gestionar facturas y controlar comisiones con cálculo automático de IVA.

## Características

- ✅ Gestión de facturas con cálculo automático de comisiones e IVA
- ✅ Soporte para múltiples comercializadoras (con opción de agregar nuevas)
- ✅ Registro de datos del vehículo (completar después de recibir información del banco)
- ✅ Cálculo automático de:
  - Valor fijo según años de servicio (1 año: $208, 2 años: $301, 3 años: $394)
  - Excedente (Valor Total - Valor Fijo)
  - IVA del excedente (15%)
  - Comisión para Valeria
  - IVA de ganancia propia (15% del valor fijo)
  - Total IVA a pagar
- ✅ Reportes por cortes semestrales de IVA
- ✅ Reportes personalizados por período

## Tecnologías

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Firebase (Firestore)

## Configuración Inicial

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar Firebase

1. Crea un proyecto en [Firebase Console](https://console.firebase.google.com/)
2. Habilita Firestore Database
3. Copia las credenciales de tu proyecto Firebase
4. Edita el archivo `src/config/firebase.ts` y reemplaza los valores:

```typescript
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_AUTH_DOMAIN",
  projectId: "TU_PROJECT_ID",
  storageBucket: "TU_STORAGE_BUCKET",
  messagingSenderId: "TU_MESSAGING_SENDER_ID",
  appId: "TU_APP_ID"
};
```

### 3. Reglas de Firestore

Configura las reglas de seguridad en Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /facturas/{document=**} {
      allow read, write: if true; // Por ahora permite todo, ajusta según tus necesidades de seguridad
    }
  }
}
```

### 4. Usuario restringido (Valeria)

Para que Valeria pueda entrar y ver solo la pestaña **Resumen** (con sus filtros):

1. En [Firebase Console](https://console.firebase.google.com/) → tu proyecto → **Authentication** → **Users** → **Add user**.
2. Crea un usuario con:
   - **Email:** `valeria@g.com`
   - **Contraseña:** `val2026`
3. En la app, Valeria puede iniciar sesión con **usuario:** `valeria` o **email:** `valeria@g.com` y **contraseña:** `val2026`. Solo verá Resumen y Cerrar sesión.

### 5. Ejecutar la aplicación

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

## Estructura del Proyecto

```
src/
├── components/          # Componentes React
│   ├── FormFactura.tsx    # Formulario de creación/edición
│   ├── ListaFacturas.tsx  # Lista de facturas
│   └── ReporteIva.tsx     # Reportes de IVA
├── config/             # Configuración
│   └── firebase.ts        # Configuración de Firebase
├── services/           # Servicios
│   └── facturasService.ts # CRUD de facturas
├── types/              # Tipos TypeScript
│   └── index.ts
├── utils/              # Utilidades
│   └── calculos.ts        # Funciones de cálculo
├── App.tsx             # Componente principal
└── main.tsx            # Punto de entrada
```

## Uso

### Crear una Factura

1. Haz clic en "Nueva Factura"
2. Completa los campos requeridos:
   - Comercializadora (puedes agregar nuevas si es necesario)
   - Número de Factura
   - Fecha de Factura
   - Cliente
   - Valor Total
   - Años de Servicio (1, 2 o 3 años)
3. Los valores se calculan automáticamente
4. Opcionalmente, completa los datos del vehículo (puedes hacerlo después)
5. Haz clic en "Crear Factura"

### Editar una Factura

1. En la lista de facturas, haz clic en "Editar"
2. Modifica los campos necesarios
3. Los valores se recalculan automáticamente
4. Haz clic en "Actualizar"

### Ver Reportes de IVA

1. Haz clic en la pestaña "Reportes IVA"
2. Ver los cortes semestrales automáticos
3. Generar reportes personalizados seleccionando un rango de fechas

## Cálculos

El sistema calcula automáticamente:

- **Valor Fijo**: Según años de servicio (ya incluye IVA)
  - 1 año: $208
  - 2 años: $301
  - 3 años: $394

- **Excedente**: `Valor Total - Valor Fijo`

- **IVA Excedente**: `Excedente × 15%`

- **Comisión Val**: `Valor Total - Valor Fijo - IVA Excedente`

- **IVA Ganancia Propia**: `Valor Fijo × 15%`

- **Total IVA**: `IVA Ganancia Propia + IVA Excedente`

## Despliegue

### Firebase Hosting

```bash
npm run build
firebase init hosting
# Selecciona 'dist' como directorio público
firebase deploy --only hosting
```

## Licencia

Propietario - Halconsoft
