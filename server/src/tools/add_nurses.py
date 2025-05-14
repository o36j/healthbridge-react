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

# Nurse data
nurse_first_names = [
    "Sarah", "Jessica", "Emily", "Ashley", "Amanda", "Rachel", "Megan", "Lauren",
    "Jennifer", "Melissa", "Nicole", "Michelle", "Stephanie", "Elizabeth", "Rebecca",
    "Michael", "John", "David", "James", "Robert", "William", "Joseph", "Richard",
    "Daniel", "Thomas", "Christopher", "Matthew", "Anthony", "Mark", "Steven"
]

nurse_last_names = [
    "Smith", "Johnson", "Williams", "Jones", "Brown", "Davis", "Miller", "Wilson",
    "Moore", "Taylor", "Anderson", "Thomas", "Jackson", "White", "Harris", "Martin",
    "Thompson", "Garcia", "Martinez", "Robinson", "Clark", "Rodriguez", "Lewis", "Lee",
    "Walker", "Hall", "Allen", "Young", "Hernandez", "King", "Wright", "Lopez", "Hill"
]

# Nursing specialties
nursing_specialties = [
    "Registered Nurse (RN)", "Licensed Practical Nurse (LPN)", "Certified Nursing Assistant (CNA)",
    "Nurse Practitioner (NP)", "Clinical Nurse Specialist (CNS)", "Certified Registered Nurse Anesthetist (CRNA)",
    "Intensive Care Unit (ICU) Nurse", "Emergency Room (ER) Nurse", "Operating Room (OR) Nurse",
    "Pediatric Nurse", "Neonatal Nurse", "Obstetric (OB) Nurse", "Geriatric Nurse",
    "Oncology Nurse", "Psychiatric Nurse", "Home Health Nurse", "Hospice Nurse", "Public Health Nurse",
    "School Nurse", "Nurse Educator", "Nurse Manager", "Case Management Nurse"
]

# Department assignments based on specialty
departments = {
    "Registered Nurse (RN)": "General Nursing",
    "Licensed Practical Nurse (LPN)": "General Nursing",
    "Certified Nursing Assistant (CNA)": "Support Care",
    "Nurse Practitioner (NP)": "Family Medicine",
    "Clinical Nurse Specialist (CNS)": "Specialized Care",
    "Certified Registered Nurse Anesthetist (CRNA)": "Anesthesiology",
    "Intensive Care Unit (ICU) Nurse": "Intensive Care",
    "Emergency Room (ER) Nurse": "Emergency Medicine",
    "Operating Room (OR) Nurse": "Surgery",
    "Pediatric Nurse": "Pediatrics",
    "Neonatal Nurse": "Neonatal Care",
    "Obstetric (OB) Nurse": "OB/GYN",
    "Geriatric Nurse": "Geriatrics",
    "Oncology Nurse": "Oncology",
    "Psychiatric Nurse": "Psychiatry",
    "Home Health Nurse": "Home Health",
    "Hospice Nurse": "Palliative Care",
    "Public Health Nurse": "Public Health",
    "School Nurse": "School Health",
    "Nurse Educator": "Education",
    "Nurse Manager": "Administration",
    "Case Management Nurse": "Case Management"
}

# Nursing education
nursing_education = [
    "Associate Degree in Nursing (ADN)",
    "Bachelor of Science in Nursing (BSN)",
    "Master of Science in Nursing (MSN)",
    "Doctor of Nursing Practice (DNP)",
    "PhD in Nursing"
]

# Nursing schools
nursing_schools = [
    "Johns Hopkins School of Nursing",
    "University of Pennsylvania School of Nursing",
    "Duke University School of Nursing",
    "University of Washington School of Nursing",
    "New York University Rory Meyers College of Nursing",
    "University of Michigan School of Nursing",
    "University of California, San Francisco School of Nursing",
    "Emory University Nell Hodgson Woodruff School of Nursing",
    "University of North Carolina at Chapel Hill School of Nursing",
    "University of Pittsburgh School of Nursing",
    "Columbia University School of Nursing",
    "Yale School of Nursing",
    "Vanderbilt University School of Nursing",
    "University of Illinois Chicago College of Nursing",
    "Ohio State University College of Nursing",
    "University of Texas Health Science Center at Houston School of Nursing",
    "University of Maryland School of Nursing",
    "Rush University College of Nursing",
    "Villanova University M. Louise Fitzpatrick College of Nursing",
    "Boston College Connell School of Nursing"
]

