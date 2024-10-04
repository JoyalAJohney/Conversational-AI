FROM python:3.10-slim


WORKDIR /app

# Copy backend code and requirements.txt
COPY ./backend /app/backend
COPY ./backend/requirements.txt /app/backend/requirements.txt

# Install dependencies
RUN pip install --no-cache-dir -r /app/backend/requirements.txt


COPY ./frontend /app/frontend

COPY system_prompt.txt /app/system_prompt.txt

EXPOSE 8000

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]

