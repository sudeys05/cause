
import React from 'react';
import { 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Plus,
  Users,
  FileText,
  Shield,
  TrendingUp,
  Activity,
  Search,
  Bell,
  BarChart3
} from 'lucide-react';
import './Dashboard.css';

const Dashboard = ({ onLicensePlateClick, setActiveSection }) => {
  const stats = [
    { 
      title: 'OB Entries', 
      value: '23', 
      change: '+2 from last week', 
      color: 'orange', 
      icon: FileText, 
      onClick: () => setActiveSection?.('occurrence-book'),
      trend: 'up'
    },
    { 
      title: 'Active Records', 
      value: '12', 
      change: '+1 from last week', 
      color: 'blue', 
      icon: Clock, 
      onClick: () => setActiveSection?.('custodial-records'),
      trend: 'up'
    },
    { 
      title: 'Evidence Items', 
      value: '45', 
      change: '+5 from last week', 
      color: 'green', 
      icon: CheckCircle, 
      onClick: () => setActiveSection?.('evidence'),
      trend: 'up'
    },
    { 
      title: 'Priority Reports', 
      value: '8', 
      change: '+1 from last week', 
      color: 'red', 
      icon: AlertTriangle, 
      onClick: () => setActiveSection?.('reports'),
      trend: 'up'
    }
  ];

  const quickActions = [
    { 
      title: 'Add OB Entry', 
      subtitle: 'Create occurrence book entry', 
      icon: Plus, 
      color: 'blue', 
      onClick: () => setActiveSection?.('occurrence-book') 
    },
    { 
      title: 'Custodial Records', 
      subtitle: '3 pending entries', 
      icon: Users, 
      color: 'red', 
      onClick: () => setActiveSection?.('custodial-records') 
    },
    { 
      title: 'Geofile Access', 
      subtitle: 'Location tracking', 
      icon: Shield, 
      color: 'green', 
      onClick: () => setActiveSection?.('geofiles') 
    },
    { 
      title: 'License Plate', 
      subtitle: 'Vehicle lookup', 
      icon: Search, 
      color: 'purple', 
      onClick: onLicensePlateClick 
    },
    { 
      title: 'Evidence Log', 
      subtitle: 'Upload evidence', 
      icon: TrendingUp, 
      color: 'teal', 
      onClick: () => setActiveSection?.('evidence') 
    },
    { 
      title: 'Generate Report', 
      subtitle: 'Create report', 
      icon: BarChart3, 
      color: 'indigo', 
      onClick: () => setActiveSection?.('reports') 
    }
  ];

  const recentUpdates = [
    { 
      id: 'UPD003', 
      time: '2024-01-15 14:30', 
      officer: 'Officer Johnson', 
      caseId: 'CASE-2024-001', 
      description: 'Evidence submitted for forensic analysis', 
      priority: 'HIGH',
      status: 'Active'
    },
    { 
      id: 'UPD002', 
      time: '2024-01-15 12:15', 
      officer: 'Officer Davis', 
      caseId: 'CASE-2024-002', 
      description: 'Witness statement recorded', 
      priority: 'MEDIUM',
      status: 'Pending'
    },
    { 
      id: 'UPD001', 
      time: '2024-01-15 09:45', 
      officer: 'Officer Smith', 
      caseId: 'CASE-2024-003', 
      description: 'Suspect interview completed', 
      priority: 'HIGH',
      status: 'Completed'
    },
    { 
      id: 'UPD004', 
      time: '2024-01-14 16:20', 
      officer: 'Officer Wilson', 
      caseId: 'CASE-2024-004', 
      description: 'Crime scene photos uploaded', 
      priority: 'LOW',
      status: 'Review'
    },
    { 
      id: 'UPD005', 
      time: '2024-01-14 11:30', 
      officer: 'Officer Brown', 
      caseId: 'CASE-2024-005', 
      description: 'Background check completed', 
      priority: 'MEDIUM',
      status: 'Completed'
    }
  ];

  const formatDateTime = () => {
    const now = new Date();
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return now.toLocaleDateString('en-US', options);
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Welcome Back, Officer Smith</h1>
          <p>{formatDateTime()}</p>
        </div>
        <div className="header-actions">
          <div className="notification-badge">
            <span>3</span>
          </div>
          <Activity className="header-activity-icon" size={24} color="#3498db" />
        </div>
      </div>

      <div className="dashboard-content">
        <section className="stats-section">
          <h2>System Overview</h2>
          <div className="stats-grid">
            {stats.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <div 
                  key={index} 
                  className={`stat-card ${stat.color}`}
                  onClick={stat.onClick}
                  style={{ cursor: stat.onClick ? 'pointer' : 'default' }}
                  data-testid={`stat-card-${stat.title.toLowerCase().replace(' ', '-')}`}
                  tabIndex={0}
                  role="button"
                  aria-label={`${stat.title}: ${stat.value}, ${stat.change}`}
                >
                  <div className="stat-header">
                    <IconComponent className="stat-icon" />
                    <span className="stat-value">{stat.value}</span>
                  </div>
                  <div className="stat-info">
                    <h3>{stat.title}</h3>
                    <p>{stat.change}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="actions-section">
          <h2>Quick Actions</h2>
          <div className="actions-grid">
            {quickActions.map((action, index) => {
              const IconComponent = action.icon;
              return (
                <div 
                  key={index} 
                  className={`action-card ${action.color}`}
                  onClick={action.onClick}
                  style={{ cursor: action.onClick ? 'pointer' : 'default' }}
                  tabIndex={0}
                  role="button"
                  aria-label={`${action.title}: ${action.subtitle}`}
                >
                  <IconComponent className="action-icon" />
                  <div className="action-info">
                    <h3>{action.title}</h3>
                    <p>{action.subtitle}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="updates-section">
          <h2>Recent Activity</h2>
          <div className="table-container">
            <table className="updates-table">
              <thead>
                <tr>
                  <th>Entry ID</th>
                  <th>Date & Time</th>
                  <th>Officer</th>
                  <th>Case ID</th>
                  <th>Description</th>
                  <th>Priority</th>
                </tr>
              </thead>
              <tbody>
                {recentUpdates.map((update) => (
                  <tr key={update.id}>
                    <td>
                      <span className="entry-id">{update.id}</span>
                    </td>
                    <td>{update.time}</td>
                    <td>
                      <span className="officer-name">{update.officer}</span>
                    </td>
                    <td>
                      <span className="case-link">{update.caseId}</span>
                    </td>
                    <td>{update.description}</td>
                    <td>
                      <span className={`priority ${update.priority.toLowerCase()}`}>
                        {update.priority}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
