package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	plannerpb "github.com/UF-SASE-Web-Team/AI-Advisor/backend/services/api-gateway/proto/planner"
	ragpb "github.com/UF-SASE-Web-Team/AI-Advisor/backend/services/api-gateway/proto/rag"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

// UserPreference represents the JSON request from frontend
type UserPreference struct {
	X                  int              `json:"x"`
	Y                  int              `json:"y"`
	Z                  int              `json:"z"`
	MinCredits         int              `json:"min_credits"`
	MaxCredits         int              `json:"max_credits"`
	BlacklistedPeriods map[string][]int `json:"blacklisted_periods"`
}

// SolveResponse represents the JSON response to frontend
type SolveResponse struct {
	Status           string            `json:"status"`
	ScheduledCourses []ScheduledCourse `json:"scheduled_courses"`
	TotalCredits     int               `json:"total_credits"`
	ErrorMessage     string            `json:"error_message,omitempty"`
}

type ScheduledCourse struct {
	CourseID   string `json:"course_id"`
	CourseName string `json:"course_name"`
	Credits    int    `json:"credits"`
	Day        string `json:"day"`
	Period     int    `json:"period"`
	CourseType string `json:"course_type"`
}

// RAG types
type RAGQueryRequest struct {
	Question   string `json:"question"`
	MaxResults int    `json:"max_results,omitempty"`
	SessionID  string `json:"session_id,omitempty"`
	UserID     string `json:"user_id,omitempty"`
}

type RAGQueryResponse struct {
	Answer       string      `json:"answer"`
	Sources      []SourceDoc `json:"sources"`
	ErrorMessage string      `json:"error_message,omitempty"`
	SessionID    string      `json:"session_id,omitempty"`
}

type SourceDoc struct {
	CourseCode     string  `json:"course_code"`
	CourseName     string  `json:"course_name"`
	Content        string  `json:"content"`
	RelevanceScore float32 `json:"relevance_score"`
}

type CourseInfoRequest struct {
	CourseCode string `json:"course_code"`
}

type CourseInfoResponse struct {
	Found         bool          `json:"found"`
	CourseCode    string        `json:"course_code,omitempty"`
	CourseName    string        `json:"course_name,omitempty"`
	Description   string        `json:"description,omitempty"`
	Prerequisites string        `json:"prerequisites,omitempty"`
	Credits       int           `json:"credits,omitempty"`
	Department    string        `json:"department,omitempty"`
	Instructors   []string      `json:"instructors,omitempty"`
	MeetingTimes  []MeetingTime `json:"meeting_times,omitempty"`
	ErrorMessage  string        `json:"error_message,omitempty"`
}

type MeetingTime struct {
	Days      []string `json:"days"`
	TimeBegin string   `json:"time_begin"`
	TimeEnd   string   `json:"time_end"`
	Building  string   `json:"building"`
	Room      string   `json:"room"`
}

type TestResponse struct {
	Message  string      `json:"message"`
	Received interface{} `json:"received,omitempty"`
}

type ScheduleGenerateRequest struct {
	MaxCredits int `json:"max_credits"`
}

type TranscriptRow struct {
	ID              string   `json:"id"`
	Term            string   `json:"term,omitempty"`
	Course          string   `json:"course"`
	Name            string   `json:"name"`
	CreditAttempted *float64 `json:"credit_attempted"`
	EarnedHours     *float64 `json:"earned_hours"`
	CarriedHours    *float64 `json:"carried_hours"`
	Grade           string   `json:"grade,omitempty"`
}

type supabaseUserResponse struct {
	ID string `json:"id"`
}

var (
	savedPref     UserPreference
	plannerClient plannerpb.PlannerServiceClient
	ragClient     ragpb.RAGServiceClient
)

type Supabase struct {
	URL string
	Key string
}

type contextKey string

const userIDContextKey contextKey = "user_id"

func NewSupabase() *Supabase {
	return &Supabase{
		URL: os.Getenv("SUPABASE_URL"),
		Key: os.Getenv("SUPABASE_SERVICE_ROLE_KEY"),
	}
}

