import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import {
  AlertTriangle,
  Camera,
  Car,
  Film,
  ImagePlus,
  MapPin,
  PlayCircle,
  Radar,
  ShieldAlert,
  Sparkles,
  Trash2,
  UploadCloud,
} from 'lucide-react'
import { SectionHeader, Badge } from '../../components/ui'
import { communityApi } from '../../api/communityApi'
import { ocrApi } from '../../api/ocrApi'
import { aiDetectionApi } from '../../api/aiDetectionApi'
import { useAuth } from '../../context/AuthContext'
import { formatDateTime, getErrorMessage } from '../../utils/helpers'
import {
  buildComplaintDraft,
  calculateConfidenceScore,
  combineFrameAnalyses,
  inferZoneFromCoordinates,
} from '../../utils/civicIssueAnalysis'
import { recognizePlateFromDataUrl } from '../../utils/plateOcr'

const REPORT_MODES = {
  VEHICLE_EMISSION: {
    title: 'Vehicle Emission',
    subtitle: 'Real-time smoke detection with rolling emission score',
    issueType: 'AIR_POLLUTION',
    icon: Car,
    mediaType: 'VIDEO',
  },
  GARBAGE: {
    title: 'Garbage / Civic Waste',
    subtitle: 'Photo-style cleanliness scan for bins, roads, and dumping',
    issueType: 'WASTE_DUMPING',
    icon: Trash2,
    mediaType: 'PHOTO',
  },
}

const MAX_EVIDENCE_DATA_URL_LENGTH = 2_500_000
const MAX_PHOTO_UPLOAD_BYTES = 10 * 1024 * 1024
const MAX_VIDEO_UPLOAD_BYTES = 30 * 1024 * 1024

function formatScore(value) {
  return `${Math.round(Number(value || 0))}/100`
}

function createEvidenceDataUrl(canvas, initialQuality = 0.72) {
  let quality = initialQuality
  let dataUrl = canvas.toDataURL('image/jpeg', quality)

  while (dataUrl.length > MAX_EVIDENCE_DATA_URL_LENGTH && quality > 0.42) {
    quality -= 0.08
    dataUrl = canvas.toDataURL('image/jpeg', quality)
  }

  return dataUrl
}

function normalizeAiDetectionResult(result, mode, durationSeconds = 0) {
  return {
    ...result,
    mode,
    mediaDurationSeconds: durationSeconds,
    frameSampleCount: result.frameSampleCount || 1,
    rollingAverageScore: result.rollingAverageScore ?? result.aiScore ?? 0,
    detectionModel: result.detectionModel || 'YOLO FastAPI detector',
    onDeviceInference: false,
    detections: result.detections || [],
  }
}

function isFileOverLimit(file, maxBytes) {
  return file.size > maxBytes
}

