from fastapi import FastAPI, HTTPException
import psycopg2
from psycopg2.extras import RealDictCursor
from fastapi.middleware.cors import CORSMiddleware
import joblib
import os
from fastapi import HTTPException

app = FastAPI(title="VANAD Analytics API")

# Add this block to allow your React app to fetch data
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # For local Vite testing
        "http://localhost",       # For Docker Nginx frontend
        "http://127.0.0.1"        # Alternative local mapping
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database connection configuration
DB_CONFIG = {
    "dbname": "ecommerce_analytics",
    "user": "ibrahim",
    "password": "super_secret_password_123", 
    "host": "vanad-postgres",
    "port": "5432"
}

def get_db_connection():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        return conn
    except Exception as e:
        print(f"Database connection error: {e}")
        return None

@app.get("/")
def read_root():
    return {"message": "Welcome to the VANAD Analytics API"}

@app.get("/api/metrics/total-revenue")
def get_total_revenue():
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        # RealDictCursor returns rows as Python dictionaries instead of tuples
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Calculate total revenue from completed orders
        cur.execute("""
            SELECT SUM(total_amount) as total_revenue, COUNT(order_id) as total_orders 
            FROM orders 
            WHERE status = 'completed';
        """)
        
        result = cur.fetchone()
        cur.close()
        conn.close()
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/metrics/top-products")
def get_top_products(limit: int = 5):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        # Calculate top products by quantity sold
        cur.execute("""
            SELECT p.name, p.category, SUM(oi.quantity) as total_sold, SUM(oi.quantity * oi.unit_price) as total_revenue
            FROM order_items oi
            JOIN products p ON oi.product_id = p.product_id
            GROUP BY p.product_id, p.name, p.category
            ORDER BY total_sold DESC
            LIMIT %s;
        """, (limit,))
        
        result = cur.fetchall()
        cur.close()
        conn.close()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/metrics/sales-by-category")
def get_sales_by_category():
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        # Aggregate revenue by product category
        cur.execute("""
            SELECT p.category, SUM(oi.quantity * oi.unit_price) as category_revenue
            FROM order_items oi
            JOIN products p ON oi.product_id = p.product_id
            GROUP BY p.category
            ORDER BY category_revenue DESC;
        """)
        
        result = cur.fetchall()
        cur.close()
        conn.close()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/orders/recent")
def get_recent_orders(limit: int = 10):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        # Fetch the most recent orders with customer names
        cur.execute("""
            SELECT o.order_id, c.first_name, c.last_name, o.total_amount, o.order_date, o.status
            FROM orders o
            JOIN customers c ON o.customer_id = c.customer_id
            ORDER BY o.order_date DESC
            LIMIT %s;
        """, (limit,))
        
        result = cur.fetchall()
        cur.close()
        conn.close()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/predict")
def get_revenue_prediction():
    """Loads the trained scikit-learn model and predicts the next 7 steps of revenue."""
    model_path = os.path.join('artifacts', 'revenue_model.joblib')
    
    # 1. Check if the AI model actually exists
    if not os.path.exists(model_path):
        raise HTTPException(status_code=404, detail="Predictive model not found. Please train it first.")
        
    try:
        # 2. Load the brain
        model = joblib.load(model_path)
        
        # 3. Connect to the database to find out what the latest order_id is
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        cur.execute("SELECT COALESCE(MAX(order_id), 0) FROM orders;")
        max_order_id = cur.fetchone()[0]
        
        # 4. Create an array of the NEXT 7 order IDs to feed to the model
        future_orders = [[max_order_id + i] for i in range(1, 8)]
        
        # 5. Ask the model to predict the revenue for those future steps
        predictions = model.predict(future_orders)
        
        # 6. Format the output neatly for the React frontend
        forecast = []
        for i, pred in enumerate(predictions):
            forecast.append({
                "future_step": i + 1,
                "projected_revenue": round(max(0, pred), 2) # max(0, pred) prevents impossible negative revenue
            })
            
        return forecast
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if 'cur' in locals() and cur: cur.close()
        if 'conn' in locals() and conn: conn.close()