-- Add indexes to optimize dashboard queries
-- Run this after adding the date column to commissions table

-- : Using calculated_at instead of date for commissions table
-- Index for employee commissions queries (most frequent)
CREATE INDEX IF NOT EXISTS idx_commissions_employee_date 
ON commissions(employee_id, calculated_at, status);

-- : Using submitted_at instead of submission_date for order_submissions
-- Index for order submissions queries
CREATE INDEX IF NOT EXISTS idx_order_submissions_employee_date 
ON order_submissions(employee_id, submitted_at, approval_status);

-- : Using submitted_at instead of submission_date for cancellation_submissions
-- Index for cancellation submissions queries
CREATE INDEX IF NOT EXISTS idx_cancellation_submissions_employee_date 
ON cancellation_submissions(employee_id, submitted_at, approval_status);

-- Index for slots by date (for streak calculation)
CREATE INDEX IF NOT EXISTS idx_slots_date 
ON slots(slot_date);

-- : Using calculated_at for commission aggregations
-- Composite index for commission aggregations
CREATE INDEX IF NOT EXISTS idx_commissions_status_date 
ON commissions(status, calculated_at) WHERE status = 'approved';

-- Index for employee status and streak
CREATE INDEX IF NOT EXISTS idx_employees_status_streak 
ON employees(status, streak);

COMMENT ON INDEX idx_commissions_employee_date IS 'Optimizes dashboard earnings queries by employee and date range';
COMMENT ON INDEX idx_order_submissions_employee_date IS 'Optimizes dashboard order count queries';
COMMENT ON INDEX idx_cancellation_submissions_employee_date IS 'Optimizes cancellation tracking queries';
