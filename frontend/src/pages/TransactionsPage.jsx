import { useEffect, useState } from 'react';
import { memberAPI, transactionAPI } from '../services/api';
import { Layout } from '../components/Layout';

export const TransactionsPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);  // ✅ ADD THIS
  const [selectedMember, setSelectedMember] = useState(null);
  const [searchMember, setSearchMember] = useState('');
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({
    amount: '',
    branch: '',
    notes: '',
  });

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setCurrentUser(user);
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [membersRes, transRes] = await Promise.all([
        memberAPI.getAllMembers(),
        transactionAPI.getTransactions({ limit: 100 }),
      ]);
      setMembers(membersRes.data);
      setTransactions(transRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMemberSearch = (value) => {
    setSearchMember(value);
    if (value.length > 0) {
      const filtered = members.filter(
        (m) =>
          m.name.toLowerCase().includes(value.toLowerCase()) ||
          m.card_number.includes(value)
      );
      setFilteredMembers(filtered);
    } else {
      setFilteredMembers([]);
    }
  };

  const handleSelectMember = (member) => {
    setSelectedMember(member);
    setSearchMember(member.name);
    setFilteredMembers([]);
  };

  // ✅ EDIT TRANSACTION
  const handleEditTransaction = (trans) => {
    setEditingId(trans.id);
    setSelectedMember(members.find(m => m.id === trans.member_id));
    setSearchMember(members.find(m => m.id === trans.member_id)?.name || '');
    setFormData({
      amount: trans.amount.toString(),
      branch: trans.branch,
      notes: trans.notes || '',
    });
    setShowForm(true);
  };

  // ✅ DELETE TRANSACTION
  const handleDeleteTransaction = async (id) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        setLoading(true);
        await transactionAPI.deleteTransaction(id);
        setSuccess('Transaction deleted successfully');
        fetchData();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to delete transaction');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMember) {
      setError('Please select a member');
      return;
    }

    if (!currentUser) {
      setError('User not authenticated');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const payload = {
        member_id: selectedMember.id,
        amount: parseFloat(formData.amount),
        branch: formData.branch,
        notes: formData.notes,
      };

      // ✅ ADD created_by HANYA untuk CREATE, bukan UPDATE
      if (!editingId) {
        payload.created_by = currentUser.id;
      }

      let response;
      if (editingId) {
        // ✅ UPDATE TRANSACTION
        response = await transactionAPI.updateTransaction(editingId, payload);
        setSuccess('Transaction updated successfully! Tier: ' + ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'][response.data.member_update.new_tier]);
      } else {
        // ✅ CREATE TRANSACTION
        response = await transactionAPI.addTransaction(payload);
        setSuccess('Transaction recorded successfully! Tier: ' + ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'][response.data.member_update.new_tier]);
      }

      fetchData();
      setFormData({ amount: '', branch: '', notes: '' });
      setSelectedMember(null);
      setSearchMember('');
      setShowForm(false);
      setEditingId(null);

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save transaction');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedMember(null);
    setSearchMember('');
    setFormData({ amount: '', branch: '', notes: '' });
    setEditingId(null);
  };

  return (
    <Layout>
      <div className="container-fluid">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1>Transactions</h1>
            <p className="text-muted">Record member purchases</p>
          </div>
          <button onClick={() => setShowForm(true)} className="btn btn-primary">
            + New Transaction
          </button>
        </div>

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

        {/* Modal Form */}
        {showForm && (
          <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    {editingId ? 'Edit Transaction' : 'Record Transaction'}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={handleCloseForm}
                  />
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="modal-body">
                    {/* Member Selection */}
                    <div className="mb-3">
                      <label className="form-label">Select Member *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Search by name or card number..."
                        value={searchMember}
                        onChange={(e) => handleMemberSearch(e.target.value)}
                        autoComplete="off"
                        disabled={editingId ? true : false}  // ✅ DISABLE JIKA EDIT
                      />
                      {filteredMembers.length > 0 && (
                        <div className="list-group mt-2" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                          {filteredMembers.map((member) => (
                            <button
                              key={member.id}
                              type="button"
                              className="list-group-item list-group-item-action"
                              onClick={() => handleSelectMember(member)}
                              disabled={editingId ? true : false}  // ✅ DISABLE JIKA EDIT
                            >
                              <div className="d-flex justify-content-between">
                                <strong>{member.name}</strong>
                                <span className="badge bg-primary">{member.card_number}</span>
                              </div>
                              <small className="text-muted">
                                Current: {['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'][member.tier]} - Discount: {member.current_discount}%
                              </small>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {selectedMember && (
                      <div className="alert alert-info mb-3">
                        <strong>{selectedMember.name}</strong><br/>
                        Card: {selectedMember.card_number}<br/>
                        Current Tier: <span className="badge bg-warning">{['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'][selectedMember.tier]}</span><br/>
                        Total Spending: Rp{(selectedMember.total_spending / 1000000).toFixed(2)}M
                      </div>
                    )}

                    <div className="mb-3">
                      <label className="form-label">Amount (Rp) *</label>
                      <input
                        type="number"
                        className="form-control"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        placeholder="1000000"
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Branch *</label>
                      <select
                        className="form-control"
                        value={formData.branch}
                        onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                        required
                      >
                        <option value="">Select branch</option>
                        <option value="Branch 1">Branch 1</option>
                        <option value="Branch 2">Branch 2</option>
                        <option value="Branch 3">Branch 3</option>
                      </select>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Notes</label>
                      <textarea
                        className="form-control"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Optional notes..."
                        rows="3"
                      />
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleCloseForm}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !currentUser}
                      className="btn btn-primary"
                    >
                      {loading ? 'Processing...' : (editingId ? 'Update Transaction' : 'Record Transaction')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Transactions Table */}
        <div className="card">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th>Member</th>
                  <th>Card Number</th>
                  <th>Amount</th>
                  <th>Discount %</th>
                  <th>Day Type</th>
                  <th>Branch</th>
                  <th>Date</th>
                  <th>Actions</th>  {/* ✅ ADD THIS */}
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center text-muted py-4">
                      No transactions yet
                    </td>
                  </tr>
                ) : (
                  transactions.map((trans) => (
                    <tr key={trans.id}>
                      <td>{trans.member_name}</td>
                      <td className="font-monospace small">{trans.card_number}</td>
                      <td>Rp{(trans.amount / 1000).toFixed(0)}K</td>
                      <td>
                        <span className="badge bg-success">
                          {trans.discount_percentage}%
                        </span>
                      </td>
                      <td className="text-capitalize">{trans.day_type}</td>
                      <td>{trans.branch}</td>
                      <td>
                        {new Date(trans.created_at).toLocaleDateString('id-ID')}
                      </td>
                      <td>  {/* ✅ ADD THIS */}
                        <button
                          className="btn btn-sm btn-warning me-2"
                          onClick={() => handleEditTransaction(trans)}
                          title="Edit"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDeleteTransaction(trans.id)}
                          disabled={loading}
                          title="Delete"
                        >
                          🗑️ Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};