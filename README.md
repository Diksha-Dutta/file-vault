# FileVault – Secure File Storage System

## Project Overview
FileVault is a full-stack file storage system that allows users to upload, download, and manage files efficiently.  

**Current state:**
- Login / Signup modal exists (authentication not enforced yet)  
- Multiple file uploads supported (drag-and-drop + standard picker)  
- File download and delete functionality implemented  
- Deduplication implemented (same file content stored once)  

**Not yet implemented:**
- Users table and proper authentication  
- Per-user file separation (all uploaded files are visible to everyone)  
- Admin panel or analytics  
- Rate limiting, storage quotas, or RBAC  
- File previews  

---

## Tech Stack
- Frontend: React.js + TypeScript + Tailwind CSS v3  
- Backend: Go (Golang) REST API  
- Database: PostgreSQL (only `files` table created)  
- Containerization: Docker + Docker Compose  

---

## Database Setup
Currently, only the `files` table is created:

```sql
CREATE TABLE IF NOT EXISTS files (
    id SERIAL PRIMARY KEY,
    filename TEXT NOT NULL,
    filepath TEXT NOT NULL,
    mimetype TEXT NOT NULL,
    size BIGINT NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reference_count INT DEFAULT 0,
    sha256 TEXT NOT NULL,
    uploader_id INT DEFAULT 0,
    is_public BOOLEAN DEFAULT FALSE
);
```

## Setup and Usage

### Clone the repository
```bash
git clone https://github.com/Diksha-Dutta/filevault.git
cd filevault
docker-compose up --build
```

- Backend runs on [http://localhost:8080](http://localhost:8080)
- Frontend runs on [http://localhost:3000](http://localhost:3000)

## Usage

1. Open [http://localhost:3000](http://localhost:3000) in a browser
2. Use the login/signup modal (authentication not enforced yet)
3. Drag-and-drop files or use the file picker to upload
4. View all files in list or grid view
5. Download or delete files as needed

## Limitations

- No proper authentication or per-user file separation
- No admin panel or analytics
- No rate limiting, storage quotas, or RBAC
- No file previews

## Next Steps / Future Enhancements

- Implement users table and authentication
- Implement per-user file access
- Add admin panel and analytics
- Cloud deployment (AWS/GCP/Azure)
- Real-time updates on uploads/downloads
- Role-based access control (RBAC)
- File previews for images, PDFs, etc.