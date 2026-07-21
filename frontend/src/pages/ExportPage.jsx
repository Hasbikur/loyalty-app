import { useState, useEffect } from 'react';
import { dataAPI } from '../services/api';
import { Layout } from '../components/Layout';

export const ExportPage = () => {
  const [backupHistory, setBackupHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchBackupHistory();
  }, []);

  const fetchBackupHistory = async () => {
    try {
      const response = await dataAPI.getBackupHistory();
      setBackupHistory(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch backup history');
    }
  };

  const handleExport = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const response = await dataAPI.exportData();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `loyalty-backup-${Date.now()}.json`);
      document.body.appendChild(link);
      link.click();
      link.parentElement.removeChild(link);

      setSuccess('Data exported successfully!');
      setTimeout(() => fetchBackupHistory(), 500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to export data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
<div className="container-fluid">
        <h1 className="mb-4">Data Export & Backup</h1>
        <p className="text-muted">Backup and export your loyalty card data</p>

        {error && (
          <div className="alert alert-danger alert-dismissible fade show">
            {error}
            <button
              type="button"
              className="btn-close"
              onClick={() => setError('')}
            />
          </div>
        )}

        {success && (
          <div className="alert alert-success alert-dismissible fade show">
            {success}
            <button
              type="button"
              className="btn-close"
              onClick={() => setSuccess('')}
            />
          </div>
        )}

        {/* Export Section */}
        <div className="card mb-4">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-start">
              <div className="flex-grow-1">
                <h5 className="card-title">Export All Data</h5>
                <p className="card-text text-muted">
                  Download complete backup of members, transactions, and tier information in JSON format.
                  This file can be used for recovery or analysis.
                </p>
              </div>
              <button
                onClick={handleExport}
                disabled={loading}
                className="btn btn-primary ms-3"
              >
                {loading ? 'Exporting...' : '📥 Export Now'}
              </button>
            </div>
          </div>
        </div>

        {/* Backup History */}
        <div className="card mb-4">
          <div className="card-header bg-light">
            <h5 className="mb-0">Backup History</h5>
          </div>
          <div className="card-body">
            {backupHistory.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <p>No backups yet. Click export to create your first backup.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Filename</th>
                      <th>Backup Date</th>
                      <th>Created By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {backupHistory.map((backup) => (
                      <tr key={backup.id}>
                        <td className="font-monospace small">{backup.backup_filename}</td>
                        <td>
                          {new Date(backup.backup_date).toLocaleString('id-ID')}
                        </td>
                        <td>{backup.created_by_name || 'System'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Information */}
        <div className="row">
          <div className="col-md-6">
            <div className="card border-info">
              <div className="card-body bg-info-subtle">
                <h5 className="card-title">📋 What's Included</h5>
                <ul className="small mb-0">
                  <li>✓ All member data & tier information</li>
                  <li>✓ Complete transaction history</li>
                  <li>✓ Tier configuration settings</li>
                  <li>✓ Tier change history</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div className="card border-success">
              <div className="card-body bg-success-subtle">
                <h5 className="card-title">💡 Recommendations</h5>
                <ul className="small mb-0">
                  <li>✓ Export weekly for backup</li>
                  <li>✓ Keep backups in safe location</li>
                  <li>✓ Use for compliance & audit</li>
                  <li>✓ Keep for disaster recovery</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};