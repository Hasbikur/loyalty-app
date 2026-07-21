require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
 
const app = express();
const PORT = process.env.PORT || 5000;
 
app.use(cors());
app.use(express.json());
 
const dbPath = path.resolve(__dirname, './loyalty.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('DB Error:', err);
  } else {
    console.log('✅ Connected to SQLite');
    initDB();
  }
});
 
db.run('PRAGMA foreign_keys = ON');
 
function initDB() {
  db.serialize(() => {
    // 1. Users
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'staff',
        branch TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
 
    // 2. Members
    db.run(`
      CREATE TABLE IF NOT EXISTS members (
        id TEXT PRIMARY KEY,
        card_number TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        branch TEXT NOT NULL,
        tier INTEGER DEFAULT 0,
        total_spending REAL DEFAULT 0,
        current_discount REAL DEFAULT 10,
        last_purchase_date DATETIME,
        birthday TEXT,
        joined_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
 
    // 3. Transactions
    db.run(`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        member_id TEXT NOT NULL,
        amount REAL NOT NULL,
        discount_applied REAL,
        discount_percentage REAL,
        transaction_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        day_type TEXT,
        branch TEXT NOT NULL,
        notes TEXT,
        created_by TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (member_id) REFERENCES members(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);
 
    // 4. Tier Config
    db.run(`
      CREATE TABLE IF NOT EXISTS tier_config (
        tier_level INTEGER PRIMARY KEY,
        tier_name TEXT UNIQUE NOT NULL,
        min_spending REAL NOT NULL,
        discount_weekday REAL NOT NULL,
        discount_weekend REAL NOT NULL,
        has_birthday_treat BOOLEAN DEFAULT 0,
        min_order_birthday REAL DEFAULT 0
      )
    `, () => {
      // Insert tier data SETELAH table created
      db.run(`
        INSERT OR IGNORE INTO tier_config (tier_level, tier_name, min_spending, discount_weekday, discount_weekend, has_birthday_treat, min_order_birthday)
        VALUES 
          (0, 'BRONZE', 0, 10, 10, 0, 0),
          (1, 'SILVER', 3000000, 15, 10, 0, 0),
          (2, 'GOLD', 5000000, 15, 15, 1, 150000),
          (3, 'PLATINUM', 10000000, 20, 20, 1, 150000)
      `);
    });
 
    // 5. Tier History
    db.run(`
      CREATE TABLE IF NOT EXISTS tier_history (
        id TEXT PRIMARY KEY,
        member_id TEXT NOT NULL,
        old_tier INTEGER,
        new_tier INTEGER,
        change_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        reason TEXT,
        FOREIGN KEY (member_id) REFERENCES members(id)
      )
    `);
 
    // 6. Backup History
    db.run(`
      CREATE TABLE IF NOT EXISTS backup_history (
        id TEXT PRIMARY KEY,
        backup_filename TEXT NOT NULL,
        backup_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_by TEXT
      )
    `);
  });
 
  console.log('✅ Database initialized');
}
 
// ============ AUTH ============
app.post('/api/auth/register', (req, res) => {
  const { username, email, password, branch } = req.body;
  
  if (!username || !email || !password || !branch) {
    return res.status(400).json({ error: 'All fields required' });
  }
 
  const hashedPassword = bcrypt.hashSync(password, 10);
  const userId = uuidv4();
 
  db.run(
    `INSERT INTO users (id, username, email, password, role, branch) VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, username, email, hashedPassword, 'admin', branch],
    (err) => {
      if (err) {
        return res.status(400).json({ error: 'Username atau email sudah terdaftar' });
      }
      res.status(201).json({ message: 'User created successfully', userId });
    }
  );
});
 
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
 
  if (!username || !password) {
    return res.status(400).json({ error: 'Username dan password diperlukan' });
  }
 
  db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, user) => {
    if (err || !user) {
      return res.status(401).json({ error: 'Username atau password salah' });
    }
 
    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Username atau password salah' });
    }
 
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, branch: user.branch },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
 
    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, username: user.username, email: user.email, role: user.role, branch: user.branch }
    });
  });
});
 
// ============ MEMBERS ============
app.post('/api/members', (req, res) => {
  const { card_number, name, phone, email, branch, birthday } = req.body;
 
  if (!card_number || !name || !branch) {
    return res.status(400).json({ error: 'Card number, name, dan branch diperlukan' });
  }
 
  const memberId = uuidv4();
 
  db.run(
    `INSERT INTO members (id, card_number, name, phone, email, branch, tier, current_discount, birthday)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [memberId, card_number, name, phone || null, email || null, branch, 0, 10, birthday || null],
    (err) => {
      if (err) {
        return res.status(400).json({ error: 'Card number sudah terdaftar' });
      }
      res.status(201).json({
        message: 'Member created successfully',
        memberId,
        member: { id: memberId, card_number, name, tier: 0, discount: 10 }
      });
    }
  );
});
 
app.get('/api/members', (req, res) => {
  const { branch } = req.query;
  
  const query = branch 
    ? `SELECT * FROM members WHERE branch = ? ORDER BY name`
    : `SELECT * FROM members ORDER BY name`;
  
  const params = branch ? [branch] : [];
 
  db.all(query, params, (err, members) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(members || []);
  });
});
 
