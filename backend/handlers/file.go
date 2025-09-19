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

func UploadFile(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		log.Println("Upload handler hit")

		err := r.ParseMultipartForm(200 << 20)
		if err != nil {
			log.Println("ParseMultipartForm error:", err)
			http.Error(w, "Invalid form data", http.StatusBadRequest)
			return
		}

		files := r.MultipartForm.File["files"]
		if len(files) == 0 {
			http.Error(w, "No files uploaded", http.StatusBadRequest)
			return
		}

		os.MkdirAll(UploadDir, os.ModePerm)

		type UploadResult struct {
			Filename string `json:"filename"`
			Status   string `json:"status"`
		}
		var results []UploadResult

		for _, header := range files {
			file, err := header.Open()
			if err != nil {
				results = append(results, UploadResult{Filename: header.Filename, Status: "Failed to open"})
				continue
			}
			defer file.Close()

			content, err := io.ReadAll(file)
			if err != nil {
				results = append(results, UploadResult{Filename: header.Filename, Status: "Failed to read"})
				continue
			}

			hash := fmt.Sprintf("%x", sha256.Sum256(content))

			var id int
			err = db.QueryRow("SELECT id FROM files WHERE sha256=$1", hash).Scan(&id)
			if err == sql.ErrNoRows {

				destPath := filepath.Join(UploadDir, header.Filename)
				if err := os.WriteFile(destPath, content, 0644); err != nil {
					results = append(results, UploadResult{Filename: header.Filename, Status: "Failed to save"})
					continue
				}

				_, err := db.Exec(
					`INSERT INTO files (filename, filepath, size, mime_type, sha256, reference_count) 
                     VALUES ($1,$2,$3,$4,$5,$6)`,
					header.Filename, destPath, header.Size, header.Header.Get("Content-Type"), hash, 1,
				)
				if err != nil {
					results = append(results, UploadResult{Filename: header.Filename, Status: "DB error"})
					continue
				}

				results = append(results, UploadResult{Filename: header.Filename, Status: "Uploaded"})
			} else if err == nil {

				_, _ = db.Exec("UPDATE files SET reference_count = reference_count + 1 WHERE id=$1", id)
				results = append(results, UploadResult{Filename: header.Filename, Status: "Duplicate → count incremented"})
			} else {
				results = append(results, UploadResult{Filename: header.Filename, Status: "DB error"})
			}
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(results)
	}
}

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

			f.DownloadURL = fmt.Sprintf("http://localhost:8080/download?id=%d", f.ID)
			files = append(files, f)
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(files)
	}
}

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

func DeleteFile(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := r.URL.Query().Get("id")
		if id == "" {
			http.Error(w, "Missing file id", http.StatusBadRequest)
			return
		}

		var filepath string
		err := db.QueryRow("SELECT filepath FROM files WHERE id=$1", id).Scan(&filepath)
		if err != nil {
			http.Error(w, "File not found", http.StatusNotFound)
			return
		}

		if err := os.Remove(filepath); err != nil {
			http.Error(w, "Failed to delete file from server", http.StatusInternalServerError)
			return
		}

		_, err = db.Exec("DELETE FROM files WHERE id=$1", id)
		if err != nil {
			http.Error(w, "Failed to delete file from database", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusOK)
		w.Write([]byte("File deleted successfully"))
	}
}
