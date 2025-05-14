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

# Define international data for generating diverse patient information
# Names from various global cultures
international_first_names = [
    # Indian
    "Aanya", "Vihaan", "Diya", "Arjun", 
    # Chinese
    "Wei", "Jing", "Li", "Zhang", 
    # Nigerian
    "Adebayo", "Chioma", "Oluwaseun", "Ngozi", 
    # Brazilian
    "Matheus", "Larissa", "João", "Gabriela", 
    # Russian
    "Alexei", "Anastasia", "Dmitri", "Ekaterina", 
    # Japanese
    "Haruto", "Aoi", "Yuki", "Sakura", 
    # Arabic
    "Ahmed", "Fatima", "Mohammed", "Aisha", 
    # Spanish
    "Miguel", "Sofia", "Javier", "Isabella", 
    # German
    "Lukas", "Hannah", "Felix", "Emma", 
    # French
    "Lucas", "Camille", "Hugo", "Léa"
]

international_last_names = [
    # Indian
    "Patel", "Sharma", "Singh", "Khan", 
    # Chinese
    "Wang", "Li", "Zhang", "Chen", 
    # Nigerian
    "Adeyemi", "Okafor", "Eze", "Okonkwo", 
    # Brazilian
    "Silva", "Santos", "Oliveira", "Pereira", 
    # Russian
    "Petrov", "Ivanov", "Smirnov", "Kuznetsov", 
    # Japanese
    "Sato", "Suzuki", "Takahashi", "Tanaka", 
    # Arabic
    "Al-Farsi", "Al-Hashemi", "Abdullah", "Rahman", 
    # Spanish
    "Rodriguez", "Hernandez", "Garcia", "Martinez", 
    # German
    "Müller", "Schmidt", "Schneider", "Fischer", 
    # French
    "Martin", "Bernard", "Dubois", "Thomas"
]

# International cities and countries
international_locations = [
    ("Mumbai", "India"),
    ("Delhi", "India"),
    ("Beijing", "China"),
    ("Shanghai", "China"),
    ("Lagos", "Nigeria"),
    ("Abuja", "Nigeria"),
    ("São Paulo", "Brazil"),
    ("Rio de Janeiro", "Brazil"),
    ("Moscow", "Russia"),
    ("St. Petersburg", "Russia"),
    ("Tokyo", "Japan"),
    ("Osaka", "Japan"),
    ("Dubai", "UAE"),
    ("Cairo", "Egypt"),
    ("Madrid", "Spain"),
    ("Barcelona", "Spain"),
    ("Berlin", "Germany"),
    ("Munich", "Germany"),
    ("Paris", "France"),
    ("Lyon", "France"),
    ("London", "UK"),
    ("Manchester", "UK"),
    ("Toronto", "Canada"),
    ("Vancouver", "Canada"),
    ("Mexico City", "Mexico"),
    ("Sydney", "Australia"),
    ("Melbourne", "Australia"),
    ("Auckland", "New Zealand"),
    ("Cape Town", "South Africa"),
    ("Johannesburg", "South Africa"),
    ("Bangkok", "Thailand"),
    ("Seoul", "South Korea"),
    ("Singapore", "Singapore"),
    ("Rome", "Italy"),
    ("Milan", "Italy"),
    ("Amsterdam", "Netherlands"),
    ("Stockholm", "Sweden"),
    ("Geneva", "Switzerland"),
    ("Brussels", "Belgium"),
    ("Vienna", "Austria")
]

