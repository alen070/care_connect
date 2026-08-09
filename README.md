# 🏥 Home Care Assistant Finder

**Home Care Assistant Finder** is a web-based healthcare assistance platform designed to connect individuals and families with suitable home care assistants/nurses. The system provides a centralized platform for finding caregivers, managing bookings, verifying nurse credentials, and supporting vulnerable individuals through shelter assistance.

The project combines **modern web technologies, cloud-based authentication and database services, document processing, and AI-assisted certificate verification** to create a more reliable and accessible home-care service platform.

🔗 **Live Demo:** https://care-connect-two-beta.vercel.app/

🔗 **GitHub Repository:** https://github.com/alen070/Home_Care_Assistant_Finder

---

## 📌 Problem Statement

Finding a trustworthy home-care assistant can be difficult, especially when families need immediate assistance for elderly people, patients, children, or individuals requiring daily support.

Traditional approaches often depend on agencies or personal contacts, which can result in:

* Limited access to qualified caregivers
* Difficulty comparing available assistants
* Lack of transparency in caregiver information
* Manual verification of certificates
* Delays in booking and communication
* Difficulty managing caregiver and user information

**Home Care Assistant Finder** addresses these problems by providing a centralized digital platform for discovering, registering, verifying, and booking home-care assistants.

---

## 🎯 Objectives

The main objectives of the system are to:

* Provide an easy platform to find home-care assistants.
* Allow nurses/caregivers to create professional profiles.
* Enable users to search and select suitable assistants.
* Simplify the booking process.
* Provide an administrative verification system.
* Assist with nurse certificate/document verification.
* Improve trust and transparency between users and caregivers.
* Provide shelter-related assistance for vulnerable individuals.
* Maintain secure user and application data.

---

## ✨ Key Features

### 👤 User Module

Users can:

* Create and manage accounts.
* Browse available home-care assistants.
* View assistant profiles.
* Search for suitable caregivers.
* Review caregiver information and ratings.
* Request/book home-care services.
* Manage their bookings.
* Receive notifications related to their activities.

---

### 👩‍⚕️ Nurse / Care Assistant Module

Care assistants can:

* Register on the platform.
* Create professional profiles.
* Add personal and professional information.
* Upload certificates and supporting documents.
* Manage availability.
* Receive booking requests.
* Accept or manage service requests.
* Build ratings/reviews through completed services.

---

### 🛡️ Admin Module

Administrators can manage the overall platform.

Admin functionality includes:

* User management
* Nurse/caregiver management
* Profile verification
* Certificate review
* Booking management
* Ratings and reviews
* Platform monitoring
* Administrative dashboards
* Verification status management

The repository contains dedicated admin, nurse, user, authentication, notification, and shelter components.

---

### 🤖 AI-Assisted Document Verification

One of the major features of the project is its document/certificate verification workflow.

The system contains dedicated AI modules for:

* Certificate verification
* Forgery detection
* Indian document analysis

The AI implementation is organized under `src/ai`, including:

```text
certificateVerification.ts
forgeryDetection.ts
indianDocumentAI.ts
```

The project also includes a Supabase Edge Function named `verify-certificate`. This function sends uploaded certificate images to a Roboflow signature-detection model and stores the verification result for administrative review.

### Verification Flow

```text
Nurse uploads certificate
        ↓
Certificate stored
        ↓
Verification request
        ↓
Supabase Edge Function
        ↓
Roboflow AI Model
        ↓
Document / Signature Detection
        ↓
Verification Result
        ↓
Admin Review
        ↓
Approved / Rejected
```

> **Important:** AI detection is an assistance mechanism, not a replacement for official credential verification. Final approval should remain under administrative review.

---

### 🏠 Shelter Assistance Module

The platform also includes a shelter-related module intended to support vulnerable or homeless individuals.

Users/authorized personnel can:

* Report individuals requiring shelter assistance.
* Provide relevant information.
* Connect cases with nearby shelter resources.
* Allow shelter administrators to manage reported cases.

The repository includes dedicated shelter components and database migration files for shelter functionality.

---

### 🔔 Notification System

The application includes notification-related components to keep users informed about important events such as:

* Booking requests
* Booking status
* Nurse responses
* Verification updates
* Other platform activities

---

## 🏗️ System Architecture

The application follows a modern client-cloud architecture:

```text
                    ┌──────────────────────┐
                    │      End User        │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ React Web Application │
                    │   Vite + TypeScript   │
                    │    Tailwind CSS       │
                    └──────────┬───────────┘
                               │
             ┌─────────────────┼─────────────────┐
             │                 │                 │
             ▼                 ▼                 ▼
      ┌─────────────┐   ┌──────────────┐  ┌─────────────┐
      │   Supabase  │   │   Supabase   │  │   Vercel    │
      │ Auth/DB     │   │   Storage     │  │ Deployment  │
      └─────────────┘   └──────────────┘  └─────────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ Supabase Edge        │
                    │ Functions            │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ Roboflow AI Model    │
                    │ Document Detection   │
                    └──────────────────────┘
```

---

## 🛠️ Technology Stack

### Frontend

* **React 19**
* **TypeScript**
* **Vite**
* **Tailwind CSS**
* **Lucide React**

### Backend / Cloud

* **Supabase**
* Supabase Authentication
* Supabase Database
* Supabase Storage
* Supabase Edge Functions

### AI / Document Processing

* **Roboflow**
* AI-assisted document/signature detection
* **Tesseract.js** for OCR/document text processing

### Deployment

* **Vercel**

The current `package.json` confirms React, TypeScript, Vite, Tailwind CSS, Supabase JS, Tesseract.js, jsPDF and supporting libraries.

---

## 📂 Project Structure

