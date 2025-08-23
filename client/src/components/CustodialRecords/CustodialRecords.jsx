
import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  Upload, 
  Camera, 
  Save, 
  X,
  ChevronDown,
  ChevronUp,
  User,
  FileText,
  Heart,
  Shield,
  Calendar,
  Phone,
  MapPin,
  AlertTriangle
} from 'lucide-react';
import './CustodialRecords.css';

const CustodialRecords = () => {
  const [inmates, setInmates] = useState([]);
  const [showSidebar, setShowSidebar] = useState(false);
  const [selectedInmate, setSelectedInmate] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState({});

  const [formData, setFormData] = useState({
    fullName: '',
    prisonerNumber: '',
    dateOfBirth: '',
    age: '',
    gender: '',
    nationality: '',
    address: '',
    idPhoto: null,
    admissionDate: '',
    charges: [],
    sentence: '',
    courtReference: '',
    emergencyContactName: '',
    relationship: '',
    contactPhone: '',
    contactAddress: '',
    medicalConditions: '',
    allergies: '',
    doctorNotes: '',
    behaviorReports: '',
    disciplinaryActions: '',
    privileges: '',
    status: 'Active'
  });

  const chargeOptions = [
    'Theft', 'Assault', 'Robbery', 'Burglary', 'Drug Possession', 
    'Fraud', 'Vandalism', 'Public Disorder', 'Traffic Violation',
    'Domestic Violence', 'Weapons Charge', 'Other'
  ];

  const relationshipOptions = [
    'Father', 'Mother', 'Spouse', 'Sibling', 'Child', 
    'Guardian', 'Friend', 'Lawyer', 'Other'
  ];

  const statusOptions = ['Active', 'Released', 'Transferred', 'Court Appearance'];

  useEffect(() => {
    fetchInmates();
  }, []);

  const fetchInmates = async () => {
    setLoading(true);
    try {
      console.log('🔍 Fetching custodial records...');
      const response = await fetch('/api/custodial-records');
      const data = await response.json();
      console.log('📊 Received custodial records:', data);
      setInmates(data.inmates || []);
    } catch (error) {
      console.error('❌ Error fetching custodial records:', error);
    } finally {
      setLoading(false);
    }
  };

  const generatePrisonerNumber = () => {
    const year = new Date().getFullYear();
    const random = Math.random().toString(36).substr(2, 6).toUpperCase();
    return `INM-${year}-${random}`;
  };

  const handleInputChange = (e) => {
    e.persist(); // Ensure event persists through async operations
    const { name, value, type, files } = e.target;
    
    // Prevent any processing if name is missing
    if (!name) return;
    
    if (type === 'file') {
      const file = files[0];
      if (file && name === 'idPhoto') {
        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
          alert('File size must be less than 5MB');
          return;
        }
        
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        if (!allowedTypes.includes(file.type)) {
          alert('Please upload a valid image file (JPG, PNG, JPEG)');
          return;
        }
      }
      
      setFormData(prev => ({
        ...prev,
        [name]: file
      }));
    } else if (name === 'charges') {
      const selectedCharges = Array.from(e.target.selectedOptions, option => option.value);
      setFormData(prev => ({
        ...prev,
        charges: selectedCharges
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const toggleSection = (section) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const resetForm = () => {
    setFormData({
      fullName: '',
      prisonerNumber: '',
      dateOfBirth: '',
      age: '',
      gender: '',
      nationality: '',
      address: '',
      idPhoto: null,
      admissionDate: '',
      charges: [],
      sentence: '',
      courtReference: '',
      emergencyContactName: '',
      relationship: '',
      contactPhone: '',
      contactAddress: '',
      medicalConditions: '',
      allergies: '',
      doctorNotes: '',
      behaviorReports: '',
      disciplinaryActions: '',
      privileges: '',
      status: 'Active'
    });
    setSelectedInmate(null);
    setCollapsedSections({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = selectedInmate ? `/api/custodial-records/${selectedInmate.id}` : '/api/custodial-records';
      const method = selectedInmate ? 'PUT' : 'POST';

      // Create FormData to handle file upload
      const formDataToSubmit = new FormData();
      
      // Add all form fields
      Object.keys(formData).forEach(key => {
        if (key === 'idPhoto' && formData[key]) {
          // Add the file
          formDataToSubmit.append('idPhoto', formData[key]);
        } else if (key === 'charges') {
          // Handle array data
          formDataToSubmit.append(key, JSON.stringify(formData[key]));
        } else if (formData[key] !== null && formData[key] !== undefined) {
          formDataToSubmit.append(key, formData[key]);
        }
      });

      // Add prisoner number if not provided
      if (!formData.prisonerNumber) {
        formDataToSubmit.append('prisonerNumber', generatePrisonerNumber());
      }

      console.log('🔍 Submitting custodial record with file upload');

      const response = await fetch(url, {
        method,
        body: formDataToSubmit,
      });

      const data = await response.json();

      if (response.ok) {
        console.log('✅ Custodial record saved successfully');
        await fetchInmates();
        setShowSidebar(false);
        resetForm();
      } else {
        console.error('❌ Failed to save custodial record:', data.message);
        alert('Failed to save custodial record: ' + data.message);
      }
    } catch (error) {
      console.error('❌ Error saving custodial record:', error);
      alert('Error saving custodial record. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (inmate) => {
    setSelectedInmate(inmate);
    setFormData({
      fullName: inmate.fullName || '',
      prisonerNumber: inmate.prisonerNumber || '',
      dateOfBirth: inmate.dateOfBirth || '',
      age: inmate.age || '',
      gender: inmate.gender || '',
      nationality: inmate.nationality || '',
      address: inmate.address || '',
      idPhoto: null,
      admissionDate: inmate.admissionDate || '',
      charges: inmate.charges || [],
      sentence: inmate.sentence || '',
      courtReference: inmate.courtReference || '',
      emergencyContactName: inmate.emergencyContactName || '',
      relationship: inmate.relationship || '',
      contactPhone: inmate.contactPhone || '',
      contactAddress: inmate.contactAddress || '',
      medicalConditions: inmate.medicalConditions || '',
      allergies: inmate.allergies || '',
      doctorNotes: inmate.doctorNotes || '',
      behaviorReports: inmate.behaviorReports || '',
      disciplinaryActions: inmate.disciplinaryActions || '',
      privileges: inmate.privileges || '',
      status: inmate.status || 'Active'
    });
    setShowSidebar(true);
  };

  const handleDelete = async (inmateId) => {
    if (window.confirm('Are you sure you want to delete this custodial record?')) {
      try {
        const response = await fetch(`/api/custodial-records/${inmateId}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          console.log('✅ Custodial record deleted successfully');
          await fetchInmates();
        } else {
          console.error('❌ Failed to delete custodial record');
        }
      } catch (error) {
        console.error('❌ Error deleting custodial record:', error);
      }
    }
  };

  const filteredInmates = inmates.filter(inmate => {
    const matchesSearch = inmate.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         inmate.prisonerNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || inmate.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const FormSection = ({ title, children, sectionKey, icon: Icon }) => (
    <div className="form-section">
      <div 
        className="section-header" 
        onClick={() => toggleSection(sectionKey)}
      >
        {Icon && <Icon className="section-icon" />}
        <h3>{title}</h3>
        {collapsedSections[sectionKey] ? <ChevronDown /> : <ChevronUp />}
      </div>
      {!collapsedSections[sectionKey] && (
        <div className="section-content">
          {children}
        </div>
      )}
    </div>
  );

  const stats = [
    { title: 'Total Inmates', value: inmates.length.toString(), icon: Users, color: 'blue' },
    { title: 'Active', value: inmates.filter(i => i.status === 'Active').length.toString(), icon: Shield, color: 'green' },
    { title: 'Released Today', value: inmates.filter(i => i.status === 'Released' && new Date(i.releaseDate).toDateString() === new Date().toDateString()).length.toString(), icon: Calendar, color: 'orange' },
    { title: 'Court Appearances', value: inmates.filter(i => i.status === 'Court Appearance').length.toString(), icon: FileText, color: 'purple' }
  ];

  return (
    <div className="custodial-records">
      <div className="custodial-header">
        <div className="header-content">
          <div className="title-section">
            <Users className="page-icon" />
            <div>
              <h1>Custodial Records</h1>
              <p>Manage inmate information and custody details</p>
            </div>
          </div>

          <div className="header-actions">
            <div className="search-container">
              <Search className="search-icon" />
              <input
                type="text"
                placeholder="Search inmates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Status</option>
              {statusOptions.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>

            <button 
              className="add-inmate-btn" 
              onClick={() => {
                resetForm();
                setShowSidebar(true);
              }}
            >
              <Plus className="btn-icon" />
              Add Inmate
            </button>
          </div>
        </div>
      </div>

      <div className="custodial-stats">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div key={index} className={`stat-card ${stat.color}`}>
              <IconComponent className="stat-icon" />
              <div className="stat-info">
                <h3>{stat.title}</h3>
                <span className="stat-value">{stat.value}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="custodial-content">
        <div className="inmates-table-container">
          <div className="table-wrapper">
            <table className="inmates-table">
              <thead>
                <tr>
                  <th>Prisoner #</th>
                  <th>Full Name</th>
                  <th>Age</th>
                  <th>Gender</th>
                  <th>Admission Date</th>
                  <th>Charges</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInmates.map((inmate) => (
                  <tr key={inmate.id} className="table-row">
                    <td className="prisoner-number">{inmate.prisonerNumber}</td>
                    <td className="inmate-name">
                      <div className="name-cell">
                        <div className="inmate-avatar">
                          {inmate.fullName?.[0] || 'I'}
                        </div>
                        <span>{inmate.fullName}</span>
                      </div>
                    </td>
                    <td>{inmate.age}</td>
                    <td>{inmate.gender}</td>
                    <td>{new Date(inmate.admissionDate).toLocaleDateString()}</td>
                    <td>
                      <div className="charges-cell">
                        {inmate.charges?.slice(0, 2).map((charge, idx) => (
                          <span key={idx} className="charge-tag">{charge}</span>
                        ))}
                        {inmate.charges?.length > 2 && (
                          <span className="charge-more">+{inmate.charges.length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge status-${inmate.status?.toLowerCase().replace(' ', '-')}`}>
                        {inmate.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="action-btn edit-btn"
                          onClick={() => handleEdit(inmate)}
                          title="Edit Record"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          className="action-btn delete-btn"
                          onClick={() => handleDelete(inmate.id)}
                          title="Delete Record"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Sidebar Form */}
      {showSidebar && (
        <div className="sidebar-overlay">
          <div className="custodial-sidebar">
            <div className="sidebar-header">
              <h2>{selectedInmate ? 'Edit Inmate Record' : 'Add New Inmate'}</h2>
              <button 
                className="close-btn"
                onClick={() => {
                  setShowSidebar(false);
                  resetForm();
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="custodial-form" key={selectedInmate?.id || 'new-inmate'}>
              {/* Basic Information */}
              <FormSection title="Basic Information" sectionKey="basic" icon={User}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter full name"
                    />
                  </div>
                  <div className="form-group">
                    <label>Prisoner Number</label>
                    <input
                      type="text"
                      name="prisonerNumber"
                      value={formData.prisonerNumber}
                      onChange={handleInputChange}
                      placeholder="Auto-generated if empty"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Date of Birth</label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Age</label>
                    <input
                      type="number"
                      name="age"
                      value={formData.age}
                      onChange={handleInputChange}
                      placeholder="Enter age"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Gender</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Nationality</label>
                    <input
                      type="text"
                      name="nationality"
                      value={formData.nationality}
                      onChange={handleInputChange}
                      placeholder="Enter nationality"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Address</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Enter full address"
                    rows="3"
                  />
                </div>
              </FormSection>

              {/* Photo & Identification */}
              <FormSection title="Photo & Identification" sectionKey="identification" icon={Camera}>
                <div className="photo-upload-section">
                  <div className="photo-preview-container">
                    <div className="passport-photo-frame">
                      {formData.idPhoto ? (
                        <img 
                          src={formData.idPhoto instanceof File ? URL.createObjectURL(formData.idPhoto) : `/uploads/${formData.idPhoto.filename}`} 
                          alt="ID Photo Preview"
                          className="photo-preview"
                        />
                      ) : selectedInmate?.idPhoto ? (
                        <img 
                          src={`/uploads/${selectedInmate.idPhoto.filename}`} 
                          alt="ID Photo"
                          className="photo-preview"
                        />
                      ) : (
                        <div className="photo-placeholder">
                          <Camera size={48} />
                          <span>Passport Size Photo</span>
                          <small>35mm x 45mm</small>
                        </div>
                      )}
                    </div>
                    <div className="photo-requirements">
                      <h4>Photo Requirements:</h4>
                      <ul>
                        <li>Passport size (35mm x 45mm ratio)</li>
                        <li>Clear face visibility</li>
                        <li>Plain background preferred</li>
                        <li>Maximum file size: 5MB</li>
                        <li>Formats: JPG, PNG, JPEG</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="photo-upload-controls">
                    <div className="upload-button-container">
                      <input
                        type="file"
                        name="idPhoto"
                        id="idPhotoInput"
                        onChange={handleInputChange}
                        accept="image/jpeg,image/png,image/jpg"
                        className="file-input-hidden"
                      />
                      <label htmlFor="idPhotoInput" className="upload-button">
                        <Upload size={20} />
                        {formData.idPhoto ? 'Change Photo' : 'Upload Photo'}
                      </label>
                      
                      {formData.idPhoto && (
                        <button 
                          type="button" 
                          className="remove-photo-btn"
                          onClick={() => setFormData(prev => ({ ...prev, idPhoto: null }))}
                        >
                          <X size={16} />
                          Remove
                        </button>
                      )}
                    </div>
                    
                    {(formData.idPhoto || selectedInmate?.idPhoto) && (
                      <div className="photo-info">
                        <span className="file-name">
                          {formData.idPhoto instanceof File 
                            ? formData.idPhoto.name 
                            : formData.idPhoto?.originalName || selectedInmate?.idPhoto?.originalName || 'ID Photo'}
                        </span>
                        <span className="file-size">
                          {formData.idPhoto instanceof File 
                            ? (formData.idPhoto.size / 1024 / 1024).toFixed(2) 
                            : formData.idPhoto?.size ? (formData.idPhoto.size / 1024 / 1024).toFixed(2) 
                            : selectedInmate?.idPhoto?.size ? (selectedInmate.idPhoto.size / 1024 / 1024).toFixed(2) : '0'} MB
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </FormSection>

              {/* Custody & Legal Details */}
              <FormSection title="Custody & Legal Details" sectionKey="legal" icon={FileText}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Admission Date *</label>
                    <input
                      type="date"
                      name="admissionDate"
                      value={formData.admissionDate}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Court Reference</label>
                    <input
                      type="text"
                      name="courtReference"
                      value={formData.courtReference}
                      onChange={handleInputChange}
                      placeholder="Enter court reference"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Charges</label>
                  <select
                    name="charges"
                    multiple
                    value={formData.charges}
                    onChange={handleInputChange}
                    className="multi-select"
                  >
                    {chargeOptions.map(charge => (
                      <option key={charge} value={charge}>{charge}</option>
                    ))}
                  </select>
                  <small>Hold Ctrl/Cmd to select multiple charges</small>
                </div>

                <div className="form-group">
                  <label>Sentence/Duration</label>
                  <input
                    type="text"
                    name="sentence"
                    value={formData.sentence}
                    onChange={handleInputChange}
                    placeholder="Enter sentence details"
                  />
                </div>
              </FormSection>

              {/* Emergency Contact */}
              <FormSection title="Emergency Contact" sectionKey="contact" icon={Phone}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Contact Name</label>
                    <input
                      type="text"
                      name="emergencyContactName"
                      value={formData.emergencyContactName}
                      onChange={handleInputChange}
                      placeholder="Enter contact name"
                    />
                  </div>
                  <div className="form-group">
                    <label>Relationship</label>
                    <select
                      name="relationship"
                      value={formData.relationship}
                      onChange={handleInputChange}
                    >
                      <option value="">Select Relationship</option>
                      {relationshipOptions.map(rel => (
                        <option key={rel} value={rel}>{rel}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      name="contactPhone"
                      value={formData.contactPhone}
                      onChange={handleInputChange}
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Contact Address</label>
                  <textarea
                    name="contactAddress"
                    value={formData.contactAddress}
                    onChange={handleInputChange}
                    placeholder="Enter contact address"
                    rows="3"
                  />
                </div>
              </FormSection>

              {/* Health & Medical Records */}
              <FormSection title="Health & Medical Records" sectionKey="health" icon={Heart}>
                <div className="form-group">
                  <label>Medical Conditions</label>
                  <textarea
                    name="medicalConditions"
                    value={formData.medicalConditions}
                    onChange={handleInputChange}
                    placeholder="Enter known medical conditions"
                    rows="3"
                  />
                </div>

                <div className="form-group">
                  <label>Allergies/Medications</label>
                  <textarea
                    name="allergies"
                    value={formData.allergies}
                    onChange={handleInputChange}
                    placeholder="Enter allergies and current medications"
                    rows="3"
                  />
                </div>

                <div className="form-group">
                  <label>Doctor/Medical Officer Notes</label>
                  <textarea
                    name="doctorNotes"
                    value={formData.doctorNotes}
                    onChange={handleInputChange}
                    placeholder="Enter medical officer notes"
                    rows="3"
                  />
                </div>
              </FormSection>

              {/* Behavior & Notes */}
              <FormSection title="Behavior & Notes" sectionKey="behavior" icon={AlertTriangle}>
                <div className="form-group">
                  <label>Behavior Reports</label>
                  <textarea
                    name="behaviorReports"
                    value={formData.behaviorReports}
                    onChange={handleInputChange}
                    placeholder="Enter behavior observations and reports"
                    rows="3"
                  />
                </div>

                <div className="form-group">
                  <label>Disciplinary Actions</label>
                  <textarea
                    name="disciplinaryActions"
                    value={formData.disciplinaryActions}
                    onChange={handleInputChange}
                    placeholder="Enter disciplinary actions taken"
                    rows="3"
                  />
                </div>

                <div className="form-group">
                  <label>Privileges/Rewards</label>
                  <textarea
                    name="privileges"
                    value={formData.privileges}
                    onChange={handleInputChange}
                    placeholder="Enter privileges granted or rewards"
                    rows="3"
                  />
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    {statusOptions.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </FormSection>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => {
                    setShowSidebar(false);
                    resetForm();
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="submit-btn"
                  disabled={loading}
                >
                  <Save size={16} />
                  {loading ? 'Saving...' : selectedInmate ? 'Update Record' : 'Add Inmate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustodialRecords;
