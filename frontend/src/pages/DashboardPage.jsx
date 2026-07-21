import { useEffect, useState } from 'react';
import { memberAPI, transactionAPI } from '../services/api';
import { Layout } from '../components/Layout';
 
export const DashboardPage = () => {
  const [stats, setStats] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
 
  useEffect(() => {
    fetchData();
  }, []);
 
  const fetchData = async () => {
    try {
      const [statsRes, transRes] = await Promise.all([
        memberAPI.getMemberStats(),
        transactionAPI.getTransactions({ limit: 10 }),
      ]);
      setStats(statsRes.data);
      setRecentTransactions(transRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
 
  const getTierColor = (tierName) => {
    const colors = {
      'BRONZE': 'bg-warning',
      'SILVER': 'bg-secondary',
      'GOLD': 'bg-info',
      'PLATINUM': 'bg-primary',
    };
    return colors[tierName] || 'bg-secondary';
  };
 
  if (loading) {
    return (
      <Layout>
        <div className="text-center py-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </Layout>
    );
  }
 
  return (
    <Layout>
      <div className="container-fluid">
        <h1 className="mb-4">Dashboard</h1>

   {/* Key Metrics */}
    <div className="row mb-4">
      <div className="col-md-3">
        <div className="card">
          <div className="card-body">
            <h6 className="card-title text-muted">Total Members</h6>
            <h3 className="card-text">
              {stats.reduce((sum, s) => sum + s.count, 0)}
            </h3>
          </div>
        </div>
      </div>

      <div className="col-md-3">
        <div className="card">
          <div className="card-body">
            <h6 className="card-title text-muted">Total Spending</h6>
            <h3 className="card-text">
              Rp{((stats.reduce((sum, s) => sum + (s.total_spent || 0), 0)) / 1000000).toFixed(1)}M
            </h3>
          </div>
        </div>
      </div>

      <div className="col-md-3">
        <div className="card">
          <div className="card-body">
            <h6 className="card-title text-muted">Premium Members</h6>
            <h3 className="card-text">
              {stats.filter(s => ['GOLD', 'PLATINUM'].includes(s.tier_name)).reduce((sum, s) => sum + s.count, 0)}
            </h3>
          </div>
        </div>
      </div>

      <div className="col-md-3">
        <div className="card">
          <div className="card-body">
            <h6 className="card-title text-muted">Branches</h6>
            <h3 className="card-text">3</h3>
          </div>
        </div>
      </div>
    </div>

    {/* Tier Distribution */}
    <div className="row mb-4">
      <div className="col-md-6">
        <div className="card">
          <div className="card-header bg-light">
            <h5 className="mb-0">Member by Tier</h5>
          </div>
          <div className="card-body">
            {stats.map((stat) => (
              <div key={stat.tier_level} className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <span className={`badge ${getTierColor(stat.tier_name)} text-white`}>
                    {stat.tier_name}
                  </span>
                </div>
                <div className="flex-grow-1 mx-3">
                  <div className="progress" style={{ height: '10px' }}>
                    <div
                      className="progress-bar bg-primary"
                      style={{
                        width: `${
                          (stat.count / stats.reduce((sum, s) => sum + s.count, 0)) * 100
                        }%`,
                      }}
                    />
                  </div>
                </div>
                <div>
                  <span className="text-muted">{stat.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="col-md-6">
        <div className="card">
          <div className="card-header bg-light">
            <h5 className="mb-0">Quick Info</h5>
          </div>
          <div className="card-body">
            <p><strong>Tier Requirements:</strong></p>
            <ul className="small">
              <li>🥉 BRONZE: Join (0 Rp)</li>
              <li>🥈 SILVER: Rp 3,000,000</li>
              <li>🥇 GOLD: Rp 5,000,000</li>
              <li>💎 PLATINUM: Rp 10,000,000</li>
            </ul>
            <p className="mt-3"><strong>Discount Rates:</strong></p>
            <ul className="small">
              <li>BRONZE: 10% all day</li>
              <li>SILVER: 15% weekday, 10% weekend</li>
              <li>GOLD: 15% all day</li>
              <li>PLATINUM: 20% all day</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    {/* Recent Transactions */}
    <div className="row">
      <div className="col-12">
        <div className="card">
          <div className="card-header bg-light">
            <h5 className="mb-0">Recent Transactions</h5>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-hover">
                <thead className="table-light">
                  <tr>
                    <th>Member</th>
                    <th>Card Number</th>
                    <th>Amount</th>
                    <th>Discount %</th>
                    <th>Day Type</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center text-muted py-4">
                        No transactions yet
                      </td>
                    </tr>
                  ) : (
                    recentTransactions.map((trans) => (
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
                        <td>
                          {new Date(trans.created_at).toLocaleDateString('id-ID')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</Layout>
 
); };

