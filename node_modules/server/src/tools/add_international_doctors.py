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

# Middle Eastern doctor data
# Turkish names
turkish_first_names = [
    "Ahmet", "Mehmet", "Mustafa", "Ali", "Ibrahim", "Hasan", "Hüseyin", "Can", "Emre", "Oğuz", 
    "Ayşe", "Fatma", "Emine", "Hatice", "Zeynep", "Elif", "Meryem", "Özge", "Selin", "Deniz"
]

turkish_last_names = [
    "Yılmaz", "Kaya", "Demir", "Şahin", "Çelik", "Yıldız", "Erdoğan", "Öztürk", "Aydın", "Özdemir",
    "Arslan", "Doğan", "Kılıç", "Aslan", "Çetin", "Koç", "Kurt", "Yıldırım", "Polat", "Şimşek"
]

# Other Middle Eastern names
middle_eastern_first_names = [
    # Arabic
    "Mohammed", "Ahmed", "Hassan", "Abdullah", "Samir", "Omar", "Ali", "Khalid", "Tariq", "Ziad",
    "Fatima", "Aisha", "Maryam", "Layla", "Zainab", "Noor", "Huda", "Amira", "Rania", "Samira",
    # Persian
    "Reza", "Amir", "Arash", "Darius", "Farhad", "Javad", "Kamran", "Mehran", "Nima", "Parsa",
    "Leila", "Zahra", "Shirin", "Yasmin", "Azadeh", "Bahar", "Firouzeh", "Golnar", "Nasrin", "Parisa"
]

middle_eastern_last_names = [
    # Arabic
    "Al-Farsi", "Al-Hashemi", "Al-Mahmoud", "Al-Sharif", "Al-Hassan", "Al-Qasim", "Al-Said", "Al-Zaidi", "Al-Rahman", "Al-Najjar",
    # Persian
    "Hosseini", "Ahmadi", "Mohammadi", "Rahimi", "Jafari", "Karimi", "Moradi", "Rezaei", "Mousavi", "Naseri"
]

# Medical specialties with realistic distribution
specialties = [
    # Common specialties
    "Family Medicine", "Internal Medicine", "Pediatrics", "General Surgery", 
    "Obstetrics and Gynecology", "Cardiology", "Orthopedics", "Dermatology",
    # Less common specialties
    "Neurology", "Psychiatry", "Ophthalmology", "Oncology", "Endocrinology",
    "Gastroenterology", "Nephrology", "Urology", "Pulmonology", "Rheumatology",
    # Very specialized
    "Hematology", "Infectious Disease", "Allergy and Immunology", "Nuclear Medicine",
    "Plastic Surgery", "Vascular Surgery", "Neonatology", "Geriatrics"
]

# Medical education institutions in the Middle East
medical_schools = [
    # Turkey
    "Istanbul University Faculty of Medicine", "Hacettepe University Faculty of Medicine", 
    "Ankara University Faculty of Medicine", "Ege University Faculty of Medicine",
    "Çukurova University Faculty of Medicine", "Marmara University Faculty of Medicine",
    # Saudi Arabia
    "King Saud University College of Medicine", "King Abdulaziz University Faculty of Medicine",
    # Egypt
    "Cairo University Faculty of Medicine", "Ain Shams University Faculty of Medicine",
    # Lebanon
    "American University of Beirut Faculty of Medicine", "Lebanese University Faculty of Medicine",
    # UAE
    "United Arab Emirates University College of Medicine", "Mohammed Bin Rashid University of Medicine",
    # Jordan
    "University of Jordan School of Medicine", "Jordan University of Science and Technology",
    # International schools often attended by Middle Eastern doctors
    "Harvard Medical School", "Johns Hopkins School of Medicine", 
    "University of Oxford Medical School", "Imperial College London School of Medicine"
]

