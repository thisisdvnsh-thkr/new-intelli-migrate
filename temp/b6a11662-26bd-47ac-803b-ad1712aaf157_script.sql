-- ============================================
-- Intelli-Migrate Generated SQL Script
-- ============================================
-- Generated: 2026-04-06T19:42:09.456873
-- Dialect: POSTGRESQL
-- Tables: 5
-- Records: 107
-- ============================================


-- DDL: Table Definitions
DROP TABLE IF EXISTS customer_orders CASCADE;

DROP TABLE IF EXISTS customer_orders_product CASCADE;

DROP TABLE IF EXISTS customer_orders_customer CASCADE;

DROP TABLE IF EXISTS customer_orders_address CASCADE;

DROP TABLE IF EXISTS customer_orders_order CASCADE;



CREATE TABLE customer_orders_order (
    order_id SERIAL PRIMARY KEY,
    customer_orders_id INTEGER NOT NULL,
    order_date TIMESTAMP,
    FOREIGN KEY (customer_orders_id) REFERENCES customer_orders(id) ON DELETE CASCADE
);

CREATE TABLE customer_orders_address (
    address_id SERIAL PRIMARY KEY,
    customer_orders_id INTEGER NOT NULL,
    shipping_address VARCHAR(50),
    FOREIGN KEY (customer_orders_id) REFERENCES customer_orders(id) ON DELETE CASCADE
);

CREATE TABLE customer_orders_customer (
    customer_id SERIAL PRIMARY KEY,
    customer_orders_id INTEGER NOT NULL,
    customer_name VARCHAR(50),
    cust_email VARCHAR(50),
    FOREIGN KEY (customer_orders_id) REFERENCES customer_orders(id) ON DELETE CASCADE
);

CREATE TABLE customer_orders_product (
    product_id SERIAL PRIMARY KEY,
    customer_orders_id INTEGER NOT NULL,
    product_name VARCHAR(50),
    FOREIGN KEY (customer_orders_id) REFERENCES customer_orders(id) ON DELETE CASCADE
);

CREATE TABLE customer_orders (
    id SERIAL PRIMARY KEY,
    quantity INTEGER,
    category VARCHAR(50),
    unit_price DECIMAL(10,2),
    phone VARCHAR(50)
);

-- DML: Data Insertion
INSERT INTO customer_orders_order (order_id, order_date)
VALUES
    ('ORD-2024-001', '2024-01-15'),
    ('ORD-2024-003', '01/17/2024'),
    ('ORD-2024-004', '2024-01-18'),
    ('ORD-2024-006', '19-Jan-2024'),
    ('ORD-2024-007', '2024-01-20'),
    ('ORD-2024-008', '2024/01/21'),
    ('ORD-2024-009', '2024-01-22'),
    ('ORD-2024-010', '2024-01-23'),
    ('ORD-2024-012', '2024-01-25'),
    ('ORD-2024-013', '2024-01-26'),
    ('ORD-2024-014', 'January 27, 2024'),
    ('ORD-2024-015', '2024-01-28'),
    ('ORD-2024-016', '2024-01-29'),
    ('ORD-2024-017', '2024-01-30'),
    ('ORD-2024-018', '2024-01-31'),
    ('ORD-2024-019', '2024-02-01'),
    ('ORD-2024-020', '2024-02-02'),
    ('ORD-2024-021', '2024-02-03'),
    ('ORD-2024-022', '2024-02-04'),
    ('ORD-2024-023', '2024-02-05'),
    ('ORD-2024-024', '2024-02-06'),
    ('ORD-2024-025', '2024-02-07');
INSERT INTO customer_orders_address (address_id, shipping_address)
VALUES
    (1, '123 Main St, New York, NY 10001'),
    (2, '789 Pine Rd, Chicago, IL 60601'),
    (3, '321 Elm St, Houston, TX 77001'),
    (4, '10 Downing Street, London, UK'),
    (5, '555 Broadway, New York, NY 10012'),
    (6, '888 Market St, San Francisco, CA 94102'),
    (7, 'MG Road, Bangalore, India 560001'),
    (8, 'Acropolis Road, Athens, Greece'),
    (9, 'Sunset Blvd, Los Angeles, CA 90028'),
    (10, 'Gangnam District, Seoul, South Korea'),
    (11, 'Twin Peaks, WA 98001'),
    (12, '1725 Slough Ave, Scranton, PA 18503'),
    (13, 'River Heights, IL 60000'),
    (16, 'Apartment 7B, Queens, NY 11375'),
    (17, 'Rogers Arena, Vancouver, BC V6B 6G1'),
    (18, 'Central Perk, Greenwich Village, NY'),
    (19, 'Avengers Tower, Manhattan, NY 10019'),
    (20, 'Malibu Point, CA 90265'),
    (21, 'Hollywood Hills, LA, CA 90068'),
    (22, 'S.T.A.R. Labs, Detroit, MI 48201');
