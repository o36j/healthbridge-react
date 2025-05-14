#!/usr/bin/env python3
import os
import sys
import pymongo
from datetime import datetime
from bson import ObjectId
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
    print(f"Connected to MongoDB database '{db_name}' successfully!")
except Exception as e:
    print(f"Error connecting to MongoDB: {e}")
    sys.exit(1)

def print_collection_counts():
    """Print the current count of documents in each collection"""
    collections = {
        "Users": db.users,
        "Medications": db.medications,
        "Appointments": db.appointments,
        "Patient Histories": db.patienthistories,
        "Messages": db.messages,
        "Notifications": db.notifications
    }
    
    print("\nCurrent collection counts:")
    print("--------------------------")
    for name, collection in collections.items():
        count = collection.count_documents({})
        print(f"{name}: {count} documents")
    print()

def delete_test_users():
    """Delete users added by the test scripts"""
    users_collection = db.users
    
    # Find counts before deletion
    total_count = users_collection.count_documents({})
    
    # Ask which user types to delete
    print("\nSelect which user types to delete:")
    print("1. All test users")
    print("2. Only patients")
    print("3. Only doctors")
    print("4. Only international doctors")
    print("5. Only international patients")
    print("6. Only nurses")
    print("0. Skip user deletion")
    
    choice = input("Enter your choice (0-6): ")
    
    if choice == "0":
        print("Skipping user deletion.")
        return
    
    # Prepare the filter based on user choice
    delete_filter = {}
    
    if choice == "1":
        # Delete all test users except admin users
        # We don't delete admin users because they might be needed for system operation
        delete_filter = {"role": {"$ne": "admin"}}
        user_type = "all non-admin users"
    elif choice == "2":
        delete_filter = {"role": "patient", "isInternational": {"$ne": True}}
        user_type = "local patients"
    elif choice == "3":
        delete_filter = {"role": "doctor", "isInternational": {"$ne": True}}
        user_type = "local doctors"
    elif choice == "4":
        delete_filter = {"role": "doctor", "isInternational": True}
        user_type = "international doctors"
    elif choice == "5":
        delete_filter = {"role": "patient", "isInternational": True}
        user_type = "international patients"
    elif choice == "6":
        delete_filter = {"role": "nurse"}
        user_type = "nurses"
    else:
        print("Invalid choice. Skipping user deletion.")
        return
    
    # Ask for confirmation
    confirm = input(f"Are you sure you want to delete {user_type}? This cannot be undone. (y/n): ")
    if confirm.lower() != 'y':
        print(f"Skipping deletion of {user_type}.")
        return
    
    # Delete the users
    result = users_collection.delete_many(delete_filter)
    deleted_count = result.deleted_count
    
    print(f"Deleted {deleted_count} {user_type} from the database.")
    print(f"Remaining users: {total_count - deleted_count}")

def delete_medications():
    """Delete medications added by the test scripts"""
    medications_collection = db.medications
    
    # Find counts before deletion
    total_count = medications_collection.count_documents({})
    
    if total_count == 0:
        print("No medications found in the database.")
        return
    
    # Ask for confirmation
    confirm = input(f"Are you sure you want to delete all {total_count} medications? This cannot be undone. (y/n): ")
    if confirm.lower() != 'y':
        print("Skipping medication deletion.")
        return
    
    # Delete all medications
    result = medications_collection.delete_many({})
    deleted_count = result.deleted_count
    
    print(f"Deleted {deleted_count} medications from the database.")

def delete_appointments():
    """Delete appointments added by the test scripts"""
    appointments_collection = db.appointments
    
    # Find counts before deletion
    total_count = appointments_collection.count_documents({})
    
    if total_count == 0:
        print("No appointments found in the database.")
        return
    
    # Ask for confirmation
    confirm = input(f"Are you sure you want to delete all {total_count} appointments? This cannot be undone. (y/n): ")
    if confirm.lower() != 'y':
        print("Skipping appointment deletion.")
        return
    
    # Delete all appointments
    result = appointments_collection.delete_many({})
    deleted_count = result.deleted_count
    
    print(f"Deleted {deleted_count} appointments from the database.")

