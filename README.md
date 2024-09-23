# Streamlit Frontend with FastAPI Backend

## Setup

1. Install backend dependencies:
   ```
   cd backend
   pip install -r requirements.txt
   ```

2. Install frontend dependencies:
   ```
   cd frontend
   pip install -r requirements.txt
   ```

## Running the application

1. Start the backend server:
   ```
   cd backend
   uvicorn main:app --reload
   ```

2. Start the frontend server:
   ```
   cd frontend
   streamlit run app.py
   ```

3. Open your browser and go to `http://localhost:8501` to view the Streamlit app.