func getPlannerAddress() string {
	if addr := os.Getenv("PLANNER_GRPC_ADDR"); addr != "" {
		return addr
	}
	return "localhost:50051"
}

func getRAGAddress() string {
	if addr := os.Getenv("RAG_GRPC_ADDR"); addr != "" {
		return addr
	}
	return "localhost:50052"
}

func enableCORS(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Set CORS headers for all responses
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Access-Control-Max-Age", "86400") // Cache preflight for 24 hours

		// Handle preflight requests
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next(w, r)
	}
}

func getAuthenticatedUserID(r *http.Request) (string, int, string) {
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
		return "", http.StatusUnauthorized, "missing or invalid authorization header"
	}

	token := strings.TrimSpace(strings.TrimPrefix(authHeader, "Bearer "))
	if token == "" {
		return "", http.StatusUnauthorized, "missing bearer token"
	}

	supabaseURL := os.Getenv("SUPABASE_URL")
	serviceRoleKey := os.Getenv("SUPABASE_SERVICE_ROLE_KEY")
	if supabaseURL == "" || serviceRoleKey == "" {
		return "", http.StatusInternalServerError, "supabase configuration missing"
	}

	req, err := http.NewRequest(http.MethodGet, supabaseURL+"/auth/v1/user", nil)
	if err != nil {
		return "", http.StatusInternalServerError, "failed to create auth request"
	}
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("apikey", serviceRoleKey)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", http.StatusUnauthorized, "invalid or expired token"
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", http.StatusUnauthorized, "invalid or expired token"
	}

	var user supabaseUserResponse
	if err := json.NewDecoder(resp.Body).Decode(&user); err != nil {
		return "", http.StatusUnauthorized, "invalid or expired token"
	}

	if user.ID == "" {
		return "", http.StatusUnauthorized, "user id not found in token"
	}

	return user.ID, http.StatusOK, ""
}

func withAuthenticatedUser(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, statusCode, message := getAuthenticatedUserID(r)
		if statusCode != http.StatusOK {
			w.WriteHeader(statusCode)
			json.NewEncoder(w).Encode(map[string]string{"error": message})
			return
		}

		ctx := context.WithValue(r.Context(), userIDContextKey, userID)
		next(w, r.WithContext(ctx))
	}
}

func GetUserWithAuth(_ *Supabase, next http.HandlerFunc) http.HandlerFunc {
	return withAuthenticatedUser(next)
}

func handleTestEndpoint(message string) http.HandlerFunc {
	return withAuthenticatedUser(func(w http.ResponseWriter, r *http.Request) {
		userID, _ := userIDFromContext(r.Context())
		resp := TestResponse{Message: message}
		if userID != "" {
			resp.Received = map[string]string{"user_id": userID}
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp)
	})
}

func userIDFromContext(ctx context.Context) (string, bool) {
	userID, ok := ctx.Value(userIDContextKey).(string)
	return userID, ok
}

func fileExists(path string) bool {
	if path == "" {
		return false
	}
	_, err := os.Stat(path)
	return err == nil
}

