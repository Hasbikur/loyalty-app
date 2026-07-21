import { useEffect, useState } from 'react';
import { memberAPI } from '../services/api';
import { Layout } from '../components/Layout';

export const MembersPage = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [formData, setFormData] = useState({
    card_number: '',
    name: '',
    phone: '',
    email: '',
    branch: '',
    birthday: '',
  });

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const response = await memberAPI.getAllMembers();
      setMembers(response.data);
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedMember) {
        await memberAPI.updateMember(selectedMember.id, formData);
        alert('Member updated successfully');
      } else {
        await memberAPI.createMember(formData);
        alert('Member created successfully');
      }
      fetchMembers();
      setShowForm(false);
      setFormData({ card_number: '', name: '', phone: '', email: '', branch: '', birthday: '' });
      setSelectedMember(null);
    } catch (err) {
      alert('Error: ' + err.response?.data?.error);
    }
  };

  const handleEdit = (member) => {
    setSelectedMember(member);
    setFormData({
      card_number: member.card_number,
      name: member.name,
      phone: member.phone || '',
      email: member.email || '',
      branch: member.branch,
      birthday: member.birthday || '',
    });
    setShowForm(true);
  };

  const getTierBadge = (tier) => {
    const badges = {
      0: 'warning',
      1: 'secondary',
      2: 'info',
      3: 'primary',
    };
    const names = { 0: 'BRONZE', 1: 'SILVER', 2: 'GOLD', 3: 'PLATINUM' };
    return { class: badges[tier], name: names[tier] };
  };

  const filteredMembers = members.filter(
    (m) =>
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.card_number.includes(searchTerm)
  );

  return (
    <Layout>
      <div className="container-fluid">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1>Members</h1>
            <p className="text-muted">Total: {members.length} members</p>
          </div>
          <button
            onClick={() => {
              setShowForm(true);
              setSelectedMember(null);
              setFormData({ card_number: '', name: '', phone: '', email: '', branch: '', birthday: '' });
            }}
            className="btn btn-primary"
          >
            + Add Member
          </button>
        </div>

        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search by name or card number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-control"
          />
        </div>

        {/* Modal Form */}
        {showForm && (
          <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    {selectedMember ? 'Edit Member' : 'Add New Member'}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowForm(false)}
                  />
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label">Card Number *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.card_number}
                        onChange={(e) => setFormData({ ...formData, card_number: e.target.value })}
                        disabled={!!selectedMember}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Phone</label>
                      <input
                        type="tel"
                        className="form-control"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Email</label>
                      <input
                        type="email"
                        className="form-control"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                        <option value="">Select Branch</option>
                        <option value="Branch 1">Branch 1</option>
                        <option value="Branch 2">Branch 2</option>
                        <option value="Branch 3">Branch 3</option>
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Birthday (MM-DD)</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="MM-DD"
                        value={formData.birthday}
                        onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowForm(false)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      {selectedMember ? 'Update' : 'Create'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Members Table */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Card Number</th>
                    <th>Name</th>
                    <th>Tier</th>
                    <th>Total Spending</th>
                    <th>Discount</th>
                    <th>Branch</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center text-muted py-4">
                        No members found
                      </td>
                    </tr>
                  ) : (
                    filteredMembers.map((member) => {
                      const tierBadge = getTierBadge(member.tier);
                      return (
                        <tr key={member.id}>
                          <td className="font-monospace small">{member.card_number}</td>
                          <td>{member.name}</td>
                          <td>
                            <span className={`badge bg-${tierBadge.class}`}>
                              {tierBadge.name}
                            </span>
                          </td>
                          <td>Rp{(member.total_spending / 1000000).toFixed(2)}M</td>
                          <td>
                            <span className="badge bg-success">{member.current_discount}%</span>
                          </td>
                          <td>{member.branch}</td>
                          <td>
                            <button
                              onClick={() => handleEdit(member)}
                              className="btn btn-sm btn-outline-primary"
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};