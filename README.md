# VANAD E-Commerce Analytics Dashboard

A full-stack, containerized analytics platform that transforms raw transactional data into real-time metrics and uses machine learning to forecast future revenue.

## The Problem
E-commerce platforms generate massive amounts of raw, sequential data (orders, customers, inventory). However, raw SQL tables do not natively provide actionable business insights, nor do they help store owners predict short-term revenue trends to manage inventory effectively.

## The Solution
I built a unified architecture that bridges data engineering, web development, and machine learning. This system automatically ingests raw order data into a PostgreSQL database, serves aggregated KPIs through a fast Python API, and visualizes the health of the store on a React dashboard. Additionally, it features an automated Scikit-Learn training pipeline that analyzes historical trends to project a 7-step revenue forecast.

## Architecture Diagram

```mermaid
graph TD
    Client[React Frontend / Nginx port:80] -->|REST API Requests| API[FastAPI Backend port:8000]
    API -->|SQL Queries| DB[(PostgreSQL Database)]
    API -->|Load Artifact| ML[Scikit-Learn .joblib Model]
    
    DataScript[Data Ingestion Script] -->|Seed Data| DB
    TrainScript[ML Training Script] -->|Extract History| DB
    TrainScript -->|Generate Artifact| ML
Challenges & Solutions
Building this architecture entirely within Docker containers presented several networking and build challenges:

Docker Internal DNS Resolution: When containerizing the backend, the FastAPI application initially failed to connect to the PostgreSQL database. Relying on Docker's shorthand service aliases (like "db") caused a temporary failure in name resolution within the Alpine Linux environment. Solution: I bypassed the shorthand aliases and configured psycopg2 to use absolute container names (vanad-postgres), ensuring bulletproof routing across the internal Docker bridge network.

Frontend Build Conflicts in CI/CD: During the Docker build stage, strict version conflicts arose between Vite 8 and Tailwind CSS dependencies, causing the npm install process to fail and crash the container build. Solution: I implemented the --legacy-peer-deps flag specifically within the Dockerfile to bypass the strict peer dependency checks, allowing the Nginx static build to compile successfully without compromising the styling.

CORS Restrictions: Moving the frontend from a local Vite development server to an Nginx container shifted the origin from localhost:5173 to standard port 80. The FastAPI backend silently blocked these requests. Solution: I updated the CORS middleware in the Python backend to explicitly trust the Nginx origin, allowing seamless data fetching across the containerized stack.

Tech Stack
Frontend: React, Vite, Tailwind CSS, Recharts

Backend: FastAPI (Python), Uvicorn

Database: PostgreSQL, psycopg2

Machine Learning: Scikit-Learn (Linear Regression), Pandas, Joblib

DevOps: Docker, Docker Compose, GitHub Actions

How to Run Locally
This project is fully containerized. You only need Docker installed to run it.

1. Clone the repository

Bash
git clone [https://github.com/OFFICIAL-IBRAHIM-ASAD/ecommerce-analytics-dashboard.git](https://github.com/OFFICIAL-IBRAHIM-ASAD/ecommerce-analytics-dashboard.git)
cd ecommerce-analytics-dashboard
2. Start the Docker containers

Bash
docker compose up -d
3. Generate the data and train the AI model
(Run these scripts locally to populate the database and create the ML artifact)

Bash
source venv/bin/activate
python3 ingest_data.py
python3 train_model.py
4. View the Dashboard
Open your browser and navigate to http://localhost

```
