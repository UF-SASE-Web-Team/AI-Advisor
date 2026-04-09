""" Connects to SQL database so direct SQL queries can be performed """
import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

url: str = os.getenv("SUPABASE_DATABASE_URL")
connection = psycopg2.connect(url)

