// frontend/src/features/dashboard/views/ChatApi.ts
// Utility for sending chat messages to the FastAPI backend

export interface ChatRequest {
  message: string;
  user_id: string;
}

export interface ChatResponse {
  answer: string; // Now matches backend
  user_id: string;
  json_data?: any;
}

const DEV_URL = "http://localhost:8080/api/v1/chat/";
const PROD_URL = "https://fastapi-chat-microservice.onrender.com/api/v1/chat/";

function getChatApiUrl() {
  return window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? DEV_URL
    : PROD_URL;
}

// Helper to get JWT from sessionStorage (same as AuthService)
function getJwtToken() {
  return sessionStorage.getItem('accessToken');
}

export async function sendChatMessage(message: string, userId: string): Promise<ChatResponse> {
  const token = getJwtToken();
  const response = await fetch(getChatApiUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ message, user_id: userId }),
  });
  if (!response.ok) {
    throw new Error("Failed to send message");
  }
  return response.json();
}
