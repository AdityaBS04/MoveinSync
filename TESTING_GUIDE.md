# Movensync - Complete Testing Guide

**Purpose**: Comprehensive dry run to verify all system features from authentication to health monitoring

**Test Date**: November 24, 2024
**Tester**: _________________

---

## Pre-Test Setup Checklist

### 1. Install Redis (if not already installed)

**macOS:**
```bash
brew install redis
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get update
sudo apt-get install redis-server
```

**Windows:**
```bash
# Download from https://redis.io/download
# Or use Windows Subsystem for Linux (WSL)
```

### 2. Start Redis Server

```bash
redis-server
```

**Expected Output:**
```
                _._
           _.-``__ ''-._
      _.-``    `.  `_.  ''-._           Redis 7.x.x
  .-`` .-```.  ```\/    _.,_ ''-._
 (    '      ,       .-`  | `,    )     Running in standalone mode
 |`-._`-...-` __...-.``-._|'` _.-'|     Port: 6379
 |    `-._   `._    /     _.-'    |     PID: xxxxx
  `-._    `-._  `-./  _.-'    _.-'
 |`-._`-._    `-.__.-'    _.-'_.-'|
 |    `-._`-._        _.-'_.-'    |
  `-._    `-._`-.__.-'_.-'    _.-'
      `-._    `-.__.-'    _.-'
          `-._        _.-'
              `-.__.-'

Server initialized
Ready to accept connections
```

✅ **Status**: [ ] Redis Running

---

### 3. Start Backend Server

```bash
cd /Users/aditya/Documents/Projects/Movensync/backend
npm run dev
```

**Expected Output:**
```
🚀 Initializing Movensync Server...
📡 Connecting to Redis...
✅ Redis connected successfully
✅ Database already contains users

✅ Movensync Server Started Successfully
🌐 Server running on port 5000
📊 Health check: http://localhost:5000/api/health/detailed
📈 Metrics: http://localhost:5000/api/health/metrics

🎯 Features Enabled:
  ✓ Redis Caching (with graceful fallback)
  ✓ System Monitoring & Health Checks
  ✓ Retry Logic & Circuit Breakers
  ✓ Rate Limiting (100 req/15min per IP)
  ✓ Error Tracking & Logging

[nodemon] watching extensions: js,mjs,json
```

✅ **Status**: [ ] Backend Running on Port 5000

---

### 4. Start Frontend Server (New Terminal)

```bash
cd /Users/aditya/Documents/Projects/Movensync/frontend
npm start
```

**Expected Output:**
```
Compiled successfully!

You can now view movensync-frontend in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.x.x:3000
```

✅ **Status**: [ ] Frontend Running on Port 3000

---

## Test Suite

---

## Phase 1: Authentication Testing

### Test 1.1: User Login (Existing User)

**Steps:**
1. Open browser: `http://localhost:3000`
2. Click "Login" (if not on login page)
3. Enter credentials:
   - **Email**: `admin@movensync.com`
   - **Password**: `admin123`
4. Click "Login" button

**Expected Results:**
- ✅ Redirect to Dashboard (`/dashboard`)
- ✅ See welcome message: "Welcome back, Admin User"
- ✅ Role badge shows "ADMIN"
- ✅ No error messages

**Backend Console - Check for Activity Log:**
```
[Activity Log] LOGIN by user admin@movensync.com
```

**Test Result**: [ ] PASS [ ] FAIL
**Notes**: _________________________________

---

### Test 1.2: User Registration (New User)

**Steps:**
1. Logout (if logged in)
2. Click "Sign Up" link
3. Fill registration form:
   - **Full Name**: `Test User`
   - **Email**: `testuser@movensync.com`
   - **Password**: `test123456`
   - **Confirm Password**: `test123456`
   - **Role**: Select "User"
4. Click "Sign Up" button

**Expected Results:**
- ✅ Redirect to Dashboard
- ✅ See welcome message: "Welcome back, Test User"
- ✅ Role badge shows "USER"
- ✅ JWT token stored in localStorage

