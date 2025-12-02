.PHONY: proto clean

# Generate Go gRPC stubs from proto files
proto:
	protoc --go_out=. --go_opt=paths=source_relative \
		--go-grpc_out=. --go-grpc_opt=paths=source_relative \
		proto/planner/planner.proto

# Clean generated files
clean:
	rm -f proto/planner/*.pb.go

# Install protoc plugins (run once)
install-tools:
	go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
	go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest
