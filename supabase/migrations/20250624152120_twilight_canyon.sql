/*
  # Schema inicial para Sistema de Gestión de Inventario

  1. Nuevas Tablas
    - `suppliers` - Información de proveedores
      - `id` (uuid, primary key)
      - `name` (text, nombre del proveedor)
      - `contact` (text, nombre del contacto)
      - `phone` (text, teléfono opcional)
      - `email` (text, email opcional)
      - `address` (text, dirección opcional)
      - `created_at` (timestamp)
    
    - `products` - Productos del inventario
      - `id` (uuid, primary key)
      - `name` (text, nombre del producto)
      - `category` (text, categoría)
      - `current_stock` (numeric, stock actual)
      - `min_stock` (numeric, stock mínimo)
      - `max_stock` (numeric, stock máximo)
      - `unit_price` (numeric, precio unitario)
      - `supplier_id` (uuid, referencia a suppliers)
      - `description` (text, descripción opcional)
      - `sku` (text, código SKU opcional)
      - `unit` (text, unidad de medida)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `sales` - Registro de ventas
      - `id` (uuid, primary key)
      - `product_id` (uuid, referencia a products)
      - `quantity` (numeric, cantidad vendida)
      - `total_value` (numeric, valor total)
      - `sale_date` (timestamp, fecha de venta)
      - `user_id` (uuid, referencia a auth.users)
      - `created_at` (timestamp)

  2. Seguridad
    - Habilitar RLS en todas las tablas
    - Políticas para que usuarios autenticados puedan gestionar sus datos
*/

-- Crear tabla de proveedores
CREATE TABLE IF NOT EXISTS suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact text NOT NULL,
  phone text,
  email text,
  address text,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Crear tabla de productos
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  current_stock numeric NOT NULL DEFAULT 0,
  min_stock numeric NOT NULL DEFAULT 0,
  max_stock numeric NOT NULL DEFAULT 0,
  unit_price numeric NOT NULL DEFAULT 0,
  supplier_id uuid REFERENCES suppliers(id) ON DELETE SET NULL,
  description text,
  sku text,
  unit text NOT NULL DEFAULT 'pieces',
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Crear tabla de ventas
CREATE TABLE IF NOT EXISTS sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  quantity numeric NOT NULL,
  total_value numeric NOT NULL,
  sale_date timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now()
);
-- Create replenishment_requests table
CREATE TABLE IF NOT EXISTS replenishment_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
    requested_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_replenishment_requests_product_id ON replenishment_requests(product_id);
CREATE INDEX IF NOT EXISTS idx_replenishment_requests_supplier_id ON replenishment_requests(supplier_id);
CREATE INDEX IF NOT EXISTS idx_replenishment_requests_status ON replenishment_requests(status);
CREATE INDEX IF NOT EXISTS idx_replenishment_requests_requested_at ON replenishment_requests(requested_at);

-- Enable Row Level Security
ALTER TABLE replenishment_requests ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own replenishment requests" ON replenishment_requests
    FOR SELECT USING (auth.uid() = requested_by);

CREATE POLICY "Users can create replenishment requests" ON replenishment_requests
    FOR INSERT WITH CHECK (auth.uid() = requested_by);

CREATE POLICY "Users can update their own replenishment requests" ON replenishment_requests
    FOR UPDATE USING (auth.uid() = requested_by);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_replenishment_requests_updated_at
    BEFORE UPDATE ON replenishment_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add foreign keys
ALTER TABLE replenishment_requests
ADD CONSTRAINT fk_product
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

ALTER TABLE replenishment_requests
ADD CONSTRAINT fk_supplier
FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE; 
-- Habilitar Row Level Security
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- Políticas para suppliers
CREATE POLICY "Users can manage their own suppliers"
  ON suppliers
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Políticas para products
CREATE POLICY "Users can manage their own products"
  ON products
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Políticas para sales
CREATE POLICY "Users can manage their own sales"
  ON sales
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at en products
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_user_id ON suppliers(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_user_id ON sales(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_product_id ON sales(product_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date);

SELECT
    tc.constraint_name, tc.table_name, kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
WHERE constraint_type = 'FOREIGN KEY' AND tc.table_name='replenishment_requests';

-- Tabla de cierres diarios
CREATE TABLE IF NOT EXISTS day_closings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  total_sales integer NOT NULL,
  total_value numeric NOT NULL,
  closed_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);