**Backend Console - Check for Activity Log:**
```
[Activity Log] REGISTER - New user: testuser@movensync.com
```

**Test Result**: [ ] PASS [ ] FAIL
**Notes**: _________________________________

---

### Test 1.3: Protected Route Access

**Steps:**
1. Open browser in Incognito/Private mode
2. Try to access: `http://localhost:3000/dashboard`

**Expected Results:**
- ✅ Redirect to `/login` page
- ✅ Cannot access dashboard without authentication

**Test Result**: [ ] PASS [ ] FAIL
**Notes**: _________________________________

---

## Phase 2: Floor Plan Management

### Test 2.1: View All Floor Plans (With Redis Caching)

**Steps:**
1. Login as Admin (`admin@movensync.com`)
2. Navigate to "Floor Plans" section
3. Observe backend console logs

**Expected Results - First Request (Cache MISS):**
- ✅ Floor plans load successfully
- ✅ Backend console shows:
  ```
  ❌ Cache MISS: cache:floor_plans:all:user_<id>
  ```
- ✅ Response time: 50-200ms

**Expected Results - Second Request (Cache HIT):**
- Refresh the page (or navigate away and back)
- ✅ Backend console shows:
  ```
  ✅ Cache HIT: cache:floor_plans:all:user_<id>
  ```
- ✅ Response time: 1-5ms (much faster!)

**Test Result**: [ ] PASS [ ] FAIL
**Cache Working**: [ ] YES [ ] NO
**Notes**: _________________________________

---

### Test 2.2: Create New Floor Plan

**Steps:**
1. Login as Admin
2. Click "Create New Floor Plan" button
3. Fill in details:
   - **Name**: `Test Building A`
   - **Description**: `Testing floor plan creation`
   - **Building**: `HQ`
   - **Floor Number**: `1`
4. Add some rooms using the floor plan editor
5. Click "Save Draft"

**Expected Results:**
- ✅ Floor plan created successfully
- ✅ Status shows "DRAFT"
- ✅ Backend console shows:
  ```
  [Activity Log] CREATE_FLOOR_PLAN: Test Building A (draft)
  ```
- ✅ Cache invalidation occurs:
  ```
  🗑️  Cache invalidated: floor_plans:*
  ```

**Test Result**: [ ] PASS [ ] FAIL
**Notes**: _________________________________

---

### Test 2.3: Update Floor Plan (Version Control)

**Steps:**
1. Open the floor plan created in Test 2.2
2. Modify it (add/remove/move rooms)
3. Click "Save Changes"

**Expected Results:**
- ✅ Changes saved successfully
- ✅ New version created in version history
- ✅ Backend console shows:
  ```
  [Activity Log] UPDATE_FLOOR_PLAN: Test Building A
  ```
- ✅ Cache invalidated for this specific floor plan

**Test Result**: [ ] PASS [ ] FAIL
**Notes**: _________________________________

---

### Test 2.4: Publish Floor Plan

**Steps:**
1. Open the draft floor plan
2. Click "Publish" button
3. Confirm publication

**Expected Results:**
- ✅ Status changes from "DRAFT" to "PUBLISHED"
- ✅ Floor plan now visible to regular users
- ✅ Backend console shows:
  ```
  [Activity Log] PUBLISH_FLOOR_PLAN: Test Building A
  ```
- ✅ Cache invalidated

**Test Result**: [ ] PASS [ ] FAIL
**Notes**: _________________________________

---

### Test 2.5: Offline Floor Plan Editing

**Steps:**
1. Login as Admin
2. Open a floor plan for editing
3. Open Browser DevTools → Network tab
4. Select "Offline" mode (simulate network failure)
5. Make changes to the floor plan
6. Click "Save Changes"

**Expected Results:**
- ✅ Changes saved locally (in IndexedDB/localStorage)
- ✅ UI shows "Offline Mode - Changes will sync when online"
- ✅ No error alerts
7. Go back online (disable offline mode)
8. Changes should auto-sync to server
- ✅ Backend console shows successful sync

