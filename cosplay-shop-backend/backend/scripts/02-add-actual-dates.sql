-- ============================================
-- MIGRATION: Add Expected & Actual Dates
-- File: backend/database/migrations/02-add-actual-dates.sql
-- ============================================

BEGIN;

-- 1. Thêm các cột mới
ALTER TABLE rental_order
ADD COLUMN IF NOT EXISTS expected_start_date DATE,
ADD COLUMN IF NOT EXISTS expected_end_date DATE,
ADD COLUMN IF NOT EXISTS actual_start_date DATE,
ADD COLUMN IF NOT EXISTS actual_end_date DATE;

-- 2. Migrate dữ liệu cũ
UPDATE rental_order
SET 
  expected_start_date = rental_start_date,
  expected_end_date = rental_end_date
WHERE expected_start_date IS NULL;

-- Với các đơn đã rented/completed, set actual dates
UPDATE rental_order
SET 
  actual_start_date = rental_start_date,
  actual_end_date = rental_end_date
WHERE status IN ('rented', 'returning', 'completed') 
  AND actual_start_date IS NULL;

-- 3. Thêm comments
COMMENT ON COLUMN rental_order.expected_start_date IS 'Ngày khách muốn bắt đầu thuê';
COMMENT ON COLUMN rental_order.expected_end_date IS 'Ngày khách dự kiến trả';
COMMENT ON COLUMN rental_order.actual_start_date IS 'Ngày thực tế giao hàng';
COMMENT ON COLUMN rental_order.actual_end_date IS 'Ngày thực tế phải trả';

-- 4. Thêm constraints
ALTER TABLE rental_order
ADD CONSTRAINT check_expected_dates 
  CHECK (expected_end_date >= expected_start_date);

ALTER TABLE rental_order
ADD CONSTRAINT check_actual_dates 
  CHECK (actual_end_date IS NULL OR actual_start_date IS NULL OR actual_end_date >= actual_start_date);

-- 5. Thêm indexes
CREATE INDEX IF NOT EXISTS idx_rental_order_expected_dates 
  ON rental_order(expected_start_date, expected_end_date);

CREATE INDEX IF NOT EXISTS idx_rental_order_actual_dates 
  ON rental_order(actual_start_date, actual_end_date);

-- 6. Tạo view hỗ trợ
CREATE OR REPLACE VIEW v_rental_orders_with_status AS
SELECT 
  ro.*,
  u.name as customer_name,
  u.email as customer_email,
  CASE 
    WHEN ro.status IN ('rented', 'returning') AND ro.actual_end_date < CURRENT_DATE 
      THEN true 
    ELSE false 
  END as is_overdue,
  CASE 
    WHEN ro.status = 'rented' AND ro.actual_end_date IS NOT NULL 
      THEN ro.actual_end_date - CURRENT_DATE
    ELSE 0
  END as days_until_return
FROM rental_order ro
JOIN users u ON ro.user_id = u.id;

COMMIT;

-- Verification
SELECT 
  'Migration completed!' as status,
  COUNT(*) as total_orders,
  COUNT(expected_start_date) as has_expected,
  COUNT(actual_start_date) as has_actual
FROM rental_order;