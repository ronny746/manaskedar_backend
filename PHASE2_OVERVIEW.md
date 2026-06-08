# Manaskedar OTT Platform: Phase 2 Implementation

I have refactored the platform to include dedicated architectural separation for Admin and User flows, implemented a secure mobile OTP-first identity system with session limits, and redesigned the administrative dashboard in a premium Light Mode.

## 1. Architectural Route Separation
The backend is now logically partitioned to ensure clear boundaries between administrative tasks and public content consumption.

- **Admin APIs** (`/api/admin/`): Dedicated endpoints for media CRUD, category management, and banner promotions, protected by rigorous administrative middleware.
- **User APIs** (`/api/user/`): Read-optimized endpoints for content discovery, including featured banners, media library, and navigation categories.
- **Auth Base** (`/api/auth/`): Unified authentication gateway for both mobile users and administrators.

## 2. Advanced Session & Identity Logic
Implemented a mobile-first security model as requested:

- **Mobile OTP Flow**: Users receive a 4-digit OTP via their phone number for secure, password-less entry.
- **Concurrent Session Limit**: Integrated device tracking logic that permits a **maximum of 3 active sessions** per mobile number.
- **Device Management**: Automatic FIFO (First-In, First-Out) session clearing once the 3-device limit is reached, ensuring account security without manual intervention.

## 3. Premium Light Mode Dashboard
Recoding the admin panel from the ground up with a sophisticated, clean, and high-productivity Light Mode aesthetic.

- **Design Tokens**: Shifted from dark/glass to a crisp `#f8fafc` palette with rich `#4f46e5` indigo highlights.
- **Visual Improvements**:
  - High-impact **Card-based Layouts** with intentional depth and shadows.
  - Bold **Sans-serif Typography** for instant scanning of mission-critical data.
  - **Dynamic Feedback**: Real-time upload progress and success/failure visuals for media ingestion.
- **Smart Navigation**: Refined sidebar with deeper hierarchy and status indicators.

---

### Configuration Check

#### Admin Login Credentials:
- **Phone**: Use any number registered as an admin.
- **Access Key**: Current default is `admin123`.

#### Backend Session Tuning:
- To adjust the session limit, modify the logic in `backend/controllers/authController.js` inside the `verifyOtp` function.

---
> [!IMPORTANT]
> The Admin API now requires a valid `admin` flag on the JWT token. Ensure your administrative users are updated with the `isAdmin: true` flag in MongoDB.