**Test Result**: [ ] PASS [ ] FAIL
**Notes**: _________________________________

---

## Phase 3: Version Control Testing

### Test 3.1: View Version History

**Steps:**
1. Login as Admin
2. Open "Version Control" section
3. Select the floor plan edited in Test 2.3

**Expected Results:**
- ✅ See list of all versions with timestamps
- ✅ Each version shows:
  - Version number
  - Created by (author)
  - Timestamp
  - Status (pending/approved/rejected)

**Test Result**: [ ] PASS [ ] FAIL
**Notes**: _________________________________

---

### Test 3.2: Conflict Detection (Multi-Admin Editing)

**Setup**: You'll need two browser windows logged in as different admins

**Steps:**
1. **Window 1**: Login as `admin@movensync.com`
2. **Window 2**: Login with a different admin (create one if needed)
3. **Both Windows**: Open the same floor plan
4. **Window 1**: Move Room A to position (100, 100), save
5. **Window 2**: Move Room A to position (200, 200), save

**Expected Results:**
- ✅ System detects conflict
- ✅ Conflict resolution UI appears
- ✅ Shows both versions side-by-side
- ✅ Options to:
  - Accept Window 1's changes
  - Accept Window 2's changes
  - Manual merge

**Test Result**: [ ] PASS [ ] FAIL
**Notes**: _________________________________

---

### Test 3.3: Auto-Merge (Non-Conflicting Changes)

**Steps:**
1. **Window 1**: Admin 1 edits Room A
2. **Window 2**: Admin 2 edits Room B (different room)
3. Both save changes

**Expected Results:**
- ✅ Changes auto-merge successfully
- ✅ No conflict detected (different rooms)
- ✅ Both changes appear in final version
- ✅ Backend console shows:
  ```
  [Activity Log] AUTO_MERGE_VERSION successful
  ```

**Test Result**: [ ] PASS [ ] FAIL
**Notes**: _________________________________

---

## Phase 4: Room Booking System

### Test 4.1: Room Availability Check

**Steps:**
1. Login as regular User
2. Navigate to "Bookings" → "Book a Room"
3. Select:
   - Floor Plan: `Test Building A`
   - Date: Tomorrow's date
   - Time: 10:00 AM - 11:00 AM

**Expected Results:**
- ✅ Shows list of available rooms
- ✅ Rooms with existing bookings are marked "Unavailable"
- ✅ Available rooms show green indicator
- ✅ Room details displayed (capacity, type, amenities)

**Backend - Check Caching:**
```
❌ Cache MISS: cache:room_availability:floor_<id>:date_<date>
# (First request)

✅ Cache HIT: cache:room_availability:floor_<id>:date_<date>
# (Subsequent requests within 5 minutes)
```

**Test Result**: [ ] PASS [ ] FAIL
**Notes**: _________________________________

---

### Test 4.2: Create Room Booking

**Steps:**
1. Continue from Test 4.1
2. Select an available room: `Conference Room A`
3. Fill booking details:
   - **Purpose**: `Team Meeting`
   - **Attendees**: `5`
4. Click "Book Room"

**Expected Results:**
- ✅ Booking created successfully
- ✅ Confirmation message appears
- ✅ Booking appears in "My Bookings"
- ✅ Backend console shows:
  ```
  [Activity Log] CREATE_BOOKING: Conference Room A by testuser@movensync.com
  ```
- ✅ Cache invalidated for room availability

**Test Result**: [ ] PASS [ ] FAIL
**Notes**: _________________________________

---

### Test 4.3: Intelligent Room Recommendations

**Steps:**
1. Navigate to "Book a Room"
2. Click "Get Recommendations" button
3. Observe the recommended rooms

**Expected Results:**
- ✅ Rooms sorted by recommendation score
- ✅ Each room shows:
  - Recommendation score (e.g., "85/100")
  - Reason: "Based on your booking history"
  - Visual indicator (star rating or progress bar)