# Generate certification based on specialty
def generate_certification(specialty):
    """Generate appropriate certification based on nursing specialty"""
    certifications = {
        "Registered Nurse (RN)": "RN License",
        "Licensed Practical Nurse (LPN)": "LPN License",
        "Certified Nursing Assistant (CNA)": "CNA Certification",
        "Nurse Practitioner (NP)": "AANP Certification",
        "Clinical Nurse Specialist (CNS)": "CNS Certification",
        "Certified Registered Nurse Anesthetist (CRNA)": "CRNA Certification",
        "Intensive Care Unit (ICU) Nurse": "CCRN (Critical Care RN) Certification",
        "Emergency Room (ER) Nurse": "CEN (Certified Emergency Nurse)",
        "Operating Room (OR) Nurse": "CNOR Certification",
        "Pediatric Nurse": "CPN (Certified Pediatric Nurse)",
        "Neonatal Nurse": "RNC-NIC (Neonatal Intensive Care)",
        "Obstetric (OB) Nurse": "RNC-OB Certification",
        "Geriatric Nurse": "GERO-BC Certification",
        "Oncology Nurse": "OCN (Oncology Certified Nurse)",
        "Psychiatric Nurse": "PMH-BC (Psychiatric-Mental Health)",
        "Home Health Nurse": "HCS-D (Home Care Coding Specialist-Diagnosis)",
        "Hospice Nurse": "CHPN (Certified Hospice and Palliative Nurse)",
        "Public Health Nurse": "PHN Certification",
        "School Nurse": "NCSN (National Certified School Nurse)",
        "Nurse Educator": "CNE (Certified Nurse Educator)",
        "Nurse Manager": "CNML (Certified Nurse Manager and Leader)",
        "Case Management Nurse": "CCM (Certified Case Manager)"
    }
    
    return certifications.get(specialty, "Registered Nurse License")

def generate_license_number():
    """Generate a random nursing license number"""
    state_codes = ["AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", 
                   "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", 
                   "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", 
                   "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", 
                   "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"]
    
    state = random.choice(state_codes)
    return f"RN{state}{random.randint(100000, 999999)}"

def generate_email(first_name, last_name):
    """Generate a random email from first and last name"""
    domains = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "icloud.com", "nurse.com", "healthcare.org"]
    separators = ["", ".", "_"]
    sep = random.choice(separators)
    domain = random.choice(domains)
    
    # For nurses, sometimes include title or specialty
    if random.random() < 0.3:
        prefixes = ["nurse", "rn", "healthcare", "medical"]
        prefix = random.choice(prefixes)
        email = f"{prefix}{sep}{first_name.lower()}{sep}{last_name.lower()}@{domain}"
    elif random.random() < 0.5:
        # firstname.lastname@domain.com style
        email = f"{first_name.lower()}{sep}{last_name.lower()}@{domain}"
    else:
        # firstnamelastname + number @domain.com style
        email = f"{first_name.lower()}{sep}{last_name.lower()}{random.randint(1, 99)}@{domain}"
    
    return email

def generate_phone():
    """Generate a random US-formatted phone number"""
    return f"({random.randint(100, 999)}) {random.randint(100, 999)}-{random.randint(1000, 9999)}"

def generate_address():
    """Generate a random address"""
    number = random.randint(100, 9999)
    street_names = [
        "Main St", "Park Ave", "Oak St", "Cedar Rd", "Maple Dr", "Pine St", "Elm St",
        "Washington St", "Lake Ave", "Hill Rd", "River Rd", "Church St", "High St",
        "Sunset Blvd", "Lincoln Ave", "Ridge Rd", "Meadow Ln", "Valley View Dr"
    ]
    cities = [
        "New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia",
        "San Antonio", "San Diego", "Dallas", "San Jose", "Austin", "Jacksonville",
        "Fort Worth", "Columbus", "Charlotte", "San Francisco", "Indianapolis", "Seattle"
    ]
    states = [
        "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", 
        "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", 
        "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", 
        "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", 
        "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
    ]
    
    street = random.choice(street_names)
    city = random.choice(cities)
    state = random.choice(states)
    zipcode = random.randint(10000, 99999)
    
    return f"{number} {street}, {city}, {state} {zipcode}"

def generate_education_history():
    """Generate nursing education history"""
    degree = random.choice(nursing_education)
    school = random.choice(nursing_schools)
    graduation_year = datetime.now().year - random.randint(1, 25)  # Graduated 1-25 years ago
    
    education = {
        "degree": degree,
        "school": school,
        "graduation_year": graduation_year
    }
    
    # Sometimes add additional certification
    if random.random() < 0.7:
        certifications = [
            "Basic Life Support (BLS)", 
            "Advanced Cardiac Life Support (ACLS)",
            "Pediatric Advanced Life Support (PALS)",
            "Trauma Nursing Core Course (TNCC)",
            "Emergency Nursing Pediatric Course (ENPC)",
            "Certified Emergency Nurse (CEN)",
            "Critical Care Registered Nurse (CCRN)",
            "Medical-Surgical Nursing Certification (MEDSURG-BC)"
        ]
        education["additional_certifications"] = random.sample(certifications, random.randint(1, 3))
    
    return education

