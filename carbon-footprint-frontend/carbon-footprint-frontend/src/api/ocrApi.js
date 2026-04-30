import api from './axiosInstance'

export const ocrApi = {
  recognizeVehiclePlate: (imageDataUrl) =>
    api.post('/api/ocr/vehicle-plate', { imageDataUrl }),
}
