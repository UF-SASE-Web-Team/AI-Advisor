package internal

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"os"
)

type Supabase struct {
	URL string
	Key string
}

func NewSupabase() *Supabase {
	return &Supabase{
		URL: os.Getenv("SUPABASE_URL"),
		Key: os.Getenv("SUPABASE_SERVICE_ROLE_KEY"),
	}
}

type Credentials struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func (s *Supabase) Signup(email string, password string) (map[string]interface{}, error) {
	body, _ := json.Marshal(Credentials{Email: email, Password: password})
	req, _ := http.NewRequest("POST", s.URL+"/auth/v1/signup", bytes.NewBuffer(body))
	req.Header.Set("apikey", s.Key)
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	var result map[string]interface{}
	json.Unmarshal(respBody, &result)
	return result, nil
}

func (s *Supabase) Signin(email, password string) (map[string]interface{}, error) {
	body, _ := json.Marshal(Credentials{Email: email, Password: password})
	req, _ := http.NewRequest("POST", s.URL+"/auth/v1/token?grant_type=password", bytes.NewBuffer(body))
	req.Header.Set("apikey", s.Key)
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	var result map[string]interface{}
	json.Unmarshal(respBody, &result)
	return result, nil
}

func (s *Supabase) GetUser(token string) (map[string]interface{}, error) {
	req, _ := http.NewRequest("GET", s.URL+"/auth/v1/user", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("apikey", s.Key)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	var result map[string]interface{}
	json.Unmarshal(respBody, &result)
	return result, nil
}