func resolveParserCommand() (string, string, error) {
	pythonCandidates := []string{}
	if envPython := strings.TrimSpace(os.Getenv("TRANSCRIPT_PARSER_PYTHON")); envPython != "" {
		pythonCandidates = append(pythonCandidates, envPython)
	}
	pythonCandidates = append(pythonCandidates,
		"/usr/local/bin/python3",
		"/usr/bin/python3",
		"scripts/venv/Scripts/python.exe",
		"backend/scripts/venv/Scripts/python.exe",
		"../scripts/venv/Scripts/python.exe",
		"../../scripts/venv/Scripts/python.exe",
		"../../../scripts/venv/Scripts/python.exe",
		"python3",
		"python",
	)

	scriptCandidates := []string{}
	if envScript := strings.TrimSpace(os.Getenv("TRANSCRIPT_PARSER_SCRIPT")); envScript != "" {
		scriptCandidates = append(scriptCandidates, envScript)
	}
	scriptCandidates = append(scriptCandidates,
		"/opt/transcript-parser.py",
		"scripts/transcript-parser.py",
		"backend/scripts/transcript-parser.py",
		"../scripts/transcript-parser.py",
		"../../scripts/transcript-parser.py",
		"../../../scripts/transcript-parser.py",
	)

	var parserScript string
	for _, candidate := range scriptCandidates {
		clean := filepath.Clean(candidate)
		if fileExists(clean) {
			parserScript = clean
			break
		}
	}
	if parserScript == "" {
		return "", "", fmt.Errorf("transcript parser script not found")
	}

	for _, candidate := range pythonCandidates {
		clean := filepath.Clean(candidate)
		if strings.Contains(clean, "/") || strings.Contains(clean, "\\") {
			if fileExists(clean) {
				return clean, parserScript, nil
			}
			continue
		}

		if resolved, err := exec.LookPath(clean); err == nil {
			return resolved, parserScript, nil
		}
	}

	return "", "", fmt.Errorf("python runtime for transcript parser not found")
}

func parseTranscriptToJSON(pdfBytes []byte) ([]byte, int, error) {
	pythonCmd, parserScript, err := resolveParserCommand()
	if err != nil {
		return nil, 0, err
	}

	tmpDir, err := os.MkdirTemp("", "transcript-parse-*")
	if err != nil {
		return nil, 0, err
	}
	defer os.RemoveAll(tmpDir)

	pdfPath := filepath.Join(tmpDir, "transcript.pdf")
	if err := os.WriteFile(pdfPath, pdfBytes, 0600); err != nil {
		return nil, 0, err
	}

	cmd := exec.Command(pythonCmd, parserScript, pdfPath, "--stdout")
	out, err := cmd.CombinedOutput()
	if err != nil {
		return nil, 0, fmt.Errorf("parser execution failed: %v: %s", err, string(out))
	}

	parsedJSON := bytes.TrimSpace(out)
	if !json.Valid(parsedJSON) {
		return nil, 0, fmt.Errorf("parser output is not valid json")
	}

	var parsed map[string][]map[string]string
	if err := json.Unmarshal(parsedJSON, &parsed); err != nil {
		return nil, 0, fmt.Errorf("failed to decode parsed transcript json")
	}

	courseCount := 0
	for _, courses := range parsed {
		for _, course := range courses {
			if course["course"] == "" || course["name"] == "" {
				continue
			}
			courseCount++
		}
	}

	if courseCount == 0 {
		return nil, 0, fmt.Errorf("no courses extracted from transcript")
	}

	return parsedJSON, courseCount, nil
}

func resolveScheduleGeneratorCommand() (string, string, error) {
	pythonCandidates := []string{}
	if envPython := strings.TrimSpace(os.Getenv("SCHEDULE_GENERATOR_PYTHON")); envPython != "" {
		pythonCandidates = append(pythonCandidates, envPython)
	}
	pythonCandidates = append(pythonCandidates,
		"/usr/local/bin/python3",
		"/usr/bin/python3",
		"scripts/venv/Scripts/python.exe",
		"backend/scripts/venv/Scripts/python.exe",
		"../scripts/venv/Scripts/python.exe",
		"../../scripts/venv/Scripts/python.exe",
		"../../../scripts/venv/Scripts/python.exe",
		"python3",
		"python",
	)

	scriptCandidates := []string{}
	if envScript := strings.TrimSpace(os.Getenv("SCHEDULE_GENERATOR_SCRIPT")); envScript != "" {
		scriptCandidates = append(scriptCandidates, envScript)
	}
	scriptCandidates = append(scriptCandidates,
		"scripts/scheduleGenerator.py",
		"backend/scripts/scheduleGenerator.py",
		"../scripts/scheduleGenerator.py",
		"../../scripts/scheduleGenerator.py",
		"../../../scripts/scheduleGenerator.py",
	)

	var scheduleScript string
	for _, candidate := range scriptCandidates {
		clean := filepath.Clean(candidate)
		if fileExists(clean) {
			scheduleScript = clean
			break
		}
	}
	if scheduleScript == "" {
		return "", "", fmt.Errorf("schedule generator script not found")
	}

	for _, candidate := range pythonCandidates {
		clean := filepath.Clean(candidate)
		if strings.Contains(clean, "/") || strings.Contains(clean, "\\") {
			if fileExists(clean) {
				return clean, scheduleScript, nil
			}
			continue
		}

		if resolved, err := exec.LookPath(clean); err == nil {
			return resolved, scheduleScript, nil
		}
	}

	return "", "", fmt.Errorf("python runtime for schedule generator not found")
}

