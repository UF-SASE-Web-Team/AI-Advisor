FROM golang:1.24.3 as build

WORKDIR /src

# Install protoc and Go plugins
RUN apt-get update && apt-get install -y protobuf-compiler && rm -rf /var/lib/apt/lists/*
RUN go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
RUN go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest

# Copy go.mod first for caching
COPY go.mod go.sum* ./
RUN go mod download || true

# Copy proto files and generate Go stubs
COPY proto ./proto
RUN protoc --go_out=. --go_opt=paths=source_relative \
    --go-grpc_out=. --go-grpc_opt=paths=source_relative \
    proto/planner/planner.proto \
    proto/rag/rag.proto

# Copy source code and build
COPY . .
RUN go mod tidy
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /out/api ./cmd

FROM gcr.io/distroless/base-debian12
COPY --from=build /out/api /api
EXPOSE 8080
USER nonroot:nonroot
ENTRYPOINT ["/api"]
