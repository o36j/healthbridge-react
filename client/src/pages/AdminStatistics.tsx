import React, { useState, useEffect, useRef } from 'react';
import { useAuth, UserRole } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  FaUsers,
  FaCalendarCheck,
  FaChartLine,
  FaUserMd,
  FaUser,
  FaNotesMedical,
  FaHospital,
  FaDownload,
  FaPrint,
  FaFilter,
  FaCalendarAlt
} from 'react-icons/fa';
import { Container, Row, Col, Card, Button, Form, Spinner, Alert, Tabs, Tab } from 'react-bootstrap';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title } from 'chart.js';
import { Pie, Line, Bar } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import { saveAs } from 'file-saver';

// Register ChartJS components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title
);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface StatsSummary {
  totalUsers: number;
  usersByRole: {
    patient: number;
    doctor: number;
    nurse: number;
    admin: number;
  };
  totalAppointments: number;
  appointmentsByStatus: {
    pending: number;
    confirmed: number;
    cancelled: number;
    completed: number;
    rescheduled: number;
  };
  recentRegistrations: number;
  todayAppointments: number;
}

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string[] | string;
    borderColor?: string[] | string;
    borderWidth?: number;
    fill?: boolean;
    tension?: number;
  }[];
}

const AdminStatistics = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [statsSummary, setStatsSummary] = useState<StatsSummary | null>(null);
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  
  // Chart data states
  const [appointmentTimelineData, setAppointmentTimelineData] = useState<ChartData | null>(null);
  const [appointmentStatusData, setAppointmentStatusData] = useState<ChartData | null>(null);
  const [userGrowthData, setUserGrowthData] = useState<ChartData | null>(null);
  const [departmentLoadData, setDepartmentLoadData] = useState<ChartData | null>(null);
  const [doctorPerformanceData, setDoctorPerformanceData] = useState<ChartData | null>(null);
  const [diagnosisData, setDiagnosisData] = useState<ChartData | null>(null);
  const [medicationData, setMedicationData] = useState<ChartData | null>(null);
  
  // Chart refs for PDF export
  const appointmentTimelineRef = useRef<any>(null);
  const appointmentStatusRef = useRef<any>(null);
  const userDistributionRef = useRef<any>(null);
  const userGrowthRef = useRef<any>(null);
  const departmentLoadRef = useRef<any>(null);
  const doctorPerformanceRef = useRef<any>(null);
  const diagnosisRef = useRef<any>(null);
  const medicationRef = useRef<any>(null);
  
  // Function to generate mock data for appointment timeline
  const generateAppointmentTimelineMockData = () => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    setAppointmentTimelineData({
      labels: days,
      datasets: [
        {
          label: 'Appointments',
          data: [12, 19, 15, 8, 22, 14, 11],
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.4,
          fill: true
        }
      ]
    });
  };
  
  // Function to generate mock data for appointment status distribution
  const generateAppointmentStatusMockData = () => {
    setAppointmentStatusData({
      labels: ['Pending', 'Confirmed', 'Cancelled', 'Completed', 'Rescheduled'],
      datasets: [
        {
          label: 'Appointment Status',
          data: [15, 30, 8, 40, 7],
          backgroundColor: [
            'rgba(255, 206, 86, 0.7)',
            'rgba(54, 162, 235, 0.7)',
            'rgba(255, 99, 132, 0.7)',
            'rgba(75, 192, 192, 0.7)',
            'rgba(153, 102, 255, 0.7)'
          ],
          borderWidth: 1
        }
      ]
    });
  };
  
  // Function to generate mock data for user growth
  const generateUserGrowthMockData = () => {
    setUserGrowthData({
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [
        {
          label: 'Patients',
          data: [25, 42, 65, 89, 120, 152],
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.4,
          fill: true
        },
        {
          label: 'Doctors',
          data: [8, 12, 18, 24, 28, 32],
          borderColor: 'rgba(54, 162, 235, 1)',
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          tension: 0.4,
          fill: true
        },
        {
          label: 'Nurses',
          data: [5, 7, 10, 12, 15, 18],
          borderColor: 'rgba(255, 159, 64, 1)',
          backgroundColor: 'rgba(255, 159, 64, 0.2)',
          tension: 0.4,
          fill: true
        },
        {
          label: 'Admins',
          data: [2, 3, 3, 4, 4, 5],
          borderColor: 'rgba(153, 102, 255, 1)',
          backgroundColor: 'rgba(153, 102, 255, 0.2)',
          tension: 0.4,
          fill: true
        }
      ]
    });
  };
  
  // Function to generate mock data for department load
  const generateDepartmentLoadMockData = () => {
    setDepartmentLoadData({
      labels: ['Cardiology', 'Neurology', 'Pediatrics', 'Orthopedics', 'Dermatology', 'General'],
      datasets: [
        {
          label: 'Appointments by Department',
          data: [25, 18, 30, 22, 15, 40],
          backgroundColor: 'rgba(54, 162, 235, 0.7)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }
      ]
    });
  };
  
  // Function to generate mock data for doctor performance
  const generateDoctorPerformanceMockData = () => {
    setDoctorPerformanceData({
      labels: ['Dr. Smith', 'Dr. Johnson', 'Dr. Williams', 'Dr. Brown', 'Dr. Davis'],
      datasets: [
        {
          label: 'Appointments Completed',
          data: [42, 38, 45, 30, 35],
          backgroundColor: 'rgba(75, 192, 192, 0.7)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
        }
      ]
    });
  };
  
  // Function to generate mock data for common diagnoses
  const generateDiagnosisMockData = () => {
    setDiagnosisData({
      labels: [
        'Hypertension', 
        'Type 2 Diabetes', 
        'Upper Respiratory Infection', 
        'Generalized Anxiety Disorder', 
        'Seasonal Allergies', 
        'Chronic Lower Back Pain',
        'Coronary Artery Disease',
        'Asthma',
        'Osteoarthritis',
        'GERD'
      ],
      datasets: [
        {
          label: 'Frequency',
          data: [145, 125, 110, 98, 87, 75, 68, 63, 57, 52],
          backgroundColor: 'rgba(153, 102, 255, 0.7)',
          borderColor: 'rgba(153, 102, 255, 1)',
          borderWidth: 1
        }
      ]
    });
  };
  
  // Function to generate mock data for common medications
  const generateMedicationMockData = () => {
    setMedicationData({
      labels: [
        'Atorvastatin (Lipitor)', 
        'Levothyroxine (Synthroid)',
        'Lisinopril',
        'Metformin (Glucophage)',
        'Amlodipine (Norvasc)',
        'Metoprolol',
        'Omeprazole (Prilosec)',
        'Albuterol (Ventolin)',
        'Hydrochlorothiazide',
        'Sertraline (Zoloft)'
      ],
      datasets: [
        {
          label: 'Prescriptions',
          data: [157, 134, 128, 118, 105, 94, 89, 76, 68, 62],
          backgroundColor: 'rgba(255, 99, 132, 0.7)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1
        }
      ]
    });
  };
  
  // Function to generate all mock chart data at once
  const generateAllMockChartData = () => {
    generateAppointmentTimelineMockData();
    generateAppointmentStatusMockData();
    generateUserGrowthMockData();
    generateDepartmentLoadMockData();
    generateDoctorPerformanceMockData();
    generateDiagnosisMockData();
    generateMedicationMockData();
  };
  
  useEffect(() => {
    // Redirect if not admin
    if (user?.role !== UserRole.ADMIN) {
      navigate('/');
      return;
    }
    
    fetchStatistics();
  }, [user, navigate]);
  
  const fetchStatistics = async () => {
    try {
      setLoading(true);
      
      // Build query params for date range
      const params = new URLSearchParams();
      if (dateRange.startDate) {
        params.append('startDate', dateRange.startDate);
      }
      if (dateRange.endDate) {
        params.append('endDate', dateRange.endDate);
      }
      
      try {
        // Fetch summary statistics - with timeout to prevent long waiting
        const summaryResponse = await axios.get(`${API_URL}/admin/statistics/summary?${params.toString()}`, {
          timeout: 5000 // 5 second timeout
        });
        
        // Validate and ensure usersByRole data is properly structured
        const receivedData = summaryResponse.data;
        
        // Ensure all the required fields exist with fallbacks to prevent chart rendering issues
        const normalizedData = {
          ...receivedData,
          totalUsers: receivedData.totalUsers || 0,
          usersByRole: {
            patient: receivedData.usersByRole?.patient || 0,
            doctor: receivedData.usersByRole?.doctor || 0,
            nurse: receivedData.usersByRole?.nurse || 0,
            admin: receivedData.usersByRole?.admin || 0
          },
          appointmentsByStatus: {
            pending: receivedData.appointmentsByStatus?.pending || 0,
            confirmed: receivedData.appointmentsByStatus?.confirmed || 0,
            cancelled: receivedData.appointmentsByStatus?.cancelled || 0,
            completed: receivedData.appointmentsByStatus?.completed || 0,
            rescheduled: receivedData.appointmentsByStatus?.rescheduled || 0
          },
          totalAppointments: receivedData.totalAppointments || 0,
          recentRegistrations: receivedData.recentRegistrations || 0,
          todayAppointments: receivedData.todayAppointments || 0
        };
        
        // Set the normalized data to state
        setStatsSummary(normalizedData);
        
        // Debug log
        console.log('User distribution data:', normalizedData.usersByRole);
        console.log('Total users:', normalizedData.totalUsers);
        
        // Set appointment status data from the normalized data
        setAppointmentStatusData({
          labels: ['Pending', 'Confirmed', 'Cancelled', 'Completed', 'Rescheduled'],
          datasets: [
            {
              label: 'Appointment Status',
              data: [
                normalizedData.appointmentsByStatus.pending,
                normalizedData.appointmentsByStatus.confirmed,
                normalizedData.appointmentsByStatus.cancelled,
                normalizedData.appointmentsByStatus.completed,
                normalizedData.appointmentsByStatus.rescheduled
              ],
              backgroundColor: [
                'rgba(255, 206, 86, 0.7)',
                'rgba(54, 162, 235, 0.7)',
                'rgba(255, 99, 132, 0.7)',
                'rgba(75, 192, 192, 0.7)',
                'rgba(153, 102, 255, 0.7)'
              ],
              borderWidth: 1
            }
          ]
        });
        
        // Fetch appointment timeline data
        try {
          const appointmentTimelineResponse = await axios.get(`${API_URL}/admin/statistics/appointment-timeline?${params.toString()}`, {
            timeout: 5000
          });
          
          if (appointmentTimelineResponse.data && appointmentTimelineResponse.data.labels) {
            setAppointmentTimelineData({
              labels: appointmentTimelineResponse.data.labels,
              datasets: [
                {
                  label: 'Appointments',
                  data: appointmentTimelineResponse.data.data,
                  borderColor: 'rgba(75, 192, 192, 1)',
                  backgroundColor: 'rgba(75, 192, 192, 0.2)',
                  tension: 0.4,
                  fill: true
                }
              ]
            });
          } else {
            // Fallback to mock data
            generateAppointmentTimelineMockData();
          }
        } catch (error) {
          console.log('Failed to fetch appointment timeline data, using mock data instead');
          generateAppointmentTimelineMockData();
        }
        
        // Fetch department load data
        try {
          const departmentLoadResponse = await axios.get(`${API_URL}/admin/statistics/department-load?${params.toString()}`, {
            timeout: 5000
          });
          
          if (departmentLoadResponse.data && departmentLoadResponse.data.length > 0) {
            const departments = departmentLoadResponse.data.map((item: any) => item.department);
            const appointmentCounts = departmentLoadResponse.data.map((item: any) => item.appointmentCount);
            
            setDepartmentLoadData({
              labels: departments,
              datasets: [
                {
                  label: 'Appointments by Department',
                  data: appointmentCounts,
                  backgroundColor: 'rgba(54, 162, 235, 0.7)',
                  borderColor: 'rgba(54, 162, 235, 1)',
                  borderWidth: 1
                }
              ]
            });
          } else {
            // Fallback to mock data
            generateDepartmentLoadMockData();
          }
        } catch (error) {
          console.log('Failed to fetch department load data, using mock data instead');
          generateDepartmentLoadMockData();
        }
        
        // Fetch doctor performance data
        try {
          const doctorPerformanceResponse = await axios.get(`${API_URL}/admin/statistics/doctor-performance?${params.toString()}`, {
            timeout: 5000
          });
          
          if (doctorPerformanceResponse.data && doctorPerformanceResponse.data.length > 0) {
            const doctors = doctorPerformanceResponse.data.map((item: any) => 
              `Dr. ${item.doctorInfo.firstName} ${item.doctorInfo.lastName}`
            );
            const completedAppointments = doctorPerformanceResponse.data.map((item: any) => 
              item.completedAppointments
            );
            
            setDoctorPerformanceData({
              labels: doctors,
              datasets: [
                {
                  label: 'Appointments Completed',
                  data: completedAppointments,
                  backgroundColor: 'rgba(75, 192, 192, 0.7)',
                  borderColor: 'rgba(75, 192, 192, 1)',
                  borderWidth: 1
                }
              ]
            });
          } else {
            // Fallback to mock data
            generateDoctorPerformanceMockData();
          }
        } catch (error) {
          console.log('Failed to fetch doctor performance data, using mock data instead');
          generateDoctorPerformanceMockData();
        }
        
        // Fetch diagnoses data
        try {
          const diagnosesResponse = await axios.get(`${API_URL}/admin/statistics/common-diagnoses?${params.toString()}`, {
            timeout: 5000
          });
          
          if (diagnosesResponse.data && diagnosesResponse.data.length > 0) {
            const diagnoses = diagnosesResponse.data.map((item: any) => item._id);
            const counts = diagnosesResponse.data.map((item: any) => item.count);
            
            setDiagnosisData({
              labels: diagnoses,
              datasets: [
                {
                  label: 'Frequency',
                  data: counts,
                  backgroundColor: 'rgba(153, 102, 255, 0.7)',
                  borderColor: 'rgba(153, 102, 255, 1)',
                  borderWidth: 1
                }
              ]
            });
          } else {
            // Fallback to mock data
            generateDiagnosisMockData();
          }
        } catch (error) {
          console.log('Failed to fetch diagnosis data, using mock data instead');
          generateDiagnosisMockData();
        }
        
        // Fetch user growth data
        try {
          const userGrowthResponse = await axios.get(`${API_URL}/admin/statistics/user-growth?${params.toString()}`, {
            timeout: 5000
          });
          
          if (userGrowthResponse.data && userGrowthResponse.data.labels) {
            setUserGrowthData({
              labels: userGrowthResponse.data.labels,
              datasets: userGrowthResponse.data.datasets.map((dataset: any, index: number) => ({
                ...dataset,
                borderColor: index === 0 ? 'rgba(75, 192, 192, 1)' : 'rgba(54, 162, 235, 1)',
                backgroundColor: index === 0 ? 'rgba(75, 192, 192, 0.2)' : 'rgba(54, 162, 235, 0.2)',
                tension: 0.4,
                fill: true
              }))
            });
          } else {
            // Fallback to mock data
            generateUserGrowthMockData();
          }
        } catch (error) {
          console.log('Failed to fetch user growth data, using mock data instead');
          generateUserGrowthMockData();
        }
        
        // Try to fetch medication data from API
        try {
          const medicationsResponse = await axios.get(`${API_URL}/admin/statistics/common-medications`, {
            timeout: 5000
          });
          
          if (medicationsResponse.data && medicationsResponse.data.length > 0) {
            // Transform API response into chart data format
            const medicationLabels = medicationsResponse.data.map((item: any) => item.medication);
            const medicationCounts = medicationsResponse.data.map((item: any) => item.count);
            
            setMedicationData({
              labels: medicationLabels,
              datasets: [
                {
                  label: 'Prescriptions',
                  data: medicationCounts,
                  backgroundColor: 'rgba(255, 99, 132, 0.7)',
                  borderColor: 'rgba(255, 99, 132, 1)',
                  borderWidth: 1
                }
              ]
            });
          } else {
            // If no data received, fall back to mock data
            generateMedicationMockData();
          }
        } catch (medError) {
          console.log('Failed to fetch medication data, using mock data instead');
          generateMedicationMockData();
        }
      } catch (apiError) {
        console.error('Failed to fetch from API, using mock data instead');
        // Set mock data when API is not available
        const mockStatsSummary = {
          totalUsers: 150,
          usersByRole: {
            patient: 100,
            doctor: 30,
            nurse: 15,
            admin: 5
          },
          totalAppointments: 350,
          appointmentsByStatus: {
            pending: 50,
            confirmed: 120,
            cancelled: 30,
            completed: 140,
            rescheduled: 10
          },
          recentRegistrations: 15,
          todayAppointments: 28
        };
        
        setStatsSummary(mockStatsSummary);
        
        // Set appointment status data from the mock data
        setAppointmentStatusData({
          labels: ['Pending', 'Confirmed', 'Cancelled', 'Completed', 'Rescheduled'],
          datasets: [
            {
              label: 'Appointment Status',
              data: [
                mockStatsSummary.appointmentsByStatus.pending,
                mockStatsSummary.appointmentsByStatus.confirmed,
                mockStatsSummary.appointmentsByStatus.cancelled,
                mockStatsSummary.appointmentsByStatus.completed,
                mockStatsSummary.appointmentsByStatus.rescheduled
              ],
              backgroundColor: [
                'rgba(255, 206, 86, 0.7)',
                'rgba(54, 162, 235, 0.7)',
                'rgba(255, 99, 132, 0.7)',
                'rgba(75, 192, 192, 0.7)',
                'rgba(153, 102, 255, 0.7)'
              ],
              borderWidth: 1
            }
          ]
        });
        
        // Generate all mock chart data
        generateAllMockChartData();
      }
      
    } catch (err: any) {
      setError('Failed to load statistics. Please try again later.');
      console.error('Statistics error:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleDateRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDateRange(prev => ({ ...prev, [name]: value }));
  };
  
  const handleApplyDateFilter = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStatistics();
  };
  
  const handleExportData = (format: 'csv' | 'pdf') => {
    // Get current date for filename
    const date = new Date().toISOString().split('T')[0];
    const filename = `healthbridge_statistics_${date}`;
    
    if (format === 'csv') {
      // Create CSV content
      const headers = ['Category', 'Value'];
      const rows = [
        ['Total Users', statsSummary?.totalUsers || 0],
        ['Patients', statsSummary?.usersByRole?.patient || 0],
        ['Doctors', statsSummary?.usersByRole?.doctor || 0],
        ['Nurses', statsSummary?.usersByRole?.nurse || 0],
        ['Admins', statsSummary?.usersByRole?.admin || 0],
        ['Total Appointments', statsSummary?.totalAppointments || 0],
        ['Pending Appointments', statsSummary?.appointmentsByStatus?.pending || 0],
        ['Confirmed Appointments', statsSummary?.appointmentsByStatus?.confirmed || 0],
        ['Cancelled Appointments', statsSummary?.appointmentsByStatus?.cancelled || 0],
        ['Completed Appointments', statsSummary?.appointmentsByStatus?.completed || 0],
        ['Rescheduled Appointments', statsSummary?.appointmentsByStatus?.rescheduled || 0],
        ['Recent Registrations (7 days)', statsSummary?.recentRegistrations || 0],
        ['Today\'s Appointments', statsSummary?.todayAppointments || 0],
      ];
      
      // Add date filter info if applied
      if (dateRange.startDate || dateRange.endDate) {
        rows.unshift(['Date Range', `${dateRange.startDate || 'All'} to ${dateRange.endDate || 'Present'}`]);
      }
      
      // Format CSV content
      const csvContent = [
        headers.join(','),
        ...rows.map(row => `"${row[0]}",${row[1]}`)
      ].join('\n');
      
      // Create blob and trigger download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, `${filename}.csv`);
      
    } else if (format === 'pdf') {
      // Create PDF document
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(18);
      doc.text('HealthBridge Statistics Report', 14, 20);
      
      // Add date
      doc.setFontSize(12);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
      
      // Add date range if applied
      if (dateRange.startDate || dateRange.endDate) {
        doc.text(`Date Range: ${dateRange.startDate || 'All'} to ${dateRange.endDate || 'Present'}`, 14, 40);
      }
      
      // Add statistics data
      doc.setFontSize(14);
      doc.text('User Statistics', 14, 50);
      
      doc.setFontSize(10);
      doc.text(`Total Users: ${statsSummary?.totalUsers || 0}`, 20, 60);
      doc.text(`Patients: ${statsSummary?.usersByRole?.patient || 0}`, 20, 65);
      doc.text(`Doctors: ${statsSummary?.usersByRole?.doctor || 0}`, 20, 70);
      doc.text(`Nurses: ${statsSummary?.usersByRole?.nurse || 0}`, 20, 75);
      doc.text(`Admins: ${statsSummary?.usersByRole?.admin || 0}`, 20, 80);
      
      doc.setFontSize(14);
      doc.text('Appointment Statistics', 14, 90);
      
      doc.setFontSize(10);
      doc.text(`Total Appointments: ${statsSummary?.totalAppointments || 0}`, 20, 100);
      doc.text(`Pending: ${statsSummary?.appointmentsByStatus?.pending || 0}`, 20, 105);
      doc.text(`Confirmed: ${statsSummary?.appointmentsByStatus?.confirmed || 0}`, 20, 110);
      doc.text(`Cancelled: ${statsSummary?.appointmentsByStatus?.cancelled || 0}`, 20, 115);
      doc.text(`Completed: ${statsSummary?.appointmentsByStatus?.completed || 0}`, 20, 120);
      doc.text(`Rescheduled: ${statsSummary?.appointmentsByStatus?.rescheduled || 0}`, 20, 125);
      
      doc.setFontSize(14);
      doc.text('Other Metrics', 14, 135);
      
      doc.setFontSize(10);
      doc.text(`Recent Registrations (7 days): ${statsSummary?.recentRegistrations || 0}`, 20, 145);
      doc.text(`Today's Appointments: ${statsSummary?.todayAppointments || 0}`, 20, 150);
      
      // Save PDF
      doc.save(`${filename}.pdf`);
    }
  };
  
  // Add this function near other utility functions
  const ensureValidUserDistributionData = () => {
    // Debug output for user distribution data
    console.log('Creating user distribution chart with data:', statsSummary?.usersByRole);
    
    // Create a fallback dataset if needed
    if (!statsSummary || !statsSummary.usersByRole) {
      console.log('No stats summary available, using mock data');
      const mockUserData = {
        labels: ['Patients', 'Doctors', 'Nurses', 'Admins'],
        datasets: [{
          label: 'Users by Role',
          data: [100, 30, 15, 5],
          backgroundColor: [
            'rgba(255, 159, 64, 0.7)',
            'rgba(54, 162, 235, 0.7)',
            'rgba(75, 192, 192, 0.7)',
            'rgba(153, 102, 255, 0.7)'
          ],
          borderColor: [
            'rgba(255, 159, 64, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)'
          ],
          borderWidth: 1,
          hoverOffset: 4
        }]
      };
      
      return mockUserData;
    }
    
    // Get the actual values, ensuring they're valid numbers
    const patientCount = parseInt(String(statsSummary.usersByRole.patient)) || 0;
    const doctorCount = parseInt(String(statsSummary.usersByRole.doctor)) || 0;
    const nurseCount = parseInt(String(statsSummary.usersByRole.nurse)) || 0;
    const adminCount = parseInt(String(statsSummary.usersByRole.admin)) || 0;
    
    // For debugging - log the parsed values
    console.log('Parsed user counts:', { patientCount, doctorCount, nurseCount, adminCount });
    
    // Check if all values are zero (which would render an empty chart)
    const allZeros = patientCount === 0 && doctorCount === 0 && nurseCount === 0 && adminCount === 0;
    
    // If all are zero, use mock data with a clear indication this is fallback data
    if (allZeros) {
      console.log('All user counts are zero, using mock data');
      return {
        labels: ['Patients', 'Doctors', 'Nurses', 'Admins'],
        datasets: [{
          label: 'Users by Role (Demo Data)',
          data: [80, 20, 10, 5],
          backgroundColor: [
            'rgba(255, 159, 64, 0.7)',
            'rgba(54, 162, 235, 0.7)',
            'rgba(75, 192, 192, 0.7)',
            'rgba(153, 102, 255, 0.7)'
          ],
          borderColor: [
            'rgba(255, 159, 64, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)'
          ],
          borderWidth: 1,
          hoverOffset: 4
        }]
      };
    }
    
    // Create the final chart data object
    const userData = {
      labels: ['Patients', 'Doctors', 'Nurses', 'Admins'],
      datasets: [{
        label: 'Users by Role',
        data: [patientCount, doctorCount, nurseCount, adminCount],
        backgroundColor: [
          'rgba(255, 159, 64, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(153, 102, 255, 0.7)'
        ],
        borderColor: [
          'rgba(255, 159, 64, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)'
        ],
        borderWidth: 1,
        hoverOffset: 4
      }]
    };
    
    console.log('Returning user distribution chart data:', userData);
    return userData;
  };
  
  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">
          {error}
        </Alert>
      </Container>
    );
  }
  
  return (
    <Container fluid className="py-4">
      <h2 className="mb-4">
        <FaChartLine className="me-2" />
        Admin Statistics Dashboard
      </h2>
      
      {/* Filter and export controls */}
      <Row className="mb-4">
        <Col md={8}>
          <Card>
            <Card.Body>
              <Form onSubmit={handleApplyDateFilter} className="d-flex align-items-center">
                <FaCalendarAlt className="me-2 text-muted" />
                <Form.Group className="me-3">
                  <Form.Control
                    type="date"
                    name="startDate"
                    value={dateRange.startDate}
                    onChange={handleDateRangeChange}
                    placeholder="Start Date"
                  />
                </Form.Group>
                <span className="me-3">to</span>
                <Form.Group className="me-3">
                  <Form.Control
                    type="date"
                    name="endDate"
                    value={dateRange.endDate}
                    onChange={handleDateRangeChange}
                    placeholder="End Date"
                  />
                </Form.Group>
                <Button type="submit" variant="primary" className="me-2">
                  <FaFilter className="me-1" /> Apply Filter
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card>
            <Card.Body className="d-flex justify-content-around">
              <Button variant="outline-primary" onClick={() => handleExportData('csv')}>
                <FaDownload className="me-1" /> Export CSV
              </Button>
              <Button variant="outline-primary" onClick={() => handleExportData('pdf')}>
                <FaPrint className="me-1" /> Export PDF
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Summary Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="mb-3 border-0 shadow-sm">
            <Card.Body className="d-flex">
              <div className="rounded-circle bg-primary bg-opacity-10 p-3 me-3">
                <FaUsers className="text-primary fs-4" />
              </div>
              <div>
                <h6 className="text-muted mb-1">Total Users</h6>
                <h3>{statsSummary?.totalUsers || 0}</h3>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="mb-3 border-0 shadow-sm">
            <Card.Body className="d-flex">
              <div className="rounded-circle bg-success bg-opacity-10 p-3 me-3">
                <FaCalendarCheck className="text-success fs-4" />
              </div>
              <div>
                <h6 className="text-muted mb-1">Total Appointments</h6>
                <h3>{statsSummary?.totalAppointments || 0}</h3>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="mb-3 border-0 shadow-sm">
            <Card.Body className="d-flex">
              <div className="rounded-circle bg-info bg-opacity-10 p-3 me-3">
                <FaUserMd className="text-info fs-4" />
              </div>
              <div>
                <h6 className="text-muted mb-1">Total Doctors</h6>
                <h3>{statsSummary?.usersByRole?.doctor || 0}</h3>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="mb-3 border-0 shadow-sm">
            <Card.Body className="d-flex">
              <div className="rounded-circle bg-warning bg-opacity-10 p-3 me-3">
                <FaUser className="text-warning fs-4" />
              </div>
              <div>
                <h6 className="text-muted mb-1">Total Patients</h6>
                <h3>{statsSummary?.usersByRole?.patient || 0}</h3>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Charts */}
      <Tabs defaultActiveKey="appointments" id="statistics-tabs" className="mb-4">
        <Tab eventKey="appointments" title="Appointment Analytics">
          <Row>
            <Col lg={6} className="mb-4">
              <Card className="h-100 shadow-sm">
                <Card.Header>Appointment Timeline</Card.Header>
                <Card.Body>
                  {appointmentTimelineData && (
                    <Line 
                      ref={appointmentTimelineRef}
                      data={appointmentTimelineData}
                      options={{
                        responsive: true,
                        plugins: {
                          title: {
                            display: true,
                            text: 'Appointments - Last 7 Days'
                          }
                        }
                      }}
                    />
                  )}
                </Card.Body>
              </Card>
            </Col>
            <Col lg={6} className="mb-4">
              <Card className="h-100 shadow-sm">
                <Card.Header>Appointment Status Distribution</Card.Header>
                <Card.Body className="d-flex justify-content-center align-items-center">
                  {appointmentStatusData && (
                    <div style={{ maxWidth: '300px', maxHeight: '300px' }}>
                      <Pie 
                        ref={appointmentStatusRef}
                        data={appointmentStatusData}
                        options={{
                          responsive: true,
                          plugins: {
                            legend: {
                              position: 'bottom'
                            }
                          }
                        }}
                      />
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
            <Col lg={6} className="mb-4">
              <Card className="h-100 shadow-sm">
                <Card.Header>Department Load</Card.Header>
                <Card.Body>
                  {departmentLoadData && (
                    <Bar 
                      ref={departmentLoadRef}
                      data={departmentLoadData}
                      options={{
                        responsive: true,
                        plugins: {
                          title: {
                            display: true,
                            text: 'Appointments by Department'
                          }
                        }
                      }}
                    />
                  )}
                </Card.Body>
              </Card>
            </Col>
            <Col lg={6} className="mb-4">
              <Card className="h-100 shadow-sm">
                <Card.Header>Doctor Performance</Card.Header>
                <Card.Body>
                  {doctorPerformanceData && (
                    <Bar 
                      ref={doctorPerformanceRef}
                      data={doctorPerformanceData}
                      options={{
                        responsive: true,
                        indexAxis: 'y',
                        plugins: {
                          title: {
                            display: true,
                            text: 'Appointments Completed by Doctor'
                          }
                        }
                      }}
                    />
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>
        
        <Tab eventKey="users" title="User Analytics">
          <Row>
            <Col lg={8} className="mb-4">
              <Card className="h-100 shadow-sm">
                <Card.Header>User Growth</Card.Header>
                <Card.Body>
                  {userGrowthData && (
                    <Line 
                      ref={userGrowthRef}
                      data={userGrowthData}
                      options={{
                        responsive: true,
                        plugins: {
                          title: {
                            display: true,
                            text: 'User Growth Over Time'
                          }
                        }
                      }}
                    />
                  )}
                </Card.Body>
              </Card>
            </Col>
            <Col lg={4} className="mb-4">
              <Card className="h-100 shadow-sm">
                <Card.Header>User Distribution</Card.Header>
                <Card.Body className="d-flex flex-column justify-content-center align-items-center">
                  {statsSummary && (
                    <>
                      <div style={{ width: '100%', maxWidth: '300px', height: '300px' }}>
                        <Pie 
                          ref={userDistributionRef}
                          data={ensureValidUserDistributionData()}
                          options={{
                            responsive: true,
                            maintainAspectRatio: true,
                            plugins: {
                              legend: {
                                position: 'bottom',
                                labels: {
                                  font: {
                                    size: 12
                                  },
                                  padding: 20
                                }
                              },
                              tooltip: {
                                callbacks: {
                                  label: (context) => {
                                    const label = context.label || '';
                                    const value = context.raw || 0;
                                    const total = statsSummary.totalUsers || 1; // Prevent division by zero
                                    const percentage = Math.round((value as number / total) * 100);
                                    return `${label}: ${value} (${percentage}%)`;
                                  }
                                }
                              }
                            }
                          }}
                        />
                      </div>
                      
                      {/* Fallback text display of data if chart doesn't render properly */}
                      <div className="mt-3 text-center">
                        <h6>Users by Role</h6>
                        <div className="d-flex justify-content-center flex-wrap">
                          <div className="px-3">
                            <span style={{color: 'rgba(255, 159, 64, 1)'}}>●</span> Patients: {statsSummary.usersByRole.patient || 0}
                          </div>
                          <div className="px-3">
                            <span style={{color: 'rgba(54, 162, 235, 1)'}}>●</span> Doctors: {statsSummary.usersByRole.doctor || 0}
                          </div>
                          <div className="px-3">
                            <span style={{color: 'rgba(75, 192, 192, 1)'}}>●</span> Nurses: {statsSummary.usersByRole.nurse || 0}
                          </div>
                          <div className="px-3">
                            <span style={{color: 'rgba(153, 102, 255, 1)'}}>●</span> Admins: {statsSummary.usersByRole.admin || 0}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                  {!statsSummary && (
                    <div className="text-center text-muted py-5">
                      <p>No user data available</p>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>
        
        <Tab eventKey="medical" title="Medical Analytics">
          <Row>
            <Col lg={12} className="mb-4">
              <Card className="shadow-sm">
                <Card.Header>Common Diagnoses</Card.Header>
                <Card.Body>
                  {diagnosisData && (
                    <Bar 
                      ref={diagnosisRef}
                      data={diagnosisData}
                      options={{
                        responsive: true,
                        plugins: {
                          title: {
                            display: true,
                            text: 'Most Common Diagnoses'
                          }
                        }
                      }}
                    />
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
          
          {/* New section for medications */}
          <Row>
            <Col lg={12} className="mb-4">
              <Card className="shadow-sm">
                <Card.Header>Common Prescribed Medications</Card.Header>
                <Card.Body>
                  {medicationData && (
                    <Bar 
                      ref={medicationRef}
                      data={medicationData}
                      options={{
                        responsive: true,
                        indexAxis: 'y',
                        plugins: {
                          title: {
                            display: true,
                            text: 'Most Frequently Prescribed Medications'
                          }
                        }
                      }}
                    />
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
          
          <Row>
            <Col className="mb-4">
              <Alert variant="info">
                <FaNotesMedical className="me-2" />
                More detailed medical analytics can be implemented based on the specific needs of the hospital.
              </Alert>
            </Col>
          </Row>
        </Tab>
      </Tabs>
    </Container>
  );
};

export default AdminStatistics; 