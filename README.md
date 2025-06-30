# Sistema de Inventario

Un sistema de gestión de inventario desarrollado con React, TypeScript y Supabase.

## Configuración para GitHub Pages

### 1. Configurar el repositorio

1. Crea un repositorio en GitHub con el nombre `project` (o el nombre que prefieras)
2. Sube tu código al repositorio

### 2. Actualizar la configuración

Antes de hacer deploy, actualiza estos archivos con tu información:

#### En `vite.config.ts`:
```typescript
base: '/tu-nombre-repositorio/', // Cambia por el nombre real de tu repositorio
```

#### En `package.json`:
```json
"homepage": "https://tu-usuario.github.io/tu-nombre-repositorio"
```

### 3. Hacer deploy

```bash
# Instalar dependencias
npm install

# Hacer build y deploy
npm run deploy
```

### 4. Configurar GitHub Pages

1. Ve a tu repositorio en GitHub
2. Ve a Settings > Pages
3. En "Source", selecciona "Deploy from a branch"
4. Selecciona la rama `gh-pages` y la carpeta `/ (root)`
5. Haz clic en "Save"

Tu aplicación estará disponible en: `https://tu-usuario.github.io/tu-nombre-repositorio`

## Desarrollo local

```bash
npm install
npm run dev
```

## Estructura del proyecto

- `src/components/` - Componentes de React
- `src/contexts/` - Contextos de React
- `src/hooks/` - Hooks personalizados
- `src/lib/` - Configuración de librerías
- `src/types/` - Definiciones de tipos TypeScript

## Tecnologías utilizadas

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Supabase
- Lucide React 

## Integración con n8n y WhatsApp (Twilio)

Para enviar mensajes automáticos por WhatsApp al crear una solicitud de reabastecimiento:

1. Crea un workflow en n8n Cloud que reciba un webhook (POST) y use Twilio para enviar el mensaje de WhatsApp.
2. Obtén la URL del webhook de n8n y configúrala en tu entorno local o de producción:

```
VITE_N8N_WEBHOOK_URL=https://tu-n8n-url/webhook/whatsapp-replenishment
```

3. El sistema enviará automáticamente los datos de la solicitud a ese webhook cada vez que se cree una solicitud de reabastecimiento.

El payload enviado será:

```
{
  type: 'single' | 'multi',
  request: { ... } | undefined, // para solicitudes simples
  requests: [ ... ] | undefined, // para solicitudes múltiples
  profile: { ... }, // datos del local
  adminPhone: string // puedes ajustar el campo si tienes el teléfono del admin
}
```

El workflow de n8n debe procesar estos datos y usar Twilio para enviar el mensaje de WhatsApp al proveedor correspondiente. 