# Middle Eastern cities with focus on Turkey
locations = [
    # Turkey (12 major cities)
    ("Istanbul", "Turkey"),
    ("Ankara", "Turkey"),
    ("Izmir", "Turkey"),
    ("Bursa", "Turkey"),
    ("Antalya", "Turkey"),
    ("Adana", "Turkey"),
    ("Konya", "Turkey"),
    ("Gaziantep", "Turkey"),
    ("Mersin", "Turkey"),
    ("Diyarbakır", "Turkey"),
    ("Kayseri", "Turkey"),
    ("Eskişehir", "Turkey"),
    # Other Middle Eastern countries
    ("Dubai", "UAE"),
    ("Abu Dhabi", "UAE"),
    ("Riyadh", "Saudi Arabia"),
    ("Jeddah", "Saudi Arabia"),
    ("Cairo", "Egypt"),
    ("Alexandria", "Egypt"),
    ("Beirut", "Lebanon"),
    ("Amman", "Jordan"),
    ("Baghdad", "Iraq"),
    ("Tehran", "Iran"),
    ("Doha", "Qatar"),
    ("Kuwait City", "Kuwait")
]

# Ensure we have mostly Turkish locations
turkish_weight = 0.7  # 70% chance of a Turkish location

# Hospital names by country
hospitals = {
    "Turkey": [
        "Acıbadem Hospital", "Memorial Hospital", "Medicana International Hospital", 
        "Medical Park Hospital", "Liv Hospital", "Amerikan Hospital", "Florence Nightingale Hospital",
        "Bayındır Hospital", "Güven Hospital", "Başkent University Hospital"
    ],
    "UAE": [
        "Cleveland Clinic Abu Dhabi", "Burjeel Hospital", "Zulekha Hospital", 
        "American Hospital Dubai", "Saudi German Hospital"
    ],
    "Saudi Arabia": [
        "King Faisal Specialist Hospital", "Dr. Sulaiman Al Habib Hospital", 
        "King Fahad Medical City", "Saudi German Hospital"
    ],
    "Egypt": [
        "As-Salam International Hospital", "Dar Al Fouad Hospital", 
        "Cleopatra Hospital", "El Katib Hospital"
    ],
    "Lebanon": [
        "American University of Beirut Medical Center", "Clemenceau Medical Center", 
        "Hotel Dieu de France Hospital", "Rizk Hospital"
    ],
    "Jordan": [
        "Jordan University Hospital", "King Abdullah University Hospital", 
        "Al-Khalidi Hospital", "Arab Medical Center"
    ],
    "Iraq": [
        "Baghdad Medical City", "Ibn Sina Hospital", "Al-Yarmouk Teaching Hospital"
    ],
    "Iran": [
        "Tehran Heart Center", "Shahid Beheshti Medical Center", "Milad Hospital"
    ],
    "Qatar": [
        "Hamad Medical Corporation", "Sidra Medicine", "Al Ahli Hospital"
    ],
    "Kuwait": [
        "Kuwait Hospital", "Al-Sabah Hospital", "Mubarak Al-Kabeer Hospital"
    ]
}

# International phone number formats
def generate_international_phone(country):
    """Generate a random phone number based on country"""
    country_codes = {
        "Turkey": "+90",
        "UAE": "+971",
        "Saudi Arabia": "+966",
        "Egypt": "+20",
        "Lebanon": "+961",
        "Jordan": "+962",
        "Iraq": "+964",
        "Iran": "+98",
        "Qatar": "+974",
        "Kuwait": "+965"
    }
    
    country_code = country_codes.get(country, "+90")  # Default to Turkey format
    
    if country == "Turkey":
        return f"{country_code} {random.randint(500, 559)} {random.randint(100, 999)} {random.randint(1000, 9999)}"
    elif country in ["UAE", "Saudi Arabia", "Qatar", "Kuwait"]:
        return f"{country_code} {random.randint(50, 59)} {random.randint(100, 999)} {random.randint(1000, 9999)}"
    elif country in ["Egypt"]:
        return f"{country_code} {random.randint(10, 15)} {random.randint(1000, 9999)} {random.randint(1000, 9999)}"
    else:
        # Generic Middle Eastern format
        return f"{country_code} {random.randint(50, 79)} {random.randint(100, 999)} {random.randint(1000, 9999)}"

