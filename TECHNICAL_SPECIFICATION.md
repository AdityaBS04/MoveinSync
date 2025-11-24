# 🏢 Intelligent Floor Plan Management System - Technical Specification v1.0

**Project Name:** Movensync
**Document Version:** 1.0
**Last Updated:** 2025-11-22
**Author:** Technical Architecture Team

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [Database Design](#database-design)
5. [Core Modules](#core-modules)
6. [API Specifications](#api-specifications)
7. [Real-time Architecture](#real-time-architecture)
8. [Security & Authentication](#security-authentication)
9. [Performance & Scalability](#performance-scalability)
10. [Deployment Strategy](#deployment-strategy)
11. [Implementation Roadmap](#implementation-roadmap)

---

## 1. Executive Summary

### 1.1 Project Overview

**Movensync** is an enterprise-grade, real-time floor plan management and intelligent meeting room booking system designed for multi-building organizations. The system enables:

- **Collaborative floor plan editing** with real-time conflict resolution
- **Offline-first admin capabilities** with seamless synchronization
- **Intelligent meeting room recommendations** using multi-factor scoring
- **Complete audit trail** via event sourcing architecture
- **Real-time booking updates** across all connected clients

### 1.2 Key Requirements

| Requirement | Specification |
|------------|---------------|
| **Buildings** | 2 buildings |
| **Floors per Building** | 3 floors |
| **Rooms per Floor** | 10 rooms |
| **Total Rooms** | 60 rooms |
| **Concurrent Admins** | 2 editors |
| **Booking Buffer** | 2 hours between bookings |
| **Offline Capability** | Full editing support |
| **Version Control** | Complete event sourcing |
| **Real-time Sync** | Google Docs-style collaboration |

### 1.3 System Capabilities

✅ **Admin Features:**
- Drag-and-drop floor plan editor (room boundaries, capacity, features, seat positions)
- Real-time collaborative editing with live cursors
- Offline editing with intelligent conflict resolution
- Complete version history with rollback capability
- Visual conflict resolution interface

✅ **User Features:**
- Intelligent room recommendations (capacity, features, proximity, preferences)
- Multi-room simultaneous booking
- Recurring bookings support
- Real-time availability updates
- Booking cancellation with policy enforcement

✅ **System Features:**
- Hybrid database architecture (PostgreSQL + MongoDB)
- Full event sourcing for audit compliance
- Graph-based pathfinding for indoor navigation
- Service Worker + IndexedDB offline storage
- WebSocket-based real-time synchronization

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                 │
│                                                                      │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐ │
│  │   Admin Panel    │  │   User Portal    │  │  Mobile App      │ │
│  │  (React + Redux) │  │  (React + Redux) │  │  (React Native)  │ │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘ │
│           │                     │                     │            │
│           └─────────────────────┼─────────────────────┘            │
└───────────────────────────────┬─┴──────────────────────────────────┘
                                │
                    ┌───────────▼───────────┐
                    │   Service Worker      │
                    │   + IndexedDB         │
                    │   (Offline Support)   │
                    └───────────┬───────────┘
                                │
┌───────────────────────────────▼──────────────────────────────────────┐
│                      API GATEWAY LAYER                                │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  NGINX Reverse Proxy + Load Balancer                           │ │
│  │  - Rate Limiting (100 req/min per user)                        │ │
│  │  - SSL Termination                                             │ │
│  │  - Request Routing                                             │ │
│  └────────────┬───────────────────────────────┬───────────────────┘ │
└───────────────┼───────────────────────────────┼─────────────────────┘
                │                               │
        ┌───────▼────────┐              ┌──────▼──────┐
        │  REST API      │              │  WebSocket  │
        │  (Express.js)  │              │  (Socket.IO)│
        └───────┬────────┘              └──────┬──────┘
                │                               │
┌───────────────▼───────────────────────────────▼─────────────────────┐
│                    BUSINESS LOGIC LAYER                              │
│                      (Node.js + TypeScript)                          │
│                                                                      │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌────────────┐│
│  │  Floor Plan  │ │   Booking    │ │   Conflict   │ │  Pathfind  ││
│  │   Service    │ │   Service    │ │  Resolution  │ │  Service   ││
│  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘ └─────┬──────┘│
│         │                │                │               │        │
│  ┌──────▼───────┐ ┌──────▼───────┐ ┌──────▼───────┐ ┌────▼──────┐│
│  │  Event Store │ │    Room      │ │  Version     │ │   User    ││
│  │   Service    │ │  Optimizer   │ │  Control     │ │  Service  ││
│  └──────────────┘ └──────────────┘ └──────────────┘ └───────────┘│
└───────────────────────────────┬──────────────────────────────────────┘
                                │
                    ┌───────────▼───────────┐
                    │    CACHING LAYER      │
                    │    Redis Cluster      │
                    │  - Session Store      │
                    │  - Cache Manager      │
                    │  - Pub/Sub Queue      │
                    └───────────┬───────────┘
                                │
┌───────────────────────────────▼──────────────────────────────────────┐
│                    DATA PERSISTENCE LAYER                             │
│                                                                       │
│  ┌─────────────────────────┐        ┌──────────────────────────┐   │
│  │    PostgreSQL            │        │      MongoDB             │   │
│  │  (Relational Data)       │        │  (Document Store)        │   │
│  │                          │        │                          │   │
│  │  - Users                 │        │  - Floor Plans           │   │
│  │  - Bookings              │        │  - Event Store           │   │
│  │  - Rooms (metadata)      │        │  - Conflict Logs         │   │
│  │  - Buildings/Floors      │        │  - Offline Sync Queue    │   │
│  │  - Recurring Patterns    │        │  - Version Snapshots     │   │
│  └─────────────────────────┘        └──────────────────────────┘   │
└───────────────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow Architecture

#### **2.2.1 Real-time Collaborative Editing Flow**

```
Admin A                          Server                          Admin B
   │                               │                               │
   │─────(1) Edit Room────────────>│                               │
   │     {roomId, capacity: 10}    │                               │
   │                               │                               │
   │                               │──(2) Validate & Store────────>│
   │                               │     PostgreSQL Transaction    │
   │                               │                               │
   │                               │<─────(3) Commit Success───────│
   │                               │                               │
   │                               │──(4) Emit Event─────────────> │
   │<────(5) Broadcast Update──────│───────────────────────────────>│
   │     WebSocket                 │          WebSocket            │
   │                               │                               │
   │                               │──(6) Record Event────────────>│
   │                               │     MongoDB Event Store       │
   │                               │                               │
   │                               │──(7) Invalidate Cache───────> │
   │                               │     Redis DEL room:*          │
```

#### **2.2.2 Offline Sync with Conflict Resolution Flow**

```
Admin (Offline)                 IndexedDB                    Server
       │                            │                           │
       │──(1) Edit Floor Plan──────>│                           │
       │    Store in pending queue  │                           │
       │                            │                           │
       │──(2) Go Online─────────────┼───(3) Sync Request───────>│
       │                            │   {changes[], clientId}   │
       │                            │                           │
       │                            │<──(4) Server State────────│
       │                            │   {currentVersion}        │
       │                            │                           │
       │                            │                           │
       │                            │   (5) Detect Conflicts    │
       │                            │   ┌──────────────────┐    │
       │                            │   │ Three-Way Merge  │    │
       │                            │   │ - Base Version   │    │
       │                            │   │ - Client Changes │    │
       │                            │   │ - Server Changes │    │
       │                            │   └──────────────────┘    │
       │                            │                           │
       │                            │<──(6) Conflict Report─────│
       │<──(7) Show UI──────────────┤   {conflicts[], merged}   │
       │    Resolve manually        │                           │
       │                            │                           │
       │──(8) Resolution Choice────>│──(9) Apply & Sync────────>│
       │                            │                           │
       │                            │<──(10) Success────────────│
       │                            │                           │
       │──(11) Clear Queue──────────>│                           │
```

---

## 3. Technology Stack

### 3.1 Frontend Stack

| Component | Technology | Version | Justification |
|-----------|-----------|---------|---------------|
| **UI Framework** | React | 18.2+ | Component reusability, virtual DOM performance, extensive ecosystem |
| **State Management** | Redux Toolkit | 2.0+ | Predictable state for complex floor plans, time-travel debugging, DevTools |
| **UI Library** | Material-UI (MUI) | 5.14+ | Professional admin interface, accessibility (WCAG AA), responsive components |
| **Floor Plan Canvas** | Fabric.js | 5.3+ | Vector editing, object manipulation, layer management, export capabilities |
| **3D Visualization** | Konva.js | 9.2+ | High-performance 2D canvas, event handling, complex shapes |
| **Offline Storage** | IndexedDB + Dexie.js | 3.2+ | Large data storage (>50MB), structured queries, version management |
| **Service Worker** | Workbox | 7.0+ | Advanced caching strategies, background sync, offline reliability |
| **Real-time Client** | Socket.IO Client | 4.6+ | WebSocket with fallbacks, automatic reconnection, room-based events |
| **HTTP Client** | Axios | 1.6+ | Interceptors for auth/retry, request cancellation, timeout handling |
| **Forms** | React Hook Form | 7.48+ | Minimal re-renders, built-in validation, TypeScript support |
| **Validation** | Yup | 1.3+ | Schema-based validation, complex conditional rules |
| **Date Handling** | Day.js | 1.11+ | Lightweight (2KB), immutable, timezone support |
| **Maps/Pathfinding** | Leaflet.js | 1.9+ | Indoor mapping, custom overlays, marker clustering |
| **Graph Algorithms** | graphlib | 2.1+ | Dijkstra's shortest path, graph traversal for indoor navigation |
| **TypeScript** | TypeScript | 5.3+ | Type safety, IntelliSense, refactoring support |

### 3.2 Backend Stack

| Component | Technology | Version | Justification |
|-----------|-----------|---------|---------------|
| **Runtime** | Node.js | 20 LTS | Non-blocking I/O, JavaScript across stack, native async/await |
| **Framework** | Express.js | 4.18+ | Middleware ecosystem, routing flexibility, production-proven |
| **Language** | TypeScript | 5.3+ | Type safety, interfaces for API contracts, better maintainability |
| **Real-time** | Socket.IO | 4.6+ | WebSocket with HTTP long-polling fallback, namespace isolation |
| **Auth** | Passport.js + JWT | 6.0+ / 9.0+ | Strategy-based auth, stateless tokens, role-based access control |
| **Validation** | Joi | 17.11+ | Schema validation, custom validators, detailed error messages |
| **ORM (PostgreSQL)** | Prisma | 5.7+ | Type-safe queries, migrations, relation management |
| **ODM (MongoDB)** | Mongoose | 8.0+ | Schema validation, middleware hooks, population |
| **Task Queue** | Bull | 4.12+ | Redis-backed jobs, retry logic, delayed processing |
| **Logging** | Winston | 3.11+ | Multiple transports, log levels, structured logging |
| **Monitoring** | Prom-client | 15.1+ | Prometheus metrics, custom collectors, histograms |
| **Testing** | Jest + Supertest | 29.7+ / 6.3+ | Unit/integration tests, mocking, coverage reports |

### 3.3 Database Stack

| Component | Technology | Version | Justification |
|-----------|-----------|---------|---------------|
| **Relational DB** | PostgreSQL | 16+ | ACID transactions, strong consistency for bookings, JSON support |
| **Document DB** | MongoDB | 7.0+ | Flexible schema for floor plans, event sourcing, hierarchical data |
| **Cache** | Redis | 7.2+ | Sub-millisecond latency, pub/sub for real-time, session storage |
| **Search** | PostgreSQL Full-Text | Built-in | Simpler than Elasticsearch for 60 rooms, pg_trgm for fuzzy search |

### 3.4 DevOps & Infrastructure

| Component | Technology | Version | Justification |
|-----------|-----------|---------|---------------|
| **Containerization** | Docker | 24+ | Consistent environments, easy deployment |
| **Orchestration** | Docker Compose | 2.23+ | Multi-container apps, development parity |
| **Reverse Proxy** | NGINX | 1.25+ | Load balancing, SSL termination, static file serving |
| **Process Manager** | PM2 | 5.3+ | Zero-downtime reload, cluster mode, monitoring |
| **CI/CD** | GitHub Actions | - | Automated testing, build, deployment pipeline |
| **Monitoring** | Prometheus + Grafana | 2.48+ / 10.2+ | Metrics collection, visualization dashboards |
| **Log Aggregation** | Winston + File Rotation | 3.11+ | Centralized logs, automatic cleanup |
| **Error Tracking** | Sentry | 7.91+ | Exception monitoring, performance tracking, user context |

---

## 4. Database Design

### 4.1 Hybrid Architecture Strategy

**PostgreSQL:** Handles transactional, relational data requiring ACID guarantees
**MongoDB:** Stores hierarchical, versioned, and event-sourced data

#### **Why Hybrid?**

| Use Case | PostgreSQL ✅ | MongoDB ✅ |
|----------|---------------|------------|
| User authentication | Strong consistency, relational integrity | - |
| Booking transactions | ACID compliance, concurrent booking conflicts | - |
| Room relationships | Foreign keys (building → floor → room) | - |
| Recurring bookings | Complex date queries, timezone handling | - |
| Floor plan layouts | - | Flexible schema (nested objects, arrays) |
| Event sourcing | - | High write throughput, immutable events |
| Version history | - | Document versioning, no schema migrations |
| Offline sync queue | - | Temporary storage, TTL indexes |

### 4.2 PostgreSQL Schema

```sql
-- ============================================
-- BUILDINGS & INFRASTRUCTURE
-- ============================================

CREATE TABLE buildings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    address TEXT,
    total_floors INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_buildings_name ON buildings(name);

-- ============================================

CREATE TABLE floors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    building_id UUID REFERENCES buildings(id) ON DELETE CASCADE,
    floor_number INT NOT NULL,
    name VARCHAR(100),
    total_rooms INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(building_id, floor_number)
);

CREATE INDEX idx_floors_building ON floors(building_id);

-- ============================================
-- ROOMS (Metadata Only - Layouts in MongoDB)
-- ============================================

CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    floor_id UUID REFERENCES floors(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    room_number VARCHAR(50),
    capacity INT NOT NULL CHECK (capacity > 0),
    room_type VARCHAR(50) DEFAULT 'meeting', -- meeting, conference, huddle, phone_booth
    features TEXT[], -- {projector, whiteboard, video_conf, tv}
    status VARCHAR(20) DEFAULT 'active', -- active, maintenance, blocked

    -- Graph-based pathfinding data
    graph_node_id VARCHAR(50), -- Links to floor plan graph

    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    version INT DEFAULT 1,

    UNIQUE(floor_id, room_number)
);

CREATE INDEX idx_rooms_floor ON rooms(floor_id);
CREATE INDEX idx_rooms_status ON rooms(status);
CREATE INDEX idx_rooms_capacity ON rooms(capacity);
CREATE INDEX idx_rooms_features ON rooms USING GIN(features);

-- ============================================
-- USERS & AUTHENTICATION
-- ============================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(200),
    role VARCHAR(20) DEFAULT 'user', -- admin, user
    department VARCHAR(100),
    preferences JSONB DEFAULT '{}', -- {favorite_rooms: [], preferred_floor: 2}

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- ============================================
-- BOOKINGS
-- ============================================

CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,

    -- Time slots
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,

    -- Booking details
    title VARCHAR(200) NOT NULL,
    description TEXT,
    participant_count INT,

    -- Recurring bookings
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_pattern_id UUID REFERENCES recurrence_patterns(id),
    parent_booking_id UUID REFERENCES bookings(id), -- Links to parent series

    -- Status
    status VARCHAR(20) DEFAULT 'confirmed', -- confirmed, cancelled, completed
    cancellation_reason TEXT,
    cancelled_at TIMESTAMP,
    cancelled_by UUID REFERENCES users(id),

    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    -- Constraints
    CHECK (end_time > start_time),
    CHECK (participant_count <= (SELECT capacity FROM rooms WHERE id = room_id))
);

CREATE INDEX idx_bookings_room_time ON bookings(room_id, start_time, end_time);
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_start_time ON bookings(start_time);

-- Prevent double-booking with exclusion constraint
CREATE EXTENSION IF NOT EXISTS btree_gist;
ALTER TABLE bookings ADD CONSTRAINT no_double_booking
EXCLUDE USING GIST (
    room_id WITH =,
    tsrange(start_time, end_time) WITH &&
) WHERE (status = 'confirmed');

-- ============================================
-- RECURRING BOOKING PATTERNS
-- ============================================

CREATE TABLE recurrence_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    frequency VARCHAR(20) NOT NULL, -- daily, weekly, monthly
    interval INT DEFAULT 1, -- Every N days/weeks/months
    days_of_week INT[], -- [1,2,3,4,5] for weekdays
    end_date DATE,
    max_occurrences INT,

    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- BOOKING BUFFER MANAGEMENT (2-hour cleanup)
-- ============================================

CREATE TABLE booking_buffers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    buffer_start TIMESTAMP NOT NULL,
    buffer_end TIMESTAMP NOT NULL,
    buffer_type VARCHAR(20) DEFAULT 'cleaning', -- cleaning, setup, maintenance

    created_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(room_id, buffer_start)
);

CREATE INDEX idx_buffers_room_time ON booking_buffers(room_id, buffer_start, buffer_end);

-- ============================================
-- USER BOOKING PREFERENCES (for recommendations)
-- ============================================

CREATE TABLE user_room_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    booking_count INT DEFAULT 1,
    last_booked_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(user_id, room_id)
);

CREATE INDEX idx_history_user ON user_room_history(user_id);

-- ============================================
-- AUDIT TRAIL (Relational Events)
-- ============================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(50) NOT NULL, -- CREATE_BOOKING, CANCEL_BOOKING, EDIT_ROOM
    entity_type VARCHAR(50) NOT NULL, -- booking, room, floor_plan
    entity_id UUID NOT NULL,
    changes JSONB, -- {old: {...}, new: {...}}
    ip_address INET,
    user_agent TEXT,

    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);
```

### 4.3 MongoDB Schema

```javascript
// ============================================
// FLOOR PLAN DOCUMENTS
// ============================================

db.createCollection("floorPlans", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["floorId", "layout", "version"],
      properties: {
        _id: { bsonType: "objectId" },
        floorId: { bsonType: "string" }, // UUID from PostgreSQL floors table

        // Canvas layout data
        layout: {
          bsonType: "object",
          properties: {
            canvas: {
              bsonType: "object",
              properties: {
                width: { bsonType: "int" },
                height: { bsonType: "int" },
                backgroundImage: { bsonType: "string" }
              }
            },
            rooms: {
              bsonType: "array",
              items: {
                bsonType: "object",
                properties: {
                  roomId: { bsonType: "string" }, // UUID from PostgreSQL rooms
                  shape: { enum: ["rectangle", "circle", "polygon"] },
                  coordinates: {
                    bsonType: "object",
                    properties: {
                      x: { bsonType: "int" },
                      y: { bsonType: "int" },
                      width: { bsonType: "int" },
                      height: { bsonType: "int" },
                      vertices: { bsonType: "array" } // For polygons
                    }
                  },
                  rotation: { bsonType: "double" },
                  fill: { bsonType: "string" },
                  stroke: { bsonType: "string" }
                }
              }
            },
            seats: {
              bsonType: "array",
              items: {
                bsonType: "object",
                properties: {
                  seatId: { bsonType: "string" },
                  roomId: { bsonType: "string" },
                  x: { bsonType: "int" },
                  y: { bsonType: "int" },
                  rotation: { bsonType: "double" }
                }
              }
            },
            walls: { bsonType: "array" },
            doors: { bsonType: "array" },
            windows: { bsonType: "array" }
          }
        },

        // Graph for pathfinding
        navigationGraph: {
          bsonType: "object",
          properties: {
            nodes: {
              bsonType: "array",
              items: {
                bsonType: "object",
                properties: {
                  id: { bsonType: "string" },
                  x: { bsonType: "int" },
                  y: { bsonType: "int" },
                  type: { enum: ["room", "hallway", "entrance", "elevator", "stairs"] }
                }
              }
            },
            edges: {
              bsonType: "array",
              items: {
                bsonType: "object",
                properties: {
                  from: { bsonType: "string" },
                  to: { bsonType: "string" },
                  weight: { bsonType: "double" }, // Distance in pixels
                  accessible: { bsonType: "bool" }
                }
              }
            }
          }
        },

        // Version control
        version: { bsonType: "int" },
        baseVersion: { bsonType: "int" }, // For three-way merge

        // Metadata
        lastModifiedBy: { bsonType: "string" }, // User ID
        lastModifiedAt: { bsonType: "date" },
        createdAt: { bsonType: "date" },

        // Checksums for integrity
        checksum: { bsonType: "string" }
      }
    }
  }
});

db.floorPlans.createIndex({ "floorId": 1 }, { unique: true });
db.floorPlans.createIndex({ "version": -1 });
db.floorPlans.createIndex({ "lastModifiedAt": -1 });

// ============================================
// EVENT STORE (Immutable Audit Trail)
// ============================================

db.createCollection("events", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["aggregateId", "eventType", "data", "version", "timestamp"],
      properties: {
        _id: { bsonType: "objectId" },

        // Event identification
        aggregateId: { bsonType: "string" }, // Floor plan ID or booking ID
        aggregateType: { enum: ["floor_plan", "booking", "room"] },
        eventType: {
          enum: [
            "FLOOR_PLAN_CREATED",
            "ROOM_ADDED",
            "ROOM_MODIFIED",
            "ROOM_DELETED",
            "SEAT_ADDED",
            "SEAT_MOVED",
            "BOOKING_CREATED",
            "BOOKING_CANCELLED"
          ]
        },

        // Event data
        data: { bsonType: "object" },

        // Causality
        version: { bsonType: "long" }, // Aggregate version number
        causationId: { bsonType: "string" }, // Command ID that caused this event
        correlationId: { bsonType: "string" }, // Session/request ID

        // Metadata
        userId: { bsonType: "string" },
        timestamp: { bsonType: "date" },
        clientId: { bsonType: "string" }, // For offline sync tracking

        // Integrity
        checksum: { bsonType: "string" }, // SHA-256 of data
        previousChecksum: { bsonType: "string" } // Hash chain
      }
    }
  }
});

db.events.createIndex({ "aggregateId": 1, "version": 1 }, { unique: true });
db.events.createIndex({ "timestamp": -1 });
db.events.createIndex({ "userId": 1 });
db.events.createIndex({ "eventType": 1 });

// ============================================
// CONFLICT RESOLUTION QUEUE
// ============================================

db.createCollection("conflicts", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["floorPlanId", "conflictType", "baseVersion", "serverChanges", "clientChanges"],
      properties: {
        _id: { bsonType: "objectId" },

        floorPlanId: { bsonType: "string" },
        conflictType: {
          enum: ["CONCURRENT_EDIT", "OFFLINE_SYNC", "VERSION_MISMATCH"]
        },

        // Three-way merge data
        baseVersion: { bsonType: "object" }, // Common ancestor
        serverChanges: { bsonType: "object" },
        clientChanges: { bsonType: "object" },

        // Conflict details
        conflictingFields: { bsonType: "array" }, // ["rooms.0.capacity", "seats.5.x"]

        // Resolution
        status: { enum: ["PENDING", "RESOLVED", "REJECTED"] },
        resolution: { bsonType: "object" },
        resolvedBy: { bsonType: "string" },
        resolvedAt: { bsonType: "date" },
        resolutionStrategy: {
          enum: ["TIMESTAMP_PRIORITY", "ROLE_PRIORITY", "MANUAL_MERGE", "AUTO_MERGE"]
        },

        // Metadata
        createdAt: { bsonType: "date" },
        expiresAt: { bsonType: "date" } // Auto-delete after 7 days
      }
    }
  }
});

db.conflicts.createIndex({ "floorPlanId": 1 });
db.conflicts.createIndex({ "status": 1 });
db.conflicts.createIndex({ "expiresAt": 1 }, { expireAfterSeconds: 0 }); // TTL index

// ============================================
// OFFLINE SYNC QUEUE
// ============================================

db.createCollection("offlineQueue", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["clientId", "changes", "status"],
      properties: {
        _id: { bsonType: "objectId" },

        clientId: { bsonType: "string" }, // Device/browser identifier
        userId: { bsonType: "string" },

        changes: {
          bsonType: "array",
          items: {
            bsonType: "object",
            properties: {
              changeId: { bsonType: "string" },
              entityType: { enum: ["floor_plan", "room", "seat"] },
              entityId: { bsonType: "string" },
              operation: { enum: ["CREATE", "UPDATE", "DELETE"] },
              data: { bsonType: "object" },
              timestamp: { bsonType: "date" },
              baseVersion: { bsonType: "int" }
            }
          }
        },

        status: { enum: ["PENDING", "SYNCING", "SYNCED", "FAILED"] },
        retryCount: { bsonType: "int", minimum: 0 },
        lastError: { bsonType: "string" },

        createdAt: { bsonType: "date" },
        syncedAt: { bsonType: "date" },
        expiresAt: { bsonType: "date" }
      }
    }
  }
});

db.offlineQueue.createIndex({ "clientId": 1, "status": 1 });
db.offlineQueue.createIndex({ "expiresAt": 1 }, { expireAfterSeconds: 0 });

// ============================================
// VERSION SNAPSHOTS (Performance Optimization)
// ============================================

db.createCollection("versionSnapshots", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["aggregateId", "version", "snapshot"],
      properties: {
        _id: { bsonType: "objectId" },

        aggregateId: { bsonType: "string" },
        aggregateType: { enum: ["floor_plan", "booking"] },
        version: { bsonType: "long" },

        snapshot: { bsonType: "object" }, // Full state at this version

        createdAt: { bsonType: "date" }
      }
    }
  }
});

db.versionSnapshots.createIndex({ "aggregateId": 1, "version": -1 });
// Create snapshot every 10 versions to speed up event replay
```

### 4.4 Redis Schema

```javascript
// ============================================
// CACHE KEYS (Key Patterns & TTLs)
// ============================================

// Room availability cache
// Key: room:<roomId>:availability:<date>
// Value: JSON array of time slots
// TTL: 300s (5 minutes)
{
  "available": [
    {"start": "2025-11-22T09:00:00Z", "end": "2025-11-22T10:00:00Z"},
    {"start": "2025-11-22T11:00:00Z", "end": "2025-11-22T13:00:00Z"}
  ],
  "booked": [...]
}

// Room details cache
// Key: room:<roomId>:details
// Value: JSON object
// TTL: 3600s (1 hour)
{
  "id": "uuid",
  "name": "Conference Room A",
  "capacity": 10,
  "features": ["projector", "whiteboard"],
  "floorId": "uuid"
}

// User room recommendations
// Key: recommendations:<userId>:<timestamp>
// Value: Sorted set (score = recommendation score)
// TTL: 600s (10 minutes)
ZADD recommendations:user123:2025-11-22 95 room-uuid-1
ZADD recommendations:user123:2025-11-22 87 room-uuid-2

// Conflict locks (pessimistic locking)
// Key: lock:floor_plan:<floorId>
// Value: {"userId": "admin1", "timestamp": 1732310400000}
// TTL: 30s (auto-release)
SET lock:floor_plan:uuid "{...}" EX 30 NX

// Session storage
// Key: session:<sessionId>
// Value: JSON object
// TTL: 86400s (24 hours)
{
  "userId": "uuid",
  "role": "admin",
  "loginAt": "2025-11-22T08:00:00Z"
}

// Active users (real-time presence)
// Key: presence:floor:<floorId>
// Value: Set of user IDs
// TTL: 300s (refresh on activity)
SADD presence:floor:uuid user123
EXPIRE presence:floor:uuid 300

// Booking conflict detection
// Key: booking:check:<roomId>:<date>
// Value: Sorted set (score = start timestamp)
// TTL: 86400s (refresh daily)
ZADD booking:check:room123:2025-11-22 1732262400 "booking-uuid-1"

// ============================================
// PUB/SUB CHANNELS
// ============================================

// Real-time floor plan updates
// Channel: floor_plan:<floorId>:updates
PUBLISH floor_plan:uuid:updates '{"type":"ROOM_MODIFIED","roomId":"...","data":{...}}'

// Booking notifications
// Channel: bookings:<userId>
PUBLISH bookings:user123 '{"type":"BOOKING_CONFIRMED","bookingId":"...","room":{...}}'

// Conflict alerts
// Channel: conflicts:<floorId>
PUBLISH conflicts:uuid '{"type":"CONFLICT_DETECTED","conflictId":"...","admins":["admin1","admin2"]}'

// System events
// Channel: system:events
PUBLISH system:events '{"type":"CACHE_CLEARED","affectedKeys":["room:*"]}'
```

---

## 5. Core Modules

### 5.1 Module Architecture

```
src/
├── modules/
│   ├── floorPlan/
│   │   ├── controllers/
│   │   │   ├── FloorPlanController.ts          # HTTP endpoints
│   │   │   └── FloorPlanSocketController.ts    # WebSocket handlers
│   │   ├── services/
│   │   │   ├── FloorPlanService.ts             # Business logic
│   │   │   ├── ConflictResolver.ts             # Three-way merge
│   │   │   ├── VersionControl.ts               # Event sourcing
│   │   │   └── OfflineSync.ts                  # Sync orchestration
│   │   ├── repositories/
│   │   │   ├── FloorPlanRepository.ts          # MongoDB operations
│   │   │   └── EventStoreRepository.ts         # Event persistence
│   │   ├── models/
│   │   │   ├── FloorPlan.ts                    # TypeScript interfaces
│   │   │   ├── Room.ts
│   │   │   └── Seat.ts
│   │   ├── validators/
│   │   │   └── floorPlanSchema.ts              # Joi validation
│   │   └── __tests__/
│   │       └── floorPlan.test.ts
│   │
│   ├── booking/
│   │   ├── controllers/
│   │   │   ├── BookingController.ts
│   │   │   └── RecurringBookingController.ts
│   │   ├── services/
│   │   │   ├── BookingService.ts
│   │   │   ├── RoomOptimizer.ts                # Recommendation engine
│   │   │   ├── BufferManager.ts                # 2-hour cleanup scheduling
│   │   │   └── RecurrenceService.ts            # Recurring booking logic
│   │   ├── repositories/
│   │   │   ├── BookingRepository.ts            # PostgreSQL operations
│   │   │   └── RecurrenceRepository.ts
│   │   ├── models/
│   │   │   └── Booking.ts
│   │   └── __tests__/
│   │
│   ├── pathfinding/
│   │   ├── services/
│   │   │   ├── PathfindingService.ts           # Dijkstra's algorithm
│   │   │   ├── GraphBuilder.ts                 # Build navigation graph
│   │   │   └── DistanceCalculator.ts           # Pixel-based distance
│   │   ├── models/
│   │   │   └── NavigationGraph.ts
│   │   └── __tests__/
│   │
│   ├── auth/
│   │   ├── controllers/
│   │   │   └── AuthController.ts
│   │   ├── services/
│   │   │   ├── AuthService.ts
│   │   │   └── JWTService.ts
│   │   ├── middleware/
│   │   │   ├── authenticate.ts
│   │   │   └── authorize.ts
│   │   └── strategies/
│   │       └── jwt.strategy.ts
│   │
│   └── realtime/
│       ├── handlers/
│       │   ├── FloorPlanHandler.ts             # Socket.IO floor plan events
│       │   ├── BookingHandler.ts               # Socket.IO booking events
│       │   └── PresenceHandler.ts              # User presence tracking
│       └── middleware/
│           └── socketAuth.ts
│
├── shared/
│   ├── database/
│   │   ├── postgresql.ts                       # Prisma client
│   │   ├── mongodb.ts                          # Mongoose connection
│   │   └── redis.ts                            # Redis client
│   ├── cache/
│   │   └── CacheManager.ts                     # Cache abstraction
│   ├── errors/
│   │   ├── AppError.ts
│   │   └── errorHandler.ts
│   ├── logger/
│   │   └── winston.ts
│   ├── monitoring/
│   │   └── prometheus.ts
│   └── utils/
│       ├── retry.ts
│       ├── hash.ts
│       └── validators.ts
│
├── config/
│   ├── index.ts
│   ├── database.ts
│   ├── redis.ts
│   └── jwt.ts
│
└── app.ts                                      # Express app setup
```

### 5.2 Module Details

#### **5.2.1 Floor Plan Management Module**

**Responsibilities:**
- Drag-and-drop floor plan editing (rooms, seats, walls, doors)
- Real-time collaborative editing with operational transformation
- Conflict detection and resolution (three-way merge)
- Version control via event sourcing
- Offline editing with IndexedDB sync
- Export floor plans (PNG, SVG, PDF)

**Key Classes:**

```typescript
// services/FloorPlanService.ts

export class FloorPlanService {
  async createFloorPlan(floorId: string, layout: Layout, userId: string): Promise<FloorPlan>
  async updateFloorPlan(floorPlanId: string, changes: Partial<Layout>, userId: string): Promise<FloorPlan>
  async getFloorPlan(floorPlanId: string): Promise<FloorPlan>
  async getFloorPlanHistory(floorPlanId: string, limit: number): Promise<Event[]>
  async rollbackToVersion(floorPlanId: string, version: number): Promise<FloorPlan>
  async deleteFloorPlan(floorPlanId: string, userId: string): Promise<void>
}

// services/ConflictResolver.ts

export class ConflictResolver {
  async detectConflicts(base: FloorPlan, current: FloorPlan, incoming: FloorPlan): Promise<Conflict[]>
  async resolveConflict(conflict: Conflict, strategy: ResolutionStrategy, userId: string): Promise<ResolvedChange>
  async autoMerge(base: FloorPlan, current: FloorPlan, incoming: FloorPlan): Promise<MergedPlan>
  private hasConflictingDependencies(conflict: Conflict): boolean
  private applyResolution(floorPlan: FloorPlan, resolution: ResolvedChange): FloorPlan
}

// services/VersionControl.ts

export class VersionControl {
  async recordEvent(event: Event): Promise<void>
  async getEvents(aggregateId: string, fromVersion?: number): Promise<Event[]>
  async replayEvents(aggregateId: string, toVersion: number): Promise<FloorPlan>
  async createSnapshot(aggregateId: string, version: number): Promise<void>
  private updateMaterializedView(event: Event): Promise<void>
  private generateChecksum(data: any): string
}

// services/OfflineSync.ts

export class OfflineSync {
  async queueChanges(changes: Change[], clientId: string): Promise<void>
  async syncWithServer(clientId: string): Promise<SyncResult>
  async applyServerChanges(clientId: string, serverState: FloorPlan): Promise<void>
  async getPendingChanges(clientId: string): Promise<Change[]>
  private detectConflictsInQueue(clientChanges: Change[], serverState: FloorPlan): Promise<Conflict[]>
}
```

**Event Types:**

```typescript
enum FloorPlanEventType {
  FLOOR_PLAN_CREATED = 'FLOOR_PLAN_CREATED',
  ROOM_ADDED = 'ROOM_ADDED',
  ROOM_MODIFIED = 'ROOM_MODIFIED',
  ROOM_DELETED = 'ROOM_DELETED',
  ROOM_MOVED = 'ROOM_MOVED',
  SEAT_ADDED = 'SEAT_ADDED',
  SEAT_MOVED = 'SEAT_MOVED',
  SEAT_DELETED = 'SEAT_DELETED',
  WALL_ADDED = 'WALL_ADDED',
  DOOR_ADDED = 'DOOR_ADDED',
  NAVIGATION_GRAPH_UPDATED = 'NAVIGATION_GRAPH_UPDATED'
}
```

#### **5.2.2 Booking & Optimization Module**

**Responsibilities:**
- Intelligent room recommendations (multi-factor scoring)
- Booking creation with double-booking prevention
- Recurring bookings support
- 2-hour buffer management
- Real-time availability updates
- Cancellation policy enforcement

**Key Classes:**

```typescript
// services/BookingService.ts

export class BookingService {
  async createBooking(request: BookingRequest, userId: string): Promise<Booking>
  async createRecurringBooking(request: RecurringBookingRequest, userId: string): Promise<Booking[]>
  async cancelBooking(bookingId: string, reason: string, userId: string): Promise<void>
  async getBookings(userId: string, filters: BookingFilters): Promise<Booking[]>
  async checkAvailability(roomId: string, timeSlot: TimeSlot): Promise<boolean>
  private createBufferSlots(booking: Booking): Promise<BookingBuffer[]>
  private validateBookingRules(request: BookingRequest): Promise<void>
}

// services/RoomOptimizer.ts

export class RoomOptimizer {
  async getRecommendedRooms(criteria: BookingCriteria, userId: string): Promise<RoomScore[]>
  private calculateRoomScore(room: Room, criteria: BookingCriteria, userId: string): Promise<RoomScore>
  private calculateCapacityScore(room: Room, participantCount: number): number
  private calculateProximityScore(room: Room, preferredLocation: Point): number
  private calculateAvailabilityScore(room: Room, timeSlot: TimeSlot): Promise<number>
  private calculateFeatureMatchScore(room: Room, requiredFeatures: string[]): number
  private calculateUserPreferenceScore(room: Room, userId: string): Promise<number>
}

// services/RecurrenceService.ts

export class RecurrenceService {
  async generateRecurrenceSchedule(pattern: RecurrencePattern, startDate: Date): Promise<Date[]>
  async updateRecurringSeries(parentBookingId: string, updates: Partial<Booking>): Promise<void>
  async cancelRecurringSeries(parentBookingId: string, fromDate?: Date): Promise<void>
  private calculateNextOccurrence(pattern: RecurrencePattern, currentDate: Date): Date | null
}

// services/BufferManager.ts

export class BufferManager {
  async createBuffer(roomId: string, afterBooking: Booking): Promise<BookingBuffer>
  async clearExpiredBuffers(): Promise<void> // Cron job
  async getActiveBuffers(roomId: string): Promise<BookingBuffer[]>
}
```

**Recommendation Scoring Algorithm:**

```typescript
interface RoomScore {
  roomId: string;
  score: number; // 0-100
  breakdown: {
    capacityScore: number;      // Weight: 0.30
    proximityScore: number;     // Weight: 0.20
    availabilityScore: number;  // Weight: 0.25
    featureScore: number;       // Weight: 0.15
    userPreferenceScore: number;// Weight: 0.10
  };
}

// Scoring formula:
// FinalScore = (capacity * 0.30) + (proximity * 0.20) + (availability * 0.25) +
//              (features * 0.15) + (userPref * 0.10)

// Example:
// Room A: capacity=90, proximity=85, availability=100, features=100, userPref=80
// Score = (90*0.30) + (85*0.20) + (100*0.25) + (100*0.15) + (80*0.10) = 91.0
```

#### **5.2.3 Pathfinding Module**

**Responsibilities:**
- Build navigation graph from floor plan layout
- Calculate shortest path between rooms (Dijkstra's algorithm)
- Provide walking distance estimates
- Support accessibility constraints

**Key Classes:**

```typescript
// services/PathfindingService.ts

export class PathfindingService {
  async findShortestPath(fromRoomId: string, toRoomId: string): Promise<Path>
  async calculateDistance(fromRoomId: string, toRoomId: string): Promise<number> // pixels
  async getAccessiblePath(fromRoomId: string, toRoomId: string): Promise<Path>
  private dijkstra(graph: NavigationGraph, startNode: string, endNode: string): Path
}

// services/GraphBuilder.ts

export class GraphBuilder {
  async buildNavigationGraph(floorPlanId: string): Promise<NavigationGraph>
  async updateGraph(floorPlanId: string, changes: Partial<Layout>): Promise<void>
  private extractNodes(layout: Layout): GraphNode[]
  private extractEdges(layout: Layout, nodes: GraphNode[]): GraphEdge[]
  private calculateEdgeWeight(from: GraphNode, to: GraphNode): number // Euclidean distance
}

// services/DistanceCalculator.ts

export class DistanceCalculator {
  calculatePixelDistance(point1: Point, point2: Point): number
  calculateWalkingDistance(path: Path): number
  estimateWalkingTime(distance: number): number // assuming 1.4 m/s walking speed
}
```

**Graph Structure:**

```typescript
interface NavigationGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

interface GraphNode {
  id: string;
  x: number;
  y: number;
  type: 'room' | 'hallway' | 'entrance' | 'elevator' | 'stairs';
  accessible: boolean; // For wheelchair accessibility
}

interface GraphEdge {
  from: string;
  to: string;
  weight: number; // Distance in pixels
  accessible: boolean;
}

interface Path {
  nodes: string[];
  totalDistance: number;
  estimatedTime: number; // seconds
}
```

#### **5.2.4 Real-time Collaboration Module**

**Responsibilities:**
- WebSocket connection management
- Real-time floor plan updates broadcast
- User presence tracking (who's editing what)
- Optimistic UI updates with rollback

**Key Classes:**

```typescript
// handlers/FloorPlanHandler.ts

export class FloorPlanHandler {
  async onConnect(socket: Socket): Promise<void>
  async onDisconnect(socket: Socket): Promise<void>
  async onJoinFloorPlan(socket: Socket, floorPlanId: string): Promise<void>
  async onLeaveFloorPlan(socket: Socket, floorPlanId: string): Promise<void>
  async onFloorPlanEdit(socket: Socket, change: Change): Promise<void>
  async onCursorMove(socket: Socket, position: Point): Promise<void>
  private broadcastToFloorPlan(floorPlanId: string, event: string, data: any): void
}

// handlers/PresenceHandler.ts

export class PresenceHandler {
  async trackUserPresence(userId: string, floorPlanId: string): Promise<void>
  async removeUserPresence(userId: string, floorPlanId: string): Promise<void>
  async getActiveUsers(floorPlanId: string): Promise<User[]>
  private heartbeat(userId: string, floorPlanId: string): Promise<void> // Every 30s
}
```

**WebSocket Events:**

```typescript
// Client → Server
socket.emit('floor_plan:join', { floorPlanId: 'uuid' });
socket.emit('floor_plan:edit', {
  floorPlanId: 'uuid',
  change: { type: 'ROOM_MODIFIED', roomId: 'uuid', data: {...} }
});
socket.emit('cursor:move', { x: 100, y: 200 });

// Server → Client
socket.on('floor_plan:update', (data) => { /* Update local state */ });
socket.on('floor_plan:conflict', (conflict) => { /* Show conflict UI */ });
socket.on('user:joined', (user) => { /* Show user cursor */ });
socket.on('user:left', (userId) => { /* Remove user cursor */ });
socket.on('cursor:update', ({ userId, x, y }) => { /* Move cursor */ });
```

#### **5.2.5 Authentication & Authorization Module**

**Responsibilities:**
- JWT-based authentication
- Role-based access control (admin vs user)
- Session management
- Password hashing (bcrypt)

**Key Classes:**

```typescript
// services/AuthService.ts

export class AuthService {
  async register(email: string, password: string, role: string): Promise<User>
  async login(email: string, password: string): Promise<{ token: string; user: User }>
  async verifyToken(token: string): Promise<User>
  async logout(userId: string): Promise<void>
  private hashPassword(password: string): Promise<string>
  private comparePassword(password: string, hash: string): Promise<boolean>
}

// middleware/authenticate.ts

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) throw new UnauthorizedError();

  const user = await authService.verifyToken(token);
  req.user = user;
  next();
}

// middleware/authorize.ts

export function authorize(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new ForbiddenError();
    }
    next();
  };
}
```

**Access Control Matrix:**

| Resource | Admin | User |
|----------|-------|------|
| Create/Edit Floor Plans | ✅ | ❌ |
| View Floor Plans | ✅ | ✅ |
| Create Bookings | ✅ | ✅ |
| Cancel Own Bookings | ✅ | ✅ |
| Cancel Any Booking | ✅ | ❌ |
| View All Bookings | ✅ | Own only |
| Manage Users | ✅ | ❌ |

---

## 6. API Specifications

### 6.1 REST API Endpoints

**Base URL:** `https://api.movensync.com/v1`

#### **6.1.1 Authentication**

```http
POST /auth/register
POST /auth/login
POST /auth/logout
POST /auth/refresh
GET  /auth/me
```

**Example:**

```http
POST /auth/login
Content-Type: application/json

{
  "email": "admin@company.com",
  "password": "SecurePass123!"
}

Response 200:
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "admin@company.com",
    "role": "admin",
    "fullName": "John Doe"
  }
}
```

#### **6.1.2 Buildings & Floors**

```http
GET    /buildings
GET    /buildings/:id
POST   /buildings
PUT    /buildings/:id
DELETE /buildings/:id

GET    /buildings/:buildingId/floors
GET    /floors/:id
POST   /floors
PUT    /floors/:id
DELETE /floors/:id
```

#### **6.1.3 Rooms**

```http
GET    /rooms
GET    /rooms/:id
POST   /rooms
PUT    /rooms/:id
DELETE /rooms/:id
GET    /rooms/:id/availability?date=2025-11-22
GET    /rooms/search?capacity=10&features=projector,whiteboard
```

**Example:**

```http
GET /rooms/search?capacity=10&features=projector&floor=2

Response 200:
{
  "rooms": [
    {
      "id": "uuid",
      "name": "Conference Room A",
      "capacity": 12,
      "features": ["projector", "whiteboard", "video_conf"],
      "floorId": "uuid",
      "floorNumber": 2,
      "buildingName": "HQ Building"
    }
  ],
  "total": 1
}
```

#### **6.1.4 Floor Plans**

```http
GET    /floor-plans/:floorId
POST   /floor-plans
PUT    /floor-plans/:id
DELETE /floor-plans/:id
GET    /floor-plans/:id/history?limit=50
POST   /floor-plans/:id/rollback
POST   /floor-plans/sync
GET    /floor-plans/:id/export?format=png|svg|pdf
```

**Example: Sync Offline Changes**

```http
POST /floor-plans/sync
Content-Type: application/json
Authorization: Bearer <token>

{
  "clientId": "browser-fingerprint-123",
  "changes": [
    {
      "changeId": "change-1",
      "entityType": "room",
      "entityId": "room-uuid",
      "operation": "UPDATE",
      "data": { "capacity": 12 },
      "timestamp": "2025-11-22T10:30:00Z",
      "baseVersion": 42
    }
  ]
}

Response 200:
{
  "synced": true,
  "results": [
    { "changeId": "change-1", "success": true, "version": 43 }
  ],
  "conflicts": [],
  "serverCorrections": []
}

Response 409 (Conflict):
{
  "synced": false,
  "conflicts": [
    {
      "changeId": "change-1",
      "type": "CONCURRENT_EDIT",
      "baseVersion": 42,
      "currentVersion": 45,
      "serverValue": { "capacity": 15 },
      "clientValue": { "capacity": 12 }
    }
  ]
}
```

#### **6.1.5 Bookings**

```http
GET    /bookings
GET    /bookings/:id
POST   /bookings
POST   /bookings/recurring
DELETE /bookings/:id
PUT    /bookings/:id/cancel

GET    /bookings/my-bookings
POST   /bookings/check-availability
POST   /bookings/recommend
```

**Example: Get Recommendations**

```http
POST /bookings/recommend
Content-Type: application/json
Authorization: Bearer <token>

{
  "participantCount": 8,
  "requiredFeatures": ["projector", "whiteboard"],
  "preferredLocation": { "floorId": "uuid", "x": 100, "y": 200 },
  "timeSlot": {
    "start": "2025-11-22T14:00:00Z",
    "end": "2025-11-22T16:00:00Z"
  },
  "maxDistance": 500
}

Response 200:
{
  "recommendations": [
    {
      "roomId": "uuid",
      "roomName": "Conference Room A",
      "score": 92,
      "breakdown": {
        "capacityScore": 95,
        "proximityScore": 88,
        "availabilityScore": 100,
        "featureScore": 100,
        "userPreferenceScore": 75
      },
      "distance": 120,
      "capacity": 10,
      "available": true
    }
  ]
}
```

**Example: Create Recurring Booking**

```http
POST /bookings/recurring
Content-Type: application/json
Authorization: Bearer <token>

{
  "roomId": "uuid",
  "title": "Weekly Team Standup",
  "startTime": "2025-11-22T09:00:00Z",
  "endTime": "2025-11-22T09:30:00Z",
  "participantCount": 5,
  "recurrencePattern": {
    "frequency": "weekly",
    "interval": 1,
    "daysOfWeek": [1, 2, 3, 4, 5],
    "endDate": "2026-11-22"
  }
}

Response 201:
{
  "parentBookingId": "uuid",
  "createdBookings": 52,
  "bookings": [...]
}
```

#### **6.1.6 Pathfinding**

```http
POST /pathfinding/shortest-path
POST /pathfinding/distance
```

**Example:**

```http
POST /pathfinding/shortest-path
Content-Type: application/json

{
  "fromRoomId": "room-1-uuid",
  "toRoomId": "room-2-uuid",
  "accessible": false
}

Response 200:
{
  "path": {
    "nodes": ["room-1-uuid", "hallway-1", "hallway-2", "room-2-uuid"],
    "totalDistance": 450,
    "estimatedTime": 321
  }
}
```

### 6.2 WebSocket Events

**Namespace:** `/floor-plans`

```typescript
// Connection
socket.on('connect', () => { /* Authenticated via token */ });

// Floor plan collaboration
socket.emit('floor_plan:join', { floorPlanId: 'uuid' });
socket.emit('floor_plan:leave', { floorPlanId: 'uuid' });
socket.emit('floor_plan:edit', {
  floorPlanId: 'uuid',
  change: {
    type: 'ROOM_MODIFIED',
    roomId: 'uuid',
    data: { capacity: 12 },
    userId: 'uuid'
  }
});

// Server broadcasts
socket.on('floor_plan:update', (data) => {
  // { type: 'ROOM_MODIFIED', roomId: 'uuid', data: {...}, userId: 'uuid', version: 43 }
});

socket.on('floor_plan:conflict', (conflict) => {
  // { conflictId: 'uuid', type: 'CONCURRENT_EDIT', ... }
});

// User presence
socket.emit('cursor:move', { floorPlanId: 'uuid', x: 100, y: 200 });
socket.on('user:joined', (user) => { /* { userId: 'uuid', name: 'John', color: '#ff0000' } */ });
socket.on('user:left', (userId) => { /* 'uuid' */ });
socket.on('cursor:update', ({ userId, x, y }) => { /* Update cursor position */ });

// Booking updates
socket.on('booking:created', (booking) => { /* Refresh availability */ });
socket.on('booking:cancelled', ({ bookingId, roomId }) => { /* Update UI */ });
```

---

## 7. Real-time Architecture

### 7.1 WebSocket Connection Flow

```
Client                          Server                          Redis Pub/Sub
  │                               │                                  │
  │──(1) Connect WS──────────────>│                                  │
  │    {token: "jwt"}             │                                  │
  │                               │                                  │
  │                               │──(2) Verify Token───────────────>│
  │                               │    Check Redis session           │
  │                               │                                  │
  │<─────(3) Connected────────────│                                  │
  │    {userId, role}             │                                  │
  │                               │                                  │
  │──(4) Join Room───────────────>│                                  │
  │    {floorPlanId: "uuid"}      │                                  │
  │                               │                                  │
  │                               │──(5) Subscribe Channel──────────>│
  │                               │    SUBSCRIBE floor_plan:uuid     │
  │                               │                                  │
  │<─────(6) Joined───────────────│                                  │
  │    {activeUsers: [...]}       │                                  │
  │                               │                                  │
  │──(7) Edit────────────────────>│                                  │
  │    {change: {...}}            │                                  │
  │                               │                                  │
  │                               │──(8) Validate & Save────────────>│
  │                               │    PostgreSQL + MongoDB          │
  │                               │                                  │
  │                               │──(9) Publish Event──────────────>│
  │                               │    PUBLISH floor_plan:uuid       │
  │                               │                                  │
  │                               │<─────(10) Event Broadcast────────│
  │                               │                                  │
  │<─────(11) Update──────────────│                                  │
  │    {change, version}          │                                  │
  │                               │                                  │
  │──────────────────────────────>│<─────────────────────────────────│
  │    (All clients in room receive update simultaneously)           │
```

### 7.2 Operational Transformation (OT)

**Problem:** Two admins edit the same room simultaneously.

**Solution:** Operational Transformation to reconcile changes.

```typescript
// Example: Admin A and Admin B both move Room 5

// Initial state (Server Version 100):
{ roomId: 'room-5', x: 100, y: 100 }

// Admin A (offline): Move to x=150
Change A: { roomId: 'room-5', x: 150, baseVersion: 100 }

// Admin B (online): Move to y=200
Change B: { roomId: 'room-5', y: 200, baseVersion: 100 }

// Server receives Change B first → Version 101
{ roomId: 'room-5', x: 100, y: 200 }

// Server receives Change A → Detect conflict
// Base: {x: 100, y: 100}
// Current: {x: 100, y: 200}
// Incoming: {x: 150, y: 100}

// OT Algorithm:
// - Change A only modified x (not conflicting with y)
// - Change B only modified y (not conflicting with x)
// → Auto-merge: {x: 150, y: 200}

// Result Version 102:
{ roomId: 'room-5', x: 150, y: 200 }
```

**Implementation:**

```typescript
class OperationalTransform {
  transform(baseState: any, operations: Operation[]): any {
    let currentState = { ...baseState };

    operations.forEach(op => {
      if (op.type === 'SET_PROPERTY') {
        currentState[op.key] = op.value;
      } else if (op.type === 'ARRAY_INSERT') {
        currentState[op.key].splice(op.index, 0, op.value);
      } else if (op.type === 'ARRAY_DELETE') {
        currentState[op.key].splice(op.index, 1);
      }
    });

    return currentState;
  }

  detectConflicts(op1: Operation, op2: Operation): boolean {
    // Conflict if both operations modify the same property
    return op1.key === op2.key && op1.type === op2.type;
  }

  merge(op1: Operation, op2: Operation): Operation[] {
    // If no conflict, apply both
    if (!this.detectConflicts(op1, op2)) {
      return [op1, op2];
    }

    // Conflict resolution: timestamp priority
    return op1.timestamp > op2.timestamp ? [op1] : [op2];
  }
}
```

### 7.3 Conflict Resolution Strategies

| Strategy | Use Case | Implementation |
|----------|----------|----------------|
| **Auto-Merge** | Non-overlapping changes (different properties) | Apply both changes |
| **Timestamp Priority** | Overlapping changes to same property | Latest change wins |
| **Role Priority** | Admin vs Admin conflict | Admin with higher privilege wins |
| **Manual Review** | Complex conflicts (e.g., room deletion vs modification) | Queue for admin review |

**Conflict UI Flow:**

```typescript
// Frontend: Conflict notification
socket.on('floor_plan:conflict', (conflict) => {
  // Show modal
  showConflictModal({
    title: 'Floor Plan Conflict Detected',
    message: `${conflict.otherUser.name} also modified this room.`,
    options: [
      { label: 'Keep My Changes', value: 'LOCAL' },
      { label: 'Accept Their Changes', value: 'REMOTE' },
      { label: 'Merge Both', value: 'MERGE' },
      { label: 'Review Manually', value: 'MANUAL' }
    ],
    onResolve: (choice) => {
      socket.emit('conflict:resolve', {
        conflictId: conflict.id,
        resolution: choice
      });
    }
  });
});
```

---

## 8. Security & Authentication

### 8.1 JWT Authentication Flow

```
Client                          Server                          Database
  │                               │                                  │
  │──(1) POST /auth/login────────>│                                  │
  │    {email, password}          │                                  │
  │                               │                                  │
  │                               │──(2) Query User─────────────────>│
  │                               │    SELECT * FROM users WHERE...  │
  │                               │                                  │
  │                               │<─────(3) User Data───────────────│
  │                               │                                  │
  │                               │──(4) Verify Password             │
  │                               │    bcrypt.compare(password, hash)│
  │                               │                                  │
  │                               │──(5) Generate JWT                │
  │                               │    sign({ userId, role }, secret)│
  │                               │                                  │
  │                               │──(6) Store Session──────────────>│
  │                               │    Redis: session:<sessionId>    │
  │                               │                                  │
  │<─────(7) Return Token─────────│                                  │
  │    {token: "eyJ..."}          │                                  │
  │                               │                                  │
  │──(8) API Request─────────────>│                                  │
  │    Authorization: Bearer eyJ..│                                  │
  │                               │                                  │
  │                               │──(9) Verify JWT                  │
  │                               │    verify(token, secret)         │
  │                               │                                  │
  │                               │──(10) Check Session─────────────>│
  │                               │    GET session:<sessionId>       │
  │                               │                                  │
  │                               │<─────(11) Session Valid──────────│
  │                               │                                  │
  │<─────(12) Response────────────│                                  │
```

### 8.2 JWT Payload Structure

```typescript
interface JWTPayload {
  userId: string;
  email: string;
  role: 'admin' | 'user';
  sessionId: string;
  iat: number; // Issued at
  exp: number; // Expiration (24 hours)
}

// Token generation
const token = jwt.sign(
  {
    userId: user.id,
    email: user.email,
    role: user.role,
    sessionId: generateUUID()
  },
  process.env.JWT_SECRET,
  { expiresIn: '24h' }
);
```

### 8.3 Security Best Practices

| Security Layer | Implementation |
|----------------|----------------|
| **Password Hashing** | bcrypt with salt rounds = 12 |
| **JWT Secret** | 256-bit random key stored in env |
| **Token Expiration** | 24 hours (refresh required) |
| **HTTPS Only** | TLS 1.3, redirect HTTP to HTTPS |
| **CORS** | Whitelist specific origins |
| **Rate Limiting** | 100 requests/min per user (Redis-backed) |
| **SQL Injection** | Parameterized queries (Prisma ORM) |
| **XSS Protection** | Content Security Policy headers |
| **CSRF Protection** | SameSite cookies, CSRF tokens |
| **Input Validation** | Joi schemas, sanitize inputs |
| **Audit Logging** | Log all auth events to PostgreSQL |

### 8.4 Role-Based Access Control (RBAC)

```typescript
// Middleware example
router.put('/floor-plans/:id',
  authenticate,
  authorize('admin'),
  async (req, res) => {
    // Only admins can edit floor plans
  }
);

router.post('/bookings',
  authenticate,
  authorize('admin', 'user'),
  async (req, res) => {
    // Both admins and users can book
  }
);
```

---

## 9. Performance & Scalability

### 9.1 Caching Strategy

```typescript
class CacheManager {
  // Cache-aside pattern
  async get<T>(key: string, fetchFn: () => Promise<T>, ttl: number): Promise<T> {
    const cached = await redis.get(key);
    if (cached) return JSON.parse(cached);

    const fresh = await fetchFn();
    await redis.setex(key, ttl, JSON.stringify(fresh));
    return fresh;
  }

  // Write-through pattern
  async set<T>(key: string, value: T, ttl: number): Promise<void> {
    await redis.setex(key, ttl, JSON.stringify(value));
  }

  // Invalidation
  async invalidate(pattern: string): Promise<void> {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) await redis.del(...keys);
  }
}

// Usage
const room = await cacheManager.get(
  `room:${roomId}:details`,
  () => db.rooms.findUnique({ where: { id: roomId } }),
  3600 // 1 hour TTL
);
```

### 9.2 Database Optimization

**PostgreSQL:**
```sql
-- Index for booking availability queries
CREATE INDEX idx_bookings_room_time_status
ON bookings(room_id, start_time, end_time, status);

-- Partial index for active bookings only
CREATE INDEX idx_active_bookings
ON bookings(room_id, start_time)
WHERE status = 'confirmed';

-- Covering index for room search
CREATE INDEX idx_rooms_search
ON rooms(capacity, status)
INCLUDE (name, features);
```

**MongoDB:**
```javascript
// Compound index for event queries
db.events.createIndex({ aggregateId: 1, version: 1 });

// TTL index for expired conflicts
db.conflicts.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
```

### 9.3 Performance Targets

| Metric | Target | Monitoring |
|--------|--------|------------|
| **API Response Time (p50)** | < 100ms | Prometheus histogram |
| **API Response Time (p99)** | < 500ms | Prometheus histogram |
| **WebSocket Latency** | < 50ms | Custom metric |
| **Event Replay (100 events)** | < 1s | Timer in code |
| **Offline Sync** | < 3s | Timer in code |
| **Cache Hit Ratio** | > 85% | Redis INFO stats |
| **Database Connection Pool** | 10-50 connections | Prisma metrics |
| **Concurrent WebSocket Connections** | 100+ | Socket.IO admin UI |

### 9.4 Load Testing Plan

```bash
# Using Artillery.io
artillery quick --count 100 --num 50 https://api.movensync.com/v1/rooms

# Scenarios:
# 1. Concurrent floor plan editing (2 admins)
# 2. 50 simultaneous booking requests
# 3. 100 users viewing floor plans
# 4. Offline sync with 500 queued changes
```

---

## 10. Deployment Strategy

### 10.1 Docker Compose (Development)

```yaml
version: '3.9'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
    ports:
      - "5000:5000"
    environment:
      NODE_ENV: development
      DATABASE_URL: postgresql://postgres:password@postgres:5432/movensync
      MONGODB_URI: mongodb://mongo:27017/movensync
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET}
    volumes:
      - ./backend:/app
      - /app/node_modules
    depends_on:
      - postgres
      - mongo
      - redis
    command: npm run dev

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    environment:
      REACT_APP_API_URL: http://localhost:5000
      REACT_APP_WS_URL: ws://localhost:5000
    volumes:
      - ./frontend:/app
      - /app/node_modules
    command: npm start

  postgres:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: movensync
    volumes:
      - postgres_data:/var/lib/postgresql/data

  mongo:
    image: mongo:7.0
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

  redis:
    image: redis:7.2-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - backend
      - frontend

  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      GF_SECURITY_ADMIN_PASSWORD: admin
    volumes:
      - grafana_data:/var/lib/grafana

volumes:
  postgres_data:
  mongo_data:
  redis_data:
  grafana_data:
```

### 10.2 Production Deployment (Cloud)

**Option 1: AWS Architecture**

```
┌─────────────────────────────────────────────────────────┐
│                    AWS INFRASTRUCTURE                    │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │           Route 53 (DNS)                           │ │
│  └────────────┬───────────────────────────────────────┘ │
│               │                                          │
│  ┌────────────▼───────────────────────────────────────┐ │
│  │     CloudFront (CDN) + WAF                         │ │
│  └────────────┬───────────────────────────────────────┘ │
│               │                                          │
│  ┌────────────▼───────────────────────────────────────┐ │
│  │     Application Load Balancer (ALB)                │ │
│  └────────────┬───────────────────────────────────────┘ │
│               │                                          │
│  ┌────────────▼───────────────────────────────────────┐ │
│  │         ECS Fargate Cluster                        │ │
│  │  ┌──────────────┐  ┌──────────────┐               │ │
│  │  │  Backend     │  │  WebSocket   │               │ │
│  │  │  Service     │  │  Service     │               │ │
│  │  │  (2 tasks)   │  │  (2 tasks)   │               │ │
│  │  └──────────────┘  └──────────────┘               │ │
│  └───────────────────────────────────────────────────┘ │
│               │                                          │
│  ┌────────────▼───────────────────────────────────────┐ │
│  │         ElastiCache Redis (Multi-AZ)               │ │
│  └────────────────────────────────────────────────────┘ │
│               │                                          │
│  ┌────────────▼───────────────────────────────────────┐ │
│  │         RDS PostgreSQL (Multi-AZ)                  │ │
│  │         + Read Replicas                            │ │
│  └────────────────────────────────────────────────────┘ │
│               │                                          │
│  ┌────────────▼───────────────────────────────────────┐ │
│  │         DocumentDB (MongoDB-compatible)            │ │
│  │         3-node replica set                         │ │
│  └────────────────────────────────────────────────────┘ │
│               │                                          │
│  ┌────────────▼───────────────────────────────────────┐ │
│  │         S3 (Floor plan images, backups)            │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**Cost Estimate (Monthly):**
- ECS Fargate (4 tasks): ~$150
- RDS PostgreSQL (db.t4g.medium): ~$100
- DocumentDB (3 nodes): ~$300
- ElastiCache Redis (cache.t4g.medium): ~$50
- ALB: ~$25
- CloudFront: ~$20
- Total: ~$645/month

### 10.3 CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml

name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Run linter
        run: npm run lint

      - name: Check TypeScript
        run: npm run type-check

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Build Docker image
        run: |
          docker build -t movensync-backend:${{ github.sha }} ./backend
          docker build -t movensync-frontend:${{ github.sha }} ./frontend

      - name: Push to ECR
        run: |
          aws ecr get-login-password | docker login --username AWS --password-stdin
          docker push movensync-backend:${{ github.sha }}
          docker push movensync-frontend:${{ github.sha }}

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to ECS
        run: |
          aws ecs update-service \
            --cluster movensync-cluster \
            --service backend-service \
            --force-new-deployment
```

---

## 11. Implementation Roadmap

### 11.1 Phase 1: Foundation (Weeks 1-3)

**Week 1: Project Setup & Database**
- [ ] Initialize monorepo (Turborepo or Nx)
- [ ] Setup Docker Compose environment
- [ ] Configure PostgreSQL + Prisma schema
- [ ] Configure MongoDB + Mongoose models
- [ ] Setup Redis client
- [ ] Create database migration scripts
- [ ] Write seed data (2 buildings, 6 floors, 60 rooms)

**Week 2: Authentication & Basic CRUD**
- [ ] Implement JWT authentication
- [ ] Create User model & CRUD
- [ ] Create Building/Floor/Room CRUD
- [ ] Setup Express routing structure
- [ ] Configure CORS, rate limiting, logging
- [ ] Write unit tests (Jest)

**Week 3: Frontend Foundation**
- [ ] Setup React + TypeScript + Vite
- [ ] Configure Redux Toolkit
- [ ] Setup React Router
- [ ] Implement authentication flow
- [ ] Create layout components (Header, Sidebar, Dashboard)
- [ ] Integrate Material-UI theme

**Deliverable:** Login system, basic room management UI

---

### 11.2 Phase 2: Floor Plan Editor (Weeks 4-6)

**Week 4: Canvas Editor**
- [ ] Integrate Fabric.js
- [ ] Implement drag-and-drop room creation
- [ ] Add room properties panel (capacity, features)
- [ ] Implement seat placement
- [ ] Add zoom/pan controls
- [ ] Export floor plan (PNG, SVG)

**Week 5: Version Control & Event Sourcing**
- [ ] Implement Event Store (MongoDB)
- [ ] Create event recording service
- [ ] Build event replay mechanism
- [ ] Add version history UI
- [ ] Implement rollback functionality
- [ ] Add snapshot generation (every 10 versions)

**Week 6: Real-time Collaboration**
- [ ] Setup Socket.IO server
- [ ] Implement floor plan join/leave events
- [ ] Add real-time cursor tracking
- [ ] Build conflict detection (three-way merge)
- [ ] Create conflict resolution UI
- [ ] Add user presence indicators

**Deliverable:** Collaborative floor plan editor with version control

---

### 11.3 Phase 3: Offline Support (Weeks 7-8)

**Week 7: Service Worker & IndexedDB**
- [ ] Setup Workbox
- [ ] Configure caching strategies
- [ ] Implement IndexedDB schema (Dexie.js)
- [ ] Build offline change queue
- [ ] Add offline indicator UI

**Week 8: Sync Mechanism**
- [ ] Create sync endpoint
- [ ] Implement three-way merge algorithm
- [ ] Build conflict resolution backend
- [ ] Add sync progress UI
- [ ] Test offline → online transitions

**Deliverable:** Offline-capable floor plan editing

---

### 11.4 Phase 4: Booking System (Weeks 9-11)

**Week 9: Basic Booking**
- [ ] Create Booking model & CRUD
- [ ] Implement availability checking
- [ ] Add double-booking prevention (PostgreSQL exclusion constraint)
- [ ] Build booking form UI
- [ ] Add my-bookings dashboard

**Week 10: Room Recommendations**
- [ ] Implement multi-factor scoring algorithm
- [ ] Build user preference tracking
- [ ] Add recommendation endpoint
- [ ] Create recommendation UI cards
- [ ] Integrate with booking flow

**Week 11: Recurring Bookings & Buffers**
- [ ] Create RecurrencePattern model
- [ ] Implement recurring booking generation
- [ ] Build buffer management (2-hour cleanup)
- [ ] Add recurring booking UI
- [ ] Create cancellation policy enforcement

**Deliverable:** Full booking system with AI recommendations

---

### 11.5 Phase 5: Pathfinding (Week 12)

**Week 12: Navigation Graph**
- [ ] Implement graph builder from floor plan
- [ ] Add Dijkstra's shortest path algorithm
- [ ] Create distance calculator
- [ ] Build pathfinding UI (show route on map)
- [ ] Integrate with room recommendations (proximity score)

**Deliverable:** Indoor navigation

---

### 11.6 Phase 6: Polish & Production (Weeks 13-14)

**Week 13: Testing & Optimization**
- [ ] Write integration tests (Supertest)
- [ ] E2E tests (Playwright/Cypress)
- [ ] Performance testing (Artillery)
- [ ] Database query optimization
- [ ] Cache hit ratio analysis
- [ ] Fix bugs

**Week 14: Deployment & Monitoring**
- [ ] Setup CI/CD pipeline (GitHub Actions)
- [ ] Configure production environment (AWS/Azure)
- [ ] Setup Prometheus + Grafana dashboards
- [ ] Configure error tracking (Sentry)
- [ ] Write deployment documentation
- [ ] Final security audit

**Deliverable:** Production-ready system

---

### 11.7 Milestone Summary

| Phase | Duration | Key Deliverables | Team Size |
|-------|----------|------------------|-----------|
| **Phase 1** | 3 weeks | Auth, Database, Basic UI | 2 devs |
| **Phase 2** | 3 weeks | Floor Plan Editor, Real-time Collab | 2 devs |
| **Phase 3** | 2 weeks | Offline Support | 1 dev |
| **Phase 4** | 3 weeks | Booking System, Recommendations | 2 devs |
| **Phase 5** | 1 week | Pathfinding | 1 dev |
| **Phase 6** | 2 weeks | Testing, Deployment | 2 devs |
| **Total** | **14 weeks** | **Full System** | **2 devs** |

---

## 12. Appendix

### 12.1 Technology Alternatives Considered

| Component | Chosen | Alternative | Reason for Choice |
|-----------|--------|-------------|-------------------|
| State Management | Redux Toolkit | Zustand, Recoil | Better DevTools, time-travel debugging |
| Canvas Library | Fabric.js | Konva, Paper.js | Best object manipulation, export support |
| Real-time | Socket.IO | WebSockets, Pusher | Auto-reconnect, fallback mechanisms |
| ORM | Prisma | TypeORM, Sequelize | Type safety, migrations, relation handling |
| Task Queue | Bull | BullMQ, Bee-Queue | Mature, Redis-backed, UI dashboard |

### 12.2 Glossary

| Term | Definition |
|------|------------|
| **Event Sourcing** | Storing all changes as immutable events instead of current state |
| **Operational Transformation** | Algorithm to reconcile concurrent edits |
| **Three-Way Merge** | Merge strategy using base, current, and incoming versions |
| **Optimistic UI** | Update UI immediately, rollback if server rejects |
| **Service Worker** | Browser background script for offline capabilities |
| **IndexedDB** | Browser storage for large structured data |
| **Dijkstra's Algorithm** | Shortest path algorithm for graphs |
| **CRDT** | Conflict-free Replicated Data Type (not used, but considered) |

### 12.3 References

- [Event Sourcing Pattern - Martin Fowler](https://martinfowler.com/eaaDev/EventSourcing.html)
- [Operational Transformation - Wikipedia](https://en.wikipedia.org/wiki/Operational_transformation)
- [Service Worker API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Dijkstra's Algorithm - Wikipedia](https://en.wikipedia.org/wiki/Dijkstra%27s_algorithm)
- [PostgreSQL Exclusion Constraints](https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-EXCLUSION)

---

## Document Approval

| Role | Name | Date | Signature |
|------|------|------|-----------|
| **Tech Lead** | - | 2025-11-22 | - |
| **Product Owner** | - | 2025-11-22 | - |
| **Stakeholder** | - | 2025-11-22 | - |

---

**End of Technical Specification Document**
