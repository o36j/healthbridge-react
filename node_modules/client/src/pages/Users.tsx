import { useState, useEffect } from 'react';
import { useAuth, UserRole } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import axios from 'axios';
import { FaSearch, FaUserPlus, FaUserEdit, FaUserTimes, FaUserCog, FaStar, FaStarHalfAlt, FaSort, FaFilter, FaTrash, FaSave, FaHospital, FaCamera, FaUpload, FaUser } from 'react-icons/fa';
import { Modal, Form } from 'react-bootstrap';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  profilePhoto?: string;
  department?: string;
  specialization?: string;
  rating?: number;
  ratingCount?: number;
  createdAt: string;
  lastLogin?: string;
  active: boolean;
  education?: string[];
  acceptsNewPatients?: boolean;
  experience?: number;
  location?: string;
  telehealth?: boolean;
  availability?: {
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
    saturday: string;
    sunday: string;
  };
  certifications?: string[];
  nurseSpecialty?: string;
  yearsOfExperience?: number;
  shiftPreference?: string;
  skills?: string[];
  nurseEducation?: string[];
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const SERVER_URL = API_URL.replace('/api', '');

// Helper function to safely format profile image URLs
const getProfileImageUrl = (photoPath?: string): string => {
  if (!photoPath) return '';
  
  // If it's already a blob URL, return it
  if (photoPath.startsWith('blob:')) {
    return photoPath;
  }

  // If it starts with http, it's an absolute URL
  if (photoPath.startsWith('http')) {
    return photoPath;
  }

  // Otherwise, it's a relative path, so prepend the server URL
  return `${SERVER_URL}${photoPath}`;
};

// Add department and specialization options at the top of the file after interfaces
const departmentOptions = [
  "Cardiology",
  "Dermatology",
  "Emergency Medicine",
  "Family Medicine",
  "Gastroenterology",
  "Internal Medicine",
  "Neurology",
  "Obstetrics & Gynecology",
  "Oncology",
  "Ophthalmology",
  "Orthopedics",
  "Pediatrics",
  "Psychiatry",
  "Radiology",
  "Surgery",
  "Urology"
];

const specializationOptions = {
  "Cardiology": ["General Cardiology", "Interventional Cardiology", "Electrophysiology"],
  "Dermatology": ["General Dermatology", "Cosmetic Dermatology", "Pediatric Dermatology"],
  "Emergency Medicine": ["Trauma", "Critical Care", "Medical Toxicology"],
  "Family Medicine": ["Primary Care", "Geriatrics", "Sports Medicine"],
  "Gastroenterology": ["Digestive Diseases", "Hepatology", "Pancreatic Disorders"],
  "Internal Medicine": ["General Medicine", "Pulmonology", "Geriatrics"],
  "Neurology": ["General Neurology", "Stroke Care", "Epilepsy", "Neuromuscular Medicine"],
  "Obstetrics & Gynecology": ["Obstetrics", "Gynecology", "Reproductive Endocrinology"],
  "Oncology": ["Medical Oncology", "Surgical Oncology", "Radiation Oncology"],
  "Ophthalmology": ["Comprehensive Ophthalmology", "Corneal Disease", "Glaucoma", "Retina"],
  "Orthopedics": ["General Orthopedics", "Sports Medicine", "Joint Replacement", "Spine"],
  "Pediatrics": ["General Pediatrics", "Neonatology", "Pediatric Cardiology"],
  "Psychiatry": ["General Psychiatry", "Child & Adolescent Psychiatry", "Addiction Medicine"],
  "Radiology": ["Diagnostic Radiology", "Interventional Radiology", "Neuroradiology"],
  "Surgery": ["General Surgery", "Cardiac Surgery", "Neurosurgery", "Plastic Surgery"],
  "Urology": ["General Urology", "Oncology", "Female Urology", "Pediatric Urology"]
};

// Add nurse specialties options
const nurseSpecialtyOptions = [
  "Critical Care",
  "Emergency",
  "Neonatal",
  "Oncology",
  "Pediatric",
  "Psychiatric",
  "Surgical",
  "Labor & Delivery",
  "Geriatric",
  "Operating Room",
  "Cardiac Care",
  "Anesthesia",
  "Clinical Nurse Specialist",
  "Family Nurse Practitioner",
  "General Practice"
];

// Add shift preference options
const shiftPreferenceOptions = [
  "Day Shift (8AM-4PM)",
  "Evening Shift (4PM-12AM)",
  "Night Shift (12AM-8AM)",
  "Morning Shift (7AM-3PM)",
  "Afternoon Shift (3PM-11PM)",
  "Rotating Shifts",
  "Weekends Only",
  "Flexible Hours"
];

// Add this helper function to safely check numeric properties
const safeGreaterThanZero = (value?: number): boolean => {
  return typeof value === 'number' && value > 0;
};

