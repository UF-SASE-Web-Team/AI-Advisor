module github.com/UF-SASE-Web-Team/AI-Advisor/backend/services/api-gateway

go 1.24.3

require google.golang.org/grpc v1.79.1

require (
	golang.org/x/net v0.48.0 // indirect
	golang.org/x/sys v0.39.0 // indirect
	golang.org/x/text v0.32.0 // indirect
	google.golang.org/genproto/googleapis/rpc v0.0.0-20251202230838-ff82c1b0f217 // indirect
	google.golang.org/protobuf v1.36.10 // indirect
)

replace github.com/UF-SASE-Web-Team/AI-Advisor/backend/services/api-gateway/proto/planner => ../proto/planner

replace github.com/UF-SASE-Web-Team/AI-Advisor/backend/services/api-gateway/proto/rag => ../proto/rag