- ✅ Rooms you've booked before ranked higher
- ✅ Backend console shows:
  ```
  [Room Recommendation] User: testuser@movensync.com
  Recommended rooms: [list with scores]
  ```

**Test Result**: [ ] PASS [ ] FAIL
**Notes**: _________________________________

---

### Test 4.4: Date Validation in Booking Form

**Steps:**
1. Navigate to booking form
2. Select Start Date/Time: `2024-11-25 10:00 AM`
3. Try to select End Date/Time: `2024-11-25 09:00 AM` (before start)

**Expected Results:**
- ✅ End date picker disables all dates/times before start time
- ✅ Cannot select end time before start time
- ✅ Browser validation prevents invalid selection

**Test Result**: [ ] PASS [ ] FAIL
**Notes**: _________________________________

---

### Test 4.5: View My Bookings

**Steps:**
1. Navigate to "My Bookings" page
2. View list of your bookings

**Expected Results:**
- ✅ Shows all bookings for current user
- ✅ Each booking displays:
  - Room name
  - Date and time
  - Status (upcoming/past/cancelled)
  - Purpose
- ✅ Options to cancel upcoming bookings

**Test Result**: [ ] PASS [ ] FAIL
**Notes**: _________________________________

---

## Phase 5: Room Navigation & Pathfinding

### Test 5.1: Find Path Between Rooms

**Steps:**
1. Navigate to "Navigation" section
2. Select:
   - **From**: `Room A`
   - **To**: `Room B`
3. Click "Find Path"

**Expected Results:**
- ✅ Path displayed on floor plan
- ✅ Route highlighted with colored line
- ✅ Distance/time estimate shown
- ✅ Step-by-step directions listed:
  ```
  1. Start from Room A
  2. Go through Hallway 1
  3. Turn right at Junction
  4. Arrive at Room B
  Total distance: 45m, Estimated time: 2 minutes
  ```
- ✅ Backend shows A* pathfinding algorithm execution:
  ```
  [Pathfinding] A* algorithm: Room A → Room B
  Nodes explored: 12, Path length: 4 rooms
  Computation time: 3ms
  ```

**Backend - Check Caching:**
```
❌ Cache MISS: cache:path:<roomA_id>:<roomB_id>
✅ Cache HIT on subsequent identical queries
```

**Test Result**: [ ] PASS [ ] FAIL
**Notes**: _________________________________

---

### Test 5.2: Navigate to Booked Room

**Steps:**
1. Go to "My Bookings"
2. Click "Navigate" button on an upcoming booking

**Expected Results:**
- ✅ Automatically opens navigation with:
  - From: Current location (or entrance)
  - To: Booked room
- ✅ Path displayed immediately
- ✅ "Start Navigation" button available

**Test Result**: [ ] PASS [ ] FAIL
**Notes**: _________________________________

---

## Phase 6: Activity Logging Verification

### Test 6.1: Check All Activity Logs

**Steps:**
1. Login as Admin
2. Navigate to "Activity Logs" section
3. Set filters to "All Activities" and "All Users"

**Expected Results - Verify ALL these log types exist:**

| Action Type | Expected Entry | Status |
|-------------|---------------|--------|
| **LOGIN** | User login: admin@movensync.com | [ ] |
| **REGISTER** | New user: testuser@movensync.com | [ ] |
| **CREATE_FLOOR_PLAN** | Test Building A (draft) | [ ] |
| **UPDATE_FLOOR_PLAN** | Test Building A modified | [ ] |
| **PUBLISH_FLOOR_PLAN** | Test Building A published | [ ] |
| **CREATE_BOOKING** | Conference Room A booked | [ ] |
| **CANCEL_BOOKING** | (if you cancelled any) | [ ] |
| **CREATE_VERSION** | New version of floor plan | [ ] |
| **APPROVE_VERSION** | (if tested) | [ ] |
| **PATHFINDING** | Navigation query logged | [ ] |

**Each log entry should show:**
- ✅ Timestamp
- ✅ User who performed action
- ✅ Action type
- ✅ Details/description
- ✅ IP address (if available)