const Users = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showEditRatingModal, setShowEditRatingModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newRating, setNewRating] = useState<number>(0);
  const [successMessage, setSuccessMessage] = useState('');
  
  // For add user form
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: UserRole.PATIENT,
    department: '',
    specialization: '',
    education: [] as string[],
    acceptsNewPatients: true,
    experience: 0,
    location: 'Ankara, Turkey',
    telehealth: true,
    availability: {
      monday: '9:00 AM - 5:00 PM',
      tuesday: '9:00 AM - 5:00 PM',
      wednesday: '9:00 AM - 5:00 PM',
      thursday: '9:00 AM - 5:00 PM',
      friday: '9:00 AM - 5:00 PM',
      saturday: 'Not Available',
      sunday: 'Not Available',
    },
    certifications: ['RN', 'BLS'] as string[],
    nurseSpecialty: 'General Practice',
    yearsOfExperience: 2,
    shiftPreference: 'Day Shift (8AM-4PM)',
    skills: ['Patient care', 'Vital signs monitoring', 'Medication administration'] as string[],
    nurseEducation: ['BSN University of Ankara'] as string[]
  });
  
  // For edit user form
  const [editUser, setEditUser] = useState({
    _id: '',
    email: '',
    firstName: '',
    lastName: '',
    role: UserRole.PATIENT,
    department: '',
    specialization: '',
    active: true,
    education: [] as string[],
    acceptsNewPatients: false,
    experience: 0,
    location: '',
    telehealth: false,
    availability: {
      monday: '',
      tuesday: '',
      wednesday: '',
      thursday: '',
      friday: '',
      saturday: '',
      sunday: '',
    },
    certifications: [] as string[],
    nurseSpecialty: '',
    yearsOfExperience: 0,
    shiftPreference: '',
    skills: [] as string[],
    nurseEducation: [] as string[]
  });
  
  // For profile photo upload
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // For edit user profile photo
  const [editProfilePhoto, setEditProfilePhoto] = useState<File | null>(null);
  const [editPhotoPreview, setEditPhotoPreview] = useState<string | null>(null);
  
  useEffect(() => {
    // Only check role on initial load, not on subsequent renders
    const checkAdminRole = async () => {
    if (user?.role !== UserRole.ADMIN) {
      navigate('/');
      return;
    }
    
      // If we're already on the users page and we're an admin, just fetch users
    fetchUsers();
    };
    
    checkAdminRole();
  }, [user?.role]); // Only depend on user.role changes, not on navigate
  
  // Clear success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);
  
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/users`);
      setUsers(response.data.users);
    } catch (err) {
      setError('Failed to load users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      // In a real app, this would call the API to update the user's status
      // await axios.patch(`${API_URL}/users/${userId}/status`, { active: !currentStatus });
      
      // For demo purposes, just update the local state
      setSuccessMessage(`User status updated to ${!currentStatus ? 'active' : 'inactive'}`);
      
      setUsers((prevUsers) =>
        prevUsers.map((u) =>
          u._id === userId ? { ...u, active: !currentStatus } : u
        )
      );
    } catch (err) {
      setError('Failed to update user status');
      console.error(err);
    }
  };
  
  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
    
    try {
      await axios.delete(`${API_URL}/users/${userId}`);
      setUsers(users.filter(user => user._id !== userId));
      setSuccessMessage('User deleted successfully');
    } catch (err) {
      setError('Failed to delete user');
      console.error(err);
    }
  };
  
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type.startsWith('image/')) {
        setProfilePhoto(file);
        setPhotoPreview(URL.createObjectURL(file));
      } else {
        setError('Please upload an image file');
      }
    }
  };
  
  // Reset form function to clean up after submission, whether successful or not
  const resetAddUserForm = () => {
    setNewUser({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      role: UserRole.PATIENT,
      department: '',
      specialization: '',
      education: [],
      acceptsNewPatients: true,
      experience: 0,
      location: 'Ankara, Turkey',
      telehealth: true,
      availability: {
        monday: '9:00 AM - 5:00 PM',
        tuesday: '9:00 AM - 5:00 PM',
        wednesday: '9:00 AM - 5:00 PM',
        thursday: '9:00 AM - 5:00 PM',
        friday: '9:00 AM - 5:00 PM',
        saturday: 'Not Available',
        sunday: 'Not Available',
      },
      certifications: ['RN', 'BLS'],
      nurseSpecialty: 'General Practice',
      yearsOfExperience: 2,
      shiftPreference: 'Day Shift (8AM-4PM)',
      skills: ['Patient care', 'Vital signs monitoring', 'Medication administration'],
      nurseEducation: ['BSN University of Ankara']
    });
    setProfilePhoto(null);
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }
    setPhotoPreview(null);
  };
  
  const handleAddUser = async () => {
    // Validate required fields
    if (!newUser.email || !newUser.password || !newUser.firstName || !newUser.lastName) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setError(''); // Clear any previous errors
      const formData = new FormData();
      
      // Add user data to formData
      Object.entries(newUser).forEach(([key, value]) => {
        if (key === 'education' || key === 'certifications' || key === 'skills' || key === 'nurseEducation') {
          // Handle arrays separately
          if (Array.isArray(value)) {
            formData.append(key, JSON.stringify(value));
          }
        } else if (key === 'availability' && typeof value === 'object') {
          // Handle availability object separately
          formData.append(key, JSON.stringify(value));
        } else if (value !== undefined && value !== null) { // Only append non-empty values
          formData.append(key, String(value));
        }
      });
      
      // Add profile photo if available
      if (profilePhoto) {
        formData.append('profilePhoto', profilePhoto);
      }
      
      // Log the request for debugging
      console.log('Submitting new user with data:', Object.fromEntries(formData.entries()));
      
      // Set loading state
      setLoading(true);
      
      // Use the admin route for creating users instead of the regular register endpoint
      const response = await axios.post(`${API_URL}/admin/create-user`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('User creation response:', response.data);
      
      if (response.data && response.data.user) {
        // Add the new user to the users array
        setUsers(prevUsers => [...prevUsers, response.data.user]);
        
        // Close the modal
        setShowAddUserModal(false);
        
        // Reset the form
        resetAddUserForm();
        
        // Show success message
        setSuccessMessage('User added successfully');
        
        // Ensure we stay on the current page - no navigation happens
        
        // Refresh the user list to make sure we have the latest data
        fetchUsers();
      } else {
        throw new Error('Invalid server response');
      }
    } catch (err: any) {
      console.error('Error adding user:', err);
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error || 
                          err.message || 
                          'Failed to add user';
      setError(errorMessage);
    } finally {
      // Ensure loading is set to false
      setLoading(false);
    }
  };
  
  const handleEditRating = async () => {
    if (!selectedUser) return;
    
    try {
      const response = await axios.put(`${API_URL}/users/rating/${selectedUser._id}`, {
        rating: newRating,
      });
      
      setUsers(users.map(user => 
        user._id === selectedUser._id ? { ...user, rating: newRating } : user
      ));
      
      setShowEditRatingModal(false);
      setSuccessMessage('Doctor rating updated successfully');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update rating');
      console.error(err);
    }
  };
  
  const openRatingModal = (user: User) => {
    setSelectedUser(user);
    setNewRating(user.rating || 0);
    setShowEditRatingModal(true);
  };
  
  // Format date for display
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  // Get unique departments
  const departments = [...new Set(
    users
      .filter(user => user.department)
      .map(user => user.department)
  )];
  
  // Sort users
  const sortedUsers = [...users].sort((a, b) => {
    if (sortBy === 'name') {
      const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
      const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
      return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    } else if (sortBy === 'role') {
      return sortOrder === 'asc' ? a.role.localeCompare(b.role) : b.role.localeCompare(a.role);
    } else if (sortBy === 'date') {
      return sortOrder === 'asc' 
        ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else if (sortBy === 'rating' && a.role === 'doctor' && b.role === 'doctor') {
      const ratingA = a.rating || 0;
      const ratingB = b.rating || 0;
      return sortOrder === 'asc' ? ratingA - ratingB : ratingB - ratingA;
    }
    return 0;
  });
  
  // Filter users based on search term, role filter, and department filter
  const filteredUsers = sortedUsers.filter((user) => {
    // Role filter
    if (roleFilter !== 'all' && user.role !== roleFilter) {
      return false;
    }
    
    // Department filter (only for medical staff)
    if (departmentFilter !== 'all' && 
        (user.role === 'doctor' || user.role === 'nurse') && 
        user.department !== departmentFilter) {
      return false;
    }
    
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        user.role.toLowerCase().includes(searchLower) ||
        (user.department && user.department.toLowerCase().includes(searchLower)) ||
        (user.specialization && user.specialization.toLowerCase().includes(searchLower))
      );
    }
    
    return true;
  });
  
  // Get role badge color
  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-dark text-white';
      case 'doctor':
        return 'bg-primary text-white';
      case 'nurse':
        return 'bg-success text-white';
      case 'patient':
        return 'bg-secondary';
      default:
        return 'bg-light text-dark';
    }
  };
  
  // Render star rating
  const renderStarRating = (rating: number = 0) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={`full-${i}`} className="text-warning" />);
    }
    
    if (hasHalfStar) {
      stars.push(<FaStarHalfAlt key="half" className="text-warning" />);
    }
    
    const emptyStars = 5 - stars.length;
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<FaStar key={`empty-${i}`} className="text-muted" />);
    }
    
    return (
      <div className="d-flex align-items-center">
        {stars} <span className="ms-1">({rating.toFixed(1)})</span>
      </div>
    );
  };
  
  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };
  
  // Update table row to correctly display image
  const renderProfileImage = (user: User) => {
    if (user.profilePhoto) {
      const imgUrl = getProfileImageUrl(user.profilePhoto);
      return (
        <img
          className="rounded-circle"
          src={imgUrl}
          alt={`${user.firstName} ${user.lastName}`}
          width="40"
          height="40"
          style={{ objectFit: 'cover' }}
          onError={(e) => {
            // If image fails to load, show initials instead
            (e.target as HTMLImageElement).style.display = 'none';
            (e.target as HTMLImageElement).parentElement?.classList.add('bg-secondary', 'bg-opacity-10', 'd-flex', 'align-items-center', 'justify-content-center');
            (e.target as HTMLImageElement).parentElement?.setAttribute('data-initials', `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`);
          }}
        />
      );
    } else {
      return (
        <div className="rounded-circle bg-secondary bg-opacity-10 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
          <span className="text-secondary">
            {user.firstName?.charAt(0) || ''}
            {user.lastName?.charAt(0) || ''}
          </span>
        </div>
      );
    }
  };
  
  // Function to handle editing a user
  const handleEditUser = (userId: string) => {
    const userToEdit = users.find(u => u._id === userId);
    if (!userToEdit) {
      setError('User not found');
      return;
    }
    
    // Create a default availability object with empty strings
    const defaultAvailability = {
      monday: '',
      tuesday: '',
      wednesday: '',
      thursday: '',
      friday: '',
      saturday: '',
      sunday: ''
    };
    
    // Merge the user's availability with default values
    const userAvailability = userToEdit.availability || defaultAvailability;
    
    // Create a properly typed editUser object
    const updatedEditUser = {
      _id: userToEdit._id,
      email: userToEdit.email,
      firstName: userToEdit.firstName,
      lastName: userToEdit.lastName,
      role: userToEdit.role as UserRole,
      department: userToEdit.department || '',
      specialization: userToEdit.specialization || '',
      active: userToEdit.active,
      education: userToEdit.education || [],
      acceptsNewPatients: userToEdit.acceptsNewPatients || false,
      experience: userToEdit.experience || 0,
      location: userToEdit.location || '',
      telehealth: userToEdit.telehealth || false,
      availability: {
        monday: userAvailability.monday || '',
        tuesday: userAvailability.tuesday || '',
        wednesday: userAvailability.wednesday || '',
        thursday: userAvailability.thursday || '',
        friday: userAvailability.friday || '',
        saturday: userAvailability.saturday || '',
        sunday: userAvailability.sunday || ''
      },
      certifications: userToEdit.certifications || [],
      nurseSpecialty: userToEdit.nurseSpecialty || '',
      yearsOfExperience: userToEdit.yearsOfExperience || 0,
      shiftPreference: userToEdit.shiftPreference || '',
      skills: userToEdit.skills || [],
      nurseEducation: userToEdit.nurseEducation || []
    };
    
    setEditUser(updatedEditUser);
    
    // Set photo preview if user has a profile photo
    if (userToEdit.profilePhoto) {
      setEditPhotoPreview(getProfileImageUrl(userToEdit.profilePhoto));
    } else {
      setEditPhotoPreview(null);
    }
    
    setShowEditUserModal(true);
  };
  
  const handleEditPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type.startsWith('image/')) {
        setEditProfilePhoto(file);
        setEditPhotoPreview(URL.createObjectURL(file));
      } else {
        setError('Please upload an image file');
      }
    }
  };
  
  const handleUpdateUser = async () => {
    if (!editUser._id) return;
    
    try {
      setError(''); // Clear any previous errors
      
      // Create a user update payload with basic info
      const userUpdateData = {
        email: editUser.email,
        firstName: editUser.firstName,
        lastName: editUser.lastName,
        department: editUser.department || '',
        specialization: editUser.specialization || '',
        // Add doctor-specific fields when role is doctor
        ...(editUser.role === UserRole.DOCTOR ? {
          education: editUser.education,
          acceptsNewPatients: editUser.acceptsNewPatients,
          experience: editUser.experience,
          location: editUser.location,
          telehealth: editUser.telehealth,
          availability: editUser.availability
        } : {}),
        // Add nurse-specific fields when role is nurse
        ...(editUser.role === UserRole.NURSE ? {
          certifications: editUser.certifications,
          nurseSpecialty: editUser.nurseSpecialty,
          yearsOfExperience: editUser.yearsOfExperience,
          shiftPreference: editUser.shiftPreference,
          skills: editUser.skills,
          nurseEducation: editUser.nurseEducation
        } : {})
      };
      
      // Log for debugging
      console.log('Updating user with data:', userUpdateData);
      
      // First, update the basic user profile information
      const response = await axios.put(`${API_URL}/users/${editUser._id}`, userUpdateData);
      
      // If role has changed, update role separately
      const existingUser = users.find(u => u._id === editUser._id);
      if (existingUser && existingUser.role !== editUser.role) {
        console.log(`Updating user role from ${existingUser.role} to ${editUser.role}`);
        await axios.put(`${API_URL}/users/role/${editUser._id}`, {
          role: editUser.role
        });
      }
      
      // If active status has changed, update it
      if (existingUser && existingUser.active !== editUser.active) {
        console.log(`Updating active status from ${existingUser.active} to ${editUser.active}`);
        await axios.patch(`${API_URL}/users/${editUser._id}/status`, { 
          active: editUser.active 
        });
      }
      
      // If there's a new profile photo, upload it
      if (editProfilePhoto) {
        console.log('Uploading new profile photo');
        const photoFormData = new FormData();
        photoFormData.append('profilePhoto', editProfilePhoto);
        
        await axios.post(`${API_URL}/users/upload-photo/${editUser._id}`, photoFormData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }
      
      // Fetch the updated user list
      await fetchUsers();
      
      setShowEditUserModal(false);
      setSuccessMessage('User updated successfully');
      
      // Clean up
      if (editPhotoPreview && editPhotoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(editPhotoPreview);
      }
      setEditProfilePhoto(null);
      setEditPhotoPreview(null);
    } catch (err: any) {
      console.error('Error updating user:', err);
      
      // Check for specific error messages
      if (err.response?.status === 400 && err.response?.data?.message === 'Email already in use by another account') {
        setError('This email is already being used by another account. Please choose a different email.');
      } else {
        const errorMessage = err.response?.data?.message || 
                            err.response?.data?.error || 
                            err.message || 
                            'Failed to update user';
        setError(errorMessage);
      }
    }
  };
  
  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0">User Management</h1>
        
        <button 
          className="btn btn-primary d-flex align-items-center" 
          onClick={() => setShowAddUserModal(true)}
        >
          <FaUserPlus className="me-2" /> Add New User
        </button>
      </div>
      
      {/* Success message */}
      {successMessage && (
        <div className="alert alert-success alert-dismissible fade show d-flex align-items-center" role="alert">
          <FaUserCog className="me-2" />
          <div>{successMessage}</div>
          <button 
            type="button" 
            className="btn-close" 
            onClick={() => setSuccessMessage('')}
            aria-label="Close"
          ></button>
        </div>
      )}
      
      {error && (
        <div className="alert alert-danger alert-dismissible fade show d-flex align-items-center" role="alert">
          <div>{error}</div>
          <button 
            type="button" 
            className="btn-close" 
            onClick={() => setError('')} 
            aria-label="Close"
          ></button>
        </div>
      )}
      
      {/* Filters */}
      <div className="card shadow-sm mb-4">
        <div className="card-body p-3">
          <div className="row g-3">
            {/* Search bar */}
            <div className="col-lg-5 col-md-12">
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0">
                  <FaSearch className="text-muted" />
                </span>
                <input
                  type="text"
                  className="form-control border-start-0 ps-0"
                  placeholder="Search by name, email, role, department..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  aria-label="Search users"
                />
              </div>
            </div>
            
            {/* Role filter */}
            <div className="col-lg-2 col-md-4 col-sm-6">
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0">
                  <FaUserCog className="text-muted" />
                </span>
                <select
                  id="roleFilter"
                  className="form-select border-start-0 ps-0"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  aria-label="Filter by role"
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Admins</option>
                  <option value="doctor">Doctors</option>
                  <option value="nurse">Nurses</option>
                  <option value="patient">Patients</option>
                </select>
              </div>
            </div>
            
            {/* Department filter - conditionally shown */}
            {(roleFilter === 'doctor' || roleFilter === 'nurse' || roleFilter === 'all') && (
              <div className="col-lg-2 col-md-4 col-sm-6">
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0">
                    <FaHospital className="text-muted" />
                  </span>
                  <select
                    id="departmentFilter"
                    className="form-select border-start-0 ps-0"
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                    aria-label="Filter by department"
                  >
                    <option value="all">All Departments</option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
            
            {/* Sort by filter */}
            <div className="col-lg-3 col-md-4 col-sm-12">
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0">
                  <FaSort className="text-muted" />
                </span>
                <select
                  id="sortBy"
                  className="form-select border-start-0 ps-0"
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split('-');
                    setSortBy(field);
                    setSortOrder(order);
                  }}
                  aria-label="Sort by"
                >
                  <option value="name-asc">Name (A-Z)</option>
                  <option value="name-desc">Name (Z-A)</option>
                  <option value="role-asc">Role (A-Z)</option>
                  <option value="role-desc">Role (Z-A)</option>
                  <option value="date-asc">Date (Oldest first)</option>
                  <option value="date-desc">Date (Newest first)</option>
                  <option value="rating-desc">Rating (High to Low)</option>
                  <option value="rating-asc">Rating (Low to High)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Users List */}
      {loading ? (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "200px" }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <div className="card shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover table-striped mb-0">
              <thead className="table-light">
                <tr>
                  <th className="border-0">
                    <button 
                      className="btn btn-sm btn-link text-secondary p-0 d-flex align-items-center"
                      onClick={() => toggleSort('name')}
                      title="Sort by name"
                    >
                      <span>User</span>
                      <FaSort className={`ms-1 ${sortBy === 'name' ? 'text-primary' : 'text-secondary'}`} />
                    </button>
                  </th>
                  <th className="border-0">
                    <button 
                      className="btn btn-sm btn-link text-secondary p-0 d-flex align-items-center"
                      onClick={() => toggleSort('role')}
                      title="Sort by role"
                    >
                      <span>Role</span>
                      <FaSort className={`ms-1 ${sortBy === 'role' ? 'text-primary' : 'text-secondary'}`} />
                    </button>
                  </th>
                  <th className="border-0">Details</th>
                  <th className="border-0">
                    <button 
                      className="btn btn-sm btn-link text-secondary p-0 d-flex align-items-center"
                      onClick={() => toggleSort('date')}
                      title="Sort by date"
                    >
                      <span>Activity</span>
                      <FaSort className={`ms-1 ${sortBy === 'date' ? 'text-primary' : 'text-secondary'}`} />
                    </button>
                  </th>
                  <th className="border-0 text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user._id} className={!user.active ? 'bg-light' : ''}>
                    <td className="align-middle">
                      <div className="d-flex align-items-center">
                        <div className="flex-shrink-0">
                          {renderProfileImage(user)}
                        </div>
                        <div className="ms-3">
                          <h6 className="mb-0 fw-medium">
                            {user.firstName} {user.lastName}
                          </h6>
                          <small className="text-muted">{user.email}</small>
                        </div>
                      </div>
                    </td>
                    
                    <td className="align-middle">
                      <span className={`badge ${getRoleBadgeClass(user.role)}`}>
                        {user.role ? (user.role.charAt(0).toUpperCase() + user.role.slice(1)) : 'Unknown'}
                      </span>
                    </td>
                    
                    <td className="align-middle">
                      {user.role === 'doctor' && (
                        <>
                          <div className="small fw-medium">
                            {user.department || 'No department'}
                          </div>
                          <div className="small text-muted">
                            {user.specialization || 'No specialization'}
                          </div>
                          {user.location && (
                            <div className="small text-muted mt-1">
                              <i className="fa fa-map-marker-alt me-1"></i> {user.location}
                            </div>
                          )}
                          {safeGreaterThanZero(user.experience) && (
                            <div className="small text-muted">
                              <i className="fa fa-clock me-1"></i> {user.experience} years exp.
                            </div>
                          )}
                          {user.telehealth && (
                            <div className="small text-success">
                              <i className="fa fa-video me-1"></i> Telehealth available
                            </div>
                          )}
                          {user.acceptsNewPatients && (
                            <div className="small text-primary">
                              <i className="fa fa-user-plus me-1"></i> Accepting new patients
                            </div>
                          )}
                          <div className="mt-1">
                            {renderStarRating(user.rating || 0)}
                          </div>
                        </>
                      )}
                      
                      {user.role === 'nurse' && (
                        <>
                        <div className="small fw-medium">
                          {user.department || 'No department'}
                          </div>
                          {user.nurseSpecialty && (
                            <div className="small text-muted">
                              Specialty: {user.nurseSpecialty}
                        </div>
                          )}
                          {safeGreaterThanZero(user.yearsOfExperience) && (
                            <div className="small text-muted">
                              <i className="fa fa-clock me-1"></i> {user.yearsOfExperience} years exp.
                            </div>
                          )}
                          {user.shiftPreference && (
                            <div className="small text-info">
                              <i className="fa fa-calendar-alt me-1"></i> {user.shiftPreference}
                            </div>
                          )}
                          {user.certifications && user.certifications.length > 0 && (
                            <div className="small text-success">
                              <i className="fa fa-certificate me-1"></i> {user.certifications.length} certification(s)
                            </div>
                          )}
                        </>
                      )}
                      
                      {!user.department && user.role !== 'doctor' && user.role !== 'nurse' && (
                        <span className="text-muted small">No additional details</span>
                      )}
                    </td>
                    
                    <td className="align-middle small">
                      <div>
                        <span className="fw-medium me-1">Created:</span>
                        <span className="text-muted">{formatDate(user.createdAt)}</span>
                      </div>
                      <div>
                        <span className="fw-medium me-1">Last login:</span>
                        <span className="text-muted">{formatDate(user.lastLogin)}</span>
                      </div>
                    </td>
                    
                    <td className="align-middle text-end">
                      <div className="btn-group">
                        <button
                          onClick={() => handleEditUser(user._id)}
                          className="btn btn-sm btn-outline-primary"
                          aria-label="Edit user"
                          title="Edit user"
                        >
                          <FaUserEdit />
                        </button>
                        
                        {user.role === 'doctor' && (
                          <button
                            onClick={() => openRatingModal(user)}
                            className="btn btn-sm btn-outline-warning"
                            aria-label="Edit doctor rating"
                            title="Edit doctor rating"
                          >
                            <FaStar />
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleToggleUserStatus(user._id, user.active)}
                          className={`btn btn-sm ${user.active ? 'btn-outline-danger' : 'btn-outline-success'}`}
                          aria-label={user.active ? "Deactivate user" : "Activate user"}
                          title={user.active ? "Deactivate user" : "Activate user"}
                        >
                          {user.active ? <FaUserTimes /> : <FaUserCog />}
                        </button>
                        
                        <button
                          onClick={() => handleDeleteUser(user._id)}
                          className="btn btn-sm btn-outline-danger"
                          aria-label="Delete user"
                          title="Delete user"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Add User Modal */}
      <Modal show={showAddUserModal} onHide={() => setShowAddUserModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add New User</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            {/* Profile Photo Upload - Optional */}
            <div className="text-center mb-3">
              <div className="position-relative d-inline-block">
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Profile Preview"
                    className="rounded-circle mb-3"
                    style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                  />
                ) : (
                  <div className="rounded-circle bg-light d-flex align-items-center justify-content-center mb-3 mx-auto" 
                    style={{ width: '100px', height: '100px' }}>
                    <FaUser className="text-secondary" size={40} />
                  </div>
                )}
                
                <label className="btn btn-sm btn-outline-primary position-absolute bottom-0 end-0">
                  <FaCamera />
                  <input 
                    type="file" 
                    className="d-none" 
                    accept="image/*"
                    onChange={handlePhotoChange}
                    aria-label="Upload profile photo"
                    title="Upload profile photo"
                  />
                </label>
              </div>
              
              <p className="text-muted small">(Optional) Profile Photo</p>
            </div>
            
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control 
                type="email" 
                value={newUser.email}
                onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Password</Form.Label>
              <Form.Control 
                type="password" 
                value={newUser.password}
                onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>First Name</Form.Label>
              <Form.Control 
                type="text" 
                value={newUser.firstName}
                onChange={(e) => setNewUser({...newUser, firstName: e.target.value})}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Last Name</Form.Label>
              <Form.Control 
                type="text" 
                value={newUser.lastName}
                onChange={(e) => setNewUser({...newUser, lastName: e.target.value})}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Role</Form.Label>
              <Form.Control 
                as="select"
                value={newUser.role}
                onChange={(e) => setNewUser({...newUser, role: e.target.value as UserRole})}
                required
              >
                <option value={UserRole.PATIENT}>Patient</option>
                <option value={UserRole.DOCTOR}>Doctor</option>
                <option value={UserRole.NURSE}>Nurse</option>
                <option value={UserRole.ADMIN}>Admin</option>
              </Form.Control>
            </Form.Group>
            
            {(newUser.role === UserRole.DOCTOR || newUser.role === UserRole.NURSE) && (
              <>
                <Form.Group className="mb-3">
                  <Form.Label>Department</Form.Label>
                  <Form.Control 
                    as="select"
                    value={newUser.department}
                    onChange={(e) => {
                      const newDepartment = e.target.value;
                      // Reset specialization when department changes
                      setNewUser({
                        ...newUser, 
                        department: newDepartment,
                        specialization: ''
                      });
                    }}
                  >
                    <option value="">Select Department</option>
                    {departmentOptions.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </Form.Control>
                </Form.Group>
                
                {newUser.role === UserRole.DOCTOR && (
                  <>
                    {newUser.department && (
                  <Form.Group className="mb-3">
                    <Form.Label>Specialization</Form.Label>
                    <Form.Control 
                          as="select"
                      value={newUser.specialization}
                      onChange={(e) => setNewUser({...newUser, specialization: e.target.value})}
                        >
                          <option value="">Select Specialization</option>
                          {specializationOptions[newUser.department as keyof typeof specializationOptions]?.map(spec => (
                            <option key={spec} value={spec}>{spec}</option>
                          ))}
                        </Form.Control>
                      </Form.Group>
                    )}

                    <Form.Group className="mb-3">
                      <Form.Label>Location</Form.Label>
                      <Form.Control 
                        type="text" 
                        value={newUser.location}
                        onChange={(e) => setNewUser({...newUser, location: e.target.value})}
                        placeholder="City, State"
                    />
                  </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Years of Experience</Form.Label>
                      <Form.Control 
                        type="number" 
                        value={newUser.experience}
                        onChange={(e) => setNewUser({...newUser, experience: parseInt(e.target.value)})}
                        min="0"
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Education (comma separated)</Form.Label>
                      <Form.Control 
                        as="textarea" 
                        rows={2}
                        value={newUser.education.join(', ')}
                        onChange={(e) => setNewUser({...newUser, education: e.target.value.split(',').map(item => item.trim())})}
                        placeholder="MD Harvard Medical School, Residency Johns Hopkins"
                      />
                    </Form.Group>

                    <div className="row mb-3">
                      <div className="col-md-6">
                        <Form.Check 
                          type="switch"
                          id="add-telehealth-switch"
                          label="Offers Telehealth"
                          checked={newUser.telehealth}
                          onChange={(e) => setNewUser({...newUser, telehealth: e.target.checked})}
                        />
                      </div>
                      <div className="col-md-6">
                        <Form.Check 
                          type="switch"
                          id="add-new-patients-switch"
                          label="Accepting New Patients"
                          checked={newUser.acceptsNewPatients}
                          onChange={(e) => setNewUser({...newUser, acceptsNewPatients: e.target.checked})}
                        />
                      </div>
                    </div>

                    <hr className="my-4" />

                    <h6 className="mb-3">Availability Schedule</h6>
                    <div className="row g-3">
                      {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                        <div className="col-md-6" key={day}>
                          <Form.Group className="mb-2">
                            <Form.Label className="text-capitalize">{day}</Form.Label>
                            <Form.Control 
                              type="text" 
                              value={newUser.availability[day as keyof typeof newUser.availability] || ''}
                              onChange={(e) => {
                                const updatedAvailability = {...newUser.availability, [day]: e.target.value};
                                setNewUser({...newUser, availability: updatedAvailability});
                              }}
                              placeholder="9:00 AM - 5:00 PM or Not Available"
                            />
                          </Form.Group>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Add the nurse-specific fields to the Add User form */}
                {newUser.role === UserRole.NURSE && (
                  <>
                    <Form.Group className="mb-3">
                      <Form.Label>Nurse Specialty</Form.Label>
                      <Form.Control 
                        as="select"
                        value={newUser.nurseSpecialty}
                        onChange={(e) => setNewUser({...newUser, nurseSpecialty: e.target.value})}
                      >
                        <option value="">Select Specialty</option>
                        {nurseSpecialtyOptions.map(specialty => (
                          <option key={specialty} value={specialty}>{specialty}</option>
                        ))}
                      </Form.Control>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Shift Preference</Form.Label>
                      <Form.Control 
                        as="select"
                        value={newUser.shiftPreference}
                        onChange={(e) => setNewUser({...newUser, shiftPreference: e.target.value})}
                      >
                        <option value="">Select Shift Preference</option>
                        {shiftPreferenceOptions.map(shift => (
                          <option key={shift} value={shift}>{shift}</option>
                        ))}
                      </Form.Control>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Years of Experience</Form.Label>
                      <Form.Control 
                        type="number" 
                        value={newUser.yearsOfExperience}
                        onChange={(e) => setNewUser({...newUser, yearsOfExperience: parseInt(e.target.value)})}
                        min="0"
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Education (comma separated)</Form.Label>
                      <Form.Control 
                        as="textarea" 
                        rows={2}
                        value={newUser.nurseEducation.join(', ')}
                        onChange={(e) => setNewUser({...newUser, nurseEducation: e.target.value.split(',').map(item => item.trim())})}
                        placeholder="BSN University of Ankara, MSN Health Sciences"
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Certifications (comma separated)</Form.Label>
                      <Form.Control 
                        as="textarea" 
                        rows={2}
                        value={newUser.certifications.join(', ')}
                        onChange={(e) => setNewUser({...newUser, certifications: e.target.value.split(',').map(item => item.trim())})}
                        placeholder="RN, CNS, ACLS, BLS"
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Skills (comma separated)</Form.Label>
                      <Form.Control 
                        as="textarea" 
                        rows={2}
                        value={newUser.skills.join(', ')}
                        onChange={(e) => setNewUser({...newUser, skills: e.target.value.split(',').map(item => item.trim())})}
                        placeholder="Patient care, IV therapy, Wound care, Medication administration"
                      />
                    </Form.Group>
                  </>
                )}
              </>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <button 
            type="button" 
            className="btn btn-outline-secondary" 
            onClick={() => {
              setShowAddUserModal(false);
              resetAddUserForm();
            }}
          >
            Cancel
          </button>
          <button 
            type="button"
            className="btn btn-primary d-flex align-items-center" 
            onClick={handleAddUser}
          >
            <FaSave className="me-2" /> Save User
          </button>
        </Modal.Footer>
      </Modal>
      
      {/* Edit User Modal */}
      <Modal show={showEditUserModal} onHide={() => setShowEditUserModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit User</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            {/* Profile Photo Upload */}
            <div className="text-center mb-3">
              <div className="position-relative d-inline-block">
                {editPhotoPreview ? (
                  <img
                    src={editPhotoPreview}
                    alt="Profile Preview"
                    className="rounded-circle mb-3"
                    style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                  />
                ) : (
                  <div className="rounded-circle bg-light d-flex align-items-center justify-content-center mb-3 mx-auto" 
                    style={{ width: '100px', height: '100px' }}>
                    <FaUser className="text-secondary" size={40} />
                  </div>
                )}
                
                <label className="btn btn-sm btn-outline-primary position-absolute bottom-0 end-0">
                  <FaCamera />
                  <input 
                    type="file" 
                    className="d-none" 
                    accept="image/*"
                    onChange={handleEditPhotoChange}
                    aria-label="Upload profile photo"
                    title="Upload profile photo"
                  />
                </label>
              </div>
              
              <p className="text-muted small">(Optional) Profile Photo</p>
            </div>
            
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control 
                type="email" 
                value={editUser.email}
                onChange={(e) => setEditUser({...editUser, email: e.target.value})}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>First Name</Form.Label>
              <Form.Control 
                type="text" 
                value={editUser.firstName}
                onChange={(e) => setEditUser({...editUser, firstName: e.target.value})}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Last Name</Form.Label>
              <Form.Control 
                type="text" 
                value={editUser.lastName}
                onChange={(e) => setEditUser({...editUser, lastName: e.target.value})}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Role</Form.Label>
              <Form.Control 
                as="select"
                value={editUser.role}
                onChange={(e) => setEditUser({...editUser, role: e.target.value as UserRole})}
                required
              >
                <option value={UserRole.PATIENT}>Patient</option>
                <option value={UserRole.DOCTOR}>Doctor</option>
                <option value={UserRole.NURSE}>Nurse</option>
                <option value={UserRole.ADMIN}>Admin</option>
              </Form.Control>
            </Form.Group>
            
            {(editUser.role === UserRole.DOCTOR || editUser.role === UserRole.NURSE) && (
              <>
                <Form.Group className="mb-3">
                  <Form.Label>Department</Form.Label>
                  <Form.Control 
                    as="select"
                    value={editUser.department}
                    onChange={(e) => {
                      const newDepartment = e.target.value;
                      // Reset specialization when department changes
                      setEditUser({
                        ...editUser, 
                        department: newDepartment,
                        specialization: ''
                      });
                    }}
                  >
                    <option value="">Select Department</option>
                    {departmentOptions.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </Form.Control>
                </Form.Group>
                
                {editUser.role === UserRole.DOCTOR && (
                  <>
                    {editUser.department && (
                      <Form.Group className="mb-3">
                        <Form.Label>Specialization</Form.Label>
                        <Form.Control 
                          as="select"
                          value={editUser.specialization}
                          onChange={(e) => setEditUser({...editUser, specialization: e.target.value})}
                        >
                          <option value="">Select Specialization</option>
                          {specializationOptions[editUser.department as keyof typeof specializationOptions]?.map(spec => (
                            <option key={spec} value={spec}>{spec}</option>
                          ))}
                        </Form.Control>
                      </Form.Group>
                    )}

                    <Form.Group className="mb-3">
                      <Form.Label>Location</Form.Label>
                      <Form.Control 
                        type="text" 
                        value={editUser.location}
                        onChange={(e) => setEditUser({...editUser, location: e.target.value})}
                        placeholder="City, State"
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Years of Experience</Form.Label>
                      <Form.Control 
                        type="number" 
                        value={editUser.experience}
                        onChange={(e) => setEditUser({...editUser, experience: parseInt(e.target.value)})}
                        min="0"
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Education (comma separated)</Form.Label>
                      <Form.Control 
                        as="textarea" 
                        rows={2}
                        value={editUser.education.join(', ')}
                        onChange={(e) => setEditUser({...editUser, education: e.target.value.split(',').map(item => item.trim())})}
                        placeholder="MD Harvard Medical School, Residency Johns Hopkins"
                      />
                    </Form.Group>

                    <div className="row mb-3">
                      <div className="col-md-6">
                        <Form.Check 
                          type="switch"
                          id="telehealth-switch"
                          label="Offers Telehealth"
                          checked={editUser.telehealth}
                          onChange={(e) => setEditUser({...editUser, telehealth: e.target.checked})}
                        />
                      </div>
                      <div className="col-md-6">
                        <Form.Check 
                          type="switch"
                          id="new-patients-switch"
                          label="Accepting New Patients"
                          checked={editUser.acceptsNewPatients}
                          onChange={(e) => setEditUser({...editUser, acceptsNewPatients: e.target.checked})}
                        />
                      </div>
                    </div>

                    <hr className="my-4" />

                    <h6 className="mb-3">Availability Schedule</h6>
                    <div className="row g-3">
                      {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                        <div className="col-md-6" key={day}>
                          <Form.Group className="mb-2">
                            <Form.Label className="text-capitalize">{day}</Form.Label>
                            <Form.Control 
                              type="text" 
                              value={editUser.availability[day as keyof typeof editUser.availability] || ''}
                              onChange={(e) => {
                                const updatedAvailability = {...editUser.availability, [day]: e.target.value};
                                setEditUser({...editUser, availability: updatedAvailability});
                              }}
                              placeholder="9:00 AM - 5:00 PM or Not Available"
                            />
                          </Form.Group>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
            
            {editUser.role === UserRole.NURSE && (
              <>
                <Form.Group className="mb-3">
                  <Form.Label>Nurse Specialty</Form.Label>
                  <Form.Control 
                    as="select"
                    value={editUser.nurseSpecialty}
                    onChange={(e) => setEditUser({...editUser, nurseSpecialty: e.target.value})}
                  >
                    <option value="">Select Specialty</option>
                    {nurseSpecialtyOptions.map(specialty => (
                      <option key={specialty} value={specialty}>{specialty}</option>
                    ))}
                  </Form.Control>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Shift Preference</Form.Label>
                  <Form.Control 
                    as="select"
                    value={editUser.shiftPreference}
                    onChange={(e) => setEditUser({...editUser, shiftPreference: e.target.value})}
                  >
                    <option value="">Select Shift Preference</option>
                    {shiftPreferenceOptions.map(shift => (
                      <option key={shift} value={shift}>{shift}</option>
                    ))}
                  </Form.Control>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Years of Experience</Form.Label>
                  <Form.Control 
                    type="number" 
                    value={editUser.yearsOfExperience}
                    onChange={(e) => setEditUser({...editUser, yearsOfExperience: parseInt(e.target.value)})}
                    min="0"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Education (comma separated)</Form.Label>
                  <Form.Control 
                    as="textarea" 
                    rows={2}
                    value={editUser.nurseEducation.join(', ')}
                    onChange={(e) => setEditUser({...editUser, nurseEducation: e.target.value.split(',').map(item => item.trim())})}
                    placeholder="BSN University of Ankara, MSN Health Sciences"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Certifications (comma separated)</Form.Label>
                  <Form.Control 
                    as="textarea" 
                    rows={2}
                    value={editUser.certifications.join(', ')}
                    onChange={(e) => setEditUser({...editUser, certifications: e.target.value.split(',').map(item => item.trim())})}
                    placeholder="RN, CNS, ACLS, BLS"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Skills (comma separated)</Form.Label>
                  <Form.Control 
                    as="textarea" 
                    rows={2}
                    value={editUser.skills.join(', ')}
                    onChange={(e) => setEditUser({...editUser, skills: e.target.value.split(',').map(item => item.trim())})}
                    placeholder="Patient care, IV therapy, Wound care, Medication administration"
                  />
                </Form.Group>
              </>
            )}
            
            <Form.Group className="mb-3">
              <Form.Check 
                type="switch"
                id="user-active-switch"
                label="Active User"
                checked={editUser.active}
                onChange={(e) => setEditUser({...editUser, active: e.target.checked})}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <button 
            type="button" 
            className="btn btn-outline-secondary" 
            onClick={() => {
              setShowEditUserModal(false);
              if (editPhotoPreview && editPhotoPreview.startsWith('blob:')) {
                URL.revokeObjectURL(editPhotoPreview);
              }
              setEditProfilePhoto(null);
              setEditPhotoPreview(null);
            }}
          >
            Cancel
          </button>
          <button 
            type="button"
            className="btn btn-primary d-flex align-items-center" 
            onClick={handleUpdateUser}
          >
            <FaSave className="me-2" /> Save Changes
          </button>
        </Modal.Footer>
      </Modal>
      
      {/* Edit Rating Modal */}
      <Modal show={showEditRatingModal} onHide={() => setShowEditRatingModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Update Doctor Rating</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedUser && (
            <div>
              <p className="mb-3">
                Update rating for Dr. {selectedUser.firstName} {selectedUser.lastName}
              </p>
              
              <div className="mb-4">
                <Form.Label>Current Rating: {selectedUser.rating?.toFixed(1) || '0.0'}</Form.Label>
                <div className="d-flex align-items-center mb-2">
                  {renderStarRating(selectedUser.rating || 0)}
                </div>
              </div>
              
              <Form.Group className="mb-3">
                <Form.Label>New Rating (0-5)</Form.Label>
                <Form.Control 
                  type="number" 
                  min="0"
                  max="5"
                  step="0.1"
                  value={newRating}
                  onChange={(e) => setNewRating(parseFloat(e.target.value))}
                />
              </Form.Group>
              
              <div className="mt-3">
                <p className="text-muted small">
                  Preview of new rating:
                </p>
                <div className="d-flex align-items-center mt-1">
                  {renderStarRating(newRating)}
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <button 
            type="button" 
            className="btn btn-outline-secondary" 
            onClick={() => setShowEditRatingModal(false)}
          >
            Cancel
          </button>
          <button 
            type="button"
            className="btn btn-primary d-flex align-items-center" 
            onClick={handleEditRating}
          >
            <FaSave className="me-2" /> Update Rating
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Users; 