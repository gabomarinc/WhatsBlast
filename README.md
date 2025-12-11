# HumanFlow - Web App de Prospección Emocional

Esta aplicación te permite cargar prospectos desde un archivo Excel y conectarlos con WhatsApp Web, utilizando un diseño emocional centrado en el humano.

## 🚀 Cómo Usar

Esta es una aplicación 100% Client-Side. No envía tus datos a ningún servidor, todo el procesamiento del archivo Excel ocurre en tu navegador.

1. **Prepara tu Excel:**
   - Asegúrate de tener un archivo `.xlsx` o `.csv`.
   - Debe tener encabezados en la primera fila (ej: `Nombre`, `Teléfono`, `Empresa`).
   - El sistema detectará automáticamente las columnas, pero podrás confirmar cuál es cuál.

2. **Carga el archivo:**
   - Arrastra tu archivo a la pantalla de inicio.

3. **Configura:**
   - Selecciona la hoja (tab) donde están los datos.
   - Confirma qué columna es el **Nombre** y cuál es el **Teléfono**.

4. **Prospecta:**
   - Edita tu mensaje base usando variables como `{{Nombre}}` o `{{Empresa}}`.
   - Haz clic en enviar para abrir WhatsApp Web con el mensaje listo.

## 🧠 Filosofía de Diseño

- **Visceral:** Colores suaves (Indigo/Slate), sombras suaves, espacios amplios.
- **Conductual:** Flujo lineal (Cargar Archivo -> Mapear -> Enviar).
- **Reflexivo:** Mensajes de confirmación que elogian al usuario ("Mensaje preparado 🎯").

## 🛠 Desarrollo Local

1. `npm install`
2. `npm run dev`
3. Abre `http://localhost:5173`

## 📦 Despliegue

Simplemente conecta este repositorio a **Vercel** o **Netlify**. No requiere configuración de servidor ni API keys.