func generateScheduleForUser(userID string, maxCredits int) ([]byte, error) {
	pythonCmd, scheduleScript, err := resolveScheduleGeneratorCommand()
	if err != nil {
		return nil, err
	}

	tmpDir, err := os.MkdirTemp("", "schedule-generate-*")
	if err != nil {
		return nil, err
	}
	defer os.RemoveAll(tmpDir)

	outputPath := filepath.Join(tmpDir, "schedule.json")
	args := []string{scheduleScript, userID, "--output", outputPath}
	if maxCredits > 0 {
		args = append(args, "--max-credits", strconv.Itoa(maxCredits))
	}

	cmd := exec.Command(pythonCmd, args...)
	out, err := cmd.CombinedOutput()
	if err != nil {
		return nil, fmt.Errorf("schedule generation failed: %v: %s", err, string(out))
	}

	scheduleJSON, err := os.ReadFile(outputPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read generated schedule")
	}

	trimmed := bytes.TrimSpace(scheduleJSON)
	if !json.Valid(trimmed) {
		return nil, fmt.Errorf("generated schedule is not valid json")
	}

	return trimmed, nil
}

func parseNullableFloat(value string) *float64 {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" || trimmed == "--" {
		return nil
	}

	parsed, err := strconv.ParseFloat(trimmed, 64)
	if err != nil {
		return nil
	}
	return &parsed
}

func transcriptRowsFromParsedJSON(parsedTranscript []byte, userID string) ([]TranscriptRow, error) {
	var parsed map[string][]map[string]string
	if err := json.Unmarshal(parsedTranscript, &parsed); err != nil {
		return nil, fmt.Errorf("failed to decode parsed transcript json")
	}

	rows := make([]TranscriptRow, 0)
	for term, courses := range parsed {
		for _, course := range courses {
			courseCode := strings.TrimSpace(course["course"])
			courseName := strings.TrimSpace(course["name"])
			if courseCode == "" || courseName == "" {
				continue
			}

			row := TranscriptRow{
				ID:              userID,
				Term:            strings.TrimSpace(term),
				Course:          courseCode,
				Name:            courseName,
				CreditAttempted: parseNullableFloat(course["credit_attempted"]),
				EarnedHours:     parseNullableFloat(course["earned_hours"]),
				CarriedHours:    parseNullableFloat(course["carried_hours"]),
				Grade:           strings.TrimSpace(course["grade"]),
			}

			rows = append(rows, row)
		}
	}

	if len(rows) == 0 {
		return nil, fmt.Errorf("no transcript rows were generated")
	}

	return rows, nil
}

