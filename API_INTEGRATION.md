# 🔌 Frontend-Backend API Integration Guide

## ✅ Setup Complete

Your frontend is now connected to the backend API!

## 🎯 Single Point Configuration

### **Change API URL in ONE Place:**

**File:** `frontend/.env`

```env
# Local Development
VITE_API_URL=https://qr-menu-backend-lwba.onrender.com/api

# Production (Change this when deploying)
# VITE_API_URL=https://your-production-api.com/api
```

### **How to Create .env File:**

```bash
cd frontend
cp .env.example .env
```

Then edit `.env` with your API URL.

---

## 📡 API Integration Architecture

### **1. Base Configuration**

**File:** `src/shared/api/axios.js`
- Creates axios instance with base URL from `.env`
- Auto-adds JWT token to requests
- Handles 401 (unauthorized) errors
- Intercepts responses

**File:** `src/shared/config/api.js`
- Exports centralized API endpoints
- Single source of truth for all URLs

### **2. API Endpoints**

**File:** `src/shared/api/endpoints.js`

All API calls are organized by feature:

```javascript
import { authAPI, qrAPI, dashboardAPI } from '@shared/api/endpoints'

// Login
await authAPI.login({ email, password })

// Register
await authAPI.register({ name, email, password })

// Get Dashboard Stats
await dashboardAPI.getStats()

// Generate QR Code
await qrAPI.generate({ name, type, tableNumber })
```

### **3. Authentication Context**

**File:** `src/shared/contexts/AuthContext.jsx`

Handles all auth logic:
- ✅ Calls real backend API
- ✅ Stores JWT token
- ✅ Auto-refreshes user on page load
- ✅ Fallback to demo mode if backend offline

---

## 🔐 Authentication Flow

### **Login Flow:**

1. User enters credentials
2. Frontend calls `POST /api/auth/login`
3. Backend validates and returns JWT token
4. Token stored in localStorage
5. User redirected to dashboard
6. Token auto-added to all future requests

### **Token Storage:**

```javascript
// Token stored as:
localStorage.setItem('auth_token', 'eyJhbGciOiJIUzI1NiIs...')

// Auto-added to all requests:
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### **Protected Routes:**

All admin routes require authentication. The token is checked on every request.

---

## 🧪 Testing API Integration

### **1. Start Backend:**

```bash
cd backend
npm run dev
```

Should see:
```
✅ MongoDB Connected: localhost
🚀 Server running on port 5000
```

### **2. Start Frontend:**

```bash
cd frontend
npm run dev
```

### **3. Test Register:**

1. Go to `http://localhost:3000/owner/login`
2. Click "Register" tab
3. Fill in:
   - Name: Test User
   - Email: test@test.com
   - Password: 123456
   - Restaurant: My Restaurant
4. Click "Create Account"

**Expected Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {...},
    "token": "eyJ..."
  }
}
```

### **4. Test Login:**

1. Go to `http://localhost:3000/owner/login`
2. Enter:
   - Email: test@test.com
   - Password: 123456
3. Click "Login"

**Should redirect to dashboard!**

---

## 📊 Dashboard API Integration

### **Dashboard Stats:**

```javascript
// In Dashboard component
import { dashboardAPI } from '@shared/api/endpoints'

const stats = await dashboardAPI.getStats()
// Returns: totalQRCodes, activeQRCodes, totalScans, etc.
```

### **QR Code Generation:**

```javascript
// In QR Generator component
import { qrAPI } from '@shared/api/endpoints'

const qrCode = await qrAPI.generate({
  name: "Table 5",
  type: "table",
  tableNumber: "5"
})
// Returns: QR code image data, URL, token
```

---

## 🚨 Error Handling

### **Network Errors:**

If backend is offline:
```
"Backend server not running. Please start the API server."
```

### **Validation Errors:**

```json
{
  "success": false,
  "message": "Email is required, Password must be at least 6 characters"
}
```

### **Auth Errors:**

```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

---

## 🔄 Changing to Production API

### **Step 1: Update .env**

```env
# frontend/.env
VITE_API_URL=https://api.yourrestaurant.com/api
```

### **Step 2: Rebuild Frontend**

```bash
cd frontend
npm run build
```

### **Step 3: Deploy**

Deploy `frontend/dist` folder to:
- Vercel
- Netlify
- AWS S3 + CloudFront
- Any static hosting

**That's it! One change in `.env` updates entire app.**

---

## 📁 File Structure

```
frontend/
├── .env                          ← **CHANGE API URL HERE**
├── .env.example
└── src/
    └── shared/
        ├── api/
        │   ├── axios.js          ← Axios config (uses .env)
        │   └── endpoints.js      ← All API functions
        ├── config/
        │   └── api.js            ← API constants
        └── contexts/
            └── AuthContext.jsx   ← Auth logic (calls API)
```

---

## ✅ Integration Checklist

- [x] `.env` file created with API URL
- [x] Axios configured with base URL
- [x] Auth API integrated (login/register)
- [x] Dashboard API integrated
- [x] QR Code API integrated
- [x] JWT token auto-added to requests
- [x] Error handling implemented
- [x] Protected routes working
- [x] Single point of configuration

---

## 🎉 You're All Set!

Your frontend now calls the real backend API!

**To Test:**
1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd frontend && npm run dev`
3. Register/Login at `http://localhost:3000/owner/login`
4. Everything should work with real data!

**To Deploy:**
1. Change `VITE_API_URL` in `.env`
2. Build: `npm run build`
3. Deploy `dist` folder

---

## 📚 Related Documentation

- [Backend API Documentation](../backend/API_DOCUMENTATION.md)
- [Backend README](../backend/README.md)
- [Frontend README](./README.md)