export default function SmartComplaints() {
  const { user } = useAuth()
  const fileInputRef = useRef(null)
  const photoInputRef = useRef(null)
  const videoRef = useRef(null)
  const snapshotCanvasRef = useRef(null)
  const streamRef = useRef(null)
  const analysisIntervalRef = useRef(null)
  const analysisStartedAtRef = useRef(null)
  const analysisRequestInFlightRef = useRef(false)
  const cancelAnalysisRef = useRef(false)
  const uploadedObjectUrlRef = useRef('')
  const bestFrameScoreRef = useRef(0)
  const lastAutoOcrEvidenceRef = useRef('')

  const [reportMode, setReportMode] = useState('VEHICLE_EMISSION')
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [locating, setLocating] = useState(false)
  const [frameAnalyses, setFrameAnalyses] = useState([])
  const [currentFrameAnalysis, setCurrentFrameAnalysis] = useState(null)
  const [analysisDurationSeconds, setAnalysisDurationSeconds] = useState(0)
  const [analysisProgressPct, setAnalysisProgressPct] = useState(0)
  const [evidenceImageUrl, setEvidenceImageUrl] = useState('')
  const [platePreviewImageUrl, setPlatePreviewImageUrl] = useState('')
  const [myIssues, setMyIssues] = useState([])
  const [ocrLoading, setOcrLoading] = useState(false)
  const [ocrNotice, setOcrNotice] = useState('')
  const [uploadedMedia, setUploadedMedia] = useState(null)
  const [uploadedPhoto, setUploadedPhoto] = useState(null)
  const [location, setLocation] = useState({
    latitude: user?.latitude || null,
    longitude: user?.longitude || null,
    address: user?.address || '',
  })
  const [formState, setFormState] = useState({
    title: '',
    description: '',
    address: user?.address || '',
    vehiclePlateNumber: '',
  })
  const [fieldTouched, setFieldTouched] = useState({
    title: false,
    description: false,
    address: false,
  })

  const modeConfig = REPORT_MODES[reportMode]
  const finalAnalysis = combineFrameAnalyses(
    frameAnalyses,
    reportMode === 'GARBAGE' ? 'GARBAGE' : 'VEHICLE_EMISSION',
    { durationSeconds: analysisDurationSeconds }
  )
  const currentZone = inferZoneFromCoordinates(location.latitude, location.longitude)
  const complaintConfidenceScore = calculateConfidenceScore({
    aiScore: finalAnalysis.aiScore,
    frameSampleCount: finalAnalysis.frameSampleCount,
    hasEvidenceImage: Boolean(evidenceImageUrl),
    hasCoordinates: location.latitude != null && location.longitude != null,
    hasPlateNumber: Boolean(formState.vehiclePlateNumber),
    vehicleCount: finalAnalysis.vehicleCount,
    metrics: finalAnalysis.metrics,
  })

  const loadMyIssues = async () => {
    try {
      const response = await communityApi.getMyIssues()
      setMyIssues(response.data || [])
    } catch {
      setMyIssues([])
    }
  }

  useEffect(() => {
    loadMyIssues()
    return () => {
      stopAnalysis()
      stopCamera()
      if (uploadedObjectUrlRef.current) {
        URL.revokeObjectURL(uploadedObjectUrlRef.current)
        uploadedObjectUrlRef.current = ''
      }
    }
  }, [])

  useEffect(() => {
    if (!finalAnalysis?.summary) return

    const draft = buildComplaintDraft({
      analysis: finalAnalysis,
      issueType: modeConfig.issueType,
      address: formState.address || location.address,
      latitude: location.latitude,
      longitude: location.longitude,
      reporterName: user?.name,
      vehiclePlateNumber: formState.vehiclePlateNumber,
      evidenceImageUrl,
    })

    setFormState((previous) => ({
      ...previous,
      title: fieldTouched.title ? previous.title : draft.title,
      description: fieldTouched.description ? previous.description : draft.description,
      address: fieldTouched.address ? previous.address : (draft.address || previous.address),
    }))
  }, [
    finalAnalysis.aiScore,
    finalAnalysis.estimatedCarbonGrams,
    finalAnalysis.summary,
    location.latitude,
    location.longitude,
    location.address,
    modeConfig.issueType,
    user?.name,
    formState.vehiclePlateNumber,
  ])

  useEffect(() => {
    stopAnalysis()
    setFrameAnalyses([])
    setCurrentFrameAnalysis(null)
    setAnalysisDurationSeconds(0)
    setAnalysisProgressPct(0)
    setEvidenceImageUrl('')
    setPlatePreviewImageUrl('')
    setOcrNotice('')
    bestFrameScoreRef.current = 0
    lastAutoOcrEvidenceRef.current = ''
    if (uploadedObjectUrlRef.current) {
      URL.revokeObjectURL(uploadedObjectUrlRef.current)
      uploadedObjectUrlRef.current = ''
    }
    setUploadedMedia(null)
    setUploadedPhoto(null)
    setFormState((previous) => ({
      ...previous,
      title: '',
      description: '',
      vehiclePlateNumber: '',
    }))
    setFieldTouched((previous) => ({
      ...previous,
      title: false,
      description: false,
    }))
  }, [reportMode])

  useEffect(() => {
    if (
      reportMode !== 'VEHICLE_EMISSION'
      || !evidenceImageUrl
      || ocrLoading
      || formState.vehiclePlateNumber.trim()
      || lastAutoOcrEvidenceRef.current === evidenceImageUrl
    ) {
      return
    }

    lastAutoOcrEvidenceRef.current = evidenceImageUrl
    void runPlateOcr(true)
  }, [evidenceImageUrl, reportMode, formState.vehiclePlateNumber, ocrLoading])

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setCameraActive(false)
  }

  const clearUploadedMedia = () => {
    if (uploadedObjectUrlRef.current) {
      URL.revokeObjectURL(uploadedObjectUrlRef.current)
      uploadedObjectUrlRef.current = ''
    }
    setUploadedMedia(null)
    setUploadedPhoto(null)
    setAnalysisDurationSeconds(0)
    setAnalysisProgressPct(0)
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.removeAttribute('src')
      videoRef.current.load()
    }
  }

  const analyzeEvidenceDataUrl = async (imageDataUrl, durationSeconds = 0) => {
    const mode = reportMode === 'GARBAGE' ? 'GARBAGE' : 'VEHICLE_EMISSION'
    const response = await aiDetectionApi.detectImage({
      imageDataUrl,
      mode,
      durationSeconds,
    })
    return normalizeAiDetectionResult(response.data, mode, durationSeconds)
  }

  const analyzeUploadedPhotoFile = (file, objectUrl) => new Promise((resolve, reject) => {
    const image = new Image()

    image.onload = async () => {
      const snapshotCanvas = snapshotCanvasRef.current
      const snapshotContext = snapshotCanvas?.getContext('2d')

      if (!snapshotCanvas || !snapshotContext) {
        reject(new Error('Photo analyzer is not ready yet.'))
        return
      }

      snapshotCanvas.width = 640
      snapshotCanvas.height = 360
      snapshotContext.drawImage(image, 0, 0, snapshotCanvas.width, snapshotCanvas.height)
      const evidenceDataUrl = createEvidenceDataUrl(snapshotCanvas, 0.72)

      try {
        const result = await analyzeEvidenceDataUrl(evidenceDataUrl, 0)
        resolve({ result, evidenceDataUrl })
      } catch (error) {
        reject(error)
      }
    }

    image.onerror = () => reject(new Error('Could not read the selected photo.'))
    image.src = objectUrl
  })

  const waitForVideoMetadata = (videoElement) => new Promise((resolve, reject) => {
    if (!videoElement) {
      reject(new Error('Video preview is not available.'))
      return
    }
    if (videoElement.readyState >= 1 && Number.isFinite(videoElement.duration)) {
      resolve()
      return
    }

    const handleLoaded = () => {
      cleanup()
      resolve()
    }
    const handleError = () => {
      cleanup()
      reject(new Error('Could not read uploaded video metadata.'))
    }
    const cleanup = () => {
      videoElement.removeEventListener('loadedmetadata', handleLoaded)
      videoElement.removeEventListener('error', handleError)
    }

    videoElement.addEventListener('loadedmetadata', handleLoaded)
    videoElement.addEventListener('error', handleError)
  })

  const seekVideoTo = (videoElement, timeSeconds) => new Promise((resolve, reject) => {
    if (!videoElement) {
      reject(new Error('Video element unavailable for frame analysis.'))
      return
    }

    const targetTime = Math.max(0, timeSeconds)
    if (Math.abs((videoElement.currentTime || 0) - targetTime) < 0.03) {
      resolve()
      return
    }
    const handleSeeked = () => {
      cleanup()
      resolve()
    }
    const handleError = () => {
      cleanup()
      reject(new Error('Could not seek uploaded video for analysis.'))
    }
    const cleanup = () => {
      videoElement.removeEventListener('seeked', handleSeeked)
      videoElement.removeEventListener('error', handleError)
    }

    videoElement.addEventListener('seeked', handleSeeked)
    videoElement.addEventListener('error', handleError)
    videoElement.currentTime = targetTime
  })

  const startCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera access is not supported in this browser.')
      return
    }

    try {
      clearUploadedMedia()
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setCameraError('')
      setCameraActive(true)
    } catch (error) {
      setCameraError(error?.message || 'Camera permission denied.')
    }
  }

  const handleUploadedVideoSelection = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('video/')) {
      toast.error('Please choose a video file for analysis.')
      return
    }
    if (isFileOverLimit(file, MAX_VIDEO_UPLOAD_BYTES)) {
      toast.error('Video is too large. Please upload a video up to 30 MB.')
      event.target.value = ''
      return
    }

    stopAnalysis()
    stopCamera()
    if (uploadedObjectUrlRef.current) {
      URL.revokeObjectURL(uploadedObjectUrlRef.current)
      uploadedObjectUrlRef.current = ''
    }
    setUploadedPhoto(null)

    const objectUrl = URL.createObjectURL(file)
    uploadedObjectUrlRef.current = objectUrl
    setUploadedMedia({
      name: file.name,
      url: objectUrl,
      sizeMb: Math.round((file.size / (1024 * 1024)) * 10) / 10,
      durationSeconds: 0,
    })
    setCameraError('')
    setFrameAnalyses([])
    setCurrentFrameAnalysis(null)
    setEvidenceImageUrl('')
    setPlatePreviewImageUrl('')
    setAnalysisProgressPct(0)
    bestFrameScoreRef.current = 0

    try {
      if (!videoRef.current) {
        throw new Error('Preview player is not ready yet.')
      }
      videoRef.current.pause()
      videoRef.current.srcObject = null
      videoRef.current.src = objectUrl
      videoRef.current.load()
      await waitForVideoMetadata(videoRef.current)
      const durationSeconds = Math.round((videoRef.current.duration || 0) * 10) / 10
      setUploadedMedia((previous) => previous ? { ...previous, durationSeconds } : previous)
      setAnalysisDurationSeconds(durationSeconds)
      videoRef.current.currentTime = 0
      toast.success('Uploaded video is ready for frame-by-frame analysis.')
    } catch (error) {
      clearUploadedMedia()
      toast.error(error?.message || 'Could not prepare the uploaded video.')
    } finally {
      event.target.value = ''
    }
  }

  const handleUploadedPhotoSelection = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file for photo analysis.')
      return
    }
    if (isFileOverLimit(file, MAX_PHOTO_UPLOAD_BYTES)) {
      toast.error('Photo is too large. Please upload an image up to 10 MB.')
      event.target.value = ''
      return
    }

    stopAnalysis()
    stopCamera()
    clearUploadedMedia()

    const objectUrl = URL.createObjectURL(file)
    uploadedObjectUrlRef.current = objectUrl
    setCameraError('')
    setFrameAnalyses([])
    setCurrentFrameAnalysis(null)
    setEvidenceImageUrl('')
    setPlatePreviewImageUrl('')
    setAnalysisProgressPct(0)
    setAnalysisDurationSeconds(0)
    bestFrameScoreRef.current = 0

    try {
      const { result, evidenceDataUrl } = await analyzeUploadedPhotoFile(file, objectUrl)
      setUploadedPhoto({
        name: file.name,
        url: objectUrl,
        sizeMb: Math.round((file.size / (1024 * 1024)) * 10) / 10,
      })
      setFrameAnalyses([{ ...result, sampleTimeSeconds: 0 }])
      setCurrentFrameAnalysis(result)
      setEvidenceImageUrl(evidenceDataUrl)
      setAnalysisProgressPct(100)
      toast.success('Photo analyzed and evidence snapshot added.')
    } catch (error) {
      clearUploadedMedia()
      toast.error(error?.message || 'Could not analyze the selected photo.')
    } finally {
      event.target.value = ''
    }
  }

  const captureEvidenceFrame = () => {
    if (!videoRef.current || !snapshotCanvasRef.current || videoRef.current.readyState < 2) return ''
    const canvas = snapshotCanvasRef.current
    const context = canvas.getContext('2d')
    if (!context) return ''

    canvas.width = 480
    canvas.height = 270
    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)
    return createEvidenceDataUrl(canvas, 0.72)
  }

  const stopAnalysis = () => {
    cancelAnalysisRef.current = true
    analysisRequestInFlightRef.current = false
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current)
      analysisIntervalRef.current = null
    }
    analysisStartedAtRef.current = null
    setAnalyzing(false)
  }

  const runPlateOcr = async (silent = false) => {
    if (reportMode !== 'VEHICLE_EMISSION') return
    if (!evidenceImageUrl) {
      if (!silent) toast.error('Capture an evidence frame before scanning a plate.')
      return
    }

    setOcrLoading(true)
    setOcrNotice('Scanning number plate from the best evidence frame...')
    try {
      const result = await recognizePlateFromDataUrl(evidenceImageUrl)
      setPlatePreviewImageUrl(result.previewImageUrl || '')

      let detectedPlate = result.normalizedText
      let confidence = result.confidence

      if (!detectedPlate) {
        try {
          const backendResult = await ocrApi.recognizeVehiclePlate(evidenceImageUrl)
          detectedPlate = backendResult.data?.plateNumber
          confidence = backendResult.data?.confidence
        } catch {
          // Browser OCR remains the primary low-latency path; backend OCR is a fallback when available.
        }
      }

      if (detectedPlate) {
        setFormState((previous) => ({
          ...previous,
          vehiclePlateNumber: detectedPlate,
        }))
        setOcrNotice(`OCR detected plate ${detectedPlate} with ${Math.round(confidence || 0)}% confidence.`)
        if (!silent) {
          toast.success(`Plate detected: ${detectedPlate}`)
        }
      } else {
        setOcrNotice('OCR ran, but a valid plate number was not clear. You can still type it manually.')
        if (!silent) {
          toast.error('Plate text was unclear. Try another evidence frame.')
        }
      }
    } catch (error) {
      const message = error?.message || 'Plate OCR could not be completed right now.'
      setOcrNotice(message)
      if (!silent) {
        toast.error(message)
      }
    } finally {
      setOcrLoading(false)
    }
  }

  const analyzeUploadedVideoFile = async () => {
    if (!uploadedMedia?.url || !videoRef.current) {
      toast.error('Choose a saved video before starting uploaded analysis.')
      return
    }

    try {
      await waitForVideoMetadata(videoRef.current)
      const durationSeconds = Number(uploadedMedia.durationSeconds || videoRef.current.duration || 0)
      const safeDurationSeconds = Math.max(1, durationSeconds)
      const sampleCount = Math.min(24, Math.max(8, Math.ceil(safeDurationSeconds / 2)))
      const nextFrames = []
      let bestSnapshot = ''
      let bestScore = 0

      stopAnalysis()
      cancelAnalysisRef.current = false
      setAnalyzing(true)
      setAnalysisProgressPct(0)
      setAnalysisDurationSeconds(Math.round(safeDurationSeconds * 10) / 10)

      for (let index = 0; index < sampleCount; index += 1) {
        if (cancelAnalysisRef.current) {
          break
        }
        const sampleTime = sampleCount === 1
          ? 0
          : Math.min(safeDurationSeconds - 0.05, (index / (sampleCount - 1)) * safeDurationSeconds)

        await seekVideoTo(videoRef.current, sampleTime)
        const snapshot = captureEvidenceFrame()
        if (!snapshot) continue

        const frameResult = await analyzeEvidenceDataUrl(snapshot, safeDurationSeconds)

        if (!frameResult) continue

        nextFrames.push({
          ...frameResult,
          sampleTimeSeconds: Math.round(sampleTime * 10) / 10,
        })
        setCurrentFrameAnalysis(frameResult)
        setAnalysisProgressPct(Math.round(((index + 1) / sampleCount) * 100))

        if ((frameResult.aiScore || 0) >= bestScore) {
          bestScore = frameResult.aiScore || 0
          bestSnapshot = snapshot
        }
      }

      setFrameAnalyses(nextFrames)
      if (bestSnapshot) {
        setEvidenceImageUrl(bestSnapshot)
      }
      await seekVideoTo(videoRef.current, 0)
    } catch (error) {
      toast.error(error?.message || 'Uploaded video analysis could not be completed.')
    } finally {
      setAnalyzing(false)
    }
  }

  const startAnalysis = async () => {
    if (uploadedPhoto?.url) {
      toast.success('Photo is already analyzed. Generate the complaint when ready.')
      return
    }

    if (uploadedMedia?.url) {
      await analyzeUploadedVideoFile()
      return
    }

    if (!cameraActive) {
      await startCamera()
    }

    if (!videoRef.current) return
    stopAnalysis()
    cancelAnalysisRef.current = false
    setAnalyzing(true)
    setAnalysisProgressPct(0)
    setAnalysisDurationSeconds(0)
    analysisStartedAtRef.current = Date.now()

    analysisIntervalRef.current = setInterval(async () => {
      if (analysisRequestInFlightRef.current) return

      const durationSeconds = Math.round(((Date.now() - analysisStartedAtRef.current) / 1000) * 10) / 10
      const snapshot = captureEvidenceFrame()
      if (!snapshot) return

      analysisRequestInFlightRef.current = true
      let result = null
      try {
        result = await analyzeEvidenceDataUrl(snapshot, durationSeconds)
      } catch (error) {
        toast.error(getErrorMessage(error))
        stopAnalysis()
        return
      } finally {
        analysisRequestInFlightRef.current = false
      }

      if (!result || cancelAnalysisRef.current) return

      setCurrentFrameAnalysis(result)
      setFrameAnalyses((previous) => [...previous.slice(-29), result])
      setAnalysisDurationSeconds(durationSeconds)

      if ((result.aiScore || 0) >= bestFrameScoreRef.current) {
        bestFrameScoreRef.current = result.aiScore || 0
        setEvidenceImageUrl(snapshot)
      }
    }, reportMode === 'GARBAGE' ? 900 : 650)
  }

  const handleLocate = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported on this device.')
      return
    }

    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLocation = {
          latitude: Number(position.coords.latitude.toFixed(6)),
          longitude: Number(position.coords.longitude.toFixed(6)),
          address: formState.address || user?.address || '',
        }
        setLocation(nextLocation)
        toast.success(`Zone mapped to ${inferZoneFromCoordinates(nextLocation.latitude, nextLocation.longitude)}`)
        setLocating(false)
      },
      (error) => {
        toast.error(error?.message || 'Unable to fetch your current location.')
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    )
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!finalAnalysis.frameSampleCount) {
      toast.error('Run the live scan first so the complaint includes an AI score.')
      return
    }

    const draft = buildComplaintDraft({
      analysis: finalAnalysis,
      issueType: modeConfig.issueType,
      address: formState.address || location.address,
      latitude: location.latitude,
      longitude: location.longitude,
      reporterName: user?.name,
      vehiclePlateNumber: formState.vehiclePlateNumber,
      evidenceImageUrl,
    })

    const payload = {
      ...draft,
      title: formState.title || draft.title,
      description: formState.description || draft.description,
      address: formState.address || draft.address,
      issueType: modeConfig.issueType,
      mediaType: modeConfig.mediaType,
      evidenceImageUrl,
      aiConfidenceScore: complaintConfidenceScore,
      vehiclePlateNumber: formState.vehiclePlateNumber || draft.vehiclePlateNumber,
    }

    setSubmitting(true)
    try {
      await communityApi.createIssue(payload)
      toast.success('Complaint generated and submitted to the civic dashboard.')
      await loadMyIssues()
      setFrameAnalyses([])
      setCurrentFrameAnalysis(null)
      bestFrameScoreRef.current = 0
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  const currentBadgeVariant = finalAnalysis.aiPriority === 'CRITICAL' || finalAnalysis.aiPriority === 'HIGH'
    ? 'red'
    : finalAnalysis.aiPriority === 'MEDIUM'
      ? 'amber'
      : 'green'

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="page-header rounded-3xl border border-cyan-300/20 bg-slate-900/55 p-5 backdrop-blur-xl">
        <h1 className="page-title">Smart Complaints</h1>
        <p className="page-subtitle">
          Real-time mobile-friendly emission and garbage complaint generation with frame scoring, geo-tagging,
          and admin-ready evidence snapshots.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-4">
        <div className="glass-card p-5">
          <SectionHeader
            title="Capture Console"
            subtitle="Analyze a live camera stream, saved video, or uploaded photo"
            action={<Badge variant="slate">{uploadedMedia || uploadedPhoto ? 'Uploaded file' : 'On-device flow'}</Badge>}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.entries(REPORT_MODES).map(([key, item]) => {
              const Icon = item.icon
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setReportMode(key)}
                  className={`rounded-2xl border p-4 text-left transition ${
                    reportMode === key
                      ? 'border-cyan-300/40 bg-cyan-500/10'
                      : 'border-surface-500/20 bg-surface-700/30 hover:bg-surface-700/45'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{item.title}</p>
                      <p className="mt-1 text-xs leading-relaxed text-slate-400">{item.subtitle}</p>
                    </div>
                    <Icon className="w-4 h-4 text-cyan-300" />
                  </div>
                </button>
              )
            })}
          </div>

          <div className="mt-4 overflow-hidden rounded-3xl border border-surface-500/20 bg-slate-950/70">
            <div className="relative aspect-video">
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                controls={Boolean(uploadedMedia)}
                className={`h-full w-full object-cover ${uploadedPhoto ? 'opacity-0' : ''}`}
              />
              {uploadedPhoto && (
                <img
                  src={uploadedPhoto.url}
                  alt="Uploaded complaint evidence"
                  className="absolute inset-0 h-full w-full object-cover"
                />
              )}
              {!cameraActive && !uploadedMedia && !uploadedPhoto && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/85 text-center">
                  <Camera className="w-10 h-10 text-cyan-300" />
                  <div>
                    <p className="text-sm font-medium text-white">Camera preview offline</p>
                    <p className="mt-1 text-xs text-slate-400">Start the camera to run live complaint analysis.</p>
                  </div>
                </div>
              )}
              <div className="absolute left-3 top-3 rounded-full border border-cyan-300/20 bg-slate-950/70 px-3 py-1 text-[11px] text-cyan-200">
                {modeConfig.detectionModel || 'Live civic analyzer'}
              </div>
              {analyzing && (
                <div className="absolute right-3 top-3 inline-flex items-center gap-2 rounded-full border border-red-400/30 bg-red-500/10 px-3 py-1 text-[11px] text-red-200">
                  <span className="h-2 w-2 rounded-full bg-red-400" />
                  {uploadedMedia ? `Analyzing ${analysisProgressPct}%` : uploadedPhoto ? 'Photo scan' : 'Live scan'}
                </div>
              )}
            </div>
          </div>

          {cameraError && (
            <p className="mt-3 text-sm text-red-300">{cameraError}</p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={startCamera} className="btn-primary">
              <Camera className="w-4 h-4" />
              <span>{cameraActive ? 'Refresh camera' : 'Start camera'}</span>
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-xl border border-cyan-300/30 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-200 transition hover:bg-cyan-500/20"
            >
              <Film className="mr-2 inline h-4 w-4" />
              Choose saved video
            </button>
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              className="rounded-xl border border-teal-300/30 bg-teal-500/10 px-4 py-2 text-sm text-teal-200 transition hover:bg-teal-500/20"
            >
              <ImagePlus className="mr-2 inline h-4 w-4" />
              Choose photo
            </button>
            <button
              type="button"
              onClick={analyzing ? stopAnalysis : startAnalysis}
              disabled={Boolean(uploadedPhoto)}
              className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200 transition hover:bg-emerald-500/20"
            >
              <PlayCircle className="mr-2 inline h-4 w-4" />
              {analyzing
                ? uploadedMedia ? 'Stop uploaded scan' : 'Stop live scan'
                : uploadedPhoto ? 'Photo already analyzed' : uploadedMedia ? 'Analyze uploaded video' : reportMode === 'GARBAGE' ? 'Scan live scene' : 'Analyze recording stream'}
            </button>
            <button
              type="button"
              onClick={() => {
                const snapshot = captureEvidenceFrame()
                if (snapshot) {
                  setEvidenceImageUrl(snapshot)
                  toast.success('Evidence frame captured.')
                }
              }}
              className="rounded-xl border border-surface-500/30 bg-surface-700/40 px-4 py-2 text-sm text-slate-200 transition hover:bg-surface-700/60"
            >
              <UploadCloud className="mr-2 inline h-4 w-4" />
              Capture evidence frame
            </button>
            <button
              type="button"
              onClick={handleLocate}
              disabled={locating}
              className="rounded-xl border border-sky-400/30 bg-sky-500/10 px-4 py-2 text-sm text-sky-200 transition hover:bg-sky-500/20 disabled:opacity-60"
            >
              <MapPin className="mr-2 inline h-4 w-4" />
              {locating ? 'Locating...' : 'Geo-tag now'}
            </button>
            {(uploadedMedia || uploadedPhoto) && (
              <button
                type="button"
                onClick={clearUploadedMedia}
                className="rounded-xl border border-surface-500/30 bg-surface-700/40 px-4 py-2 text-sm text-slate-200 transition hover:bg-surface-700/60"
              >
                Remove uploaded file
              </button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleUploadedVideoSelection}
            className="hidden"
          />
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            onChange={handleUploadedPhotoSelection}
            className="hidden"
          />

          <canvas ref={snapshotCanvasRef} className="hidden" />

          {uploadedMedia && (
            <div className="mt-4 rounded-2xl border border-surface-500/20 bg-surface-800/60 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Uploaded video ready</p>
              <p className="mt-2 text-sm font-medium text-white">{uploadedMedia.name}</p>
              <p className="mt-1 text-xs text-slate-400">
                {uploadedMedia.sizeMb} MB • {analysisDurationSeconds || uploadedMedia.durationSeconds || 0}s duration
              </p>
            </div>
          )}

          {uploadedPhoto && (
            <div className="mt-4 rounded-2xl border border-surface-500/20 bg-surface-800/60 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Uploaded photo analyzed</p>
              <p className="mt-2 text-sm font-medium text-white">{uploadedPhoto.name}</p>
              <p className="mt-1 text-xs text-slate-400">{uploadedPhoto.sizeMb} MB &bull; single-frame complaint evidence</p>
            </div>
          )}

          {evidenceImageUrl && (
            <div className="mt-4 rounded-2xl border border-surface-500/20 bg-surface-800/60 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Evidence snapshot</p>
              <img
                src={evidenceImageUrl}
                alt="Captured complaint evidence"
                className="mt-3 h-44 w-full rounded-2xl object-cover"
              />
            </div>
          )}
        </div>

        <div className="glass-card p-5">
          <SectionHeader
            title="AI Analysis"
            subtitle="Rolling score, priority, and structured complaint draft"
            action={<Badge variant={currentBadgeVariant}>{finalAnalysis.aiPriority || 'LOW'}</Badge>}
          />

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-surface-500/20 bg-surface-700/30 p-4">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">Current frame</p>
              <p className="mt-2 text-2xl font-semibold text-white">{formatScore(currentFrameAnalysis?.aiScore || 0)}</p>
              <p className="mt-1 text-xs text-slate-400">
                {currentFrameAnalysis?.severityLabel || 'Waiting for live analysis'}
              </p>
            </div>
            <div className="rounded-2xl border border-surface-500/20 bg-surface-700/30 p-4">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">Rolling average</p>
              <p className="mt-2 text-2xl font-semibold text-white">{formatScore(finalAnalysis.aiScore)}</p>
              <p className="mt-1 text-xs text-slate-400">{finalAnalysis.severityLabel}</p>
            </div>
            <div className="rounded-2xl border border-surface-500/20 bg-surface-700/30 p-4">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">Confidence</p>
              <p className="mt-2 text-2xl font-semibold text-white">{formatScore(complaintConfidenceScore)}</p>
              <p className="mt-1 text-xs text-slate-400">Evidence + location + frame stability</p>
            </div>
            <div className="rounded-2xl border border-surface-500/20 bg-surface-700/30 p-4">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">Frames analyzed</p>
              <p className="mt-2 text-2xl font-semibold text-white">{finalAnalysis.frameSampleCount || 0}</p>
              <p className="mt-1 text-xs text-slate-400">{modeConfig.mediaType.toLowerCase()} complaint flow</p>
            </div>
            <div className="rounded-2xl border border-surface-500/20 bg-surface-700/30 p-4">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">Duration</p>
              <p className="mt-2 text-2xl font-semibold text-white">{analysisDurationSeconds || 0}s</p>
              <p className="mt-1 text-xs text-slate-400">{uploadedMedia ? 'Uploaded media duration' : 'Analyzed live duration'}</p>
            </div>
            <div className="rounded-2xl border border-surface-500/20 bg-surface-700/30 p-4">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">Visual carbon estimate</p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {reportMode === 'VEHICLE_EMISSION' ? `${Math.round(finalAnalysis.estimatedCarbonGrams || 0)} g` : 'N/A'}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {reportMode === 'VEHICLE_EMISSION' ? finalAnalysis.carbonEstimateLabel : 'Shown only for vehicle smoke'}
              </p>
            </div>
            <div className="rounded-2xl border border-surface-500/20 bg-surface-700/30 p-4">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">Zone mapped</p>
              <p className="mt-2 text-lg font-semibold text-white">{currentZone}</p>
              <p className="mt-1 text-xs text-slate-400">
                {location.latitude != null && location.longitude != null
                  ? `${location.latitude}, ${location.longitude}`
                  : 'Coordinates pending'}
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-cyan-300/20 bg-cyan-500/10 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">Detection summary</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-300">{finalAnalysis.summary}</p>
              </div>
              <Radar className="w-4 h-4 text-cyan-200" />
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {finalAnalysis.smokeColor && <span className="badge-slate">Smoke: {finalAnalysis.smokeColor}</span>}
              {finalAnalysis.wasteType && <span className="badge-slate">Waste: {finalAnalysis.wasteType}</span>}
              {reportMode === 'VEHICLE_EMISSION' && (
                <span className="badge-slate">Vehicles: {finalAnalysis.vehicleCount || 0}</span>
              )}
              <span className="badge-slate">{finalAnalysis.detectionModel}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label className="label">Complaint title</label>
              <input
                type="text"
                value={formState.title}
                onChange={(event) => {
                  setFieldTouched((previous) => ({ ...previous, title: true }))
                  setFormState((previous) => ({ ...previous, title: event.target.value }))
                }}
                className="input-field"
                placeholder="Auto-generated title will appear here"
              />
            </div>

            <div>
              <label className="label">Structured description</label>
              <textarea
                rows={5}
                value={formState.description}
                onChange={(event) => {
                  setFieldTouched((previous) => ({ ...previous, description: true }))
                  setFormState((previous) => ({ ...previous, description: event.target.value }))
                }}
                className="input-field min-h-[140px] resize-none"
                placeholder="AI-generated complaint summary"
              />
            </div>

            <div className={`grid grid-cols-1 ${reportMode === 'VEHICLE_EMISSION' ? 'sm:grid-cols-2' : ''} gap-3`}>
              <div>
                <label className="label">Address / landmark</label>
                <input
                  type="text"
                  value={formState.address}
                  onChange={(event) => {
                    setFieldTouched((previous) => ({ ...previous, address: true }))
                    setFormState((previous) => ({ ...previous, address: event.target.value }))
                    setLocation((previous) => ({ ...previous, address: event.target.value }))
                  }}
                  className="input-field"
                  placeholder="Street, road, or nearby landmark"
                />
              </div>
              {reportMode === 'VEHICLE_EMISSION' && (
                <div>
                  <label className="label">Plate number / manual entry (optional)</label>
                  <input
                    type="text"
                    value={formState.vehiclePlateNumber}
                    onChange={(event) => setFormState((previous) => ({
                      ...previous,
                      vehiclePlateNumber: event.target.value.toUpperCase(),
                    }))}
                    className="input-field"
                    placeholder="e.g. KA03MK5124"
                  />
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => runPlateOcr(false)}
                      disabled={ocrLoading || !evidenceImageUrl}
                      className="rounded-xl border border-cyan-300/30 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-200 transition hover:bg-cyan-500/20 disabled:opacity-60"
                    >
                      {ocrLoading ? 'Scanning plate...' : 'Scan plate from evidence'}
                    </button>
                    {ocrNotice && (
                      <p className="text-[11px] leading-relaxed text-slate-400">{ocrNotice}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {platePreviewImageUrl && reportMode === 'VEHICLE_EMISSION' && (
              <div className="rounded-2xl border border-surface-500/20 bg-surface-700/30 p-4">
                <p className="text-[11px] uppercase tracking-wide text-slate-500">OCR plate crop</p>
                <img
                  src={platePreviewImageUrl}
                  alt="OCR plate crop"
                  className="mt-3 h-24 w-full rounded-xl object-cover"
                />
              </div>
            )}

            <div className="rounded-2xl border border-surface-500/20 bg-surface-700/30 p-4 text-sm text-slate-300">
              <p className="font-medium text-white">Submission package</p>
              <p className="mt-2">Type: {modeConfig.title}</p>
              <p className="mt-1">Severity: {finalAnalysis.severityLabel}</p>
              <p className="mt-1">Priority: {finalAnalysis.aiPriority}</p>
              <p className="mt-1">Score: {formatScore(finalAnalysis.aiScore)}</p>
              <p className="mt-1">Confidence: {formatScore(complaintConfidenceScore)}</p>
              {reportMode === 'VEHICLE_EMISSION' && (
                <>
                  <p className="mt-1">Visual carbon estimate: {Math.round(finalAnalysis.estimatedCarbonGrams || 0)} g</p>
                  <p className="mt-1 text-xs text-slate-400">{finalAnalysis.carbonEstimateMethod}</p>
                </>
              )}
              <p className="mt-1">Timestamp: {new Date().toLocaleString('en-IN')}</p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full justify-center"
            >
              <Sparkles className="h-4 w-4" />
              <span>{submitting ? 'Submitting...' : 'Generate smart complaint'}</span>
            </button>
          </form>
        </div>
      </div>

      <div className="glass-card p-5">
        <SectionHeader
          title="My Complaint Feed"
          subtitle="Recent AI-generated complaints and their resolution status"
          action={<Badge variant="slate">{myIssues.length} reports</Badge>}
        />

        {myIssues.length === 0 ? (
          <div className="rounded-2xl border border-surface-500/20 bg-surface-700/30 p-6 text-center text-sm text-slate-400">
            No smart complaints yet. Start the camera, run a scan, and generate your first report.
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            {myIssues.slice(0, 8).map((issue) => (
              <div key={issue.id} className="rounded-2xl border border-surface-500/20 bg-surface-700/30 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{issue.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{issue.mappedZoneName || issue.zoneName}</p>
                  </div>
                  <Badge
                    variant={
                      issue.status === 'ACTION_TAKEN'
                        ? 'green'
                        : issue.aiPriority === 'HIGH' || issue.aiPriority === 'CRITICAL'
                          ? 'red'
                          : 'amber'
                    }
                  >
                    {issue.status}
                  </Badge>
                </div>

                <p className="mt-3 text-sm leading-relaxed text-slate-300">{issue.description}</p>

                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="badge-slate">Score {formatScore(issue.aiScore)}</span>
                  <span className="badge-slate">Confidence {formatScore(issue.aiConfidenceScore)}</span>
                  {issue.estimatedCarbonGrams > 0 && (
                    <span className="badge-slate">Visual carbon {Math.round(issue.estimatedCarbonGrams)} g</span>
                  )}
                  {issue.smokeColor && <span className="badge-slate">{issue.smokeColor} smoke</span>}
                  {issue.wasteType && <span className="badge-slate">{issue.wasteType}</span>}
                  {issue.vehiclePlateNumber && <span className="badge-slate">{issue.vehiclePlateNumber}</span>}
                </div>

                {issue.evidenceImageUrl && (
                  <img
                    src={issue.evidenceImageUrl}
                    alt={issue.title}
                    className="mt-3 h-36 w-full rounded-2xl object-cover"
                  />
                )}

                <p className="mt-3 text-[11px] text-slate-500">{formatDateTime(issue.reportedAt)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="glass-card p-5">
        <SectionHeader title="Implementation Note" subtitle="YOLO microservice analyzer path" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="rounded-2xl border border-surface-500/20 bg-surface-700/30 p-4">
            <div className="flex items-center gap-2 text-white">
              <ShieldAlert className="w-4 h-4 text-cyan-300" />
              <p className="text-sm font-semibold">YOLO microservice</p>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              The UI sends evidence frames to the FastAPI AI service, where trained YOLO models detect garbage and
              vehicle smoke before the complaint is assembled.
            </p>
          </div>
          <div className="rounded-2xl border border-surface-500/20 bg-surface-700/30 p-4">
            <div className="flex items-center gap-2 text-white">
              <AlertTriangle className="w-4 h-4 text-amber-300" />
              <p className="text-sm font-semibold">Upload + live video</p>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              The same complaint flow now supports either a live camera stream or a saved uploaded video, both sampled
              frame by frame through the YOLO service for smoke severity estimation.
            </p>
          </div>
          <div className="rounded-2xl border border-surface-500/20 bg-surface-700/30 p-4">
            <div className="flex items-center gap-2 text-white">
              <MapPin className="w-4 h-4 text-emerald-300" />
              <p className="text-sm font-semibold">Visual carbon estimate</p>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              Vehicle complaints include an estimated visual carbon release based on YOLO smoke detections, vehicle
              count, and analyzed duration. It is useful for prioritization, not exact emissions accounting.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
