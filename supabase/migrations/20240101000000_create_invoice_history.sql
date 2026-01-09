-- supabase/migrations/20240101000000_create_invoice_history.sql
-- Migration to create invoice history tracking table

-- Create invoice_history table
CREATE TABLE IF NOT EXISTS invoice_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL CHECK (action IN ('created', 'updated', 'status_changed', 'viewed', 'sent', 'paid', 'deleted')),
  previous_data JSONB,
  new_data JSONB,
  status_from VARCHAR(50),
  status_to VARCHAR(50),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_invoice_history_invoice_id ON invoice_history(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_history_user_id ON invoice_history(user_id);
CREATE INDEX IF NOT EXISTS idx_invoice_history_created_at ON invoice_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invoice_history_action ON invoice_history(action);

-- Create a function to automatically track invoice changes
CREATE OR REPLACE FUNCTION track_invoice_change()
RETURNS TRIGGER AS $$
DECLARE
  history_action VARCHAR(50);
  old_status VARCHAR(50);
  new_status VARCHAR(50);
BEGIN
  -- Determine the action type
  IF TG_OP = 'INSERT' THEN
    history_action := 'created';
    old_status := NULL;
    new_status := NEW.status;
    -- Store the new invoice data
    INSERT INTO invoice_history (invoice_id, user_id, action, new_data, status_to, created_at)
    VALUES (NEW.id, NEW.user_id, history_action, to_jsonb(NEW), new_status, NOW());
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Check if status changed
    IF OLD.status != NEW.status THEN
      history_action := 'status_changed';
      old_status := OLD.status;
      new_status := NEW.status;
      INSERT INTO invoice_history (invoice_id, user_id, action, previous_data, new_data, status_from, status_to, created_at)
      VALUES (NEW.id, NEW.user_id, history_action, to_jsonb(OLD), to_jsonb(NEW), old_status, new_status, NOW());
    ELSE
      history_action := 'updated';
      INSERT INTO invoice_history (invoice_id, user_id, action, previous_data, new_data, created_at)
      VALUES (NEW.id, NEW.user_id, history_action, to_jsonb(OLD), to_jsonb(NEW), NOW());
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    history_action := 'deleted';
    INSERT INTO invoice_history (invoice_id, user_id, action, previous_data, created_at)
    VALUES (OLD.id, OLD.user_id, history_action, to_jsonb(OLD), NOW());
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS track_invoice_change_trigger ON invoices;

-- Create the trigger
CREATE TRIGGER track_invoice_change_trigger
AFTER INSERT OR UPDATE OR DELETE ON invoices
FOR EACH ROW EXECUTE FUNCTION track_invoice_change();

-- Enable Row Level Security on invoice_history
ALTER TABLE invoice_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for invoice_history
CREATE POLICY IF NOT EXISTS "Users can view their own invoice history"
  ON invoice_history
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "System can insert invoice history"
  ON invoice_history
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "System can update invoice history"
  ON invoice_history
  FOR UPDATE
  USING (true);

COMMENT ON TABLE invoice_history IS 'Stores audit trail of all changes made to invoices';
COMMENT ON FUNCTION track_invoice_change() IS 'Automatically tracks invoice changes in history table';
