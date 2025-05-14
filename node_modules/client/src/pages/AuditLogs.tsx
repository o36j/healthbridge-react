import React, { useState, useEffect } from 'react';
import { useAuth, UserRole } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  FaSearch,
  FaFilter,
  FaCalendarAlt,
  FaUser,
  FaClock,
  FaChevronLeft,
  FaChevronRight,
  FaFileAlt,
  FaEye,
  FaDownload
} from 'react-icons/fa';
import Button from '../components/ui/Button';
import { Form, Badge, Spinner, Alert, Card, Row, Col } from 'react-bootstrap';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface AuditLog {
  _id: string;
  action: string;
  performedBy: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  performedOn?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  previousValue?: any;
  newValue?: any;
  details?: string;
  ip?: string;
  userAgent?: string;
  createdAt: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const AuditLogs = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });
  
  // Filters
  const [actionFilter, setActionFilter] = useState<string>('');
  const [userFilter, setUserFilter] = useState<string>('');
  const [startDateFilter, setStartDateFilter] = useState<string>('');
  const [endDateFilter, setEndDateFilter] = useState<string>('');
  
  // For action options
  const [availableActions, setAvailableActions] = useState<string[]>([]);
  
  // Stats
  const [stats, setStats] = useState<any>(null);
  
  // Selected log for details
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  
  useEffect(() => {
    // Redirect if not admin
    if (user?.role !== UserRole.ADMIN) {
      navigate('/');
      return;
    }
    
    fetchAuditLogs();
    fetchAuditActions();
    fetchAuditStats();
  }, [user, navigate]);
  
  const fetchAuditLogs = async (page = pagination.page) => {
    try {
      setLoading(true);
      
      // Build query params
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', pagination.limit.toString());
      
      if (actionFilter) {
        params.append('action', actionFilter);
      }
      
      if (userFilter) {
        params.append('userId', userFilter);
      }
      
      if (startDateFilter) {
        params.append('startDate', startDateFilter);
      }
      
      if (endDateFilter) {
        params.append('endDate', endDateFilter);
      }
      
      const response = await axios.get(`${API_URL}/admin/audit-logs?${params.toString()}`);
      
      setAuditLogs(response.data.auditLogs);
      setPagination(response.data.pagination);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load audit logs');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchAuditActions = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/audit-actions`);
      setAvailableActions(response.data.actions);
    } catch (err: any) {
      console.error('Failed to load audit actions:', err);
    }
  };
  
  const fetchAuditStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/audit-stats`);
      setStats(response.data);
    } catch (err: any) {
      console.error('Failed to load audit stats:', err);
    }
  };
  
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages) {
      return;
    }
    
    fetchAuditLogs(newPage);
  };
  
  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAuditLogs(1); // Reset to first page when applying filters
  };
  
  const handleClearFilters = () => {
    setActionFilter('');
    setUserFilter('');
    setStartDateFilter('');
    setEndDateFilter('');
    
    // Reset to first page and fetch without filters
    setTimeout(() => {
      fetchAuditLogs(1);
    }, 0);
  };
  
  const handleViewDetails = (log: AuditLog) => {
    setSelectedLog(log);
  };
  
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Unknown date';
    
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };
  
  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'user_created':
        return 'success';
      case 'user_updated':
        return 'info';
      case 'user_deleted':
        return 'danger';
      case 'doctor_rating_updated':
        return 'warning';
      case 'role_updated':
        return 'primary';
      case 'login_success':
        return 'primary';
      case 'login_failed':
        return 'danger';
      default:
        return 'secondary';
    }
  };
  
  const getActionDisplayName = (action: string) => {
    if (!action) return 'Unknown Action';
    
    return action
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  const exportLogs = () => {
    // Convert logs to CSV
    const headers = [
      'Action',
      'Performed By',
      'Performed On',
      'Details',
      'IP Address',
      'User Agent',
      'Date',
    ];
    
    const rows = auditLogs.map(log => [
      getActionDisplayName(log.action),
      log.performedBy 
        ? `${log.performedBy.firstName || ''} ${log.performedBy.lastName || ''} (${log.performedBy.email || 'No email'})`
        : 'Unknown',
      log.performedOn 
        ? `${log.performedOn.firstName || ''} ${log.performedOn.lastName || ''} (${log.performedOn.email || 'No email'})`
        : 'N/A',
      log.details || 'N/A',
      log.ip || 'N/A',
      log.userAgent || 'N/A',
      formatDate(log.createdAt),
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    // Create a blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const renderDiffValue = (value: any) => {
    if (value === null || value === undefined) {
      return <span className="text-muted">null</span>;
    }
    
    if (typeof value === 'object') {
      return (
        <pre className="bg-light p-2 rounded small">
          {JSON.stringify(value, null, 2)}
        </pre>
      );
    }
    
    return String(value);
  };
  
  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Audit Logs</h1>
        
        <Button onClick={exportLogs}>
          <FaDownload className="mr-2" /> Export Logs
        </Button>
      </div>
      
      {error && (
        <Alert variant="danger" className="mb-4" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}
      
      {/* Stats cards */}
      {stats && (
        <Row className="mb-4">
          <Col md={3}>
            <Card className="text-center h-100">
              <Card.Body>
                <Card.Title as="h5">Total Logs</Card.Title>
                <div className="fs-2 fw-bold">{stats.counts.total}</div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center h-100">
              <Card.Body>
                <Card.Title as="h5">Today</Card.Title>
                <div className="fs-2 fw-bold">{stats.counts.today}</div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center h-100">
              <Card.Body>
                <Card.Title as="h5">Last 7 Days</Card.Title>
                <div className="fs-2 fw-bold">{stats.counts.thisWeek}</div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center h-100">
              <Card.Body>
                <Card.Title as="h5">Last 30 Days</Card.Title>
                <div className="fs-2 fw-bold">{stats.counts.thisMonth}</div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
      
      {/* Filters */}
      <Card className="mb-4">
        <Card.Body>
          <Card.Title className="mb-3">Filters</Card.Title>
          <Form onSubmit={handleApplyFilters}>
            <Row>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Action</Form.Label>
                  <Form.Select
                    value={actionFilter}
                    onChange={(e) => setActionFilter(e.target.value)}
                  >
                    <option value="">All Actions</option>
                    {availableActions.map((action) => (
                      <option key={action} value={action}>
                        {getActionDisplayName(action)}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>User ID</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="User ID"
                    value={userFilter}
                    onChange={(e) => setUserFilter(e.target.value)}
                  />
                </Form.Group>
              </Col>
              
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Start Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={startDateFilter}
                    onChange={(e) => setStartDateFilter(e.target.value)}
                  />
                </Form.Group>
              </Col>
              
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>End Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={endDateFilter}
                    onChange={(e) => setEndDateFilter(e.target.value)}
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <div className="d-flex gap-2 justify-content-end">
              <Button 
                variant="outline" 
                type="button"
                onClick={handleClearFilters}
              >
                Clear Filters
              </Button>
              <Button type="submit">
                <FaFilter className="me-2" /> Apply Filters
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
      
      {/* Logs Table */}
      <Card>
        <Card.Body>
          {loading ? (
            <div className="text-center p-5">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
            </div>
          ) : auditLogs.length === 0 ? (
            <Alert variant="info">No audit logs found.</Alert>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Action</th>
                      <th>Performed By</th>
                      <th>Performed On</th>
                      <th>Details</th>
                      <th>Date</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log) => (
                      <tr key={log._id}>
                        <td>
                          <Badge bg={getActionBadgeColor(log.action)}>
                            {getActionDisplayName(log.action)}
                          </Badge>
                        </td>
                        <td>
                          {log.performedBy ? (
                            <span>
                              {log.performedBy.firstName || ''} {log.performedBy.lastName || ''}
                              <div className="small text-muted">{log.performedBy.email || 'No email'}</div>
                            </span>
                          ) : (
                            <span className="text-muted">Unknown</span>
                          )}
                        </td>
                        <td>
                          {log.performedOn ? (
                            <span>
                              {log.performedOn.firstName || ''} {log.performedOn.lastName || ''}
                              <div className="small text-muted">{log.performedOn.email || 'No email'}</div>
                            </span>
                          ) : (
                            <span className="text-muted">N/A</span>
                          )}
                        </td>
                        <td>
                          <div className="text-truncate" style={{ maxWidth: '300px' }}>
                            {log.details || <span className="text-muted">No details</span>}
                          </div>
                        </td>
                        <td>
                          {formatDate(log.createdAt)}
                        </td>
                        <td>
                          <Button 
                            variant="primary" 
                            size="sm"
                            onClick={() => handleViewDetails(log)}
                          >
                            <FaEye /> View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              <div className="d-flex justify-content-between align-items-center mt-3">
                <div>
                  Showing {auditLogs.length} of {pagination.total} logs
                </div>
                <div className="d-flex gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                  >
                    <FaChevronLeft />
                  </Button>
                  <div className="d-flex align-items-center">
                    Page {pagination.page} of {pagination.totalPages}
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                  >
                    <FaChevronRight />
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card.Body>
      </Card>
      
      {/* Log Details Modal */}
      {selectedLog && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <Badge bg={getActionBadgeColor(selectedLog.action)} className="me-2">
                    {getActionDisplayName(selectedLog.action)}
                  </Badge>
                  Audit Log Details
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setSelectedLog(null)}
                  title="Close"
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body">
                <Row className="mb-3">
                  <Col md={6}>
                    <strong>Performed By:</strong>
                    <div>
                      {selectedLog.performedBy ? (
                        <>
                          {selectedLog.performedBy.firstName || ''} {selectedLog.performedBy.lastName || ''}
                          <div className="small text-muted">{selectedLog.performedBy.email || 'No email'}</div>
                        </>
                      ) : (
                        <span className="text-muted">Unknown</span>
                      )}
                    </div>
                  </Col>
                  <Col md={6}>
                    <strong>Performed On:</strong>
                    <div>
                      {selectedLog.performedOn ? (
                        <>
                          {selectedLog.performedOn.firstName || ''} {selectedLog.performedOn.lastName || ''}
                          <div className="small text-muted">{selectedLog.performedOn.email || 'No email'}</div>
                        </>
                      ) : (
                        <span className="text-muted">N/A</span>
                      )}
                    </div>
                  </Col>
                </Row>
                
                <Row className="mb-3">
                  <Col md={6}>
                    <strong>Timestamp:</strong>
                    <div>{formatDate(selectedLog.createdAt)}</div>
                  </Col>
                  <Col md={6}>
                    <strong>IP Address:</strong>
                    <div>{selectedLog.ip || 'Not recorded'}</div>
                  </Col>
                </Row>
                
                {selectedLog.details && (
                  <div className="mb-3">
                    <strong>Details:</strong>
                    <div>{selectedLog.details}</div>
                  </div>
                )}
                
                {(selectedLog.previousValue || selectedLog.newValue) && (
                  <div className="mt-4">
                    <h6>Changes:</h6>
                    <div className="row">
                      <div className="col-md-6">
                        <div className="card">
                          <div className="card-header">Previous Value</div>
                          <div className="card-body">
                            {renderDiffValue(selectedLog.previousValue)}
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="card">
                          <div className="card-header">New Value</div>
                          <div className="card-body">
                            {renderDiffValue(selectedLog.newValue)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {selectedLog.userAgent && (
                  <div className="mt-3">
                    <strong>User Agent:</strong>
                    <div className="small text-muted">
                      {selectedLog.userAgent}
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <Button variant="secondary" onClick={() => setSelectedLog(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogs; 