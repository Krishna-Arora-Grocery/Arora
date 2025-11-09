-- Add payment tracking fields to commissions table
ALTER TABLE commissions
ADD COLUMN IF NOT EXISTS payment_period INT, -- 1, 2, or 3 for the 10-day period
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'paid'
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS paid_by UUID REFERENCES employees(id);

-- Create index for payment queries
CREATE INDEX IF NOT EXISTS idx_commissions_payment_period ON commissions(employee_id, payment_period, date);
CREATE INDEX IF NOT EXISTS idx_commissions_payment_status ON commissions(payment_status);

COMMENT ON COLUMN commissions.payment_period IS 'Which 10-day period of the month (1-10, 11-20, 21-30/31)';
COMMENT ON COLUMN commissions.payment_status IS 'Whether payment has been sent: pending or paid';
COMMENT ON COLUMN commissions.paid_at IS 'When admin marked this commission as paid';
COMMENT ON COLUMN commissions.paid_by IS 'Admin who marked this commission as paid';
