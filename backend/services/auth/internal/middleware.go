package internal

import (
	"fmt"
	"net/http"
	"strings"
)

func AuthMiddleware(s *Supabase, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if !strings.HasPrefix(authHeader, "Bearer ") {
			http.Error(w, "missing token", http.StatusUnauthorized)
			return
		}

		token := strings.TrimPrefix(authHeader, "Bearer ")
		user, err := s.GetUser(token)
		if err != nil || user == nil {
			http.Error(w, "invalid token", http.StatusForbidden)
			return
		}

		fmt.Println("Authenticated user:", user["email"])
		next.ServeHTTP(w, r)
	})
}