def generate_professional_profile(specialty):
    """Generate a professional profile for a nurse"""
    years_experience = random.randint(1, 20)
    
    # Generate bio
    bio_templates = [
        f"Dedicated {specialty} with {years_experience} years of experience providing compassionate patient care.",
        f"Experienced {specialty} focused on delivering high-quality patient-centered care. {years_experience} years in the healthcare field.",
        f"Compassionate {specialty} with {years_experience} years of clinical experience in diverse healthcare settings.",
        f"Detail-oriented {specialty} with {years_experience} years of experience and a passion for patient advocacy."
    ]
    
    bio = random.choice(bio_templates)
    
    # Generate availability
    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    work_days = random.sample(days, random.randint(3, 5))  # Nurses typically work 3-5 days
    work_days.sort(key=lambda x: days.index(x))
    
    shifts = ["Morning (7AM-3PM)", "Evening (3PM-11PM)", "Night (11PM-7AM)", "Rotating"]
    primary_shift = random.choice(shifts)
    
    availability = {
        "days": work_days,
        "shift": primary_shift
    }
    
    # Build professional profile
    profile = {
        "bio": bio,
        "education": generate_education_history(),
        "experience": f"{years_experience} years",
        "availability": availability,
        "specialties": [specialty],
        "languages": ["English"]
    }
    
    # Sometimes add another language
    if random.random() < 0.3:
        additional_languages = ["Spanish", "French", "Chinese", "Tagalog", "Vietnamese", "Korean", "Russian", "Arabic"]
        additional = random.choice(additional_languages)
        profile["languages"].append(additional)
    
    return profile

# Generate nurses
nurses = []
for i in range(7):
    # Generate basic nurse information
    first_name = random.choice(nurse_first_names)
    last_name = random.choice(nurse_last_names)
    
    # Determine gender based on first name list position
    is_female = True
    if first_name in nurse_first_names[16:]:  # Male names start at index 16
        is_female = False
    
    # Generate random birth date (25-60 years old)
    birth_year = datetime.now().year - random.randint(25, 60)
    birth_month = random.randint(1, 12)
    birth_day = random.randint(1, 28)  # Using 28 to avoid invalid dates
    birth_date = datetime(birth_year, birth_month, birth_day)
    
    # Generate specialty
    specialty = random.choice(nursing_specialties)
    
    # Get department based on specialty
    department = departments.get(specialty, "General Nursing")
    
    # Generate professional profile
    profile = generate_professional_profile(specialty)
    
    # Calculate rating based on experience (more experience tends to higher rating, but with some randomness)
    experience_years = int(profile["experience"].split()[0])
    base_rating = min(3.5 + (experience_years / 15), 4.9)  # Max base rating is 4.9
    rating_variance = random.uniform(-0.3, 0.3)  # Add some randomness
    rating = max(3.5, min(5, base_rating + rating_variance))  # Keep between 3.5 and 5
    
    rating_count = random.randint(5, 100)  # Number of ratings
    
    # Create the nurse record
    nurse = {
        "email": generate_email(first_name, last_name),
        "password": "password123",  # Would be hashed in a real scenario
        "role": "nurse",
        "firstName": first_name,
        "lastName": last_name,
        "dateOfBirth": birth_date,
        "gender": "female" if is_female else "male",
        "phone": generate_phone(),
        "address": generate_address(),
        "location": f"{random.choice(['Hospital', 'Clinic', 'Medical Center', 'Health Center'])}",
        "active": True,
        "department": department,
        "specialization": specialty,
        "licenseNumber": generate_license_number(),
        "certification": generate_certification(specialty),
        "rating": round(rating, 1),
        "ratingCount": rating_count,
        "professionalProfile": profile,
        "createdBy": admin_id,
        "createdAt": datetime.now(),
        "updatedAt": datetime.now(),
        # Visibility settings
        "visibilitySettings": {
            "phone": random.random() < 0.3,  # 30% chance of showing phone
            "email": random.random() < 0.4,  # 40% chance of showing email
            "department": True,
            "specialization": True,
            "licenseNumber": random.random() < 0.3,  # 30% chance of showing license
            "bio": True,
            "education": True,
            "experience": True
        }
    }
    nurses.append(nurse)

# Check for existing nurses
try:
    # Ask for confirmation before adding nurses
    existing_count = users_collection.count_documents({"role": "nurse"})
    if existing_count > 0:
        confirm = input(f"Found {existing_count} existing nurses. Add 7 more? (y/n): ")
        if confirm.lower() != 'y':
            print("Operation cancelled by user.")
            sys.exit(0)
except Exception as e:
    print(f"Error checking existing nurses: {e}")

# Insert nurses into the database
try:
    result = users_collection.insert_many(nurses)
    print(f"Successfully added {len(result.inserted_ids)} nurses to the database.")
    
    # Print the names of nurses that were added
    for i, nurse in enumerate(nurses):
        print(f"  {i+1}. {nurse['firstName']} {nurse['lastName']} - {nurse['specialization']}")
except Exception as e:
    print(f"Error adding nurses: {e}")
    sys.exit(1)

print("Done!") 