import psycopg2
from faker import Faker
import random

# Database connection configuration
DB_CONFIG = {
    "dbname": "ecommerce_analytics",
    "user": "ibrahim",
    "password": "super_secret_password_123", # <--- UPDATE THIS
    "host": "localhost",
    "port": "5432"
}

fake = Faker()

def populate_data():
    conn = None  # <-- Fixes the UnboundLocalError
    cur = None
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        print("Connected to PostgreSQL successfully!")

        # 1. Generate Products
        categories = ['Electronics', 'Clothing', 'Home & Kitchen', 'Books', 'Sports']
        product_ids = []
        for _ in range(20):
            cur.execute(
                "INSERT INTO products (name, category, price, stock_quantity) VALUES (%s, %s, %s, %s) RETURNING product_id",
                (fake.ecommerce_name() if hasattr(fake, 'ecommerce_name') else fake.word().capitalize(), 
                 random.choice(categories), round(random.uniform(10, 1000), 2), random.randint(10, 100))
            )
            product_ids.append(cur.fetchone()[0])

        # 2. Generate Customers
        customer_ids = []
        for _ in range(50):
            cur.execute(
                "INSERT INTO customers (first_name, last_name, email, city, country) VALUES (%s, %s, %s, %s, %s) RETURNING customer_id",
                (fake.first_name(), fake.last_name(), fake.unique.email(), fake.city(), fake.country())
            )
            customer_ids.append(cur.fetchone()[0])

        # 3. Generate Orders & Order Items
        for _ in range(100):
            cust_id = random.choice(customer_ids)
            total_amt = 0
            cur.execute(
                "INSERT INTO orders (customer_id, total_amount, status) VALUES (%s, %s, %s) RETURNING order_id",
                (cust_id, 0, 'completed')
            )
            order_id = cur.fetchone()[0]

            # Add 1-3 items per order
            for _ in range(random.randint(1, 3)):
                prod_id = random.choice(product_ids)
                qty = random.randint(1, 2)
                # Get price of the product
                cur.execute("SELECT price FROM products WHERE product_id = %s", (prod_id,))
                price = cur.fetchone()[0]
                
                cur.execute(
                    "INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (%s, %s, %s, %s)",
                    (order_id, prod_id, qty, price)
                )
                total_amt += (price * qty)

            # Update the order total
            cur.execute("UPDATE orders SET total_amount = %s WHERE order_id = %s", (total_amt, order_id))

        conn.commit()
        print(f"Success! Inserted 20 products, 50 customers, and 100 orders.")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        if conn:
            cur.close()
            conn.close()

if __name__ == "__main__":
    populate_data()
