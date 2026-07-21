# Loyalty Program App

Aplikasi manajemen program loyalitas member yang komprehensif dengan sistem tier otomatis, tracking spending, dan discount berbasis hari.

## 🎯 Fitur Utama

- **Member Management**
  - Registrasi member dengan card number unik
  - Edit profil member (nama, kontak, birthday)
  - Status tracking (active/inactive)

- **Tier System**
  - 4 tier otomatis: BRONZE → SILVER → GOLD → PLATINUM
  - Tier berdasarkan total spending
  - Automatic tier upgrade/downgrade

- **Transaction Recording**
  - Catat pembelian member
  - Discount otomatis sesuai tier & hari (weekday/weekend)
  - Edit & delete transaction dengan auto-recalculation
  - Tracking diskon yang diberikan

- **Discount Management**
  - Weekday discount berbeda dari weekend
  - Tier-based discount tiers
  - Birthday special treats (Gold & Platinum)

- **Analytics & Reporting**
  - Member statistics (count per tier, total spending)
  - Transaction history & export
  - Tier history tracking
  - Backup data otomatis (JSON export)

- **Authentication**
  - User login dengan JWT
  - Role-based access (Admin, Staff)
  - Branch management

## 🛠️ Tech Stack

**Backend:**
- Node.js + Express.js
- SQLite3
- JWT Authentication
- Bcryptjs (Password hashing)

**Frontend:**
- React.js
- Bootstrap 5
- Axios (API calls)
- React Router

## 📋 Persyaratan

- Node.js v14+
- npm atau yarn
- SQLite3

## 🚀 Instalasi & Running

### Backend Setup
```bash
cd loyalty-app/backend
npm install
npm start

Server berjalan di http://localhost:5000

Frontend Setup
bash
cd loyalty-app/frontend
npm install
npm start
Aplikasi berjalan di http://localhost:3000

📁 Project Structure
java
loyalty-app/
├── backend/
│   ├── server.js
│   ├── database.js
│   ├── loyalty.db
│   ├── .env
│   └── package.json
│
└── frontend/
    ├── src/
    ├── .env
    └── package.json
🔐 Environment Variables
Backend (.env):

makefile
PORT=5000
JWT_SECRET=your_secret_key
Frontend (.env):

bash
REACT_APP_API_URL=http://localhost:5000/api
💡 Fitur Utama
Member registration & management
Automatic tier system based on spending
Transaction recording dengan auto-discount
Analytics & reporting
Data export & backup
📝 License
MIT License

👤 Author
Hasbikur