def generate_international_address(city, country):
    """Generate a random address based on country"""
    number = random.randint(1, 120)
    
    # Different address formats for different countries
    street_types = {
        "Turkey": ["Caddesi", "Sokak", "Bulvarı", "Mahallesi"],
        "UAE": ["Street", "Road", "Avenue"],
        "Saudi Arabia": ["Street", "Road", "Way"],
        "Egypt": ["Street", "Avenue", "Square"],
        "Lebanon": ["Street", "Avenue", "Boulevard"],
        "Jordan": ["Street", "Road", "Avenue"],
        "Iraq": ["Street", "Road", "Square"],
        "Iran": ["Street", "Avenue", "Boulevard"],
        "Qatar": ["Street", "Road", "Zone"],
        "Kuwait": ["Street", "Road", "Block"]
    }
    
    # Use generic street type if country not in list
    street_type = random.choice(street_types.get(country, ["Street", "Road", "Avenue"]))
    
    # Street names based on region
    if country == "Turkey":
        street_names = [
            "Atatürk", "Cumhuriyet", "İstiklal", "Millet", "Bağdat", "Istiklal", 
            "İnönü", "Vatan", "Gazi", "Fatih", "Fevzi Çakmak", "Kızılay"
        ]
    else:
        street_names = [
            "Al Wahda", "Al Salam", "Al Quds", "Al Nahda", "Al Jazeera", "Al Noor",
            "Mohammed", "Sultan Qaboos", "King Abdullah", "Sheikh Zayed", "Hamdan"
        ]
    
    street_name = random.choice(street_names)
    
    # Different postal code formats
    if country == "Turkey":
        postal_code = f"{random.randint(10000, 81900)}"
    elif country in ["UAE"]:
        postal_code = f"{random.randint(10000, 99999)}"
    elif country in ["Saudi Arabia"]:
        postal_code = f"{random.randint(10000, 99999)}-{random.randint(1000, 9999)}"
    else:
        postal_code = f"{random.randint(10000, 99999)}"
    
    # Build the address based on common formats for the country
    if country == "Turkey":
        district = random.choice(["Beyoğlu", "Kadıköy", "Şişli", "Beşiktaş", "Üsküdar", "Bahçelievler", "Bağcılar", "Bakırköy", "Fatih", "Gaziosmanpaşa"])
        return f"{street_name} {street_type} No:{number}, {district}, {city}, {country}, {postal_code}"
    elif country in ["UAE", "Saudi Arabia", "Qatar", "Kuwait"]:
        district = random.choice(["Al Nahyan", "Al Bateen", "Al Manhal", "Al Mushrif", "Al Khalidiya", "Al Danah", "Al Markaziyah"])
        return f"{number} {street_name} {street_type}, {district}, {city}, {country}, {postal_code}"
    else:
        return f"{number} {street_name} {street_type}, {city}, {country}, {postal_code}"

def generate_email(first_name, last_name):
    """Generate a random email from first and last name"""
    domains = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "icloud.com", "doctor.com", "medmail.com"]
    separators = ["", ".", "_"]
    sep = random.choice(separators)
    domain = random.choice(domains)
    
    # For doctors, sometimes include title or specialty
    if random.random() < 0.3:
        prefixes = ["dr", "doctor", "med", "doc"]
        prefix = random.choice(prefixes)
        email = f"{prefix}{sep}{first_name.lower()}{sep}{last_name.lower()}@{domain}"
    elif random.random() < 0.5:
        # firstname.lastname@domain.com style
        email = f"{first_name.lower()}{sep}{last_name.lower()}@{domain}"
    else:
        # firstnamelastname + number @domain.com style
        email = f"{first_name.lower()}{sep}{last_name.lower()}{random.randint(1, 99)}@{domain}"
    
    return email

def generate_license_number(country):
    """Generate a realistic medical license number based on country"""
    if country == "Turkey":
        return f"TR-MD-{random.randint(10000, 99999)}"
    elif country == "UAE":
        return f"UAE-DHA-{random.randint(1000, 9999)}"
    elif country == "Saudi Arabia":
        return f"SCFHS-{random.randint(10000, 99999)}"
    elif country == "Egypt":
        return f"EG-MS-{random.randint(10000, 99999)}"
    else:
        return f"MED-{country[:2].upper()}-{random.randint(10000, 99999)}"

