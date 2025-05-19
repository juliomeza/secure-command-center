import os
import logging
import psycopg2

def get_postgres_connection():
    """Establishes a connection to the PostgreSQL database."""
    try:
        conn = psycopg2.connect(
            host=os.getenv('PG_HOST'),
            port=os.getenv('PG_PORT'),
            database=os.getenv('PG_DATABASE'),
            user=os.getenv('PG_USER'),
            password=os.getenv('PG_PASSWORD'),
            sslmode=os.getenv('PG_SSLMODE', 'disable')
        )
        logging.info("Successfully connected to PostgreSQL.")
        return conn
    except psycopg2.Error as e:
        logging.error(f"Error connecting to PostgreSQL: {e}")
        return None
    except Exception as e:
        logging.error(f"Unexpected error connecting to PostgreSQL: {e}")
        return None
