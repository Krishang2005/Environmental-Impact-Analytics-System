const TESSERACT_SCRIPT_ID = 'tesseract-js-runtime'
const TESSERACT_SCRIPT_SRC = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js'

function ensureBrowser() {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}

export function normalizePlateText(value) {
  if (!value) return ''
  const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, '')
  const match = cleaned.match(/[A-Z]{2}\d{1,2}[A-Z]{1,3}\d{4}/)
  return match?.[0] || ''
}

function loadTesseractScript() {
  if (!ensureBrowser()) {
    return Promise.reject(new Error('OCR requires a browser environment.'))
  }

  if (window.Tesseract?.recognize) {
    return Promise.resolve(window.Tesseract)
  }

  const existing = document.getElementById(TESSERACT_SCRIPT_ID)
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', () => resolve(window.Tesseract), { once: true })
      existing.addEventListener('error', () => reject(new Error('Failed to load OCR runtime.')), { once: true })
    })
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.id = TESSERACT_SCRIPT_ID
    script.src = TESSERACT_SCRIPT_SRC
    script.async = true
    script.onload = () => resolve(window.Tesseract)
    script.onerror = () => reject(new Error('Failed to load OCR runtime.'))
    document.head.appendChild(script)
  })
}

function buildPlateCrop(dataUrl) {
  return new Promise((resolve, reject) => {
    if (!ensureBrowser()) {
      reject(new Error('OCR requires a browser environment.'))
      return
    }

    const image = new Image()
    image.onload = () => {
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d', { willReadFrequently: true })
      if (!context) {
        reject(new Error('Could not initialize OCR canvas.'))
        return
      }

      const cropWidth = image.width * 0.56
      const cropHeight = image.height * 0.24
      const cropX = (image.width - cropWidth) / 2
      const cropY = image.height * 0.58

      canvas.width = 900
      canvas.height = 260
      context.filter = 'grayscale(1) contrast(1.65) brightness(1.15)'
      context.drawImage(image, cropX, cropY, cropWidth, cropHeight, 0, 0, canvas.width, canvas.height)

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
      const pixels = imageData.data
      for (let index = 0; index < pixels.length; index += 4) {
        const luminance = (pixels[index] + pixels[index + 1] + pixels[index + 2]) / 3
        const binary = luminance > 150 ? 255 : 0
        pixels[index] = binary
        pixels[index + 1] = binary
        pixels[index + 2] = binary
      }
      context.putImageData(imageData, 0, 0)
      resolve(canvas.toDataURL('image/png'))
    }
    image.onerror = () => reject(new Error('Unable to read the captured evidence image.'))
    image.src = dataUrl
  })
}

export async function recognizePlateFromDataUrl(dataUrl) {
  if (!dataUrl) {
    throw new Error('No evidence frame available for OCR.')
  }

  const Tesseract = await loadTesseractScript()
  const croppedPlateImage = await buildPlateCrop(dataUrl)
  const result = await Tesseract.recognize(croppedPlateImage, 'eng', {
    tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
  })

  const rawText = result?.data?.text || ''
  const normalizedText = normalizePlateText(rawText)
  const confidence = Number(result?.data?.confidence || 0)

  return {
    rawText,
    normalizedText,
    confidence: Math.round(confidence * 10) / 10,
    previewImageUrl: croppedPlateImage,
  }
}
