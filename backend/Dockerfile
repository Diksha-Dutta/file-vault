# Use official Golang image
FROM golang:1.25-alpine


WORKDIR /app

# Copy go.mod and download dependencies
COPY go.mod .
COPY go.sum .
RUN go mod download

# Copy source
COPY . .

# Build Go app
RUN go build -o main .

# Create uploads folder
RUN mkdir -p uploads

EXPOSE 8080

# Run server
CMD ["./main"]
