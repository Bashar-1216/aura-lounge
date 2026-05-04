-- ============================================
-- QR Order System — Aura Lounge
-- Database Schema + Sample Data
-- ============================================

CREATE DATABASE IF NOT EXISTS aura_lounge
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE aura_lounge;

-- ============================================
-- 1. USERS (Admin & Kitchen staff)
-- ============================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'kitchen') NOT NULL DEFAULT 'kitchen',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================
-- 2. CATEGORIES
-- ============================================
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(50) DEFAULT '',
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================
-- 3. MENU ITEMS
-- ============================================
CREATE TABLE menu_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    price DECIMAL(8,2) NOT NULL,
    image_url VARCHAR(500) DEFAULT '',
    is_available BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    tags VARCHAR(200) DEFAULT '',
    prep_time_mins INT DEFAULT 15,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    INDEX idx_category (category_id),
    INDEX idx_available (is_available),
    INDEX idx_featured (is_featured)
) ENGINE=InnoDB;

-- ============================================
-- 4. TABLES
-- ============================================
CREATE TABLE tables_info (
    id INT AUTO_INCREMENT PRIMARY KEY,
    table_number VARCHAR(20) NOT NULL UNIQUE,
    capacity INT DEFAULT 4,
    status ENUM('free', 'occupied', 'reserved') DEFAULT 'free',
    qr_code_url VARCHAR(500) DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================
-- 5. ORDERS
-- ============================================
CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    table_id INT NOT NULL,
    customer_name VARCHAR(100) DEFAULT 'Guest',
    status ENUM('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled') DEFAULT 'pending',
    total_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (table_id) REFERENCES tables_info(id),
    INDEX idx_status (status),
    INDEX idx_created (created_at),
    INDEX idx_table (table_id)
) ENGINE=InnoDB;

-- ============================================
-- 6. ORDER ITEMS
-- ============================================
CREATE TABLE order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    menu_item_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(8,2) NOT NULL,
    customization TEXT DEFAULT '',
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id),
    INDEX idx_order (order_id)
) ENGINE=InnoDB;

-- ============================================
-- SAMPLE DATA
-- ============================================

-- Admin user (password: admin123)
INSERT INTO users (name, email, password_hash, role) VALUES
('Admin', 'admin@aura.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin'),
('Kitchen Staff', 'kitchen@aura.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'kitchen');

-- Categories
INSERT INTO categories (name, icon, sort_order, is_active) VALUES
('Hot Drinks', '☕', 1, TRUE),
('Cold Drinks', '🥤', 2, TRUE),
('Pastries', '🥐', 3, TRUE),
('Breakfast', '🍳', 4, TRUE),
('Main Dishes', '🍽️', 5, TRUE),
('Desserts', '🍰', 6, TRUE);

-- Menu Items
-- Hot Drinks
INSERT INTO menu_items (category_id, name, description, price, is_available, is_featured, tags, prep_time_mins) VALUES
(1, 'Classic Cappuccino', 'Rich espresso with steamed milk foam and a dusting of cocoa', 18.00, TRUE, TRUE, 'popular', 5),
(1, 'Spanish Latte', 'Sweet condensed milk blended with bold espresso', 22.00, TRUE, TRUE, 'popular,sweet', 5),
(1, 'Matcha Latte', 'Premium Japanese matcha whisked with creamy steamed milk', 24.00, TRUE, FALSE, 'new', 5),
(1, 'Hot Chocolate', 'Belgian chocolate melted into velvety steamed milk', 20.00, TRUE, FALSE, '', 5),
(1, 'Turkish Coffee', 'Traditional finely ground coffee brewed to perfection', 15.00, TRUE, FALSE, '', 7);

-- Cold Drinks
INSERT INTO menu_items (category_id, name, description, price, is_available, is_featured, tags, prep_time_mins) VALUES
(2, 'Iced Americano', 'Double shot espresso over ice with cold water', 16.00, TRUE, TRUE, 'popular', 3),
(2, 'Mango Smoothie', 'Fresh mango blended with yogurt and honey', 25.00, TRUE, FALSE, 'fresh', 5),
(2, 'Berry Blast', 'Mixed berries smoothie with banana and oat milk', 26.00, TRUE, FALSE, 'fresh,healthy', 5),
(2, 'Mojito Mocktail', 'Fresh mint and lime with sparkling water and sugar syrup', 22.00, TRUE, TRUE, 'new', 5);

-- Pastries
INSERT INTO menu_items (category_id, name, description, price, is_available, is_featured, tags, prep_time_mins) VALUES
(3, 'Butter Croissant', 'Flaky French-style butter croissant baked fresh daily', 12.00, TRUE, FALSE, '', 3),
(3, 'Chocolate Danish', 'Puff pastry filled with rich chocolate cream', 14.00, TRUE, FALSE, 'sweet', 3),
(3, 'Cinnamon Roll', 'Soft dough swirled with cinnamon sugar and cream cheese glaze', 16.00, TRUE, TRUE, 'popular,sweet', 3);

-- Breakfast
INSERT INTO menu_items (category_id, name, description, price, is_available, is_featured, tags, prep_time_mins) VALUES
(4, 'Avocado Toast', 'Smashed avocado on sourdough with poached eggs and chili flakes', 32.00, TRUE, TRUE, 'popular,healthy', 12),
(4, 'Eggs Benedict', 'Poached eggs on English muffin with hollandaise sauce and smoked turkey', 35.00, TRUE, FALSE, '', 15),
(4, 'Pancake Stack', 'Fluffy buttermilk pancakes with maple syrup and mixed berries', 28.00, TRUE, FALSE, 'sweet', 12);

-- Main Dishes
INSERT INTO menu_items (category_id, name, description, price, is_available, is_featured, tags, prep_time_mins) VALUES
(5, 'Grilled Chicken Wrap', 'Tender grilled chicken with fresh veggies and garlic sauce in a tortilla', 30.00, TRUE, FALSE, '', 15),
(5, 'Smash Burger', 'Double smashed beef patties with cheddar, pickles, and special sauce', 38.00, TRUE, TRUE, 'popular', 18),
(5, 'Margherita Pizza', 'Hand-stretched dough with San Marzano tomatoes, fresh mozzarella, and basil', 42.00, TRUE, FALSE, '', 20);

-- Desserts
INSERT INTO menu_items (category_id, name, description, price, is_available, is_featured, tags, prep_time_mins) VALUES
(6, 'Lotus Cheesecake', 'Creamy cheesecake with Biscoff cookie crust and caramel drizzle', 28.00, TRUE, TRUE, 'popular,sweet', 3),
(6, 'Chocolate Lava Cake', 'Warm chocolate cake with a molten center, served with vanilla ice cream', 32.00, TRUE, FALSE, 'sweet', 10),
(6, 'Tiramisu', 'Classic Italian dessert with espresso-soaked ladyfingers and mascarpone', 30.00, TRUE, FALSE, 'sweet', 3);

-- Tables (12 tables)
INSERT INTO tables_info (table_number, capacity, status) VALUES
('T1', 2, 'free'),
('T2', 2, 'free'),
('T3', 4, 'free'),
('T4', 4, 'free'),
('T5', 4, 'free'),
('T6', 4, 'free'),
('T7', 6, 'free'),
('T8', 6, 'free'),
('T9', 8, 'free'),
('T10', 8, 'free'),
('T11', 4, 'free'),
('T12', 4, 'free');