**Test Result**: [ ] PASS [ ] FAIL
**Missing Log Types**: _________________________________

---

### Test 6.2: Filter Activity Logs

**Steps:**
1. In Activity Logs, use filters:
   - **Filter by User**: Select `testuser@movensync.com`
   - **Filter by Action**: Select `CREATE_BOOKING`
   - **Date Range**: Last 24 hours

**Expected Results:**
- ✅ Shows only bookings created by test user
- ✅ Other actions filtered out
- ✅ Logs match filter criteria

**Test Result**: [ ] PASS [ ] FAIL
**Notes**: _________________________________

---

## Phase 7: Redis Caching Deep Dive

### Test 7.1: Verify Redis Cache Keys

**Steps:**
1. Open Redis CLI in a new terminal:
   ```bash
   redis-cli
   ```

2. Check all cache keys:
   ```
   KEYS *
   ```

**Expected Output - Should see keys like:**
```
1) "cache:floor_plans:all:user_1"
2) "cache:floor_plan:123"
3) "cache:room_availability:floor_1:date_2024-11-25"
4) "cache:path:room_1:room_5"
5) "cache:user:bookings:user_2"
```

3. Check a specific key value:
   ```
   GET "cache:floor_plans:all:user_1"
   ```

**Expected Results:**
- ✅ Returns JSON data of floor plans
- ✅ Data matches what frontend displays

4. Check TTL (Time To Live):
   ```
   TTL "cache:floor_plans:all:user_1"
   ```

**Expected Results:**
- ✅ Returns value between 0-300 (seconds)
- ✅ TTL = 300 seconds = 5 minutes

**Test Result**: [ ] PASS [ ] FAIL
**Notes**: _________________________________

---

### Test 7.2: Cache Invalidation on Update

**Steps:**
1. In Redis CLI, check existing cache:
   ```
   KEYS cache:floor_plans:*
   ```
   (Note the keys)

2. In browser, update a floor plan (Test 2.3)

3. Back in Redis CLI, check again:
   ```
   KEYS cache:floor_plans:*
   ```

**Expected Results:**
- ✅ Old cache keys are deleted
- ✅ Backend console shows:
  ```
  🗑️  Cache invalidated: floor_plans:*
  Deleted 3 keys
  ```

**Test Result**: [ ] PASS [ ] FAIL
**Notes**: _________________________________

---

### Test 7.3: Cache Performance Comparison

**Steps:**
1. Clear all Redis cache:
   ```bash
   redis-cli FLUSHALL
   ```

2. Open browser DevTools → Network tab

3. Load floor plans page (first time - no cache)
   - **Note Response Time**: _________ ms

4. Reload page immediately (cache hit)
   - **Note Response Time**: _________ ms

**Expected Results:**
- ✅ First request (uncached): 50-200ms
- ✅ Second request (cached): 1-10ms
- ✅ **Speedup: 10-50x faster**

**Test Result**: [ ] PASS [ ] FAIL
**Performance Improvement**: _____x faster

---

### Test 7.4: Graceful Degradation (Redis Down)

**Steps:**
1. Stop Redis server:
   ```bash
   # Press Ctrl+C in Redis terminal
   ```

2. In browser, try to load floor plans

**Expected Results:**
- ✅ Application still works (no crashes)
- ✅ Data loads from database (slower)
- ✅ Backend console shows:
  ```
  ⚠️  Redis not available - running without cache
  ```
- ✅ No error messages to user

3. Restart Redis:
   ```bash
   redis-server
   ```

**Expected Results:**
- ✅ Application reconnects automatically
- ✅ Backend console shows:
  ```
  ✅ Redis connected successfully
  ```
- ✅ Caching resumes

**Test Result**: [ ] PASS [ ] FAIL
**Notes**: _________________________________

---

## Phase 8: System Health & Monitoring

### Test 8.1: Basic Health Check