def generate_education():
    """Generate education history for a doctor"""
    school = random.choice(medical_schools)
    graduation_year = datetime.now().year - random.randint(5, 35)  # Graduated 5-35 years ago
    
    education = {
        "medical_school": school,
        "degree": "M.D.",
        "graduation_year": graduation_year
    }
    
    # Add residency
    residency_specialty = random.choice(specialties)
    residency_years = f"{graduation_year + 1} - {graduation_year + 4}"
    education["residency"] = {
        "specialty": residency_specialty,
        "institution": random.choice(medical_schools),
        "years": residency_years
    }
    
    # Sometimes add fellowship
    if random.random() < 0.4:
        fellowship_specialty = random.choice([s for s in specialties if s != residency_specialty])
        fellowship_years = f"{graduation_year + 5} - {graduation_year + 7}"
        education["fellowship"] = {
            "specialty": fellowship_specialty,
            "institution": random.choice(medical_schools),
            "years": fellowship_years
        }
    
    return education

def generate_professional_profile(specialty, country, city):
    """Generate a professional profile for a doctor"""
    # Choose a hospital based on country
    if country in hospitals:
        hospital = random.choice(hospitals[country])
    else:
        hospital = f"{city} Medical Center"
    
    years_experience = random.randint(5, 30)
    
    # Generate bio
    bio_templates = [
        f"Board-certified {specialty} specialist with {years_experience} years of experience. Currently practicing at {hospital} in {city}, {country}.",
        f"Experienced {specialty} doctor specializing in advanced treatments and patient care. {years_experience} years of clinical experience at {hospital}.",
        f"Dedicated {specialty} physician with {years_experience} years of experience in both clinical practice and research. Affiliated with {hospital}.",
        f"{specialty} specialist with a focus on innovative treatments and compassionate care. {years_experience} years of medical practice at {hospital} in {city}."
    ]
    
    bio = random.choice(bio_templates)
    
    # Generate availability
    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    work_days = random.sample(days, random.randint(3, 6))
    work_days.sort(key=lambda x: days.index(x))
    
    availability = {}
    for day in work_days:
        start_hour = random.randint(8, 10)
        end_hour = random.randint(16, 19)
        availability[day] = f"{start_hour}:00 - {end_hour}:00"
    
    # Generate consultation fee
    if country == "Turkey":
        currency = "TRY"
        base_amount = random.randint(500, 2000)
    elif country in ["UAE", "Saudi Arabia", "Qatar", "Kuwait"]:
        currency = "USD"
        base_amount = random.randint(100, 500)
    else:
        currency = "USD"
        base_amount = random.randint(50, 300)
    
    consultation_fee = f"{base_amount} {currency}"
    
    # Build professional profile
    profile = {
        "bio": bio,
        "education": generate_education(),
        "experience": f"{years_experience} years",
        "hospital": hospital,
        "availability": availability,
        "consultationFee": consultation_fee,
        "acceptingNewPatients": random.random() < 0.8,
        "telehealth": random.random() < 0.7,
        "languages": ["English"]
    }
    
    # Add local language
    if country == "Turkey":
        profile["languages"].append("Turkish")
    elif country in ["UAE", "Saudi Arabia", "Egypt", "Lebanon", "Jordan", "Iraq"]:
        profile["languages"].append("Arabic")
    elif country == "Iran":
        profile["languages"].append("Persian")
    
    # Sometimes add another language
    if random.random() < 0.4:
        additional_languages = ["French", "German", "Spanish", "Russian", "Italian"]
        additional = random.choice(additional_languages)
        if additional not in profile["languages"]:
            profile["languages"].append(additional)
    
    return profile

