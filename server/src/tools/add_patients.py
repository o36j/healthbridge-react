#!/usr/bin/env python3
import os
import sys
import pymongo
from datetime import datetime, timedelta
from bson import ObjectId
from dotenv import load_dotenv
import re
import random

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

# We need to find an admin user to set as createdBy
try:
    admin_user = users_collection.find_one({"role": "admin"})
    if not admin_user:
        print("No admin user found. Looking for any user...")
        any_user = users_collection.find_one({})
        if not any_user:
            print("No users found in the database.")
            create_user = input("Would you like to create a placeholder admin user? (y/n): ")
            if create_user.lower() == 'y':
                admin_id = ObjectId()
                admin_user = {
                    "_id": admin_id,
                    "email": "admin@healthbridge.com",
                    "password": "placeholder",  # This would be hashed in a real scenario
                    "firstName": "Admin",
                    "lastName": "User",
                    "role": "admin",
                    "createdAt": datetime.now(),
                    "updatedAt": datetime.now()
                }
                users_collection.insert_one(admin_user)
                print(f"Created placeholder admin user with ID: {admin_id}")
            else:
                print("Cannot proceed without a user. Exiting.")
                sys.exit(1)
        else:
            admin_id = any_user["_id"]
            print(f"Using user ID: {admin_id} as creator")
    else:
        admin_id = admin_user["_id"]
        print(f"Using admin user ID: {admin_id} as creator")
except Exception as e:
    print(f"Error finding or creating admin user: {e}")
    sys.exit(1)

# Define sample data for generating realistic patient information
first_names = [
    "Emma", "Liam", "Olivia", "Noah", "Ava", "William", "Sophia", "James", 
    "Isabella", "Benjamin", "Mia", "Elijah", "Charlotte", "Lucas", "Amelia",
    "Mason", "Harper", "Ethan", "Evelyn", "Alexander", "Abigail", "Henry", 
    "Emily", "Jacob", "Elizabeth", "Michael", "Sofia", "Daniel", "Avery", "Matthew"
]

last_names = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
    "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson",
    "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson",
    "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker"
]

cities = [
    "New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia",
    "San Antonio", "San Diego", "Dallas", "San Jose", "Austin", "Jacksonville",
    "Fort Worth", "Columbus", "Charlotte", "San Francisco", "Indianapolis", "Seattle",
    "Denver", "Boston", "Nashville", "Portland", "Las Vegas", "Atlanta", "Miami"
]

states = [
    "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", 
    "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", 
    "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", 
    "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", 
    "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
]

street_names = [
    "Main St", "Park Ave", "Oak St", "Cedar Rd", "Maple Dr", "Pine St", "Elm St",
    "Washington St", "Lake Ave", "Hill Rd", "River Rd", "Church St", "High St",
    "Sunset Blvd", "Lincoln Ave", "Ridge Rd", "Meadow Ln", "Valley View Dr",
    "Highland Ave", "Forest Dr", "Spring St", "Madison Ave", "Jefferson St"
]

relations = ["Spouse", "Parent", "Child", "Sibling", "Friend"]

# Define blood types, gender options and common allergies for realism
blood_types = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
gender_options = ['male', 'female', 'other', 'prefer not to say']
allergies_options = [
    'Penicillin', 'Sulfa drugs', 'Aspirin', 'Ibuprofen', 'Latex', 'Peanuts', 
    'Tree nuts', 'Shellfish', 'Eggs', 'Milk', 'Soy', 'Wheat', 'Dust mites', 
    'Pet dander', 'Mold', 'Pollen', 'Bee stings', 'Contrast dye'
]

def generate_phone():
    """Generate a random US-formatted phone number"""
    return f"({random.randint(100, 999)}) {random.randint(100, 999)}-{random.randint(1000, 9999)}"

def generate_email(first_name, last_name):
    """Generate a random email from first and last name"""
    domains = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "aol.com", "icloud.com"]
    separators = ["", ".", "_"]
    sep = random.choice(separators)
    domain = random.choice(domains)
    
    if random.random() < 0.5:
        # firstname.lastname@domain.com style
        email = f"{first_name.lower()}{sep}{last_name.lower()}@{domain}"
    else:
        # firstnamelastname + number @domain.com style
        if random.random() < 0.7:
            email = f"{first_name.lower()}{sep}{last_name.lower()}{random.randint(1, 99)}@{domain}"
        else:
            email = f"{first_name.lower()[0]}{sep}{last_name.lower()}@{domain}"
    
    return email

def generate_address():
    """Generate a random address"""
    number = random.randint(100, 9999)
    street = random.choice(street_names)
    city = random.choice(cities)
    state = random.choice(states)
    zipcode = random.randint(10000, 99999)
    return f"{number} {street}, {city}, {state} {zipcode}"

# Generate patients
patients = []
for i in range(15):
    # Generate basic patient information
    first_name = random.choice(first_names)
    last_name = random.choice(last_names)
    
    # Generate random birth date between 18 and 85 years ago
    birth_year = datetime.now().year - random.randint(18, 85)
    birth_month = random.randint(1, 12)
    birth_day = random.randint(1, 28)  # Using 28 to avoid invalid dates
    birth_date = datetime(birth_year, birth_month, birth_day)
    
    # Generate between 0 and 3 random allergies
    num_allergies = random.randint(0, 3)
    patient_allergies = random.sample(allergies_options, num_allergies) if num_allergies > 0 else []
    
    # Generate a realistic medical record number
    mrn = f"MRN{random.randint(100000, 999999)}"
    
    # Generate a realistic emergency contact
    emergency_first_name = random.choice(first_names)
    emergency_last_name = random.choice(last_names)
    emergency_name = f"{emergency_first_name} {emergency_last_name}"
    emergency_relation = random.choice(relations)
    emergency_contact = f"{emergency_name} ({emergency_relation}): {generate_phone()}"
    
    # Create the patient record
    patient = {
        "email": generate_email(first_name, last_name),
        "password": "password123",  # Would be hashed in a real scenario
        "role": "patient",
        "firstName": first_name,
        "lastName": last_name,
        "dateOfBirth": birth_date,
        "gender": random.choice(gender_options),
        "phone": generate_phone(),
        "address": generate_address(),
        "location": f"{random.choice(cities)}, {random.choice(states)}",
        "active": True,
        "medicalRecordNumber": mrn,
        "emergencyContact": emergency_contact,
        "bloodType": random.choice(blood_types),
        "allergies": patient_allergies,
        "createdBy": admin_id,
        "createdAt": datetime.now(),
        "updatedAt": datetime.now()
    }
    patients.append(patient)

# Check for existing patients to avoid duplicates
try:
    # Ask for confirmation before adding patients
    existing_count = users_collection.count_documents({"role": "patient"})
    if existing_count > 0:
        confirm = input(f"Found {existing_count} existing patients. Add 15 more? (y/n): ")
        if confirm.lower() != 'y':
            print("Operation cancelled by user.")
            sys.exit(0)
except Exception as e:
    print(f"Error checking existing patients: {e}")

# Insert patients into the database
try:
    # Hash passwords before inserting (in a real app)
    # In production, you would use bcrypt or similar, but for this script we'll keep it simple
    
    result = users_collection.insert_many(patients)
    print(f"Successfully added {len(result.inserted_ids)} patients to the database.")
    
    # Print the names of patients that were added
    for i, patient in enumerate(patients):
        print(f"  {i+1}. {patient['firstName']} {patient['lastName']} - {patient['email']}")
except Exception as e:
    print(f"Error adding patients: {e}")
    sys.exit(1)

print("Done!") 