**Steps:**
1. Open browser: `http://localhost:5000/api/health`

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-11-24T10:30:00.000Z"
}
```

**Test Result**: [ ] PASS [ ] FAIL
**Notes**: _________________________________

---

### Test 8.2: Detailed Health Check

**Steps:**
1. Open: `http://localhost:5000/api/health/detailed`

**Expected Response - Verify ALL fields present:**

```json
{
  "success": true,
  "status": "healthy",  // or "degraded" or "unhealthy"
  "timestamp": "2024-11-24T10:30:00.000Z",
  "uptime": "2h 15m 30s",

  "memory": {
    "used": "150 MB",
    "total": "16 GB",
    "percentage": "0.92%",
    "heapUsed": "120 MB",
    "heapTotal": "180 MB"
  },

  "cpu": {
    "cores": 8,
    "loadAverage": [1.5, 1.8, 2.0],
    "platform": "darwin"
  },

  "services": {
    "database": "connected",
    "redis": "connected",  // or "disconnected"
    "server": "running"
  },

  "issues": []  // Should be empty if status is "healthy"
}
```

**Checklist:**
- ✅ Status is "healthy"
- ✅ Memory usage < 90%
- ✅ Redis shows "connected"
- ✅ No issues reported
- ✅ Uptime is accurate

**Test Result**: [ ] PASS [ ] FAIL
**Notes**: _________________________________

---

### Test 8.3: Performance Metrics

**Steps:**
1. Open: `http://localhost:5000/api/health/metrics`

**Expected Response - Verify ALL metrics:**

```json
{
  "success": true,
  "metrics": {
    "requests": {
      "total": 150,
      "successful": 145,
      "failed": 5,
      "byEndpoint": {
        "/api/floor-plans": {
          "count": 25,
          "avgTime": 45.5,
          "totalTime": 1137.5
        },
        "/api/bookings": {
          "count": 18,
          "avgTime": 32.1,
          "totalTime": 577.8
        }
        // ... more endpoints
      }
    },

    "performance": {
      "avgResponseTime": 38.7,
      "totalResponseTime": 5805,
      "requestCount": 150
    },

    "errors": {
      "total": 5,
      "last10": [
        {
          "message": "Error message",
          "stack": "Error stack trace",
          "context": {},
          "timestamp": "2024-11-24T10:15:00.000Z"
        }
        // ... up to 10 most recent errors
      ]
    },

    "database": {
      "queries": 200,
      "errors": 1,
      "avgQueryTime": 15.3
    },

    "cache": {
      "hits": 120,
      "misses": 30,
      "hitRate": 0.80  // 80%
    },

    "system": {
      "startTime": 1700820000000,
      "uptime": 8130000  // milliseconds
    }
  },
  "timestamp": "2024-11-24T10:30:00.000Z"
}
```

**Checklist:**
- ✅ Total requests > 0
- ✅ Success rate > 90% (successful/total)
- ✅ Average response time < 100ms
- ✅ Cache hit rate > 70% (if Redis running)
- ✅ Error count is low
- ✅ Each endpoint shows metrics

**Test Result**: [ ] PASS [ ] FAIL
**Cache Hit Rate**: _____% (should be > 70%)
**Avg Response Time**: _____ ms (should be < 100ms)

---

### Test 8.4: Readiness Probe

**Steps:**
1. Open: `http://localhost:5000/api/health/ready`

**Expected Response:**
```json
{
  "status": "ready",
  "checks": {
    "database": "ok",
    "redis": "ok"
  }
}
```

**Test Result**: [ ] PASS [ ] FAIL
**Notes**: _________________________________

---

### Test 8.5: Liveness Probe

**Steps:**
1. Open: `http://localhost:5000/api/health/live`

**Expected Response:**
```json
{
  "status": "alive",
  "timestamp": "2024-11-24T10:30:00.000Z"
}
```

**Test Result**: [ ] PASS [ ] FAIL
**Notes**: _________________________________

---

### Test 8.6: Monitor Metrics Over Time