app.get('/api/members/card/:cardNumber', (req, res) => {
  const { cardNumber } = req.params;
 
  db.get(
    `SELECT m.*, (SELECT tier_name FROM tier_config WHERE tier_level = m.tier) as tier_name
     FROM members m WHERE card_number = ?`,
    [cardNumber],
    (err, member) => {
      if (err || !member) {
        return res.status(404).json({ error: 'Member not found' });
      }
      res.json(member);
    }
  );
});
 
app.put('/api/members/:id', (req, res) => {
  const { id } = req.params;
  const { name, phone, email, birthday } = req.body;
 
  db.run(
    `UPDATE members SET name = ?, phone = ?, email = ?, birthday = ? WHERE id = ?`,
    [name, phone, email, birthday, id],
    function (err) {
      if (err || this.changes === 0) {
        return res.status(400).json({ error: 'Member not found' });
      }
      res.json({ message: 'Member updated successfully' });
    }
  );
});
 
app.get('/api/members/stats', (req, res) => {
  db.all(
    `SELECT tier as tier_level, 
      (SELECT tier_name FROM tier_config WHERE tier_level = members.tier) as tier_name,
      COUNT(*) as count, 
      SUM(total_spending) as total_spent
     FROM members WHERE is_active = 1 GROUP BY tier ORDER BY tier DESC`,
    (err, stats) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(stats || []);
    }
  );
});
 
// ============ TRANSACTIONS ============
const getDayType = () => {
  const day = new Date().getDay();
  return (day === 0 || day === 6) ? 'weekend' : 'weekday';
};
 
const calculateTier = (spending) => {
  if (spending >= 10000000) return 3;
  if (spending >= 5000000) return 2;
  if (spending >= 3000000) return 1;
  return 0;
};
 
const getDiscount = (tier, dayType) => {
  const discounts = {
    0: { weekday: 10, weekend: 10 },
    1: { weekday: 15, weekend: 10 },
    2: { weekday: 15, weekend: 15 },
    3: { weekday: 20, weekend: 20 }
  };
  return discounts[tier]?.[dayType] || 10;
};
 