INSERT INTO customer_orders_customer (customer_id, customer_name, cust_email)
VALUES
    ('C001', 'John Doe', 'john.doe@email.com'),
    ('C003', '', 'bob.wilson@company.org'),
    ('C004', 'Alice Johnson', 'alice_j@yahoo.com'),
    ('C006', 'Diana Prince', 'diana.prince@work.net'),
    ('C007', 'Edward Norton', 'ed.norton@protonmail.com'),
    ('C008', 'Fiona Green💚', 'fiona.green@email.com'),
    ('C009', 'George Harris', 'george.harris@mail.com'),
    ('C010', 'Helen Troy', 'helen.troy@olympus.gr'),
    ('C012', 'Julia Roberts', 'julia.roberts@hollywood.com'),
    ('C013', 'Kevin Lee', 'kevin.lee@tech.io'),
    ('C014', 'Laura Palmer', 'laura.palmer@twinpeaks.com'),
    ('C015', 'Michael Scott', 'michael.scott@dundermifflin.com'),
    ('C016', 'Nancy Drew', 'nancy.drew@mystery.net'),
    ('C018', '   Oscar Martinez   ', 'oscar.martinez@accounting.com'),
    ('C019', 'Peter Parker', 'spidey@dailybugle.nyc'),
    ('C020', 'Quinn Hughes', 'quinn@hockey.ca'),
    ('C021', 'Rachel Green', 'rachel.green@fashion.nyc'),
    ('C022', 'Steve Rogers', 'cap@avengers.org'),
    ('C023', 'Tony Stark', 'tony@starkindustries.com'),
    ('C024', 'Uma Thurman', 'uma.t@movies.com'),
    ('C025', 'Victor Stone', 'cyborg@justice.league');
INSERT INTO customer_orders_product (product_id, product_name)
VALUES
    (1, 'Wireless Headphones'),
    (2, 'Mechanical Keyboard'),
    (3, 'Laptop Stand'),
    (4, 'Webcam HD'),
    (5, 'External SSD 1TB'),
    (6, 'Mouse Pad XL'),
    (7, 'Wireless Mouse'),
    (8, 'USB Hub 7-Port'),
    (9, 'Desk Lamp LED'),
    (10, 'Thunderbolt Dock'),
    (11, 'Noise Canceling Earbuds'),
    (12, 'Paper (Box of 10 Reams)'),
    (13, 'Magnifying Glass'),
    (14, 'Bluetooth Speaker'),
    (15, 'Calculator Scientific'),
    (16, 'Camera DSLR'),
    (17, 'Portable Charger 20000mAh'),
    (18, 'Ring Light 18 inch'),
    (19, 'Fitness Tracker'),
    (20, 'Smart Watch Pro'),
    (21, 'Yoga Mat Premium'),
    (22, 'Graphics Card RTX');
INSERT INTO customer_orders (id, quantity, category, unit_price, phone)
VALUES
    (1, 2, 'Electronics', 79.99, '+1-555-123-4567'),
    (2, 1, 'Electronics', 149.99, '123'),
    (3, 3, 'Accessories', 45.0, '+1 (555) 246-8135'),
    (4, 2, 'Electronics', 89.99, '+44-20-7946-0958'),
    (5, 1, 'Storage', 129.99, ''),
    (6, 10, 'Accessories', 19.99, '555-333-4444'),
    (7, 0, 'Electronics', 34.99, '+91-9876543210'),
    (8, 2, 'Electronics', 39.99, '+30-210-1234567'),
    (9, 4, 'Lighting', 0.0, '+1-310-555-0199'),
    (10, 1, 'Electronics', 249.99, '+82-2-1234-5678'),
    (11, 2, 'Audio', 199.99, 'ABC-DEF-GHIJ'),
    (12, 100, 'Office Supplies', 42.99, '+1-570-555-0100'),
    (13, 1, 'Tools', 15.99, '+1-555-000-0000'),
    (14, 1, 'Audio', 59.99, '+1-555-123-4567'),
    (15, 5, 'Office Supplies', 24.99, '+1-570-555-0101'),
    (16, 1, 'Photography', 799.99, '+1-212-555-1234'),
    (17, 3, 'Electronics', 49.99, '+1-604-555-9999'),
    (18, 1, 'Lighting', 79.99, '1-555-FASHION'),
    (19, 1, 'Wearables', 149.99, '+1-555-194-1'),
    (20, 50, 'Wearables', 399.99, '+1-310-555-IRON'),
    (21, 2, 'Fitness', 34.99, '+1-555-KILL-BILL'),
    (22, 1, 'Computer Parts', 1299.99, '+1-313-555-0001');