**Steps:**
1. Perform various actions (login, create floor plan, book room, etc.)
2. After each action, refresh: `http://localhost:5000/api/health/metrics`
3. Observe metrics changing in real-time

**Expected Results:**
- ✅ Request count increases
- ✅ Average response time updates
- ✅ Cache hit rate updates
- ✅ Endpoint-specific metrics update

**Test Result**: [ ] PASS [ ] FAIL
**Notes**: _________________________________

---

## Phase 9: Failure Handling & Retry Logic

### Test 9.1: Rate Limiting

**Steps:**
1. Open browser DevTools → Console
2. Run this script to send 101 requests rapidly:
   ```javascript
   for (let i = 0; i < 101; i++) {
     fetch('http://localhost:5000/api/health')
       .then(r => r.json())
       .then(d => console.log(`Request ${i+1}:`, d))
       .catch(e => console.error(`Request ${i+1} FAILED:`, e));
   }
   ```

**Expected Results:**
- ✅ First 100 requests succeed
- ✅ Request 101 returns error:
  ```json
  {
    "error": "Too many requests from this IP, please try again later"
  }
  ```
- ✅ HTTP Status Code: 429 (Too Many Requests)

**Test Result**: [ ] PASS [ ] FAIL
**Notes**: _________________________________

---

### Test 9.2: Error Tracking in Metrics

**Steps:**
1. Cause an error (e.g., try to book an already booked room)
2. Check metrics: `http://localhost:5000/api/health/metrics`

**Expected Results:**
- ✅ `errors.total` increases
- ✅ Error appears in `errors.last10` array with:
  - Error message
  - Stack trace
  - Timestamp
  - Context information

**Test Result**: [ ] PASS [ ] FAIL
**Notes**: _________________________________

---

### Test 9.3: Circuit Breaker (Advanced)

**Note**: This test requires code inspection - circuit breaker is used internally

**Steps:**
1. Check backend code: `backend/src/utils/retryHandler.js`
2. Verify CircuitBreaker class exists with:
   - ✅ States: CLOSED, OPEN, HALF_OPEN
   - ✅ Failure threshold
   - ✅ Success threshold
   - ✅ Timeout

**Expected Results:**
- ✅ Circuit breaker implemented
- ✅ Used for external service calls (if any)

**Test Result**: [ ] PASS [ ] FAIL
**Notes**: _________________________________

---

## Phase 10: Performance Testing

### Test 10.1: Response Time Analysis

**Use this table to record response times:**

| Endpoint | First Request (Uncached) | Second Request (Cached) | Speedup |
|----------|-------------------------|------------------------|---------|
| GET /api/floor-plans | _______ ms | _______ ms | _____x |
| GET /api/floor-plans/:id | _______ ms | _______ ms | _____x |
| GET /api/bookings/my-bookings | _______ ms | _______ ms | _____x |
| GET /api/pathfinding/:from/:to | _______ ms | _______ ms | _____x |

**Expected:**
- Uncached: 50-200ms
- Cached: 1-10ms
- Speedup: 10-50x

**Test Result**: [ ] PASS [ ] FAIL
**Notes**: _________________________________

---

### Test 10.2: Concurrent User Simulation

**Steps:**
1. Open 5 browser tabs (or use different browsers)
2. Login with different users in each tab
3. Simultaneously:
   - Tab 1: View floor plans
   - Tab 2: Create booking
   - Tab 3: Navigate rooms
   - Tab 4: View activity logs
   - Tab 5: Check metrics

**Expected Results:**
- ✅ All operations complete successfully
- ✅ No timeouts or errors
- ✅ Response times remain acceptable (< 1 second)
- ✅ Metrics show increased request count

**Test Result**: [ ] PASS [ ] FAIL
**Notes**: _________________________________

---

## Test Summary

### Overall Results