# Generate doctors
doctors = []
for i in range(20):
    # Determine ethnicity and location (70% Turkish, 30% other Middle Eastern)
    if random.random() < 0.7:
        first_name = random.choice(turkish_first_names)
        last_name = random.choice(turkish_last_names)
        # For Turkish doctors, ensure they're in Turkey
        turkish_locations = [loc for loc in locations if loc[1] == "Turkey"]
        city, country = random.choice(turkish_locations)
    else:
        first_name = random.choice(middle_eastern_first_names)
        last_name = random.choice(middle_eastern_last_names)
        # For other Middle Eastern doctors, can be anywhere in the Middle East
        city, country = random.choice(locations)
    
    # Generate random birth date for a doctor (30-70 years old)
    birth_year = datetime.now().year - random.randint(30, 70)
    birth_month = random.randint(1, 12)
    birth_day = random.randint(1, 28)  # Using 28 to avoid invalid dates
    birth_date = datetime(birth_year, birth_month, birth_day)
    
    # Generate specialty
    specialty = random.choice(specialties)
    
    # Generate department based on specialty
    departments = {
        "Family Medicine": "Family Medicine",
        "Internal Medicine": "Internal Medicine",
        "Pediatrics": "Pediatrics",
        "General Surgery": "Surgery",
        "Obstetrics and Gynecology": "OB/GYN",
        "Cardiology": "Cardiology",
        "Orthopedics": "Orthopedics",
        "Dermatology": "Dermatology",
        "Neurology": "Neurology",
        "Psychiatry": "Psychiatry",
        "Ophthalmology": "Ophthalmology",
        "Oncology": "Oncology",
        "Endocrinology": "Endocrinology",
        "Gastroenterology": "Gastroenterology",
        "Nephrology": "Nephrology",
        "Urology": "Urology",
        "Pulmonology": "Pulmonology",
        "Rheumatology": "Rheumatology",
        "Hematology": "Hematology",
        "Infectious Disease": "Infectious Disease",
        "Allergy and Immunology": "Allergy and Immunology",
        "Nuclear Medicine": "Nuclear Medicine",
        "Plastic Surgery": "Surgery",
        "Vascular Surgery": "Surgery",
        "Neonatology": "Pediatrics",
        "Geriatrics": "Geriatrics"
    }
    department = departments.get(specialty, specialty)
    
    # Generate professional profile
    profile = generate_professional_profile(specialty, country, city)
    
    # Calculate rating based on experience (more experience tends to higher rating, but with some randomness)
    experience_years = int(profile["experience"].split()[0])
    base_rating = min(3 + (experience_years / 10), 4.9)  # Max base rating is 4.9
    rating_variance = random.uniform(-0.5, 0.5)  # Add some randomness
    rating = max(3, min(5, base_rating + rating_variance))  # Keep between 3 and 5
    
    rating_count = random.randint(10, 500)  # Number of ratings
    
    # Create the doctor record
    doctor = {
        "email": generate_email(first_name, last_name),
        "password": "password123",  # Would be hashed in a real scenario
        "role": "doctor",
        "firstName": first_name,
        "lastName": last_name,
        "dateOfBirth": birth_date,
        "gender": "male" if first_name in turkish_first_names[:10] or first_name in middle_eastern_first_names[:20] else "female",
        "phone": generate_international_phone(country),
        "address": generate_international_address(city, country),
        "location": f"{city}, {country}",
        "active": True,
        "department": department,
        "specialization": specialty,
        "licenseNumber": generate_license_number(country),
        "rating": round(rating, 1),
        "ratingCount": rating_count,
        "professionalProfile": profile,
        "isInternational": True,
        "nationality": country,
        "createdBy": admin_id,
        "createdAt": datetime.now(),
        "updatedAt": datetime.now(),
        # Visibility settings
        "visibilitySettings": {
            "phone": random.random() < 0.3,  # 30% chance of showing phone
            "email": random.random() < 0.3,  # 30% chance of showing email
            "department": True,
            "specialization": True,
            "licenseNumber": random.random() < 0.5,  # 50% chance of showing license
            "bio": True,
            "education": True,
            "experience": True
        }
    }
    doctors.append(doctor)

# Check for existing international doctors
try:
    # Ask for confirmation before adding doctors
    existing_count = users_collection.count_documents({"role": "doctor", "isInternational": True})
    if existing_count > 0:
        confirm = input(f"Found {existing_count} existing international doctors. Add 20 more? (y/n): ")
        if confirm.lower() != 'y':
            print("Operation cancelled by user.")
            sys.exit(0)
except Exception as e:
    print(f"Error checking existing doctors: {e}")

# Insert doctors into the database
try:
    result = users_collection.insert_many(doctors)
    print(f"Successfully added {len(result.inserted_ids)} international doctors to the database.")
    
    # Print the names of doctors that were added
    for i, doctor in enumerate(doctors):
        print(f"  {i+1}. Dr. {doctor['firstName']} {doctor['lastName']} - {doctor['specialization']} - {doctor['location']}")
except Exception as e:
    print(f"Error adding doctors: {e}")
    sys.exit(1)

print("Done!") 