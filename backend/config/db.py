import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '../../.env'))

MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017/sneaks")

# Global variables for db client
db = None

def get_db():
    global db
    if db is None:
        client = MongoClient(MONGO_URI)
        db = client.get_default_database() # Uses db from uri if exists, else defaults
        # If no default database specified in URI, we default to "sneaks"
        if db.name == "admin" or db.name == "test":
             db = client["sneaks"]
    return db
