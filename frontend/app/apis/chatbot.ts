import { API_URL } from "~/config";

export interface AdvisorSource {
  course_code: string;
  course_name: string;
  content: string;
  relevance_score: number;
}

export interface QueryAdvisorRequest {
  question: string;
  session_id?: string;
  max_results?: number;
}

export interface QueryAdvisorResponse {
  answer: string;
  sources: AdvisorSource[];
  session_id?: string;
  error_message?: string;
}

export interface CreateSessionRequest {
  title?: string;
  user_id?: string;
}

export interface CreateSessionResponse {
  session_id: string;
}

export async function createAdvisorSession(
  body: CreateSessionRequest = {},
): Promise<CreateSessionResponse> {
  const response = await fetch(`${API_URL}/api/v2/advisor/session/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`createAdvisorSession failed: ${response.status}`);
  }
  return response.json();
}

export async function queryAdvisor(
  body: QueryAdvisorRequest,
): Promise<QueryAdvisorResponse> {
  const response = await fetch(`${API_URL}/api/v2/advisor/query/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`queryAdvisor failed: ${response.status}`);
  }
  return response.json();
}
