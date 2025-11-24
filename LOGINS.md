# 🔐 Movensync - Demo Logins

## 👥 Available User Accounts

### 1. **Admin** (Full Access)
- **Email:** `admin@movensync.com`
- **Password:** `admin123`
- **Role:** Admin
- **Can:**
  - Create/Edit/Delete floor plans
  - View all bookings
  - Manage users
  - Full system access

### 2. **Regular User**
- **Email:** `user@movensync.com`
- **Password:** `user123`
- **Role:** User
- **Can:**
  - View floor plans
  - **Book meeting rooms** 📅
  - **Navigate between rooms** 🧭 (Pathfinding)
  - Manage own bookings

---

## 🚀 Getting Started

### Step 1: Delete Old Database & Restart Backend

```bash
# Delete old database
rm backend/data/movensync.db

# Start backend (will auto-create new users)
cd backend
npm run dev
```

You should see:
```
👥 Creating demo users...

✅ Admin User created
   📧 Email: admin@movensync.com
   🔑 Password: admin123
   👤 Role: admin

✅ Regular User created
   📧 Email: user@movensync.com
   🔑 Password: user123
   👤 Role: user
```

### Step 2: Start Frontend

```bash
cd frontend
npm start
```

### Step 3: Login & Test

**Login as Admin:**
- Email: `admin@movensync.com`
- Password: `admin123`
- Access: Create floor plans, manage everything

**Login as User:**
- Email: `user@movensync.com`
- Password: `user123`
- Access: View floor plans, book rooms, navigate

---

## 📋 What Each User Can Do

### **Admin Dashboard** (admin@movensync.com)
- 📋 **View Floor Plans** - See all floor plans
- 🏗️ **Create New Floor Plan** - Build new floor layouts

### **User Dashboard** (user@movensync.com)
- 📋 **View Floor Plans** - Browse available floor plans
- 📅 **My Bookings** - Book rooms & manage bookings
- 🧭 **Navigate** - Find paths between rooms

---

## 🎯 Features Available

### ✅ Working NOW - COMPLETE SYSTEM:
- Authentication (2 users: admin + user)
- Floor plan CRUD with drag-and-drop editor
- **Booking System** - Full UI to book rooms with time slots ✅
- **Pathfinding System** - Visual path navigation between rooms ✅

---

## 📡 Test APIs Directly

### Test Booking API
```bash
# Login first to get token
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@movensync.com","password":"user123"}'

# Use the token to book a room
curl -X POST http://localhost:5001/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "floorPlanId": "floor-plan-id",
    "roomId": "room-id",
    "roomName": "Meeting Room 1",
    "startTime": "2025-01-24T14:00:00Z",
    "endTime": "2025-01-24T15:00:00Z",
    "title": "Team Meeting"
  }'
```

### Test Pathfinding API
```bash
curl -X POST http://localhost:5001/api/pathfinding/find-path \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "floorPlanId": "floor-plan-id",
    "startRoomId": "meeting-room-1-id",
    "endRoomId": "washroom-1-id"
  }'
```

---

## ✅ Login Issue - FIXED!

**Problem:** Passwords weren't hashing correctly
**Solution:**
- Each user now gets a fresh salt
- Database is clean
- Both logins work perfectly

**Try it now:**
1. Delete database: `rm backend/data/movensync.db`
2. Restart backend: `npm run dev`
3. Login with either account above!

---

## 🎉 System Status - FULLY COMPLETE!

✅ **Backend:** 100% Complete
- Auth with 2 users (admin + user)
- Floor plans CRUD
- Bookings API with availability checking
- Pathfinding API with A* algorithm

✅ **Frontend:** 100% Complete
- Login/Signup pages
- Floor plan drag-and-drop editor
- Floor plan list view
- **My Bookings page** - Create, view, and cancel bookings
- **Navigate page** - Visual pathfinding with animated paths

---

## 🎯 How to Use the New Features

### **Booking a Room:**
1. Login as `user@movensync.com`
2. Click "📅 My Bookings" from dashboard
3. Click "➕ New Booking"
4. Select a floor plan
5. Select a meeting/conference room
6. Enter title, date, time, and attendees
7. Click "Create Booking"
8. View all your bookings below!

### **Finding a Path Between Rooms:**
1. Login as `user@movensync.com`
2. Click "🧭 Navigate" from dashboard
3. Select a floor plan
4. Click "📍 Select Start Room" and click a room on canvas
5. Click "🎯 Select End Room" and click another room
6. Click "🔍 Find Path"
7. See the animated path on the canvas with distance and time!

---

**The system is now 100% complete and ready to use!** 🎊🎉