# International address formats
def generate_international_address(city, country):
    """Generate a random international address"""
    number = random.randint(1, 200)
    
    # Different address formats for different countries
    street_types = {
        "India": ["Road", "Street", "Avenue", "Marg"],
        "China": ["Road", "Street", "Avenue"],
        "Nigeria": ["Street", "Road", "Avenue", "Close"],
        "Brazil": ["Rua", "Avenida", "Alameda", "Travessa"],
        "Russia": ["Ulitsa", "Prospekt", "Pereulok"],
        "Japan": ["Dori", "Chome", "Ku"],
        "UAE": ["Street", "Road", "Avenue"],
        "Egypt": ["Street", "Road", "Avenue"],
        "Spain": ["Calle", "Avenida", "Plaza", "Paseo"],
        "Germany": ["Straße", "Weg", "Platz", "Gasse"],
        "France": ["Rue", "Avenue", "Boulevard", "Place"],
        "UK": ["Street", "Road", "Avenue", "Lane"],
        "Canada": ["Street", "Road", "Avenue", "Drive"],
        "Mexico": ["Calle", "Avenida", "Boulevard"],
        "Australia": ["Street", "Road", "Avenue", "Drive"],
        "New Zealand": ["Street", "Road", "Avenue", "Drive"],
        "South Africa": ["Street", "Road", "Avenue", "Drive"],
        "Thailand": ["Road", "Street", "Soi"],
        "South Korea": ["Ro", "Gil", "Dong"],
        "Singapore": ["Road", "Street", "Avenue", "Drive"],
        "Italy": ["Via", "Corso", "Piazza", "Viale"],
        "Netherlands": ["Straat", "Weg", "Plein", "Laan"],
        "Sweden": ["Gatan", "Vägen", "Allén"],
        "Switzerland": ["Straße", "Weg", "Platz", "Gasse"],
        "Belgium": ["Rue", "Avenue", "Boulevard", "Straat"],
        "Austria": ["Straße", "Weg", "Platz", "Gasse"]
    }
    
    # Use generic street type if country not in list
    street_type = random.choice(street_types.get(country, ["Street", "Road", "Avenue"]))
    
    # Random street names
    street_names = [
        "Oak", "Maple", "Pine", "Cedar", "Rose", "Lily", "Jasmine", "Lotus",
        "Green", "Blue", "Red", "White", "Mountain", "River", "Lake", "Ocean",
        "Sun", "Moon", "Star", "Cloud", "North", "South", "East", "West",
        "Central", "Royal", "National", "Grand", "Victoria", "Elizabeth", "King", "Queen"
    ]
    
    street_name = random.choice(street_names)
    
    # Different postal code formats
    postal_code = ""
    if country in ["US", "Canada"]:
        postal_code = f"{random.randint(10000, 99999)}"
    elif country == "UK":
        postal_code = f"{random.choice('ABCDEFGHIJKLMNOPRSTUVWXY')}{random.randint(1, 99)} {random.randint(1, 9)}{random.choice('ABCDEFGHJKMNPQRSTUVWXYZ')}{random.choice('ABCDEFGHJKMNPQRSTUVWXYZ')}"
    elif country in ["France", "Germany", "Italy", "Spain"]:
        postal_code = f"{random.randint(10000, 99999)}"
    elif country == "Japan":
        postal_code = f"{random.randint(100, 999)}-{random.randint(1000, 9999)}"
    elif country == "Brazil":
        postal_code = f"{random.randint(10000, 99999)}-{random.randint(100, 999)}"
    elif country == "Australia":
        postal_code = f"{random.randint(1000, 9999)}"
    else:
        postal_code = f"{random.randint(10000, 99999)}"
    
    # Build the address based on common formats for the country
    if country in ["US", "Canada", "Australia", "UK"]:
        return f"{number} {street_name} {street_type}, {city}, {country}, {postal_code}"
    elif country in ["Japan", "South Korea"]:
        return f"{city}, {street_name} {street_type} {number}, {country}, {postal_code}"
    elif country in ["France", "Spain", "Italy"]:
        return f"{street_type} {street_name} {number}, {city}, {country}, {postal_code}"
    else:
        return f"{number} {street_name} {street_type}, {city}, {country}, {postal_code}"

# International phone number formats
def generate_international_phone(country):
    """Generate a random phone number based on country"""
    country_codes = {
        "India": "+91",
        "China": "+86",
        "Nigeria": "+234",
        "Brazil": "+55",
        "Russia": "+7",
        "Japan": "+81",
        "UAE": "+971",
        "Egypt": "+20",
        "Spain": "+34",
        "Germany": "+49",
        "France": "+33",
        "UK": "+44",
        "Canada": "+1",
        "Mexico": "+52",
        "Australia": "+61",
        "New Zealand": "+64",
        "South Africa": "+27",
        "Thailand": "+66",
        "South Korea": "+82",
        "Singapore": "+65",
        "Italy": "+39",
        "Netherlands": "+31",
        "Sweden": "+46",
        "Switzerland": "+41",
        "Belgium": "+32",
        "Austria": "+43"
    }
    
    country_code = country_codes.get(country, "+1")  # Default to US format
    
    if country in ["US", "Canada"]:
        return f"{country_code} ({random.randint(100, 999)}) {random.randint(100, 999)}-{random.randint(1000, 9999)}"
    elif country in ["UK"]:
        return f"{country_code} {random.randint(1000, 9999)} {random.randint(100000, 999999)}"
    elif country in ["India"]:
        return f"{country_code} {random.randint(7000000000, 9999999999)}"
    elif country in ["China"]:
        return f"{country_code} {random.randint(130, 199)} {random.randint(1000, 9999)} {random.randint(1000, 9999)}"
    elif country in ["Brazil"]:
        return f"{country_code} {random.randint(10, 99)} {random.randint(7, 9)}{random.randint(1000, 9999)}-{random.randint(1000, 9999)}"
    else:
        # Generic international format
        return f"{country_code} {random.randint(100000, 999999)}{random.randint(1000, 9999)}"