func main() {
	supabase := NewSupabase()

	// Connect to planner gRPC service
	plannerAddr := getPlannerAddress()
	plannerConn, err := grpc.NewClient(
		plannerAddr,
		grpc.WithTransportCredentials(insecure.NewCredentials()),
	)
	if err != nil {
		log.Fatalf("Failed to connect to planner service: %v", err)
	}
	defer plannerConn.Close()

	plannerClient = plannerpb.NewPlannerServiceClient(plannerConn)
	log.Printf("Connected to planner gRPC service at %s", plannerAddr)

	// Connect to RAG gRPC service
	ragAddr := getRAGAddress()
	ragConn, err := grpc.NewClient(
		ragAddr,
		grpc.WithTransportCredentials(insecure.NewCredentials()),
	)
	if err != nil {
		log.Fatalf("Failed to connect to RAG service: %v", err)
	}
	defer ragConn.Close()

	ragClient = ragpb.NewRAGServiceClient(ragConn)
	log.Printf("Connected to RAG gRPC service at %s", ragAddr)

	// Health check
	http.HandleFunc("/health", enableCORS(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(200)
		fmt.Fprintln(w, "ok")
	}))

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, "hello from api-gateway")
	})

	// User preference endpoint
	http.HandleFunc("/api/userpreference/", enableCORS(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			w.WriteHeader(http.StatusMethodNotAllowed)
			return
		}

		var currPref UserPreference
		err := json.NewDecoder(r.Body).Decode(&currPref)
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			fmt.Fprintln(w, "invalid request body")
			return
		}

		savedPref = currPref
		log.Printf("Received user preference: %+v\n", currPref)

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"status": "saved"})
	}))

	// Planner solve endpoint
	http.HandleFunc("/api/solve/", enableCORS(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			w.WriteHeader(http.StatusMethodNotAllowed)
			return
		}

		blacklisted := make(map[string]*plannerpb.BlacklistedPeriods)
		for day, periods := range savedPref.BlacklistedPeriods {
			intPeriods := make([]int32, len(periods))
			for i, p := range periods {
				intPeriods[i] = int32(p)
			}
			blacklisted[day] = &plannerpb.BlacklistedPeriods{Periods: intPeriods}
		}

		req := &plannerpb.SolveRequest{
			Preference: &plannerpb.UserPreference{
				X:                  int32(savedPref.X),
				Y:                  int32(savedPref.Y),
				Z:                  int32(savedPref.Z),
				MinCredits:         int32(savedPref.MinCredits),
				MaxCredits:         int32(savedPref.MaxCredits),
				BlacklistedPeriods: blacklisted,
			},
		}

		ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
		defer cancel()

		resp, err := plannerClient.Solve(ctx, req)
		if err != nil {
			log.Printf("Failed to call planner service: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(SolveResponse{
				Status:       "error",
				ErrorMessage: "failed to contact planner service",
			})
			return
		}

		courses := make([]ScheduledCourse, len(resp.ScheduledCourses))
		for i, c := range resp.ScheduledCourses {
			courses[i] = ScheduledCourse{
				CourseID:   c.CourseId,
				CourseName: c.CourseName,
				Credits:    int(c.Credits),
				Day:        c.Day,
				Period:     int(c.Period),
				CourseType: c.CourseType,
			}
		}

		jsonResp := SolveResponse{
			Status:           resp.Status,
			ScheduledCourses: courses,
			TotalCredits:     int(resp.TotalCredits),
			ErrorMessage:     resp.ErrorMessage,
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(jsonResp)
	}))

	// RAG query endpoint
	http.HandleFunc("/api/v2/advisor/query/", enableCORS(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			w.WriteHeader(http.StatusMethodNotAllowed)
			return
		}

		var reqBody RAGQueryRequest
		err := json.NewDecoder(r.Body).Decode(&reqBody)
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			fmt.Fprintln(w, "invalid request body")
			return
		}

		if reqBody.Question == "" {
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(RAGQueryResponse{
				ErrorMessage: "question is required",
			})
			return
		}

		maxResults := int32(5)
		if reqBody.MaxResults > 0 {
			maxResults = int32(reqBody.MaxResults)
		}

		log.Printf("RAG query: %s", reqBody.Question)

		ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
		defer cancel()

		resp, err := ragClient.Query(ctx, &ragpb.QueryRequest{
			Question:   reqBody.Question,
			MaxResults: maxResults,
			SessionId:  reqBody.SessionID,
			UserId:     reqBody.UserID,
		})
		if err != nil {
			log.Printf("Failed to call RAG service: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(RAGQueryResponse{
				ErrorMessage: "failed to contact RAG service",
			})
			return
		}

		sources := make([]SourceDoc, len(resp.Sources))
		for i, s := range resp.Sources {
			sources[i] = SourceDoc{
				CourseCode:     s.CourseCode,
				CourseName:     s.CourseName,
				Content:        s.Content,
				RelevanceScore: s.RelevanceScore,
			}
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(RAGQueryResponse{
			Answer:       resp.Answer,
			Sources:      sources,
			ErrorMessage: resp.ErrorMessage,
			SessionID:    resp.SessionId,
		})
	}))

	// Create chat session endpoint
	http.HandleFunc("/api/v2/advisor/session/", enableCORS(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			w.WriteHeader(http.StatusMethodNotAllowed)
			return
		}

		var reqBody struct {
			Title  string `json:"title"`
			UserID string `json:"user_id"`
		}
		json.NewDecoder(r.Body).Decode(&reqBody)

		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		resp, err := ragClient.CreateSession(ctx, &ragpb.CreateSessionRequest{
			Title:  reqBody.Title,
			UserId: reqBody.UserID,
		})
		if err != nil {
			log.Printf("Failed to create session: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "failed to create session"})
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"session_id": resp.SessionId})
	}))

	// Get sessions for a user
	http.HandleFunc("/api/v2/advisor/sessions/", enableCORS(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			w.WriteHeader(http.StatusMethodNotAllowed)
			return
		}

		userID := r.URL.Query().Get("user_id")
		if userID == "" {
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "user_id query parameter is required"})
			return
		}

		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		resp, err := ragClient.GetSessions(ctx, &ragpb.GetSessionsRequest{UserId: userID})
		if err != nil {
			log.Printf("Failed to get sessions: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "failed to get sessions"})
			return
		}

		type SessionJSON struct {
			SessionID string `json:"session_id"`
			Title     string `json:"title"`
			CreatedAt string `json:"created_at"`
			UpdatedAt string `json:"updated_at"`
		}
		sessions := make([]SessionJSON, len(resp.Sessions))
		for i, s := range resp.Sessions {
			sessions[i] = SessionJSON{
				SessionID: s.SessionId,
				Title:     s.Title,
				CreatedAt: s.CreatedAt,
				UpdatedAt: s.UpdatedAt,
			}
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{"sessions": sessions})
	}))

	// Get messages for a session
	http.HandleFunc("/api/v2/advisor/messages/", enableCORS(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			w.WriteHeader(http.StatusMethodNotAllowed)
			return
		}

		sessionID := r.URL.Query().Get("session_id")
		if sessionID == "" {
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "session_id query parameter is required"})
			return
		}

		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		resp, err := ragClient.GetMessages(ctx, &ragpb.GetMessagesRequest{SessionId: sessionID})
		if err != nil {
			log.Printf("Failed to get messages: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "failed to get messages"})
			return
		}

		type MessageJSON struct {
			Role      string `json:"role"`
			Content   string `json:"content"`
			CreatedAt string `json:"created_at"`
		}
		messages := make([]MessageJSON, len(resp.Messages))
		for i, m := range resp.Messages {
			messages[i] = MessageJSON{
				Role:      m.Role,
				Content:   m.Content,
				CreatedAt: m.CreatedAt,
			}
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{"messages": messages})
	}))

	// Course info endpoint
	http.HandleFunc("/api/v2/advisor/course/", enableCORS(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			w.WriteHeader(http.StatusMethodNotAllowed)
			return
		}

		var reqBody CourseInfoRequest
		err := json.NewDecoder(r.Body).Decode(&reqBody)
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			fmt.Fprintln(w, "invalid request body")
			return
		}

		if reqBody.CourseCode == "" {
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(CourseInfoResponse{
				Found:        false,
				ErrorMessage: "course_code is required",
			})
			return
		}

		log.Printf("Course info request: %s", reqBody.CourseCode)

		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		resp, err := ragClient.GetCourseInfo(ctx, &ragpb.CourseInfoRequest{
			CourseCode: reqBody.CourseCode,
		})
		if err != nil {
			log.Printf("Failed to call RAG service: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(CourseInfoResponse{
				Found:        false,
				ErrorMessage: "failed to contact RAG service",
			})
			return
		}

		meetingTimes := make([]MeetingTime, len(resp.MeetingTimes))
		for i, mt := range resp.MeetingTimes {
			meetingTimes[i] = MeetingTime{
				Days:      mt.Days,
				TimeBegin: mt.TimeBegin,
				TimeEnd:   mt.TimeEnd,
				Building:  mt.Building,
				Room:      mt.Room,
			}
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(CourseInfoResponse{
			Found:         resp.Found,
			CourseCode:    resp.CourseCode,
			CourseName:    resp.CourseName,
			Description:   resp.Description,
			Prerequisites: resp.Prerequisites,
			Credits:       int(resp.Credits),
			Department:    resp.Department,
			Instructors:   resp.Instructors,
			MeetingTimes:  meetingTimes,
			ErrorMessage:  resp.ErrorMessage,
		})
	}))

	// Transcript PDF upload endpoint
	http.HandleFunc("/api/v2/transcript/upload/", enableCORS(GetUserWithAuth(supabase, func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		if r.Method != http.MethodPost {
			w.WriteHeader(http.StatusMethodNotAllowed)
			return
		}

		userID, ok := userIDFromContext(r.Context())
		if !ok || userID == "" {
			w.WriteHeader(http.StatusUnauthorized)
			json.NewEncoder(w).Encode(map[string]string{"error": "unauthorized"})
			return
		}

		maxFileSize := int64(2 << 20) // 2MB, can be more if wanted
		r.Body = http.MaxBytesReader(w, r.Body, maxFileSize)
		if err := r.ParseMultipartForm(maxFileSize); err != nil {
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "file is too big or not pdf"})
			return
		}
		defer func() {
			if r.MultipartForm != nil {
				_ = r.MultipartForm.RemoveAll()
			}
		}()

		file, header, err := r.FormFile("transcript") // where the pdf file is sent in
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "missing 'transcript' field"})
			return
		}
		defer file.Close()

		// ensures only pdfs are uploaded - the supabase bucket also checks
		contentType := strings.ToLower(header.Header.Get("Content-Type"))
		if !strings.Contains(contentType, "application/pdf") {
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "only PDF files are accepted"})
			return
		}

		fileBytes, err := io.ReadAll(file)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "failed to read file"})
			return
		}
		parsedTranscript, courseCount, err := parseTranscriptToJSON(fileBytes)
		if err != nil {
			log.Printf("Transcript parse error: %v", err)
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "failed to parse transcript pdf"})
			return
		}

		rows, err := transcriptRowsFromParsedJSON(parsedTranscript, userID)
		if err != nil {
			log.Printf("Transcript row mapping error: %v", err)
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "failed to map parsed transcript data"})
			return
		}

		// grabbing supabase credentials from .env
		// make sure you have a .env in the backend folder
		supabaseURL := os.Getenv("SUPABASE_URL")
		serviceRoleKey := os.Getenv("SUPABASE_SERVICE_ROLE_KEY")
		if supabaseURL == "" || serviceRoleKey == "" {
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "supabase configuration missing"})
			return
		}

		existingURL := fmt.Sprintf("%s/rest/v1/transcript?id=eq.%s&select=id,course,name", supabaseURL, url.QueryEscape(userID))
		existingReq, err := http.NewRequest(http.MethodGet, existingURL, nil)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "failed to create transcript lookup request"})
			return
		}

		existingReq.Header.Set("Authorization", "Bearer "+serviceRoleKey)
		existingReq.Header.Set("apikey", serviceRoleKey)
		existingReq.Header.Set("Accept", "application/json")

		httpClient := &http.Client{}
		existingResp, err := httpClient.Do(existingReq)
		if err != nil {
			log.Printf("Supabase transcript lookup error: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "failed to load existing transcript rows"})
			return
		}
		defer existingResp.Body.Close()

		if existingResp.StatusCode < 200 || existingResp.StatusCode >= 300 {
			body, _ := io.ReadAll(existingResp.Body)
			log.Printf("Supabase transcript lookup returned error %d: %s", existingResp.StatusCode, string(body))
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "failed to load existing transcript rows"})
			return
		}

		var existingRows []map[string]string
		if err := json.NewDecoder(existingResp.Body).Decode(&existingRows); err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "failed to decode existing transcript rows"})
			return
		}

		existingKeys := make(map[string]struct{}, len(existingRows))
		for _, existing := range existingRows {
			if strings.TrimSpace(existing["id"]) != userID {
				continue
			}
			course := strings.TrimSpace(existing["course"])
			name := strings.TrimSpace(existing["name"])
			if course == "" || name == "" {
				continue
			}
			existingKeys[userID+"|"+course+"|"+name] = struct{}{}
		}

		rowsToInsert := make([]TranscriptRow, 0, len(rows))
		seenKeys := make(map[string]struct{}, len(existingKeys))
		for key := range existingKeys {
			seenKeys[key] = struct{}{}
		}
		for _, row := range rows {
			if strings.TrimSpace(row.ID) != userID {
				continue
			}
			key := userID + "|" + strings.TrimSpace(row.Course) + "|" + strings.TrimSpace(row.Name)
			if _, exists := seenKeys[key]; exists {
				continue
			}
			seenKeys[key] = struct{}{}
			rowsToInsert = append(rowsToInsert, row)
		}

		if len(rowsToInsert) == 0 {
			w.WriteHeader(http.StatusOK)
			json.NewEncoder(w).Encode(map[string]interface{}{
				"message":       "no new transcript rows to insert",
				"user_id":       userID,
				"course_count":  courseCount,
				"inserted_rows": 0,
			})
			return
		}

		rowsPayload, err := json.Marshal(rowsToInsert)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "failed to encode transcript rows"})
			return
		}

		insertURL := supabaseURL + "/rest/v1/transcript"
		req, err := http.NewRequest(http.MethodPost, insertURL, bytes.NewReader(rowsPayload))
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "failed to create transcript insert request"})
			return
		}

		req.Header.Set("Authorization", "Bearer "+serviceRoleKey)
		req.Header.Set("apikey", serviceRoleKey)
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Prefer", "return=minimal")

		resp, err := httpClient.Do(req)
		if err != nil {
			log.Printf("Supabase transcript insert error: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "failed to insert transcript rows"})
			return
		}
		defer resp.Body.Close()

		if resp.StatusCode < 200 || resp.StatusCode >= 300 {
			body, _ := io.ReadAll(resp.Body)
			log.Printf("Supabase returned error %d: %s", resp.StatusCode, string(body))
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "transcript insert failed"})
			return
		}

		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"message":       "transcript parsed and inserted successfully",
			"user_id":       userID,
			"course_count":  courseCount,
			"inserted_rows": len(rowsToInsert),
		})
	})))

	// Schedule generation endpoint
	http.HandleFunc("/api/v2/schedule/generate/", enableCORS(GetUserWithAuth(supabase, func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		if r.Method != http.MethodPost {
			w.WriteHeader(http.StatusMethodNotAllowed)
			return
		}

		userID, ok := userIDFromContext(r.Context())
		if !ok || userID == "" {
			w.WriteHeader(http.StatusUnauthorized)
			json.NewEncoder(w).Encode(map[string]string{"error": "unauthorized"})
			return
		}

		var reqBody ScheduleGenerateRequest
		if r.Body != nil {
			defer r.Body.Close()
			if err := json.NewDecoder(r.Body).Decode(&reqBody); err != nil {
				w.WriteHeader(http.StatusBadRequest)
				json.NewEncoder(w).Encode(map[string]string{"error": "invalid request body"})
				return
			}
		}

		if reqBody.MaxCredits <= 0 {
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "max_credits is required and must be greater than 0"})
			return
		}

		scheduleJSON, err := generateScheduleForUser(userID, reqBody.MaxCredits)
		if err != nil {
			log.Printf("Schedule generation error for user %s: %v", userID, err)
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "failed to generate schedule"})
			return
		}

		w.WriteHeader(http.StatusOK)
		_, _ = w.Write(scheduleJSON)
	})))

	log.Println("api-gateway :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
