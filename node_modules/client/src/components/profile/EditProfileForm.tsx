import { useState, useEffect, useCallback } from 'react';
import { useAuth, UserRole } from '../../contexts/AuthContext';
import axios from 'axios';
import { FaUser, FaCamera, FaUpload, FaEnvelope, FaPhone, FaMapMarkerAlt, FaIdCard, FaCalendarAlt, FaVenusMars, FaBuilding, FaUserMd, FaHospital, FaTint, FaAllergies, FaPhoneAlt, FaSave, FaGlobe, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';

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

interface EditProfileFormProps {
  onUpdateSuccess?: () => void;
  userId?: string;
  isAdminEdit?: boolean;
}

const EditProfileForm = ({ onUpdateSuccess, userId, isAdminEdit }: EditProfileFormProps) => {
  const { user, updateUserContext } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [activeTab, setActiveTab] = useState('personal');
  
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    gender: '',
    department: '',
    specialization: '',
    licenseNumber: '',
    bloodType: '',
    allergies: '',
    emergencyContact: '',
    role: '',
    medicalRecordNumber: '',
  });
  
  // Add visibility settings for professional fields
  const [fieldVisibility, setFieldVisibility] = useState({
    phone: false,
    email: false,
    department: true,
    specialization: true,
    licenseNumber: false,
    bio: true,
    education: true,
    experience: true
  });
  
  // Additional professional fields for doctors/nurses
  const [professionalData, setProfessionalData] = useState({
    bio: '',
    education: '',
    experience: '',
    availability: '',
    consultationFee: '',
    acceptingNewPatients: true
  });
  
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  // Function to convert URL to blob URL
  const convertToBlobUrl = useCallback(async (url: string) => {
    if (!url) return null;
    
    setImageLoading(true);
    setImageError(false);
    
    try {
      const response = await fetch(url, { 
        mode: 'cors',
        credentials: 'same-origin'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }
      
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      return blobUrl;
    } catch (error) {
      setImageError(true);
      return null;
    } finally {
      setImageLoading(false);
    }
  }, []);
  
  // Update photo preview when user or photo changes
  useEffect(() => {
    if (blobUrl) {
      // Clean up previous blob URL
      URL.revokeObjectURL(blobUrl);
    }
    
    if (user?.profilePhoto) {
      const fullPhotoUrl = getProfileImageUrl(user.profilePhoto);
      
      // Convert to blob URL
      convertToBlobUrl(fullPhotoUrl)
        .then(newBlobUrl => {
          if (newBlobUrl) {
            setBlobUrl(newBlobUrl);
            setPhotoPreview(newBlobUrl);
          }
        });
    } else {
      setBlobUrl(null);
      setPhotoPreview(null);
    }
    
    // Cleanup
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [user?.profilePhoto, convertToBlobUrl]);
  
  useEffect(() => {
    if ((user && user.id) || (isAdminEdit && userId)) {
      console.log('Fetching profile', isAdminEdit ? `for user ${userId}` : 'for current user');
      fetchUserProfile();
    } else {
      console.log('User not available or missing ID:', user);
    }
  }, [user, userId]);
  
  const fetchUserProfile = async () => {
    const targetUserId = isAdminEdit ? userId : user?.id;
    
    if (!targetUserId) {
      console.error('Cannot fetch profile: user ID is undefined');
      return;
    }
    
    try {
      setLoading(true);
      
      const response = await axios.get(`${API_URL}/users/${targetUserId}`);
      const userData = response.data.user;
      
      let formattedDate = '';
      if (userData.dateOfBirth) {
        const date = new Date(userData.dateOfBirth);
        formattedDate = date.toISOString().split('T')[0];
      }
      
      // Fill profile data with existing information, leaving empty strings for missing fields
      setProfileData({
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        email: userData.email || '',
        phone: userData.phone || '',
        address: userData.address || '',
        dateOfBirth: formattedDate,
        gender: userData.gender || '',
        department: userData.department || '',
        specialization: userData.specialization || '',
        licenseNumber: userData.licenseNumber || '',
        bloodType: userData.bloodType || '',
        allergies: (userData.allergies || []).join(', '),
        emergencyContact: userData.emergencyContact || '',
        role: userData.role || '',
        medicalRecordNumber: userData.medicalRecordNumber || '',
      });
      
      // Set professional data with existing information, leaving empty strings for missing fields
      if (userData.role === UserRole.DOCTOR || userData.role === UserRole.NURSE) {
        setProfessionalData({
          bio: userData.professionalProfile?.bio || '',
          education: userData.professionalProfile?.education || '',
          experience: userData.professionalProfile?.experience || '',
          availability: userData.professionalProfile?.availability || '',
          consultationFee: userData.professionalProfile?.consultationFee || '',
          acceptingNewPatients: userData.professionalProfile?.acceptingNewPatients ?? true
        });
        
        // Set visibility settings if available, otherwise use defaults
        if (userData.visibilitySettings) {
          setFieldVisibility(userData.visibilitySettings);
        }
      }
      
      // Immediately show professional tab for doctors
      if (userData.role === UserRole.DOCTOR) {
        setActiveTab('professional');
      }
      
      // Profile photo is handled by the dedicated useEffect
    } catch (err) {
      console.error('Failed to load profile information:', err);
      setError('Failed to load profile information');
    } finally {
      setLoading(false);
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        setProfilePhoto(file);
        setPhotoPreview(URL.createObjectURL(file));
      } else {
        setUploadError('Please upload an image file');
      }
    }
  };
  
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type.startsWith('image/')) {
        setProfilePhoto(file);
        setPhotoPreview(URL.createObjectURL(file));
      } else {
        setUploadError('Please upload an image file');
      }
    }
  };
  
  const handlePhotoUpload = async () => {
    if (!profilePhoto) return;
    
    const targetUserId = isAdminEdit ? userId : user?.id;
    if (!targetUserId) return;
    
    try {
      setUploadError('');
      setSaving(true);
      
      const formData = new FormData();
      formData.append('profilePhoto', profilePhoto);
      
      const response = await axios.post(`${API_URL}/users/upload-photo/${targetUserId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        withCredentials: true,
      });
      
      console.log('Photo upload response:', response.data);
      
      if (!isAdminEdit && updateUserContext && user) {
        // Use the full photo URL if available, or construct it
        const photoUrl = response.data.fullPhotoUrl || 
          (response.data.profilePhoto ? 
            getProfileImageUrl(response.data.profilePhoto) : 
            undefined);
        
        // Update the user context
        updateUserContext({
          ...user,
          profilePhoto: response.data.profilePhoto // Use the relative path for consistency
        });
        
        // Convert to blob URL for display
        if (photoUrl) {
          const newBlobUrl = await convertToBlobUrl(photoUrl);
          if (newBlobUrl) {
            if (blobUrl) {
              URL.revokeObjectURL(blobUrl);
            }
            setBlobUrl(newBlobUrl);
            setPhotoPreview(newBlobUrl);
          }
        }
      }
      
      setSuccess('Profile photo updated successfully');
      setTimeout(() => setSuccess(''), 3000);
      
      if (onUpdateSuccess) {
        onUpdateSuccess();
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const errorMessage = err.response?.data?.message || 'Failed to upload profile photo';
        setUploadError(errorMessage);
      } else {
        setUploadError('Failed to upload profile photo');
      }
    } finally {
      setSaving(false);
    }
  };
  
  // Handle visibility toggle for fields
  const handleVisibilityChange = (field: string) => {
    setFieldVisibility(prev => ({
      ...prev,
      [field]: !prev[field as keyof typeof prev]
    }));
  };
  
  // Handle changes to professional data
  const handleProfessionalDataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      setProfessionalData(prev => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked
      }));
    } else {
      setProfessionalData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  // Update handleSubmit to include professional data and visibility settings
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Form submitted. Current form data:', profileData);
    console.log('Active tab at submission:', activeTab);
    
    const targetUserId = isAdminEdit ? userId : user?.id;
    if (!targetUserId) {
      setError('User information not available.');
      console.error('Target user ID is undefined');
      return;
    }
    
    try {
      setError('');
      setSaving(true);
      
      const formattedData = {
        ...profileData,
        allergies: (isAdminEdit ? false : user?.role === UserRole.PATIENT) && profileData.allergies
          ? profileData.allergies.split(',').map(item => item.trim()).filter(item => item !== '')
          : undefined,
      };
      
      // Add professional data for doctors and nurses
      if (user?.role === UserRole.DOCTOR || user?.role === UserRole.NURSE || 
          profileData.role === UserRole.DOCTOR || profileData.role === UserRole.NURSE) {
        formattedData.professionalProfile = professionalData;
        formattedData.visibilitySettings = fieldVisibility;
      }
      
      console.log('Submitting formatted data:', formattedData);
      console.log('Updating profile for user ID:', targetUserId);
      
      const response = await axios.put(`${API_URL}/users/${targetUserId}`, formattedData);
      console.log('Profile update response:', response.data);
      
      if (!isAdminEdit && response.data.user && updateUserContext && user) {
        console.log('Updating user context with new data');
        updateUserContext({
          ...user,
          firstName: formattedData.firstName,
          lastName: formattedData.lastName,
          email: formattedData.email,
        });
      }
      
      setSuccess('Profile updated successfully');
      setTimeout(() => setSuccess(''), 3000);
      
      if (onUpdateSuccess) {
        onUpdateSuccess();
      }
    } catch (err) {
      console.error('Profile update error:', err);
      if (axios.isAxiosError(err)) {
        const errorMessage = err.response?.data?.message || 'Failed to update profile';
        console.error('Error response data:', err.response?.data);
        setError(errorMessage);
      } else {
        setError('Failed to update profile');
      }
    } finally {
      setSaving(false);
    }
  };
  
  // Add a professional tab in addition to personal and medical
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };
  
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center h-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Success/Error Messages */}
      {success && (
        <div className="alert alert-success alert-dismissible fade show mb-4" role="alert">
          <FaSave className="me-2" />
          {success}
          <button type="button" className="btn-close" onClick={() => setSuccess('')} aria-label="Close"></button>
        </div>
      )}
      
      {error && (
        <div className="alert alert-danger alert-dismissible fade show mb-4" role="alert">
          {error}
          <button type="button" className="btn-close" onClick={() => setError('')} aria-label="Close"></button>
        </div>
      )}
      
      {/* Profile Photo Section */}
      <div className="bg-light-subtle p-4 rounded-3 mb-4">
        <div className="d-flex flex-column align-items-center">
          <div 
            className={`position-relative ${dragActive ? 'ring-4 ring-primary' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {imageLoading ? (
              <div className="bg-light rounded-circle d-flex align-items-center justify-content-center" style={{ width: '120px', height: '120px' }}>
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : photoPreview ? (
              <div className="position-relative">
                <img
                  src={photoPreview}
                  alt="Profile"
                  className="rounded-circle object-fit-cover shadow-sm"
                  style={{ width: '120px', height: '120px' }}
                  crossOrigin="anonymous"
                  onError={() => setImageError(true)}
                />
                <div className="position-absolute top-0 start-0 w-100 h-100 bg-dark bg-opacity-40 rounded-circle d-flex align-items-center justify-content-center opacity-0 hover-opacity-100 transition-all">
                  <FaCamera className="text-white fs-4" />
                </div>
              </div>
            ) : imageError ? (
              <div className="bg-danger-subtle rounded-circle d-flex align-items-center justify-content-center" style={{ width: '120px', height: '120px' }}>
                <span className="text-danger">
                  <FaCamera className="fs-4" />
                </span>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-primary to-primary-subtle rounded-circle d-flex align-items-center justify-content-center text-white shadow-sm"
                style={{ width: '120px', height: '120px' }}>
                <span className="fs-1">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </span>
              </div>
            )}
          </div>
          
          <div className="mt-3 text-center">
            <h5 className="fw-bold mb-1">
              {isAdminEdit 
                ? `${profileData.firstName} ${profileData.lastName}` 
                : `${user?.firstName} ${user?.lastName}`}
            </h5>
            <p className="text-muted small mb-3">{profileData.email}</p>
            
            <div className="d-flex gap-2 justify-content-center">
              <label className="btn btn-outline-primary btn-sm">
                <FaUpload className="me-2" />
                Upload Photo
                <input
                  type="file"
                  className="d-none"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  aria-label="Upload profile photo"
                  title="Upload profile photo"
                />
              </label>
              
              {profilePhoto && (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handlePhotoUpload}
                  disabled={saving}
                >
                  {saving ? (
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  ) : (
                    <FaSave className="me-2" />
                  )}
                  Save Photo
                </button>
              )}
            </div>
            
            {uploadError && (
              <div className="text-danger small mt-2">{uploadError}</div>
            )}
          </div>
        </div>
      </div>
      
      {/* Form Tabs */}
      <div className="border-bottom mb-4">
        <nav className="nav nav-tabs border-0">
          <button
            type="button"
            className={`nav-link ${activeTab === 'personal' ? 'active' : ''}`}
            onClick={() => handleTabChange('personal')}
          >
            <FaUser className="me-2" />
            Personal Information
          </button>
          
          {(profileData.role === UserRole.DOCTOR || profileData.role === UserRole.NURSE || 
            user?.role === UserRole.DOCTOR || user?.role === UserRole.NURSE) && (
            <button
              type="button"
              className={`nav-link ${activeTab === 'professional' ? 'active' : ''}`}
              onClick={() => handleTabChange('professional')}
            >
              <FaUserMd className="me-2" />
              Professional Profile
            </button>
          )}
          
          <button
            type="button"
            className={`nav-link ${activeTab === 'medical' ? 'active' : ''}`}
            onClick={() => handleTabChange('medical')}
          >
            {isAdminEdit 
              ? (profileData.role === UserRole.PATIENT || profileData.role === 'patient' ? (
                  <>
                    <FaHospital className="me-2" />
                    Medical Information
                  </>
                ) : (
                  <>
                    <FaUserMd className="me-2" />
                    Professional Details
                  </>
                ))
              : (user?.role === UserRole.PATIENT ? (
                  <>
                    <FaHospital className="me-2" />
                    Medical Information
                  </>
                ) : (
                  <>
                    <FaIdCard className="me-2" />
                    Credentials
                  </>
                ))
            }
          </button>
        </nav>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Personal Information Tab */}
        {activeTab === 'personal' && (
          <div className="row g-4">
            <div className="col-md-6">
              <div className="form-group">
                <label className="form-label d-flex align-items-center">
                  <FaUser className="me-2 text-primary" />
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  className="form-control"
                  value={profileData.firstName}
                  onChange={handleChange}
                  required
                  placeholder="Enter your first name"
                />
              </div>
            </div>
            
            <div className="col-md-6">
              <div className="form-group">
                <label className="form-label d-flex align-items-center">
                  <FaUser className="me-2 text-primary" />
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  className="form-control"
                  value={profileData.lastName}
                  onChange={handleChange}
                  required
                  placeholder="Enter your last name"
                />
              </div>
            </div>
            
            <div className="col-md-6">
              <div className="form-group">
                <label className="form-label d-flex align-items-center">
                  <FaEnvelope className="me-2 text-primary" />
                  Email
                  {(profileData.role === UserRole.DOCTOR || profileData.role === UserRole.NURSE || 
                    user?.role === UserRole.DOCTOR || user?.role === UserRole.NURSE) && (
                    <button
                      type="button"
                      onClick={() => handleVisibilityChange('email')}
                      className="btn btn-sm text-primary ms-2 p-0"
                      title={fieldVisibility.email ? "Email is public" : "Email is private"}
                    >
                      {fieldVisibility.email ? <FaGlobe size={14} /> : <FaLock size={14} />}
                    </button>
                  )}
                </label>
                <input
                  type="email"
                  name="email"
                  className="form-control"
                  value={profileData.email}
                  onChange={handleChange}
                  required
                  placeholder="your.email@example.com"
                />
                {(profileData.role === UserRole.DOCTOR || profileData.role === UserRole.NURSE ||
                  user?.role === UserRole.DOCTOR || user?.role === UserRole.NURSE) && (
                  <div className="form-text text-muted">
                    {fieldVisibility.email 
                      ? <span className="text-success"><FaEye className="me-1" /> Publicly visible</span>
                      : <span className="text-secondary"><FaEyeSlash className="me-1" /> Private</span>
                    }
                  </div>
                )}
              </div>
            </div>
            
            <div className="col-md-6">
              <div className="form-group">
                <label className="form-label d-flex align-items-center">
                  <FaPhone className="me-2 text-primary" />
                  Phone Number
                  {(profileData.role === UserRole.DOCTOR || profileData.role === UserRole.NURSE || 
                    user?.role === UserRole.DOCTOR || user?.role === UserRole.NURSE) && (
                    <button
                      type="button"
                      onClick={() => handleVisibilityChange('phone')}
                      className="btn btn-sm text-primary ms-2 p-0"
                      title={fieldVisibility.phone ? "Phone is public" : "Phone is private"}
                    >
                      {fieldVisibility.phone ? <FaGlobe size={14} /> : <FaLock size={14} />}
                    </button>
                  )}
                </label>
                <input
                  type="tel"
                  name="phone"
                  className="form-control"
                  value={profileData.phone}
                  onChange={handleChange}
                  placeholder="(123) 456-7890"
                />
                {(profileData.role === UserRole.DOCTOR || profileData.role === UserRole.NURSE ||
                  user?.role === UserRole.DOCTOR || user?.role === UserRole.NURSE) && (
                  <div className="form-text text-muted">
                    {fieldVisibility.phone 
                      ? <span className="text-success"><FaEye className="me-1" /> Publicly visible</span> 
                      : <span className="text-secondary"><FaEyeSlash className="me-1" /> Private</span>
                    }
                  </div>
                )}
              </div>
            </div>
            
            <div className="col-md-6">
              <div className="form-group">
                <label className="form-label d-flex align-items-center">
                  <FaCalendarAlt className="me-2 text-primary" />
                  Date of Birth
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  className="form-control"
                  value={profileData.dateOfBirth}
                  onChange={handleChange}
                  aria-label="Date of Birth"
                  placeholder="YYYY-MM-DD"
                  title="Enter your date of birth"
                />
              </div>
            </div>
            
            <div className="col-md-6">
              <div className="form-group">
                <label className="form-label d-flex align-items-center">
                  <FaVenusMars className="me-2 text-primary" />
                  Gender
                </label>
                <select
                  name="gender"
                  className="form-select"
                  value={profileData.gender}
                  onChange={handleChange}
                  aria-label="Select gender"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer-not-to-say">Prefer not to say</option>
                </select>
              </div>
            </div>
            
            <div className="col-12">
              <div className="form-group">
                <label className="form-label d-flex align-items-center">
                  <FaMapMarkerAlt className="me-2 text-primary" />
                  Address
                </label>
                <textarea
                  name="address"
                  rows={2}
                  className="form-control"
                  value={profileData.address}
                  onChange={handleChange}
                  placeholder="Your full address"
                ></textarea>
              </div>
            </div>
          </div>
        )}
        
        {/* Professional Profile Tab - NEW */}
        {activeTab === 'professional' && (
          <div className="row g-4">
            <div className="col-12">
              <div className="alert alert-info">
                <FaGlobe className="me-2" />
                Fields marked as public will be visible in your public profile to patients and other healthcare providers.
              </div>
            </div>
          
            <div className="col-12">
              <div className="form-group">
                <label className="form-label d-flex align-items-center">
                  <FaUserMd className="me-2 text-primary" />
                  Professional Bio
                  <button
                    type="button"
                    onClick={() => handleVisibilityChange('bio')}
                    className="btn btn-sm text-primary ms-2 p-0"
                    title={fieldVisibility.bio ? "Bio is public" : "Bio is private"}
                  >
                    {fieldVisibility.bio ? <FaGlobe size={14} /> : <FaLock size={14} />}
                  </button>
                </label>
                <textarea
                  name="bio"
                  rows={4}
                  className="form-control"
                  value={professionalData.bio}
                  onChange={handleProfessionalDataChange}
                  placeholder="Introduce yourself professionally - this will be shown on your public profile"
                ></textarea>
                <div className="form-text text-muted">
                  {fieldVisibility.bio 
                    ? <span className="text-success"><FaEye className="me-1" /> Publicly visible</span> 
                    : <span className="text-secondary"><FaEyeSlash className="me-1" /> Private</span>
                  }
                </div>
              </div>
            </div>
            
            <div className="col-md-6">
              <div className="form-group">
                <label className="form-label d-flex align-items-center">
                  <FaIdCard className="me-2 text-primary" />
                  Education
                  <button
                    type="button"
                    onClick={() => handleVisibilityChange('education')}
                    className="btn btn-sm text-primary ms-2 p-0"
                    title={fieldVisibility.education ? "Education is public" : "Education is private"}
                  >
                    {fieldVisibility.education ? <FaGlobe size={14} /> : <FaLock size={14} />}
                  </button>
                </label>
                <textarea
                  name="education"
                  rows={3}
                  className="form-control"
                  value={professionalData.education}
                  onChange={handleProfessionalDataChange}
                  placeholder="List your degrees, schools, and years of graduation"
                ></textarea>
                <div className="form-text text-muted">
                  {fieldVisibility.education 
                    ? <span className="text-success"><FaEye className="me-1" /> Publicly visible</span> 
                    : <span className="text-secondary"><FaEyeSlash className="me-1" /> Private</span>
                  }
                </div>
              </div>
            </div>
            
            <div className="col-md-6">
              <div className="form-group">
                <label className="form-label d-flex align-items-center">
                  <FaBuilding className="me-2 text-primary" />
                  Experience
                  <button
                    type="button"
                    onClick={() => handleVisibilityChange('experience')}
                    className="btn btn-sm text-primary ms-2 p-0"
                    title={fieldVisibility.experience ? "Experience is public" : "Experience is private"}
                  >
                    {fieldVisibility.experience ? <FaGlobe size={14} /> : <FaLock size={14} />}
                  </button>
                </label>
                <textarea
                  name="experience"
                  rows={3}
                  className="form-control"
                  value={professionalData.experience}
                  onChange={handleProfessionalDataChange}
                  placeholder="Describe your professional experience and years of practice"
                ></textarea>
                <div className="form-text text-muted">
                  {fieldVisibility.experience 
                    ? <span className="text-success"><FaEye className="me-1" /> Publicly visible</span> 
                    : <span className="text-secondary"><FaEyeSlash className="me-1" /> Private</span>
                  }
                </div>
              </div>
            </div>
            
            {profileData.role === UserRole.DOCTOR && (
              <>
                <div className="col-md-6">
                  <div className="form-group">
                    <label className="form-label d-flex align-items-center">
                      <FaCalendarAlt className="me-2 text-primary" />
                      Availability
                    </label>
                    <input
                      type="text"
                      name="availability"
                      className="form-control"
                      value={professionalData.availability}
                      onChange={handleProfessionalDataChange}
                      placeholder="e.g. Mon-Fri 9AM-5PM"
                    />
                  </div>
                </div>
                
                <div className="col-md-6">
                  <div className="form-group">
                    <label className="form-label d-flex align-items-center">
                      <FaIdCard className="me-2 text-primary" />
                      Consultation Fee
                    </label>
                    <input
                      type="text"
                      name="consultationFee"
                      className="form-control"
                      value={professionalData.consultationFee}
                      onChange={handleProfessionalDataChange}
                      placeholder="e.g. $100 per hour"
                    />
                  </div>
                </div>
                
                <div className="col-md-6">
                  <div className="form-group">
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="acceptingNewPatients"
                        name="acceptingNewPatients"
                        checked={professionalData.acceptingNewPatients}
                        onChange={(e) => setProfessionalData(prev => ({
                          ...prev,
                          acceptingNewPatients: e.target.checked
                        }))}
                      />
                      <label className="form-check-label" htmlFor="acceptingNewPatients">
                        Currently accepting new patients
                      </label>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
        
        {/* Medical/Professional Information Tab */}
        {activeTab === 'medical' && (
          <div className="row g-4">
            {profileData.role === UserRole.PATIENT || user?.role === UserRole.PATIENT ? (
              <>
                <div className="col-md-6">
                  <div className="form-group">
                    <label className="form-label d-flex align-items-center">
                      <FaIdCard className="me-2 text-primary" />
                      Medical Record Number
                    </label>
                    <input
                      type="text"
                      name="medicalRecordNumber"
                      className="form-control"
                      value={profileData.medicalRecordNumber || ''}
                      onChange={handleChange}
                      placeholder="Patient ID/Medical Record Number"
                    />
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="form-group">
                    <label className="form-label d-flex align-items-center">
                      <FaTint className="me-2 text-primary" />
                      Blood Type
                    </label>
                    <select
                      name="bloodType"
                      className="form-select"
                      value={profileData.bloodType}
                      onChange={handleChange}
                      aria-label="Select blood type"
                    >
                      <option value="">Select blood type</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>
                </div>
                
                <div className="col-md-6">
                  <div className="form-group">
                    <label className="form-label d-flex align-items-center">
                      <FaAllergies className="me-2 text-primary" />
                      Allergies
                    </label>
                    <input
                      type="text"
                      name="allergies"
                      className="form-control"
                      value={profileData.allergies}
                      onChange={handleChange}
                      placeholder="List your allergies (comma separated)"
                    />
                  </div>
                </div>
                
                <div className="col-md-6">
                  <div className="form-group">
                    <label className="form-label d-flex align-items-center">
                      <FaPhoneAlt className="me-2 text-primary" />
                      Emergency Contact
                    </label>
                    <input
                      type="text"
                      name="emergencyContact"
                      className="form-control"
                      value={profileData.emergencyContact}
                      onChange={handleChange}
                      placeholder="Emergency contact number"
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="col-md-6">
                  <div className="form-group">
                    <label className="form-label d-flex align-items-center">
                      <FaBuilding className="me-2 text-primary" />
                      Department
                      <button
                        type="button"
                        onClick={() => handleVisibilityChange('department')}
                        className="btn btn-sm text-primary ms-2 p-0"
                        title={fieldVisibility.department ? "Department is public" : "Department is private"}
                      >
                        {fieldVisibility.department ? <FaGlobe size={14} /> : <FaLock size={14} />}
                      </button>
                    </label>
                    <input
                      type="text"
                      name="department"
                      className="form-control"
                      value={profileData.department}
                      onChange={handleChange}
                      placeholder="e.g. Cardiology"
                    />
                    <div className="form-text text-muted">
                      {fieldVisibility.department 
                        ? <span className="text-success"><FaEye className="me-1" /> Publicly visible</span> 
                        : <span className="text-secondary"><FaEyeSlash className="me-1" /> Private</span>
                      }
                    </div>
                  </div>
                </div>
                
                <div className="col-md-6">
                  <div className="form-group">
                    <label className="form-label d-flex align-items-center">
                      <FaUserMd className="me-2 text-primary" />
                      Specialization
                      <button
                        type="button"
                        onClick={() => handleVisibilityChange('specialization')}
                        className="btn btn-sm text-primary ms-2 p-0"
                        title={fieldVisibility.specialization ? "Specialization is public" : "Specialization is private"}
                      >
                        {fieldVisibility.specialization ? <FaGlobe size={14} /> : <FaLock size={14} />}
                      </button>
                    </label>
                    <input
                      type="text"
                      name="specialization"
                      className="form-control"
                      value={profileData.specialization}
                      onChange={handleChange}
                      placeholder="e.g. Pediatric Cardiology"
                    />
                    <div className="form-text text-muted">
                      {fieldVisibility.specialization 
                        ? <span className="text-success"><FaEye className="me-1" /> Publicly visible</span> 
                        : <span className="text-secondary"><FaEyeSlash className="me-1" /> Private</span>
                      }
                    </div>
                  </div>
                </div>
                
                <div className="col-md-6">
                  <div className="form-group">
                    <label className="form-label d-flex align-items-center">
                      <FaIdCard className="me-2 text-primary" />
                      License Number
                      <button
                        type="button"
                        onClick={() => handleVisibilityChange('licenseNumber')}
                        className="btn btn-sm text-primary ms-2 p-0"
                        title={fieldVisibility.licenseNumber ? "License Number is public" : "License Number is private"}
                      >
                        {fieldVisibility.licenseNumber ? <FaGlobe size={14} /> : <FaLock size={14} />}
                      </button>
                    </label>
                    <input
                      type="text"
                      name="licenseNumber"
                      className="form-control"
                      value={profileData.licenseNumber}
                      onChange={handleChange}
                      placeholder="Professional license number"
                    />
                    <div className="form-text text-muted">
                      {fieldVisibility.licenseNumber 
                        ? <span className="text-success"><FaEye className="me-1" /> Publicly visible</span> 
                        : <span className="text-secondary"><FaEyeSlash className="me-1" /> Private</span>
                      }
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
        
        {/* Submit Button */}
        <div className="mt-4">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
          >
            {saving ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Saving...
              </>
            ) : (
              <>
                <FaSave className="me-2" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProfileForm; 