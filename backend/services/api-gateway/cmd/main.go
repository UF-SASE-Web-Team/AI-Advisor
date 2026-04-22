package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
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
}

type RAGQueryResponse struct {
	Answer       string      `json:"answer"`
	Sources      []SourceDoc `json:"sources"`
	ErrorMessage string      `json:"error_message,omitempty"`
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
	http.HandleFunc("/api/rag/query/", enableCORS(func(w http.ResponseWriter, r *http.Request) {
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
		})
	}))

	// Course info endpoint
	http.HandleFunc("/api/rag/course/", enableCORS(func(w http.ResponseWriter, r *http.Request) {
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

		file, header, err := r.FormFile("transcript") // where the pdf file is sent in
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "missing 'transcript' field"})
			return
		}
		defer file.Close()

		// ensures only pdfs are uploaded - the supabase bucket also checks
		if header.Header.Get("Content-Type") != "application/pdf" {
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
		// creates filename, just userID_transcript
		filename := fmt.Sprintf("%s_transcript.pdf", userID)

		// grabbing supabase credentials from .env
		// make sure you have a .env in the backend folder
		supabaseURL := os.Getenv("SUPABASE_URL")
		serviceRoleKey := os.Getenv("SUPABASE_SERVICE_ROLE_KEY")
		if supabaseURL == "" || serviceRoleKey == "" {
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "supabase configuration missing"})
			return
		}

		uploadURL := supabaseURL + "/storage/v1/object/student-transcripts/" + filename
		req, err := http.NewRequest(http.MethodPost, uploadURL, bytes.NewReader(fileBytes))
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "failed to create upload request"})
			return
		}

		req.Header.Set("Authorization", "Bearer "+serviceRoleKey)
		req.Header.Set("Content-Type", "application/pdf")
		req.Header.Set("x-upsert", "true") // replaces old transcript if needed

		httpClient := &http.Client{}
		resp, err := httpClient.Do(req)
		if err != nil {
			log.Printf("Supabase upload error: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "failed to upload to storage"})
			return
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
			body, _ := io.ReadAll(resp.Body)
			log.Printf("Supabase returned error %d: %s", resp.StatusCode, string(body))
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "storage upload failed"})
			return
		}

		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(map[string]string{
			"message":  "transcript uploaded successfully",
			"user_id":  userID,
			"filename": filename,
		})
	})))

	log.Println("api-gateway :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
