-- Create transfers table
CREATE TABLE IF NOT EXISTS transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ref VARCHAR(50) UNIQUE,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  from_warehouse_id INTEGER REFERENCES warehouses(id),
  to_warehouse_id INTEGER REFERENCES warehouses(id),
  total_products INTEGER DEFAULT 0,
  order_tax NUMERIC(10, 2) DEFAULT 0,
  discount NUMERIC(10, 2) DEFAULT 0,
  shipping NUMERIC(10, 2) DEFAULT 0,
  grand_total NUMERIC(10, 2) DEFAULT 0,
  notes TEXT,
  details TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create transfer_items table
CREATE TABLE IF NOT EXISTS transfer_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id UUID REFERENCES transfers(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  qty INTEGER NOT NULL,
  net_unit_cost NUMERIC(10, 2) NOT NULL,
  discount NUMERIC(10, 2) DEFAULT 0,
  tax NUMERIC(10, 2) DEFAULT 0,
  subtotal NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sequence for transfer reference numbers
CREATE SEQUENCE IF NOT EXISTS transfer_ref_seq START 1;

-- Function to generate transfer reference numbers
CREATE OR REPLACE FUNCTION generate_transfer_ref()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ref IS NULL THEN
    NEW.ref := 'TR_' || LPAD(NEXTVAL('transfer_ref_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate reference numbers
DROP TRIGGER IF EXISTS generate_transfer_ref_trigger ON transfers;
CREATE TRIGGER generate_transfer_ref_trigger
  BEFORE INSERT ON transfers
  FOR EACH ROW
  EXECUTE FUNCTION generate_transfer_ref();

-- Function to update total_products count
CREATE OR REPLACE FUNCTION update_transfer_totals()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE transfers 
    SET 
      total_products = (
        SELECT COUNT(*) 
        FROM transfer_items 
        WHERE transfer_id = NEW.transfer_id
      ),
      grand_total = (
        SELECT COALESCE(SUM(subtotal), 0) + COALESCE(order_tax, 0) + COALESCE(shipping, 0) - COALESCE(discount, 0)
        FROM transfer_items 
        WHERE transfer_id = NEW.transfer_id
      )
    WHERE id = NEW.transfer_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE transfers 
    SET 
      total_products = (
        SELECT COUNT(*) 
        FROM transfer_items 
        WHERE transfer_id = OLD.transfer_id
      ),
      grand_total = (
        SELECT COALESCE(SUM(subtotal), 0) + COALESCE(order_tax, 0) + COALESCE(shipping, 0) - COALESCE(discount, 0)
        FROM transfer_items 
        WHERE transfer_id = OLD.transfer_id
      )
    WHERE id = OLD.transfer_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update totals
DROP TRIGGER IF EXISTS update_transfer_totals_trigger ON transfer_items;
CREATE TRIGGER update_transfer_totals_trigger
  AFTER INSERT OR UPDATE OR DELETE ON transfer_items
  FOR EACH ROW
  EXECUTE FUNCTION update_transfer_totals();

-- Create view for transfers with warehouse names
CREATE OR REPLACE VIEW transfers_with_details AS
SELECT 
  t.id,
  t.ref,
  t.date,
  t.from_warehouse_id,
  t.to_warehouse_id,
  fw.name as from_warehouse_name,
  tw.name as to_warehouse_name,
  t.total_products,
  t.order_tax,
  t.discount,
  t.shipping,
  t.grand_total,
  t.notes,
  t.details,
  t.status,
  t.created_at,
  t.updated_at
FROM transfers t
LEFT JOIN warehouses fw ON t.from_warehouse_id = fw.id
LEFT JOIN warehouses tw ON t.to_warehouse_id = tw.id;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_transfers_date ON transfers(date);
CREATE INDEX IF NOT EXISTS idx_transfers_from_warehouse ON transfers(from_warehouse_id);
CREATE INDEX IF NOT EXISTS idx_transfers_to_warehouse ON transfers(to_warehouse_id);
CREATE INDEX IF NOT EXISTS idx_transfers_ref ON transfers(ref);
CREATE INDEX IF NOT EXISTS idx_transfer_items_transfer ON transfer_items(transfer_id);
CREATE INDEX IF NOT EXISTS idx_transfer_items_product ON transfer_items(product_id);
