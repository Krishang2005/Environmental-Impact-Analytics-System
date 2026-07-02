import axios from 'axios'

const AI_BASE_URL = import.meta.env.VITE_AI_API_BASE_URL?.trim() || 'http://localhost:8001'

const aiApi = axios.create({
  baseURL: AI_BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

export const aiDetectionApi = {
  detectImage: ({ imageDataUrl, mode, durationSeconds = 0 }) =>
    aiApi.post('/detect/image', { imageDataUrl, mode, durationSeconds }),
}
