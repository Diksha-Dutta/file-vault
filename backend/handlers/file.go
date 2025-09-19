package handlers

import (
	"crypto/sha256"
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
)

var UploadDir = "./uploads"

// UploadFile handles file uploads
func UploadFile(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		log.Println("Upload handler hit")

		err := r.ParseMultipartForm(50 << 20) // 50 MB
		if err != nil {
			log.Println("ParseMultipartForm error:", err)
			http.Error(w, "Invalid form data", http.StatusBadRequest)
			return
		}

		file, header, err := r.FormFile("file")
		if err != nil {
			log.Println("FormFile error:", err)
			http.Error(w, "File missing", http.StatusBadRequest)
			return
		}
		defer file.Close()

		content, err := io.ReadAll(file)
		if err != nil {
			log.Println("ReadAll error:", err)
			http.Error(w, "Cannot read file", http.StatusInternalServerError)
			return
		}

		hash := fmt.Sprintf("%x", sha256.Sum256(content))

		// Check duplicate
		var id int
		var refCount int
		err = db.QueryRow("SELECT id, reference_count FROM files WHERE sha256=$1", hash).Scan(&id, &refCount)
		if err != nil && err != sql.ErrNoRows {
			log.Println("DB select error:", err)
			http.Error(w, "DB error", http.StatusInternalServerError)
			return
		}

		os.MkdirAll(UploadDir, os.ModePerm)

		if err == sql.ErrNoRows {
			destPath := filepath.Join(UploadDir, header.Filename)
			tmpFile, err := os.Create(destPath)
			if err != nil {
				log.Println("Create file error:", err)
				http.Error(w, "Cannot save file", http.StatusInternalServerError)
				return
			}
			defer tmpFile.Close()

			_, err = tmpFile.Write(content)
			if err != nil {
				log.Println("Write file error:", err)
				http.Error(w, "Cannot save file", http.StatusInternalServerError)
				return
			}

			_, err = db.Exec(
				`INSERT INTO files (filename, filepath, size, mime_type, sha256, reference_count) 
                 VALUES ($1,$2,$3,$4,$5,$6)`,
				header.Filename, destPath, header.Size, header.Header.Get("Content-Type"), hash, 1,
			)
			if err != nil {
				log.Println("DB insert error:", err)
				http.Error(w, "DB error", http.StatusInternalServerError)
				return
			}
		} else {
			// Duplicate file, increment reference_count
			_, err = db.Exec("UPDATE files SET reference_count = reference_count + 1 WHERE id=$1", id)
			if err != nil {
				log.Println("DB update error:", err)
				http.Error(w, "DB error", http.StatusInternalServerError)
				return
			}
		}

		w.WriteHeader(http.StatusOK)
		w.Write([]byte("File uploaded successfully!"))
	}
}

// ListFiles returns JSON with download URLs
// ListFiles returns JSON for frontend display (supports table/grid)
func ListFiles(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		rows, err := db.Query("SELECT id, filename, filepath, size, uploaded_at FROM files ORDER BY uploaded_at DESC")
		if err != nil {
			http.Error(w, "DB error", http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		type File struct {
			ID          int    `json:"id"`
			Filename    string `json:"filename"`
			Filepath    string `json:"filepath"`
			Size        int64  `json:"size"`
			UploadedAt  string `json:"uploaded_at"`
			DownloadURL string `json:"download_url"`
		}

		var files []File
		for rows.Next() {
			var f File
			var uploadedAt string
			err := rows.Scan(&f.ID, &f.Filename, &f.Filepath, &f.Size, &uploadedAt)
			if err != nil {
				http.Error(w, "DB error", http.StatusInternalServerError)
				return
			}
			f.UploadedAt = uploadedAt
			// Construct download URL
			f.DownloadURL = fmt.Sprintf("http://localhost:8080/download?id=%d", f.ID)
			files = append(files, f)
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(files)
	}
}

// DownloadFile serves a file by its ID
func DownloadFile(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := r.URL.Query().Get("id")
		if id == "" {
			http.Error(w, "Missing file id", http.StatusBadRequest)
			return
		}

		var filename string
		err := db.QueryRow("SELECT filename FROM files WHERE id=$1", id).Scan(&filename)
		if err != nil {
			http.Error(w, "File not found", http.StatusNotFound)
			return
		}

		filePath := filepath.Join(UploadDir, filename)
		w.Header().Set("Content-Disposition", "attachment; filename="+filename)
		http.ServeFile(w, r, filePath)
	}
}

// DeleteFile deletes a file by its ID
func DeleteFile(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := r.URL.Query().Get("id")
		if id == "" {
			http.Error(w, "Missing file id", http.StatusBadRequest)
			return
		}

		// Get the file path first
		var filepath string
		err := db.QueryRow("SELECT filepath FROM files WHERE id=$1", id).Scan(&filepath)
		if err != nil {
			http.Error(w, "File not found", http.StatusNotFound)
			return
		}

		// Delete from disk
		if err := os.Remove(filepath); err != nil {
			http.Error(w, "Failed to delete file from server", http.StatusInternalServerError)
			return
		}

		// Delete from database
		_, err = db.Exec("DELETE FROM files WHERE id=$1", id)
		if err != nil {
			http.Error(w, "Failed to delete file from database", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusOK)
		w.Write([]byte("File deleted successfully"))
	}
}
