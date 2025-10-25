-- ============================================
-- COSPLAY RENTAL SHOP DATABASE SCHEMA
-- ============================================

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  address TEXT,
  avatar_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- CATEGORY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS category (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES category(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- PRODUCT TABLE (Updated for Rental)
-- ============================================
CREATE TABLE IF NOT EXISTS product (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  daily_price FLOAT NOT NULL,
  weekly_price FLOAT,
  deposit_amount FLOAT NOT NULL,
  description TEXT,
  category_id UUID NOT NULL REFERENCES category(id),
  images TEXT[] DEFAULT ARRAY[]::TEXT[],
  character_name VARCHAR(255),
  size VARCHAR(50),
  condition VARCHAR(50) DEFAULT 'good',
  total_quantity INT NOT NULL DEFAULT 1,
  available_quantity INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT check_quantities CHECK (available_quantity <= total_quantity),
  CONSTRAINT check_prices CHECK (daily_price > 0 AND deposit_amount >= 0)
);

-- ============================================
-- CART TABLE (Updated for Rental)
-- ============================================
CREATE TABLE IF NOT EXISTS cart (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES product(id),
  quantity INT NOT NULL DEFAULT 1,
  rental_start_date DATE,
  rental_end_date DATE,
  rental_days INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, product_id),
  CONSTRAINT check_cart_quantity CHECK (quantity > 0),
  CONSTRAINT check_cart_dates CHECK (rental_end_date IS NULL OR rental_start_date IS NULL OR rental_end_date >= rental_start_date)
);

-- ============================================
-- RENTAL ORDER TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS rental_order (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  
  rental_start_date DATE NOT NULL,
  rental_end_date DATE NOT NULL,
  rental_days INT NOT NULL,
  
  subtotal FLOAT NOT NULL,
  deposit_total FLOAT NOT NULL,
  total_amount FLOAT NOT NULL,
  
  shipping_address TEXT NOT NULL,
  delivery_method VARCHAR(50) DEFAULT 'delivery',
  
  status VARCHAR(50) DEFAULT 'pending',
  payment_method VARCHAR(50) NOT NULL,
  payment_status VARCHAR(50) DEFAULT 'unpaid',
  
  notes TEXT,
  
  actual_return_date DATE,
  late_fee FLOAT DEFAULT 0,
  damage_fee FLOAT DEFAULT 0,
  refund_amount FLOAT DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT check_rental_dates CHECK (rental_end_date >= rental_start_date),
  CONSTRAINT check_rental_days CHECK (rental_days > 0),
  CONSTRAINT check_amounts CHECK (subtotal >= 0 AND deposit_total >= 0 AND total_amount >= 0),
  CONSTRAINT check_fees CHECK (late_fee >= 0 AND damage_fee >= 0 AND refund_amount >= 0)
);

-- ============================================
-- RENTAL ORDER DETAIL TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS rental_order_detail (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rental_order_id UUID NOT NULL REFERENCES rental_order(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES product(id),
  
  quantity INT NOT NULL DEFAULT 1,
  daily_price FLOAT NOT NULL,
  rental_days INT NOT NULL,
  subtotal FLOAT NOT NULL,
  deposit_amount FLOAT NOT NULL,
  
  return_condition VARCHAR(50),
  condition_notes TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT check_detail_quantity CHECK (quantity > 0),
  CONSTRAINT check_detail_prices CHECK (daily_price > 0 AND subtotal >= 0 AND deposit_amount >= 0)
);

-- ============================================
-- RENTAL HISTORY TABLE (Tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS rental_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES product(id),
  rental_order_id UUID NOT NULL REFERENCES rental_order(id),
  user_id UUID NOT NULL REFERENCES users(id),
  
  rental_start_date DATE NOT NULL,
  rental_end_date DATE NOT NULL,
  actual_return_date DATE,
  
  condition_before VARCHAR(50),
  condition_after VARCHAR(50),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- REVIEWS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  product_id UUID NOT NULL REFERENCES product(id),
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  images TEXT[] DEFAULT ARRAY[]::TEXT[],
  time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- WISHLIST TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS wishlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES product(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, product_id)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_product_category ON product(category_id);
CREATE INDEX IF NOT EXISTS idx_product_available ON product(available_quantity);
CREATE INDEX IF NOT EXISTS idx_cart_user ON cart(user_id);
CREATE INDEX IF NOT EXISTS idx_rental_order_user ON rental_order(user_id);
CREATE INDEX IF NOT EXISTS idx_rental_order_status ON rental_order(status);
CREATE INDEX IF NOT EXISTS idx_rental_order_dates ON rental_order(rental_start_date, rental_end_date);
CREATE INDEX IF NOT EXISTS idx_rental_order_detail_order ON rental_order_detail(rental_order_id);
CREATE INDEX IF NOT EXISTS idx_rental_order_detail_product ON rental_order_detail(product_id);
CREATE INDEX IF NOT EXISTS idx_rental_history_product ON rental_history(product_id);
CREATE INDEX IF NOT EXISTS idx_rental_history_dates ON rental_history(rental_start_date, rental_end_date);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_user ON wishlist(user_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function: Update product availability
CREATE OR REPLACE FUNCTION update_product_availability()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status IN ('confirmed', 'preparing', 'delivering', 'rented') THEN
    UPDATE product p
    SET available_quantity = available_quantity - rod.quantity,
        updated_at = CURRENT_TIMESTAMP
    FROM rental_order_detail rod
    WHERE rod.rental_order_id = NEW.id
      AND rod.product_id = p.id;
      
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status IN ('completed', 'cancelled') AND OLD.status NOT IN ('completed', 'cancelled') THEN
      UPDATE product p
      SET available_quantity = available_quantity + rod.quantity,
          updated_at = CURRENT_TIMESTAMP
      FROM rental_order_detail rod
      WHERE rod.rental_order_id = NEW.id
        AND rod.product_id = p.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Check product availability by date range
CREATE OR REPLACE FUNCTION check_product_availability(
  p_product_id UUID,
  p_quantity INT,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS BOOLEAN AS $$
DECLARE
  v_total_quantity INT;
  v_rented_quantity INT;
  v_available_quantity INT;
BEGIN
  SELECT total_quantity INTO v_total_quantity
  FROM product
  WHERE id = p_product_id;
  
  IF v_total_quantity IS NULL THEN
    RETURN FALSE;
  END IF;
  
  SELECT COALESCE(SUM(rod.quantity), 0) INTO v_rented_quantity
  FROM rental_order_detail rod
  JOIN rental_order ro ON rod.rental_order_id = ro.id
  WHERE rod.product_id = p_product_id
    AND ro.status IN ('confirmed', 'preparing', 'delivering', 'rented')
    AND (
      (ro.rental_start_date <= p_end_date AND ro.rental_end_date >= p_start_date)
    );
  
  v_available_quantity := v_total_quantity - v_rented_quantity;
  
  RETURN v_available_quantity >= p_quantity;
END;
$$ LANGUAGE plpgsql;

-- Function: Calculate late fee
CREATE OR REPLACE FUNCTION calculate_late_fee(
  p_rental_order_id UUID,
  p_return_date DATE
)
RETURNS FLOAT AS $$
DECLARE
  v_end_date DATE;
  v_daily_rate FLOAT;
  v_late_days INT;
  v_late_fee FLOAT;
BEGIN
  SELECT rental_end_date INTO v_end_date
  FROM rental_order
  WHERE id = p_rental_order_id;
  
  IF p_return_date <= v_end_date THEN
    RETURN 0;
  END IF;
  
  v_late_days := p_return_date - v_end_date;
  
  SELECT AVG(daily_price) * 1.5 INTO v_daily_rate
  FROM rental_order_detail
  WHERE rental_order_id = p_rental_order_id;
  
  v_late_fee := v_late_days * v_daily_rate;
  
  RETURN v_late_fee;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

DROP TRIGGER IF EXISTS trigger_update_product_availability ON rental_order;
CREATE TRIGGER trigger_update_product_availability
AFTER INSERT OR UPDATE ON rental_order
FOR EACH ROW
EXECUTE FUNCTION update_product_availability();

-- Function: Auto update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_product_updated_at ON product;
CREATE TRIGGER update_product_updated_at
BEFORE UPDATE ON product
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cart_updated_at ON cart;
CREATE TRIGGER update_cart_updated_at
BEFORE UPDATE ON cart
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_rental_order_updated_at ON rental_order;
CREATE TRIGGER update_rental_order_updated_at
BEFORE UPDATE ON rental_order
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();



-- ============================================
-- ADMIN USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'staff', -- 'super_admin', 'admin', 'staff'
  avatar_url VARCHAR(500),
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- ACTIVITY LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES admin_users(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id UUID,
  details JSONB,
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES FOR ADMIN
-- ============================================
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);
CREATE INDEX IF NOT EXISTS idx_activity_logs_admin ON activity_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at);

-- ============================================
-- TRIGGER FOR ADMIN UPDATED_AT
-- ============================================
DROP TRIGGER IF EXISTS update_admin_users_updated_at ON admin_users;
CREATE TRIGGER update_admin_users_updated_at
BEFORE UPDATE ON admin_users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- INSERT DEFAULT ADMIN ACCOUNT
-- ============================================
-- Password: admin123 (change this in production!)
INSERT INTO admin_users (username, email, password_hash, full_name, role) 
VALUES (
  'admin',
  'admin@cosplayshop.com',
  '$2a$10$rQ3qV5z8xGX7vK9YhJxYXOqWxN5Z5YvH0LxXfYZTxZTxZTxZTxZTx', -- admin123
  'Super Admin',
  'super_admin'
) ON CONFLICT (email) DO NOTHING;
-- ============================================
-- SAMPLE DATA (Optional)
-- ============================================

-- Insert sample categories
INSERT INTO category (id, name, description) VALUES
  (uuid_generate_v4(), 'Anime', 'Trang phục anime và manga'),
  (uuid_generate_v4(), 'Game', 'Trang phục từ game'),
  (uuid_generate_v4(), 'Movie', 'Trang phục từ phim'),
  (uuid_generate_v4(), 'Original', 'Trang phục tự thiết kế')
ON CONFLICT DO NOTHING;

