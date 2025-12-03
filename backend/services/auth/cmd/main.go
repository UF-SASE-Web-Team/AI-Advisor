package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"github.com/joho/godotenv"

	internal "github.com/UF-SASE-Web-Team/AI-Advisor/backend/services/auth/internal"
)

func main() {
	if err := godotenv.Load("../../.env"); err != nil {
		log.Println("No .env file found")
	}

	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(200)
		fmt.Fprintln(w, "ok")
	})

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, "hello from auth")
	})

	s := internal.NewSupabase()

	http.HandleFunc("/signup", func(w http.ResponseWriter, r *http.Request) {
		var body internal.Credentials
		json.NewDecoder(r.Body).Decode(&body)
		res, err := s.Signup(body.Email, body.Password)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		json.NewEncoder(w).Encode(res)
	})

	http.HandleFunc("/signin", func(w http.ResponseWriter, r *http.Request) {
		var body internal.Credentials
		json.NewDecoder(r.Body).Decode(&body)
		res, err := s.Signin(body.Email, body.Password)
		if err != nil {
			http.Error(w, "missing token", http.StatusUnauthorized)
			return
		}
		json.NewEncoder(w).Encode(res)
	})

	http.Handle("/me", internal.AuthMiddleware(s, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, "You are authenticated!")
	})))

	log.Println("api-gateway :8083")
	log.Fatal(http.ListenAndServe(":8083", nil))
}
