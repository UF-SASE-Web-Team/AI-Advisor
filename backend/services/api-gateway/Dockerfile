FROM golang:1.24.3 as build

WORKDIR /src/services/api-gateway

# Install protoc and Go plugins
RUN apt-get update && apt-get install -y protobuf-compiler && rm -rf /var/lib/apt/lists/*
RUN go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
RUN go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest

# Copy go.mod first for caching
COPY services/api-gateway/go.mod services/api-gateway/go.sum* ./
RUN go mod download || true

# Copy proto files and generate Go stubs
COPY services/api-gateway/proto ./proto
RUN protoc --go_out=. --go_opt=paths=source_relative \
    --go-grpc_out=. --go-grpc_opt=paths=source_relative \
    proto/planner/planner.proto \
    proto/rag/rag.proto

# Copy source code and build
COPY services/api-gateway/. .
RUN go mod tidy
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /out/api ./cmd

FROM python:3.11-slim

RUN pip install --no-cache-dir pypdf httpx python-dotenv

COPY --from=build /out/api /api
COPY scripts/transcript-parser.py /opt/transcript-parser.py
COPY scripts/scheduleGenerator.py /opt/scheduleGenerator.py

ENV TRANSCRIPT_PARSER_PYTHON=python3
ENV TRANSCRIPT_PARSER_SCRIPT=/opt/transcript-parser.py
ENV SCHEDULE_GENERATOR_SCRIPT=/opt/scheduleGenerator.py
ENV SCHEDULE_GENERATOR_PYTHON=/usr/local/bin/python3

EXPOSE 8080

ENTRYPOINT ["/api"]
