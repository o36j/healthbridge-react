#!/usr/bin/env python3
import os
import sys
import pymongo
import bcrypt
from dotenv import load_dotenv
import re

# Check for .env file and create if it doesn't exist
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), '.env')
if not os.path.exists(env_path):
    print(f"Warning: .env file not found at {env_path}")
    mongo_uri = input("Please enter your MongoDB connection string: ")
    with open(env_path, 'w') as f:
        f.write(f"MONGODB_URI={mongo_uri}\n")
    print(f"Created .env file at {env_path}")

# Load environment variables from .env file
load_dotenv(env_path)

# Get MongoDB URI from environment variable
mongo_uri = os.getenv('MONGODB_URI')
if not mongo_uri:
    print("Error: MONGODB_URI environment variable not found.")
    mongo_uri = input("Please enter your MongoDB connection string: ")
    with open(env_path, 'a') as f:
        f.write(f"MONGODB_URI={mongo_uri}\n")
    print(f"Updated .env file with MongoDB URI")

# Extract database name from URI or use default
db_name = "test"
uri_db_match = re.search(r'/([^/\?]+)(\?|$)', mongo_uri)
if uri_db_match:
    db_name = uri_db_match.group(1)

# Setup MongoDB connection
try:
    client = pymongo.MongoClient(mongo_uri)
    
    # Use database from URI or default
    db = client[db_name]
    users_collection = db.users
    print(f"Connected to MongoDB database '{db_name}' successfully!")
except Exception as e:
    print(f"Error connecting to MongoDB: {e}")
    sys.exit(1)

# Default password to use for all accounts
DEFAULT_PASSWORD = "password123"

# Function to hash password using bcrypt
def hash_password(password):
    # Generate a salt
    salt = bcrypt.gensalt(10)
    # Hash the password
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed_password.decode('utf-8')

# Count users with non-hashed passwords
try:
    # Check for users with plain-text 'password123'
    users_to_update = users_collection.find({"password": "password123"})
    count = users_collection.count_documents({"password": "password123"})
    
    if count == 0:
        print("No users found with plain-text passwords. All passwords appear to be hashed already.")
        sys.exit(0)
    
    print(f"Found {count} users with plain-text passwords that need to be hashed.")
    
    # Ask for confirmation before updating
    confirm = input(f"Do you want to update all these passwords to hashed 'password123'? (y/n): ")
    if confirm.lower() != 'y':
        print("Operation cancelled by user.")
        sys.exit(0)
    
    # Hash the default password once
    hashed_password = hash_password(DEFAULT_PASSWORD)
    
    # Update all users with plain-text passwords
    result = users_collection.update_many(
        {"password": "password123"},
        {"$set": {"password": hashed_password}}
    )
    
    print(f"Successfully updated {result.modified_count} user passwords to hashed values.")
    
    # Print sample users
    users = list(users_collection.find({}, {"email": 1, "role": 1, "_id": 0}).limit(5))
    print("\nSample users that can now be used for login:")
    for user in users:
        print(f"  Email: {user['email']} | Role: {user['role']} | Password: {DEFAULT_PASSWORD}")
    
except Exception as e:
    print(f"Error updating passwords: {e}")
    sys.exit(1)

print("Done!") 