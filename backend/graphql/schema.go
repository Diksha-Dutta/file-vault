package graphql

import (
	"database/sql"

	"github.com/graphql-go/graphql"
)

func NewSchema(db *sql.DB) (graphql.Schema, error) {
	totalStorage := &graphql.Field{
		Type: graphql.Int,
		Resolve: func(p graphql.ResolveParams) (interface{}, error) {
			var total int64
			err := db.QueryRow("SELECT COALESCE(SUM(size),0) FROM files").Scan(&total)
			return total, err
		},
	}

	uploadsPerUser := &graphql.Field{
		Type: graphql.NewList(graphql.NewObject(graphql.ObjectConfig{
			Name: "UserUploadStat",
			Fields: graphql.Fields{
				"userId":  &graphql.Field{Type: graphql.ID},
				"email":   &graphql.Field{Type: graphql.String},
				"uploads": &graphql.Field{Type: graphql.Int},
			},
		})),
		Resolve: func(p graphql.ResolveParams) (interface{}, error) {
			rows, err := db.Query("SELECT user_id, email, COUNT(*) FROM files JOIN users ON files.user_id=users.id GROUP BY user_id,email")
			if err != nil {
				return nil, err
			}
			defer rows.Close()
			var stats []map[string]interface{}
			for rows.Next() {
				var id, email string
				var count int
				rows.Scan(&id, &email, &count)
				stats = append(stats, map[string]interface{}{
					"userId":  id,
					"email":   email,
					"uploads": count,
				})
			}
			return stats, nil
		},
	}

	rootQuery := graphql.NewObject(graphql.ObjectConfig{
		Name: "Query",
		Fields: graphql.Fields{
			"totalStorageUsage": totalStorage,
			"uploadsPerUser":    uploadsPerUser,
		},
	})

	return graphql.NewSchema(graphql.SchemaConfig{
		Query: rootQuery,
	})
}