app.post('/api/transactions', (req, res) => {
  const { member_id, amount, branch, notes, created_by } = req.body;  // ✅ Terima created_by dari frontend

  if (!member_id || !amount || !branch) {
    return res.status(400).json({ error: 'Member ID, amount, dan branch diperlukan' });
  }

  // ✅ Validasi member exist
  db.get(`SELECT * FROM members WHERE id = ?`, [member_id], (err, member) => {
    if (err || !member) {
      return res.status(404).json({ error: 'Member not found' });
    }

    // ✅ Validasi created_by user exist
    db.get(`SELECT id FROM users WHERE id = ?`, [created_by], (err, user) => {
      if (err || !user) {
        return res.status(400).json({ error: 'Invalid user (created_by)' });
      }

      const dayType = getDayType();
      const discountPercentage = getDiscount(member.tier, dayType);
      const discountApplied = (amount * discountPercentage) / 100;
      const transactionId = uuidv4();
      const newTotalSpending = member.total_spending + amount;
      const newTier = calculateTier(newTotalSpending);

      db.run(
        `INSERT INTO transactions (id, member_id, amount, discount_applied, discount_percentage, day_type, branch, notes, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [transactionId, member_id, amount, discountApplied, discountPercentage, dayType, branch, notes || null, created_by],  // ✅ Pakai user ID yang valid
        (err) => {
          if (err) {
            console.error('❌ Transaction insert error:', err.message);
            return res.status(500).json({ error: err.message });
          }

          const newDiscount = getDiscount(newTier, dayType);

          db.run(
            `UPDATE members SET total_spending = ?, tier = ?, current_discount = ?, last_purchase_date = CURRENT_TIMESTAMP WHERE id = ?`,
            [newTotalSpending, newTier, newDiscount, member_id],
            (err) => {
              if (err) {
                return res.status(500).json({ error: err.message });
              }

              if (newTier !== member.tier) {
                db.run(
                  `INSERT INTO tier_history (id, member_id, old_tier, new_tier, reason) VALUES (?, ?, ?, ?, ?)`,
                  [uuidv4(), member_id, member.tier, newTier, `Purchase Rp${amount}`]
                );
              }

              res.status(201).json({
                message: 'Transaction recorded successfully',
                transaction: {
                  id: transactionId,
                  amount,
                  discount_percentage: discountPercentage,
                  discount_applied: discountApplied,
                  day_type: dayType
                },
                member_update: {
                  new_tier: newTier,
                  total_spending: newTotalSpending,
                  new_discount: newDiscount
                }
              });
            }
          );
        }
      );
    });
  });
});

// ============ UPDATE TRANSACTION ============
app.put('/api/transactions/:id', (req, res) => {
  const { id } = req.params;
  const { member_id, amount, branch, notes } = req.body;

  if (!member_id || !amount || !branch) {
    return res.status(400).json({ error: 'Member ID, amount, dan branch diperlukan' });
  }

  // ✅ Get old transaction data
  db.get(`SELECT * FROM transactions WHERE id = ?`, [id], (err, oldTrans) => {
    if (err || !oldTrans) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // ✅ Get member data
    db.get(`SELECT * FROM members WHERE id = ?`, [member_id], (err, member) => {
      if (err || !member) {
        return res.status(404).json({ error: 'Member not found' });
      }

      // ✅ Calculate new spending (remove old amount, add new amount)
      const amountDifference = amount - oldTrans.amount;
      const newTotalSpending = member.total_spending + amountDifference;
      const newTier = calculateTier(newTotalSpending);
      const newDiscount = getDiscount(newTier, oldTrans.day_type);

      // ✅ Update transaction
      db.run(
        `UPDATE transactions SET member_id = ?, amount = ?, branch = ?, notes = ? WHERE id = ?`,
        [member_id, amount, branch, notes || null, id],
        (err) => {
          if (err) {
            console.error('❌ Update transaction error:', err.message);
            return res.status(500).json({ error: err.message });
          }

          // ✅ Update member tier & spending
          db.run(
            `UPDATE members SET total_spending = ?, tier = ?, current_discount = ? WHERE id = ?`,
            [newTotalSpending, newTier, newDiscount, member_id],
            (err) => {
              if (err) {
                return res.status(500).json({ error: err.message });
              }

              // ✅ Update tier history jika tier berubah
              if (newTier !== member.tier) {
                db.run(
                  `INSERT INTO tier_history (id, member_id, old_tier, new_tier, reason) VALUES (?, ?, ?, ?, ?)`,
                  [uuidv4(), member_id, member.tier, newTier, `Transaction Update Rp${amount}`]
                );
              }

              res.json({
                message: 'Transaction updated successfully',
                transaction: {
                  id,
                  member_id,
                  amount,
                  branch,
                  notes
                },
                member_update: {
                  new_tier: newTier,
                  total_spending: newTotalSpending,
                  new_discount: newDiscount
                }
              });
            }
          );
        }
      );
    });
  });
});

// ============ DELETE TRANSACTION ============
app.delete('/api/transactions/:id', (req, res) => {
  const { id } = req.params;

  // ✅ Get transaction data
  db.get(`SELECT * FROM transactions WHERE id = ?`, [id], (err, trans) => {
    if (err || !trans) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // ✅ Get member data
    db.get(`SELECT * FROM members WHERE id = ?`, [trans.member_id], (err, member) => {
      if (err || !member) {
        return res.status(404).json({ error: 'Member not found' });
      }

      // ✅ Recalculate member tier (remove transaction amount)
      const newTotalSpending = member.total_spending - trans.amount;
      const newTier = calculateTier(newTotalSpending);
      const newDiscount = getDiscount(newTier, trans.day_type);

      // ✅ Delete transaction
      db.run(`DELETE FROM transactions WHERE id = ?`, [id], (err) => {
        if (err) {
          console.error('❌ Delete transaction error:', err.message);
          return res.status(500).json({ error: err.message });
        }

        // ✅ Update member tier & spending
        db.run(
          `UPDATE members SET total_spending = ?, tier = ?, current_discount = ? WHERE id = ?`,
          [newTotalSpending, newTier, newDiscount, trans.member_id],
          (err) => {
            if (err) {
              return res.status(500).json({ error: err.message });
            }

            res.json({
              message: 'Transaction deleted successfully',
              member_update: {
                new_tier: newTier,
                total_spending: newTotalSpending
              }
            });
          }
        );
      });
    });
  });
});
 
app.get('/api/transactions', (req, res) => {
  const { member_id, branch, limit = 50 } = req.query;
  
  let query = `SELECT t.*, m.name as member_name, m.card_number FROM transactions t
               JOIN members m ON t.member_id = m.id WHERE 1=1`;
  const params = [];
 
  if (member_id) {
    query += ` AND t.member_id = ?`;
    params.push(member_id);
  }
  if (branch) {
    query += ` AND t.branch = ?`;
    params.push(branch);
  }
  
  query += ` ORDER BY t.created_at DESC LIMIT ?`;
  params.push(parseInt(limit));
 
  db.all(query, params, (err, transactions) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(transactions || []);
  });
});
 
// ============ DATA EXPORT ============
app.get('/api/data/export', (req, res) => {
  const exportData = {
    exported_at: new Date().toISOString(),
    members: [],
    transactions: [],
    tier_config: [],
    tier_history: []
  };
 
  db.all(`SELECT * FROM members`, (err, members) => {
    exportData.members = members || [];
 
    db.all(`SELECT * FROM transactions`, (err, transactions) => {
      exportData.transactions = transactions || [];
 
      db.all(`SELECT * FROM tier_config`, (err, tiers) => {
        exportData.tier_config = tiers || [];
 
        db.all(`SELECT * FROM tier_history`, (err, history) => {
          exportData.tier_history = history || [];
 
          const fileName = `loyalty-backup-${Date.now()}.json`;
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
          res.send(JSON.stringify(exportData, null, 2));
 
          db.run(
            `INSERT INTO backup_history (id, backup_filename, created_by) VALUES (?, ?, ?)`,
            [uuidv4(), fileName, 'system']
          );
        });
      });
    });
  });
});
 
app.get('/api/data/backup-history', (req, res) => {
  db.all(
    `SELECT * FROM backup_history ORDER BY backup_date DESC LIMIT 50`,
    (err, history) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(history || []);
    }
  );
});
 
// ============ HEALTH CHECK ============
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});
 
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
