# Reglas de Firestore con Autenticación

Copia y pega estas reglas en la pestaña "Reglas" de Firestore en Firebase Console.

## Reglas Seguras con Autenticación (RECOMENDADO)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /facturas/{facturaId} {
      // Solo usuarios autenticados pueden leer y escribir
      allow read, write: if request.auth != null;
    }
  }
}
```

## Reglas con Validación de Datos + Autenticación (MÁS SEGURO)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /facturas/{facturaId} {
      // Solo usuarios autenticados pueden leer
      allow read: if request.auth != null;
      
      // Solo usuarios autenticados pueden crear, con validación de campos requeridos
      allow create: if request.auth != null 
        && request.resource.data.keys().hasAll([
          'comercializadora',
          'numeroFactura',
          'valorTotal',
          'anosServicio',
          'fechaFactura',
          'cliente',
          'valorFijo',
          'excedente',
          'ivaExcedente',
          'comisionVal',
          'ivaGananciaPropia',
          'totalIva',
          'createdAt',
          'updatedAt'
        ])
        && request.resource.data.valorTotal is number
        && request.resource.data.anosServicio in [1, 2, 3];
      
      // Solo usuarios autenticados pueden actualizar
      allow update: if request.auth != null
        && request.resource.data.updatedAt is timestamp;
      
      // Solo usuarios autenticados pueden eliminar
      allow delete: if request.auth != null;
    }
  }
}
```

## Cómo Aplicar las Reglas

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto `banco-bf50b`
3. Ve a **Firestore Database**
4. Haz clic en la pestaña **"Reglas"**
5. Pega una de las reglas de arriba (recomiendo la primera para empezar)
6. Haz clic en **"Publicar"**

## Habilitar Autenticación en Firebase

1. En Firebase Console, ve a **Authentication**
2. Haz clic en **"Comenzar"** o **"Get started"**
3. Habilita el proveedor **"Correo electrónico/Contraseña"**
4. Activa **"Correo electrónico/Contraseña"** y guarda

¡Listo! Ahora tu aplicación requiere autenticación para acceder a las facturas.
