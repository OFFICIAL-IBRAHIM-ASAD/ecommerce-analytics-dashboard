import psycopg2
from faker import Faker
import random

# Database connection configuration
DB_CONFIG = {
    "dbname": "ecommerce_analytics",
    "user": "ibrahim",
    "password": "super_secret_password_123",
    "host": "localhost",
    "port": "5432"
}

fake = Faker()

REALISTIC_PRODUCTS = {
    'Electronics': ['Mapple Phone', 'Mechanical Keyboard', '4K Monitor', 'Gaming Mouse', 'Smartwatch'],
    'Clothing': ['Cotton T-Shirt', 'Denim Jeans', 'Leather Jacket', 'Running Shoes', 'Winter Beanie'],
    'Home & Kitchen': ['Coffee Maker', 'Blender', 'Non-stick Pan Set', 'Smart Thermostat', 'Vacuum Cleaner'],
    'Books': ['Introduction to Algorithms (CLRS)', 'Theory of Automata', 'The Pragmatic Programmer', 'Data Analytics for Beginners', '1984'],
    'Sports': ['Yoga Mat', 'Dumbbell Set', 'Tennis Racket', 'Basketball', 'Resistance Bands']
}

def setup_database(cur):
    """Creates the necessary tables if they don't exist in the new Docker container."""
    cur.execute("""
        CREATE TABLE IF NOT EXISTS products (
            product_id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            category VARCHAR(100),
            price NUMERIC(10, 2) NOT NULL,
            stock_quantity INT DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS customers (
            customer_id SERIAL PRIMARY KEY,
            first_name VARCHAR(100),
            last_name VARCHAR(100),
            email VARCHAR(255) UNIQUE,
            city VARCHAR(100),
            country VARCHAR(100)
        );

        CREATE TABLE IF NOT EXISTS orders (
            order_id SERIAL PRIMARY KEY,
            customer_id INT REFERENCES customers(customer_id),
            total_amount NUMERIC(10, 2) DEFAULT 0,
            status VARCHAR(50),
            order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS order_items (
            order_item_id SERIAL PRIMARY KEY,
            order_id INT REFERENCES orders(order_id),
            product_id INT REFERENCES products(product_id),
            quantity INT NOT NULL,
            unit_price NUMERIC(10, 2) NOT NULL
        );
    """)
    print("Database schema verified/created.")

def populate_data():
    conn = None
    cur = None
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        print("Connected to PostgreSQL successfully!")

        # 1. Build the tables first
        setup_database(cur)

        # 2. Wipe out any old data (useful if you run this script multiple times)
        cur.execute("TRUNCATE TABLE products CASCADE;")
        cur.execute("TRUNCATE TABLE customers CASCADE;")
        cur.execute("TRUNCATE TABLE orders CASCADE;")
        print("Cleared old database records...")

        # 3. Generate Products
        product_ids = []
        categories = list(REALISTIC_PRODUCTS.keys())
        
        for _ in range(20):
            category = random.choice(categories)
            product_name = random.choice(REALISTIC_PRODUCTS[category])
            
            cur.execute(
                "INSERT INTO products (name, category, price, stock_quantity) VALUES (%s, %s, %s, %s) RETURNING product_id",
                (product_name, category, round(random.uniform(10, 1000), 2), random.randint(10, 100))
            )
            product_ids.append(cur.fetchone()[0])

        # 4. Generate Customers
        customer_ids = []
        for _ in range(50):
            cur.execute(
                "INSERT INTO customers (first_name, last_name, email, city, country) VALUES (%s, %s, %s, %s, %s) RETURNING customer_id",
                (fake.first_name(), fake.last_name(), fake.unique.email(), fake.city(), fake.country())
            )
            customer_ids.append(cur.fetchone()[0])

        # 5. Generate Orders & Order Items
        for _ in range(100):
            cust_id = random.choice(customer_ids)
            total_amt = 0
            cur.execute(
                "INSERT INTO orders (customer_id, total_amount, status) VALUES (%s, %s, %s) RETURNING order_id",
                (cust_id, 0, 'completed')
            )
            order_id = cur.fetchone()[0]

            for _ in range(random.randint(1, 3)):
                prod_id = random.choice(product_ids)
                qty = random.randint(1, 2)
                cur.execute("SELECT price FROM products WHERE product_id = %s", (prod_id,))
                price = cur.fetchone()[0]
                
                cur.execute(
                    "INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (%s, %s, %s, %s)",
                    (order_id, prod_id, qty, price)
                )
                total_amt += (price * qty)

            cur.execute("UPDATE orders SET total_amount = %s WHERE order_id = %s", (total_amt, order_id))

        conn.commit()
        print(f"Success! Inserted 20 realistic products, 50 customers, and 100 orders.")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        if conn:
            cur.close()
            conn.close()

if __name__ == "__main__":
    populate_data()