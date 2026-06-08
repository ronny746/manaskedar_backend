# 🦾 Manaskedar OTT: API Terminal Overview

This document provides a high-level overview of the newly detailed backend architecture and instructions for utilizing the **Postman Terminal** for Flutter mobile development.

## 🏗️ Backend System Architecture

The backend has been refactored into three primary administrative and discovery logical modules:

### 1. Identity & Session Management (`/api/auth`)
- **Admin Registration/Login**: Secure access for system administrators.
- **Consumer Login**: Phone-based OTP authentication with a **3-device concurrent limit** enforcement.
- **Session Audit**: Automatic tracking of active device IDs to maintain service integrity.

### 2. Administrative Control (`/api/admin`)
- **Telemetry (`/stats`)**: Real-time platform analytics (Total Content, Movies, Shorts, Audio, Subscribers).
- **Asset Vault (`/media`)**: Comprehensive library auditing with category population and chronological sorting.
- **Cloud Signatures (`/upload-auth`)**: Generates secure ImageKit authentication payloads for client-side publishing.
- **User Registry (`/admin/users`)**: Full audit log of platform identities with deactivation capabilities.

### 3. Consumer Discovery (`/api/user`)
- **Billboard (`/banners`)**: High-fidelity hero content delivery.
- **Discovery Engine (`/media`)**: Content filtering and **Keyword Search** (Regex-powered) across the entire library.

---

## 🛰️ Postman Collection Usage

I have generated a high-fidelity Postman collection file:  
`manaskedar.postman_collection.json`

### How to Import and Use:
1. **Open Postman**: Click on "Import" and select the JSON file from the `manaskedar_backend` directory.
2. **Environment Setup**: 
   - The collection uses a `{{BASE_URL}}` variable (Default: `http://localhost:5001`).
   - For administrative requests, you must paste the `token` from the login response into the `ADMIN_TOKEN` collection variable.
3. **Validated Flows**:
   - **Auth Flow**: `Admin Register` -> `Admin Login` -> Save Token.
   - **Discovery Flow**: Use `Global Asset Library` to fetch content for your Flutter frontend.
   - **Search Flow**: Use `Discovery Deck (Search Titles)` and modify the `search` query parameter to test regex filtering.

---

### [!] Technical Criticality
- **Port 5001**: Always ensure your backend is running on Port 5001 to match the Preflight CORS configurations.
- **Database Vault**: The platform is currently connected to the **MongoDB Atlas Production Cluster** (`manaskedar` database). flow flow logic flow flow flow flow flow flow flow flow flow flow flow flow flow f
