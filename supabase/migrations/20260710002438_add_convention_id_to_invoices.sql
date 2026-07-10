ALTER TABLE invoices ADD COLUMN convention_id uuid REFERENCES conventions(id);