| Test Phase | Pass | Fail | Notes |
|------------|------|------|-------|
| 1. Authentication | [ ] | [ ] | _____________ |
| 2. Floor Plan Management | [ ] | [ ] | _____________ |
| 3. Version Control | [ ] | [ ] | _____________ |
| 4. Room Booking | [ ] | [ ] | _____________ |
| 5. Navigation & Pathfinding | [ ] | [ ] | _____________ |
| 6. Activity Logging | [ ] | [ ] | _____________ |
| 7. Redis Caching | [ ] | [ ] | _____________ |
| 8. Health Monitoring | [ ] | [ ] | _____________ |
| 9. Failure Handling | [ ] | [ ] | _____________ |
| 10. Performance | [ ] | [ ] | _____________ |

---

### Redis Caching Verification Checklist

- [ ] Redis connected successfully on backend startup
- [ ] Cache MISS logged on first request
- [ ] Cache HIT logged on subsequent requests
- [ ] Response time improved by 10-50x with caching
- [ ] Cache invalidated on data updates
- [ ] Cache keys visible in Redis CLI
- [ ] TTL set correctly (300 seconds)
- [ ] Graceful degradation when Redis is down
- [ ] Cache hit rate > 70% after normal usage

---

### Activity Logging Verification Checklist

- [ ] LOGIN events logged
- [ ] REGISTER events logged
- [ ] CREATE_FLOOR_PLAN events logged
- [ ] UPDATE_FLOOR_PLAN events logged
- [ ] PUBLISH_FLOOR_PLAN events logged
- [ ] CREATE_BOOKING events logged
- [ ] CANCEL_BOOKING events logged (if tested)
- [ ] CREATE_VERSION events logged
- [ ] PATHFINDING events logged
- [ ] All logs show timestamp, user, and details

---

### Health Monitoring Verification Checklist

- [ ] Basic health check responds
- [ ] Detailed health shows all system info
- [ ] Metrics endpoint shows request statistics
- [ ] Cache hit rate tracked correctly
- [ ] Error tracking works (last 10 errors)
- [ ] Readiness probe responds
- [ ] Liveness probe responds
- [ ] Metrics update in real-time

---

### Performance Benchmarks Achieved

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Cached Response Time | < 10ms | _____ ms | [ ] |
| Uncached Response Time | < 200ms | _____ ms | [ ] |
| Cache Hit Rate | > 70% | _____% | [ ] |
| Average Response Time | < 100ms | _____ ms | [ ] |
| Request Success Rate | > 95% | _____% | [ ] |
| Memory Usage | < 90% | _____% | [ ] |

---

## Critical Issues Found

**List any critical issues encountered during testing:**

1. _________________________________________________________________
2. _________________________________________________________________
3. _________________________________________________________________

---

## Recommendations

**Based on testing, list any recommendations for improvements:**

1. _________________________________________________________________
2. _________________________________________________________________
3. _________________________________________________________________

---

## Sign-Off

**Tester Name**: _______________________
**Date**: _______________________
**Overall System Status**: [ ] PASS [ ] FAIL

**Additional Comments:**
_____________________________________________________________________
_____________________________________________________________________
_____________________________________________________________________

---

## Quick Reference Commands

### Start All Services
```bash
# Terminal 1: Redis
redis-server

# Terminal 2: Backend
cd /Users/aditya/Documents/Projects/Movensync/backend
npm run dev

# Terminal 3: Frontend
cd /Users/aditya/Documents/Projects/Movensync/frontend
npm start
```

### Redis Commands
```bash
# Connect to Redis CLI
redis-cli

# View all keys
KEYS *

# Get specific key
GET "cache:floor_plans:all:user_1"

# Check TTL
TTL "cache:floor_plans:all:user_1"

# Clear all cache
FLUSHALL

# Exit Redis CLI
exit
```

### Health Check URLs
- Basic: http://localhost:5000/api/health
- Detailed: http://localhost:5000/api/health/detailed
- Metrics: http://localhost:5000/api/health/metrics
- Ready: http://localhost:5000/api/health/ready
- Live: http://localhost:5000/api/health/live

### Test Credentials
- **Admin**: admin@movensync.com / admin123
- **Test User**: testuser@movensync.com / test123456

---

**End of Testing Guide**