```text
Home_Care_Assistant_Finder/
│
├── src/
│   ├── ai/
│   │   ├── certificateVerification.ts
│   │   ├── forgeryDetection.ts
│   │   └── indianDocumentAI.ts
│   │
│   ├── assets/
│   │
│   ├── components/
│   │   ├── admin/
│   │   ├── auth/
│   │   ├── landing/
│   │   ├── layout/
│   │   ├── notifications/
│   │   ├── nurse/
│   │   ├── shelter/
│   │   ├── shared/
│   │   ├── ui/
│   │   └── user/
│   │
│   ├── lib/
│   ├── store/
│   ├── types/
│   ├── utils/
│   │
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
│
├── supabase/
│   └── functions/
│       └── verify-certificate/
│
├── package.json
├── package-lock.json
├── tsconfig.json
├── vite.config.ts
└── index.html
```

The repository currently contains separate modules for admin, authentication, landing pages, notifications, nurses, shelters and users, reflecting the multi-role architecture of the application.

---

# 🚀 Getting Started

## Prerequisites

Make sure you have installed:

* Node.js
* npm
* Git
* A Supabase project
* A Roboflow account/API key if using AI verification

---

## 1. Clone the Repository

```bash
git clone https://github.com/alen070/Home_Care_Assistant_Finder.git
```

Navigate into the project:

```bash
cd Home_Care_Assistant_Finder
```

---

## 2. Install Dependencies

```bash
npm install
```

---

## 3. Configure Environment Variables

Create a `.env` file in the project root.

Example:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

For the certificate verification Edge Function, configure the required server-side secrets in Supabase:

```env
ROBOFLOW_API_KEY=your_roboflow_api_key
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Never expose `SUPABASE_SERVICE_ROLE_KEY` or your Roboflow secret API key in frontend code.**

---

## 4. Start Development Server

```bash
npm run dev
```

The application will be available at the local Vite development URL shown in your terminal.

---

## 5. Build for Production

```bash
npm run build
```

To preview the production build:

```bash
npm run preview
```

These commands correspond to the project's configured Vite scripts.

---

# 🔐 Security

The project uses Supabase-based authentication and database/storage infrastructure.

Security considerations include:

* Authenticated user access
* Role-based application functionality
* Database Row Level Security policies
* Protected server-side API credentials
* Supabase Edge Functions for sensitive backend operations
* Administrative verification workflows

The repository contains multiple SQL migration and policy files for database security, storage policies, registration triggers, booking logic, and administrative access control.

---

# 🔄 Main User Workflow

```text
                    USER
                     │
                     ▼
              Create Account
                     │
                     ▼
           Search Care Assistants
                     │
                     ▼
             View Nurse Profile
                     │
                     ▼
              Request Booking
                     │
                     ▼
             Nurse Receives Request
                     │
                     ▼
              Accept / Reject
                     │
                     ▼
             Service Confirmation
                     │
                     ▼
                Rating / Review
```

### Nurse Verification Workflow

```text
Nurse Registration
       │
       ▼
Upload Documents
       │
       ▼
AI-Assisted Verification
       │
       ▼
Admin Review
       │
 ┌─────┴─────┐
 ▼           ▼
Approve     Reject
 │
 ▼
Verified Nurse
       │
       ▼
Available for Booking
```

---

# 🎯 Target Users

The system is designed for multiple user groups:

| User                           | Purpose                               |
| ------------------------------ | ------------------------------------- |
| 👤 Patients / Families         | Find and book home-care assistants    |
| 👩‍⚕️ Nurses / Care Assistants | Register and offer home-care services |
| 🛡️ Administrators             | Manage users, nurses and verification |
| 🏠 Shelter Personnel           | Manage shelter-related cases          |
| 👨‍💻 Developers               | Maintain and extend the platform      |

---

# 💡 Advantages

* Centralized home-care assistant discovery
* Digital caregiver profiles
* Online booking workflow
* Administrative verification
* AI-assisted document analysis
* Cloud-based authentication
* Cloud database and storage
* Modular architecture
* Responsive modern web interface
* Shelter assistance functionality
* Scalable frontend/backend separation

---

# 🔮 Future Enhancements

Potential improvements include:

* 📍 GPS-based nurse discovery
* 🗺️ Interactive maps and route calculation
* 💳 Integrated online payments
* 📱 Dedicated Android/iOS applications
* 💬 Real-time chat between users and nurses
* 📹 Video consultation
* 🧠 Improved AI-based document fraud detection
* 📄 Automated certificate validation against official databases
* 🔔 Push notifications
* 📊 Advanced analytics dashboard
* 🌐 Multi-language support
* 🏥 Hospital and healthcare-provider integration
* ⭐ Advanced nurse recommendation/ranking system

---

# 🤝 Contributing

Contributions are welcome.

1. Fork the repository.
2. Create a feature branch.

```bash
git checkout -b feature/your-feature
```

3. Commit your changes.

```bash
git commit -m "Add your feature"
```

4. Push the branch.

```bash
git push origin feature/your-feature
```

5. Open a Pull Request.

---

# 📜 License

This project currently does not specify a license in the repository. If you intend to make the project open source, add an appropriate `LICENSE` file before claiming a specific open-source license here.

---

# 👨‍💻 Project

**Home Care Assistant Finder**

A digital platform for discovering, registering, verifying, and booking home-care assistants, with AI-assisted document verification and shelter assistance.

**Repository:**
https://github.com/alen070/Home_Care_Assistant_Finder

**Live Application:**
https://care-connect-two-beta.vercel.app/

---

## ⭐ Support

If you find this project useful, consider giving the repository a ⭐ on GitHub and sharing it with others interested in healthcare technology, AI-assisted verification, and digital care platforms.
