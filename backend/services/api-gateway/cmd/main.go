package main

import (
	"fmt"
	"log"
	"net/http"
	"encoding/json"
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

func main() {
	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(200)
		fmt.Fprintln(w, "ok")
	})

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, "hello from api-gateway")
	})

	// Endpoint to receive user preferences
	http.HandleFunc("/api/userpreference/", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			w.WriteHeader(http.StatusMethodNotAllowed)
			return
		}

		var currPref UserPreference

		err := json.NewDecoder(r.Body).Decode(&pref)

		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			fmt.Fprintln(w, "invalid request body")
			return
		}

		savedPref = currPref

		log.Printf("Received user preference: %+v\n", pref)
	}

	log.Println("api-gateway :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
