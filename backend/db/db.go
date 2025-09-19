package db

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"time"

	_ "github.com/lib/pq"
)

func Connect() *sql.DB {
	host := os.Getenv("DB_HOST")
	port := os.Getenv("DB_PORT")
	user := os.Getenv("DB_USER")
	password := os.Getenv("DB_PASSWORD")
	dbname := os.Getenv("DB_NAME")

	connStr := fmt.Sprintf(
		"postgres://%s:%s@%s:%s/%s?sslmode=disable",
		user, password, host, port, dbname,
	)

	var db *sql.DB
	var err error

	// Retry logic
	for i := 0; i < 10; i++ { // try 10 times
		db, err = sql.Open("postgres", connStr)
		if err != nil {
			log.Printf("Attempt %d: failed to open DB: %v", i+1, err)
		} else if err = db.Ping(); err != nil {
			log.Printf("Attempt %d: cannot ping DB: %v", i+1, err)
		} else {
			log.Println("Successfully connected to DB!")
			return db
		}

		time.Sleep(5 * time.Second) // wait 5 seconds before retrying
	}

	log.Fatal("Could not connect to database after 10 attempts:", err)
	return nil
}
