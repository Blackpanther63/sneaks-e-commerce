import os
from pymongo import MongoClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get MongoDB connection string from environment variable
MONGO_URI = os.getenv("MONGO_URI")

# Global database instance
db = None

def get_db():
    global db

    if db is None:
        try:
            if not MONGO_URI:
                raise ValueError("MONGO_URI environment variable is not set")

            # Connect to MongoDB Atlas
            client = MongoClient(MONGO_URI)

            # Select database
            db = client["sneakers"]

            print("✅ MongoDB Atlas connected successfully")

        except Exception as e:
            print("❌ MongoDB connection failed:", str(e))
            raise e

    return db