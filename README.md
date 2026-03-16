# NOVA × Loyverse — Deploy en Vercel

## Estructura del proyecto

```
nova-loyverse-vercel/
├── api/
│   └── dashboard.js   ← Serverless Function (el backend)
├── vercel.json        ← Configuración de Vercel
└── package.json
```

---

## 🚀 Cómo subir a Vercel (sin código, desde el navegador)

### Opción A — Subir directo desde GitHub (recomendado)

1. **Crear repositorio en GitHub**
   - Ir a https://github.com/new
   - Nombre: `nova-loyverse`
   - Crear repositorio vacío

2. **Subir los archivos**
   - Arrastra los 3 archivos al repositorio de GitHub:
     - `api/dashboard.js`
     - `vercel.json`
     - `package.json`

3. **Conectar con Vercel**
   - Ir a https://vercel.com → "Add New Project"
   - Seleccionar el repositorio `nova-loyverse`
   - Clic en **Deploy** (sin cambiar nada)

4. **Agregar el token de Loyverse**
   - En Vercel: **Settings → Environment Variables**
   - Agregar:
     ```
     Name:  LOYVERSE_TOKEN
     Value: b46875e880e94ee69ce3160d1c7670f6
     ```
   - Clic en **Save**
   - Ir a **Deployments → Redeploy** para que tome el token

5. **Copiar tu URL**
   - Vercel te da una URL como: `https://nova-loyverse.vercel.app`
   - Tu endpoint queda en: `https://nova-loyverse.vercel.app/api/dashboard`

---

### Opción B — Vercel CLI (desde terminal)

```bash
# Instalar Vercel CLI
npm install -g vercel

# Entrar a la carpeta del proyecto
cd nova-loyverse-vercel

# Desplegar (te guía paso a paso)
vercel

# Agregar el token como variable de entorno
vercel env add LOYVERSE_TOKEN
# Pegar: b46875e880e94ee69ce3160d1c7670f6
# Seleccionar: Production + Preview + Development

# Redesplegar para que tome las variables
vercel --prod
```

---

## 🔗 Actualizar el dashboard

Una vez que tengas la URL de Vercel, actualiza el dashboard.
Busca esta línea en `App.jsx`:

```js
// ANTES (backend local)
const API_BASE = "http://localhost:3001/api";

// DESPUÉS (Vercel)
const API_BASE = "https://TU-PROYECTO.vercel.app/api";
```

---

## ✅ Verificar que funciona

Abre en el navegador:
```
https://TU-PROYECTO.vercel.app/api/dashboard
```

Deberías ver un JSON con los datos de tu tienda.

---

## 🔑 Renovar el token

Si el token de Loyverse vence:
1. **Loyverse → Configuración → Integraciones → API Tokens**
2. Generar nuevo token
3. En **Vercel → Settings → Environment Variables** actualizar `LOYVERSE_TOKEN`
4. Hacer Redeploy
