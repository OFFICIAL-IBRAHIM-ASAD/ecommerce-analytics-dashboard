import psycopg2
import pandas as pd
from sklearn.linear_model import LinearRegression
import joblib
import os

# Database connection configuration (using localhost to run from WSL)
DB_CONFIG = {
    "dbname": "ecommerce_analytics",
    "user": "ibrahim",
    "password": "super_secret_password_123",
    "host": "localhost",
    "port": "5432"
}

def train_predictive_model():
    print("Connecting to the database to extract order data...")
    conn = None
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        
        # Extract sequential order data
        query = "SELECT order_id, total_amount FROM orders ORDER BY order_id;"
        df = pd.read_sql_query(query, conn)
        
        if df.empty:
            print("No data found. Please run ingest_data.py first.")
            return

        print(f"Successfully extracted {len(df)} orders. Training model...")

        # Feature Engineering: We use the sequential order_id as our 'X' (time proxy)
        # and total_amount as our 'y' (target variable)
        X = df[['order_id']]
        y = df['total_amount']

        # Initialize and train the Linear Regression model
        model = LinearRegression()
        model.fit(X, y)

        # Create an artifacts directory to store the trained model
        os.makedirs('artifacts', exist_ok=True)
        
        # Save the model to disk using joblib
        model_path = os.path.join('artifacts', 'revenue_model.joblib')
        joblib.dump(model, model_path)
        
        print(f"Model training complete! Artifact saved securely at: {model_path}")

    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    train_predictive_model()
