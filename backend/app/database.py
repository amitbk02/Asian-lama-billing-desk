from pymongo import MongoClient

MONGO_URL = "mongodb://localhost:27017"

client = MongoClient(MONGO_URL)

db = client["customer_support"]

customers = db["customers"]
problems = db["problems"]
invoices = db["invoices"]

print("MongoDB connection initialized")
