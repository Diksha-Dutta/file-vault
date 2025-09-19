package main

import (
	"filevault/db"
	"filevault/handlers"
	"log"
	"net/http"
)

func main() {
	database := db.Connect()

	// CORS middleware
	cors := func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
			w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

			if r.Method == "OPTIONS" {
				w.WriteHeader(http.StatusOK)
				return
			}

			next.ServeHTTP(w, r)
		})
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/upload", handlers.UploadFile(database))
	mux.HandleFunc("/files", handlers.ListFiles(database))
	mux.HandleFunc("/download", handlers.DownloadFile(database))
	mux.HandleFunc("/delete", handlers.DeleteFile(database))

	log.Println("Server started at :8080")
	http.ListenAndServe(":8080", cors(mux))
}