def generate_email(first_name, last_name):
    """Generate a random email from first and last name"""
    domains = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "mail.com", "icloud.com"]
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

# Define blood types, gender options and common allergies for realism
blood_types = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
gender_options = ['male', 'female', 'other', 'prefer not to say']
allergies_options = [
    'Penicillin', 'Sulfa drugs', 'Aspirin', 'Ibuprofen', 'Latex', 'Peanuts', 
    'Tree nuts', 'Shellfish', 'Eggs', 'Milk', 'Soy', 'Wheat', 'Dust mites', 
    'Pet dander', 'Mold', 'Pollen', 'Bee stings', 'Contrast dye'
]

# Relations for emergency contacts
relations = ["Spouse", "Parent", "Child", "Sibling", "Friend"]

# Generate international patients
patients = []
for i in range(15):
    # Generate basic patient information
    first_name = random.choice(international_first_names)
    last_name = random.choice(international_last_names)
    
    # Generate random birth date between 18 and 85 years ago
    birth_year = datetime.now().year - random.randint(18, 85)
    birth_month = random.randint(1, 12)
    birth_day = random.randint(1, 28)  # Using 28 to avoid invalid dates
    birth_date = datetime(birth_year, birth_month, birth_day)
    
    # Generate between 0 and 3 random allergies
    num_allergies = random.randint(0, 3)
    patient_allergies = random.sample(allergies_options, num_allergies) if num_allergies > 0 else []
    
    # Generate a realistic medical record number with international prefix
    mrn = f"INT-MRN{random.randint(100000, 999999)}"
    
    # Generate location
    city, country = random.choice(international_locations)
    
    # Generate a realistic emergency contact
    emergency_first_name = random.choice(international_first_names)
    emergency_last_name = random.choice(international_last_names)
    emergency_name = f"{emergency_first_name} {emergency_last_name}"
    emergency_relation = random.choice(relations)
    emergency_contact = f"{emergency_name} ({emergency_relation}): {generate_international_phone(country)}"
    
    # Create the patient record
    patient = {
        "email": generate_email(first_name, last_name),
        "password": "password123",  # Would be hashed in a real scenario
        "role": "patient",
        "firstName": first_name,
        "lastName": last_name,
        "dateOfBirth": birth_date,
        "gender": random.choice(gender_options),
        "phone": generate_international_phone(country),
        "address": generate_international_address(city, country),
        "location": f"{city}, {country}",
        "active": True,
        "medicalRecordNumber": mrn,
        "emergencyContact": emergency_contact,
        "bloodType": random.choice(blood_types),
        "allergies": patient_allergies,
        # Additional fields for international patients
        "isInternational": True,
        "nationality": country,
        "preferredLanguage": random.choice(["English", country, "French", "Spanish"]), 
        "passportNumber": f"{random.choice('ABCDEFGHIJKLMNOPQRSTUVWXYZ')}{random.randint(10000000, 99999999)}",
        "createdBy": admin_id,
        "createdAt": datetime.now(),
        "updatedAt": datetime.now()
    }
    patients.append(patient)

# Check for existing international patients to avoid duplicates
try:
    # Ask for confirmation before adding patients
    existing_count = users_collection.count_documents({"role": "patient", "isInternational": True})
    if existing_count > 0:
        confirm = input(f"Found {existing_count} existing international patients. Add 15 more? (y/n): ")
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
    print(f"Successfully added {len(result.inserted_ids)} international patients to the database.")
    
    # Print the names of patients that were added
    for i, patient in enumerate(patients):
        print(f"  {i+1}. {patient['firstName']} {patient['lastName']} - {patient['location']} - {patient['email']}")
except Exception as e:
    print(f"Error adding patients: {e}")
    sys.exit(1)

print("Done!") 