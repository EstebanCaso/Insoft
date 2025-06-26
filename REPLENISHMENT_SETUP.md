# Configuración del Sistema de Reabastecimiento

Este documento explica cómo configurar el sistema de reabastecimiento automático con n8n para manejar alertas de bajo stock.

## Características Implementadas

### 1. Alertas de Bajo Stock
- **Detección automática**: El sistema detecta automáticamente cuando un producto tiene stock bajo o está agotado
- **Indicadores visuales**: Los productos con bajo stock se muestran con iconos de alerta en la tabla de inventario
- **Botón de reabastecimiento**: Aparece automáticamente para productos con bajo stock

### 2. Modal de Solicitud de Reabastecimiento
- **Información completa**: Muestra detalles del producto y proveedor
- **Cantidades sugeridas**: Ofrece opciones predefinidas basadas en el stock mínimo y máximo
- **Cálculo automático**: Calcula el costo total estimado de la solicitud
- **Validación**: Asegura que la cantidad solicitada sea válida

### 3. Gestión de Solicitudes
- **Nueva pestaña**: "Reabastecimiento" en el sidebar para gestionar todas las solicitudes
- **Estados de solicitud**: Pendiente, Aprobada, Rechazada, Completada
- **Acciones**: Aprobar, rechazar o marcar como completada las solicitudes
- **Historial**: Mantiene un registro completo de todas las solicitudes

### 4. Integración con n8n
- **Webhook automático**: Envía notificaciones automáticas cuando se crea una solicitud
- **Notificaciones múltiples**: Telegram y email al proveedor
- **Datos estructurados**: Incluye toda la información necesaria para el proveedor

## Configuración de n8n

### 1. Instalación de n8n
```bash
# Instalar n8n globalmente
npm install -g n8n

# O usar Docker
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```

### 2. Configurar el Workflow
1. Abre n8n en tu navegador (http://localhost:5678)
2. Crea un nuevo workflow
3. Importa el archivo `n8n-workflow.json` o crea el workflow manualmente

### 3. Configurar Variables de Entorno
Agrega las siguientes variables a tu archivo `.env`:

```env
# URL del webhook de n8n
VITE_N8N_WEBHOOK_URL=https://estebancaso.app.n8n.cloud/workflow/g6qJPkwwSRPfk9ug

# Configuración de Telegram (opcional)
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_chat_id

# Configuración de email (opcional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

### 4. Configurar Notificaciones

#### Telegram
1. Crea un bot con @BotFather en Telegram
2. Obtén el token del bot
3. Obtén el chat ID donde quieres recibir las notificaciones
4. Actualiza las variables en el workflow de n8n

#### Email
1. Configura un servidor SMTP (Gmail, Outlook, etc.)
2. Actualiza las credenciales en el workflow de n8n
3. Asegúrate de que los proveedores tengan emails válidos

## Uso del Sistema

### 1. Detectar Bajo Stock
- Los productos con stock bajo se muestran con un icono de alerta amarillo
- Los productos agotados se muestran con un icono de alerta rojo
- El botón de carrito de compras aparece automáticamente

### 2. Solicitar Reabastecimiento
1. Haz clic en el icono de carrito de compras en la fila del producto
2. Revisa la información del producto y proveedor
3. Selecciona la cantidad a solicitar (usa las sugerencias o ingresa manualmente)
4. Revisa el resumen de la solicitud
5. Haz clic en "Enviar Solicitud"

### 3. Gestionar Solicitudes
1. Ve a la pestaña "Reabastecimiento"
2. Revisa todas las solicitudes pendientes
3. Aproba o rechaza las solicitudes según corresponda
4. Marca como completadas cuando llegue el producto

### 4. Notificaciones Automáticas
- **Telegram**: Recibirás notificaciones instantáneas con todos los detalles
- **Email**: Los proveedores recibirán emails automáticos con la solicitud
- **Seguimiento**: Puedes hacer seguimiento del estado de cada solicitud

## Estructura de la Base de Datos

### Tabla: replenishment_requests
```sql
CREATE TABLE IF NOT EXISTS replenishment_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL,
    status TEXT DEFAULT 'pending',
    requested_by UUID REFERENCES auth.users(id),
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE replenishment_requests
ADD CONSTRAINT fk_product
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

ALTER TABLE replenishment_requests
ADD CONSTRAINT fk_supplier
FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE;
```

## Flujo de Trabajo

1. **Detección**: El sistema detecta automáticamente productos con bajo stock
2. **Solicitud**: El usuario crea una solicitud de reabastecimiento
3. **Notificación**: n8n recibe la solicitud y envía notificaciones
4. **Aprobación**: El administrador aprueba o rechaza la solicitud
5. **Seguimiento**: Se hace seguimiento hasta que se complete la entrega

## Personalización

### Modificar Cantidades Sugeridas
En `ReplenishmentModal.tsx`, línea 32:
```typescript
const suggestedQuantities = [
  product.minStock * 2,        // 2x stock mínimo
  product.minStock * 3,        // 3x stock mínimo
  product.maxStock - product.currentStock,  // Llenar al máximo
  product.maxStock             // Stock máximo
].filter(q => q > 0);
```

### Modificar Criterios de Bajo Stock
En `InventoryTable.tsx`, función `getStockStatus`:
```typescript
const getStockStatus = (product: Product) => {
  if (product.currentStock <= 0) {
    return { status: 'out', color: 'text-red-600', bg: 'bg-gradient-to-r from-red-50 to-red-100' };
  } else if (product.currentStock <= product.minStock) {
    return { status: 'low', color: 'text-yellow-600', bg: 'bg-gradient-to-r from-yellow-50 to-orange-50' };
  } else {
    return { status: 'good', color: 'text-green-600', bg: 'bg-gradient-to-r from-green-50 to-emerald-50' };
  }
};
```

## Solución de Problemas

### Error: "N8N webhook URL no configurada"
- Asegúrate de que `VITE_N8N_WEBHOOK_URL` esté configurado en tu archivo `.env`
- Verifica que n8n esté ejecutándose y el webhook esté activo

### Error: "Usuario no autenticado"
- Verifica que el usuario esté logueado en la aplicación
- Revisa las políticas de RLS en Supabase

### Las notificaciones no llegan
- Verifica la configuración de Telegram/Email en n8n
- Revisa los logs de n8n para errores
- Asegúrate de que el workflow esté activo

## Próximas Mejoras

- [ ] Integración con sistemas de inventario externos
- [ ] Notificaciones push en la aplicación
- [ ] Dashboard de análisis de reabastecimiento
- [ ] Integración con sistemas de facturación
- [ ] Automatización de órdenes de compra
- [ ] Reportes de tendencias de reabastecimiento 