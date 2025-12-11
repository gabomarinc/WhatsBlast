# HumanFlow - Web App de Prospección Emocional

Esta aplicación conecta Google Sheets con WhatsApp Web utilizando un diseño emocional centrado en el humano.

## 🚀 Cómo Desplegar en Google Apps Script

Esta es una aplicación React que, para producción, se recomienda compilar a un solo archivo HTML o alojar en un hosting estático que consuma el script de Google como API.

**Opción Simplificada (Copiar y Pegar):**

1. **Google Sheet:**
   - Crea una nueva Hoja de Cálculo.
   - Renombra una pestaña como `Prospectos`.
   - Crea la primera fila con encabezados: `nombre`, `apellido`, `telefono`, `empresa`, `estado`.
   - Añade datos de prueba.

2. **Apps Script:**
   - Ve a `Extensiones > Apps Script`.
   - Borra el contenido de `Code.gs`.
   - Copia el contenido del archivo `backend/Code.gs` de este proyecto.
   - Crea un archivo HTML llamado `index.html`.
   - **IMPORTANTE:** Para que funcione dentro de Apps Script directamente sin build steps complejos, deberías copiar el contenido del `index.html` generado por el build de React dentro de ese archivo. 
   - *Nota:* Como este proyecto es React, la forma más fácil de probarlo es ejecutando el frontend localmente (npm start) que usará datos "Mock" (falsos) definidos en `services/dataService.ts`.

3. **Para conectar Frontend Local con Backend Real:**
   - Deberías modificar `services/dataService.ts` para usar `google.script.run` si estás embebido, o `fetch` si publicas el script como API Ejecutable.

## 🧠 Filosofía de Diseño

- **Visceral:** Colores suaves (Indigo/Slate), sombras suaves, espacios amplios.
- **Conductual:** Flujo lineal (Conectar -> Editar -> Enviar).
- **Reflexivo:** Mensajes de confirmación que elogian al usuario ("Mensaje preparado 🎯").

## 🛠 Desarrollo Local

1. `npm install`
2. `npm start`
3. La app iniciará en "Modo Demo" con datos simulados para que puedas probar la UX inmediatamente.