# HumanFlow - Web App de Prospección Emocional

Esta aplicación te permite cargar prospectos desde un archivo Excel y conectarlos con WhatsApp Web, utilizando un diseño emocional centrado en el humano.

## 🚀 Cómo Usar

Esta es una aplicación Client-Side.

1. **Prepara tu Excel:**
   - Asegúrate de tener un archivo `.xlsx` o `.csv`.
   - Debe tener encabezados en la primera fila (ej: `Nombre`, `Teléfono`, `Empresa`).

2. **Carga el archivo:**
   - Arrastra tu archivo a la pantalla de inicio.

3. **Configura:**
   - Selecciona la hoja (tab) y mapea las columnas.

4. **Prospecta:**
   - Envía mensajes personalizados por WhatsApp.

## 🔐 Configuración de Base de Datos (Neon)

Para que la persistencia de datos funcione, necesitas configurar la conexión a Neon PostgreSQL.

### 1. Entorno Local (Desarrollo)
1. Crea un archivo llamado `.env` en la raíz del proyecto.
2. Agrega tu cadena de conexión (Connection String) de Neon:

```env
VITE_DATABASE_URL=postgres://usuario:password@endpoint.neon.tech/neondb?sslmode=require
```

**⚠️ ADVERTENCIA DE SEGURIDAD:** 
Al usar `VITE_`, esta variable se empaqueta en el código Javascript del navegador. 
- **Es aceptable** para prototipos, demos locales o herramientas internas en redes seguras.
- **NO es seguro** para aplicaciones públicas en producción, ya que cualquiera puede ver la credencial en la consola del navegador.

### 2. Para Producción Segura
Si vas a desplegar esto públicamente y necesitas proteger tu base de datos:
1. No uses `NeonService` directamente en el frontend.
2. Implementa una **API Intermedia** (Backend Proxy).
3. Crea un endpoint (ej: Vercel Function) que reciba los datos del frontend y sea el único que tenga acceso a `DATABASE_URL` (sin el prefijo `VITE_`).

## 🛠 Desarrollo Local

1. `npm install`
2. `npm run dev`
3. Abre `http://localhost:5173`

## 📦 Despliegue

Simplemente conecta este repositorio a **Vercel** o **Netlify**. 
Recuerda agregar la variable de entorno `VITE_DATABASE_URL` en el panel de configuración de tu proveedor de hosting.
