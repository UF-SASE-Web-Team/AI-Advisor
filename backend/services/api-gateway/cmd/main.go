package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
)

type UserPreference struct {
	// INT X major courses
	X int `json:"x"`
	// INT Y minor courses
	Y int `json:"y"`
	// INT Z elective courses
	Z int `json:"z"`
	// INT min credits
	MinCredits int `json:"min_credits"`
	// INT max credits
	MaxCredits int `json:"max_credits"`
	// List of blacklisted periods (e.g. "M" -> [1,2,3], "T" -> [4,5])
	BlacklistedPeriods map[string][]int `json:"blacklisted_periods"`
}

// Saved user preference
// MOVE ON REFACTOR
var savedPref UserPreference

const ORTOOLURL = "http://localhost:8000/solve"

// Enable CORS for all origins (for testing purposes)
func enableCORS(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Allow requests from any origin (for testing only)
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		// Handle "Preflight" OPTIONS request
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next(w, r)
	}
}

func main() {
	http.HandleFunc("/health", enableCORS(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(200)
		fmt.Fprintln(w, "ok")
	}))

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, "hello from api-gateway")
	})

	// Endpoint to receive user preferences
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
	}))

	// Endpoint to forward request to OR-Tools solver service
	http.HandleFunc("/api/solve/", enableCORS(func(w http.ResponseWriter, r *http.Request) {
		// post request only
		if r.Method != http.MethodPost {
			w.WriteHeader(http.StatusMethodNotAllowed)
			return
		}

		// Put the saved user preference into JSON
		jsonData, err := json.Marshal(savedPref)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			fmt.Fprintln(w, "failed to marshal user preference")
			return
		}

		// Create a new HTTP POST request to the OR-Tools solver service
		req, err := http.NewRequest("POST", ORTOOLURL, bytes.NewBuffer(jsonData))
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			fmt.Fprintln(w, "failed to contact solver service")
			return
		}

		req.Header.Set("Content-Type", "application/json")

		// Forward the request to the solver service
		client := &http.Client{}
		resp, err := client.Do(req)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			fmt.Fprintln(w, "failed to contact solver service")
			return
		}
		defer resp.Body.Close()

		// Read and forward the response from the solver service
		log.Printf("Received response from solver service: %s\n", resp.Status)
		body, err := io.ReadAll(resp.Body)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			fmt.Fprintln(w, "failed to read response from solver service")
			return
		}
		w.WriteHeader(resp.StatusCode)
		w.Write(body)
	}))

	log.Println("api-gateway :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