def delete_patient_histories():
    """Delete patient history records added by the test scripts"""
    patient_history_collection = db.patienthistories
    
    # Find counts before deletion
    total_count = patient_history_collection.count_documents({})
    
    if total_count == 0:
        print("No patient history records found in the database.")
        return
    
    # Ask for confirmation
    confirm = input(f"Are you sure you want to delete all {total_count} patient history records? This cannot be undone. (y/n): ")
    if confirm.lower() != 'y':
        print("Skipping patient history deletion.")
        return
    
    # Delete all patient histories
    result = patient_history_collection.delete_many({})
    deleted_count = result.deleted_count
    
    print(f"Deleted {deleted_count} patient history records from the database.")

def delete_related_data():
    """Delete data in other collections that might reference deleted users"""
    # Check if there are messages or notifications
    messages_count = db.messages.count_documents({})
    notifications_count = db.notifications.count_documents({})
    
    if messages_count > 0 or notifications_count > 0:
        print("\nThere might be related data in other collections:")
        if messages_count > 0:
            print(f"- Messages: {messages_count} documents")
        if notifications_count > 0:
            print(f"- Notifications: {notifications_count} documents")
        
        confirm = input("Would you like to delete this related data as well? (y/n): ")
        if confirm.lower() == 'y':
            if messages_count > 0:
                db.messages.delete_many({})
                print(f"Deleted {messages_count} messages.")
            
            if notifications_count > 0:
                db.notifications.delete_many({})
                print(f"Deleted {notifications_count} notifications.")
        else:
            print("Skipping deletion of related data.")

def delete_all_data():
    """Delete all data from all collections"""
    collections = [
        "users", "medications", "appointments", "patienthistories", 
        "messages", "notifications"
    ]
    
    print("\n⚠️ WARNING: This will delete ALL data from ALL collections! ⚠️")
    print("This action is irreversible and will completely empty your database.")
    
    # Double confirmation for this dangerous operation
    confirm1 = input("\nAre you absolutely sure you want to delete ALL data? Type 'YES' in all caps to confirm: ")
    if confirm1 != "YES":
        print("Deletion cancelled.")
        return
    
    confirm2 = input("This is your last chance to cancel. Type 'DELETE EVERYTHING' to proceed: ")
    if confirm2 != "DELETE EVERYTHING":
        print("Deletion cancelled.")
        return
    
    # Delete all data from all collections
    total_deleted = 0
    for collection_name in collections:
        collection = db[collection_name]
        count = collection.count_documents({})
        if count > 0:
            collection.delete_many({})
            print(f"Deleted {count} documents from {collection_name}")
            total_deleted += count
    
    print(f"\nOperation complete. Deleted a total of {total_deleted} documents across all collections.")

def main():
    """Main function to run the cleanup script"""
    print("\n=================================================")
    print("HealthBridge Test Data Cleanup Utility")
    print("=================================================")
    print("This script will help you clean up test data added by the Python scripts.")
    print("You can choose which data to delete.")
    
    # Print current collection counts
    print_collection_counts()
    
    while True:
        print("\nWhat would you like to do?")
        print("1. Delete test users")
        print("2. Delete medications")
        print("3. Delete appointments")
        print("4. Delete patient history records")
        print("5. Delete related data (messages, notifications)")
        print("6. Delete ALL data (DANGEROUS)")
        print("7. Show current collection counts")
        print("0. Exit")
        
        choice = input("\nEnter your choice (0-7): ")
        
        if choice == "0":
            print("Exiting cleanup utility.")
            break
        elif choice == "1":
            delete_test_users()
        elif choice == "2":
            delete_medications()
        elif choice == "3":
            delete_appointments()
        elif choice == "4":
            delete_patient_histories()
        elif choice == "5":
            delete_related_data()
        elif choice == "6":
            delete_all_data()
        elif choice == "7":
            print_collection_counts()
        else:
            print("Invalid choice. Please try again.")
    
    # Print final collection counts
    print("\nFinal collection counts after cleanup:")
    print_collection_counts()
    
    print("Thank you for using the HealthBridge Test Data Cleanup Utility!")

if __name__ == "__main__":
    main() 