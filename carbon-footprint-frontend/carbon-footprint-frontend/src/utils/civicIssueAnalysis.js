const ZONE_BOUNDARIES = [
  { name: 'Bangalore North', minLatitude: 13.02, maxLatitude: 13.2, minLongitude: 77.4, maxLongitude: 77.8 },
  { name: 'Bangalore South', minLatitude: 12.8, maxLatitude: 12.93, minLongitude: 77.4, maxLongitude: 77.8 },
  { name: 'Bangalore East', minLatitude: 12.8, maxLatitude: 13.2, minLongitude: 77.65, maxLongitude: 77.8 },
  { name: 'Bangalore West', minLatitude: 12.8, maxLatitude: 13.2, minLongitude: 77.4, maxLongitude: 77.55 },
  { name: 'Bangalore Central', minLatitude: 12.93, maxLatitude: 13.02, minLongitude: 77.55, maxLongitude: 77.65 },
  { name: 'Bangalore Outskirts', minLatitude: 12.7, maxLatitude: 13.3, minLongitude: 77.3, maxLongitude: 77.9 },
]

const MODEL_LABELS = {
  VEHICLE_EMISSION: 'YOLOv8-Nano + MobileNetV3 adapter',
  GARBAGE: 'MobileNetV3 waste classifier adapter',
}

const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, value))
const round = (value) => Math.round(Number(value || 0) * 10) / 10

export function inferZoneFromCoordinates(latitude, longitude) {
  if (latitude == null || longitude == null) return 'Bangalore Outskirts'
  const match = ZONE_BOUNDARIES.find((zone) => (
    latitude >= zone.minLatitude
    && latitude <= zone.maxLatitude
    && longitude >= zone.minLongitude
    && longitude <= zone.maxLongitude
  ))
  return match?.name || 'Bangalore Outskirts'
}

function rgbToHsv(r, g, b) {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const delta = max - min

  let h = 0
  if (delta !== 0) {
    if (max === rn) h = ((gn - bn) / delta) % 6
    else if (max === gn) h = (bn - rn) / delta + 2
    else h = (rn - gn) / delta + 4
  }

  return {
    h: (h * 60 + 360) % 360,
    s: max === 0 ? 0 : delta / max,
    v: max,
  }
}

function buildMetrics(imageData) {
  const { data, width, height } = imageData
  let darkPixels = 0
  let brightPixels = 0
  let mutedPixels = 0
  let greyPixels = 0
  let brownPixels = 0
  let greenPixels = 0
  let plasticPixels = 0
  let upperMuted = 0
  let lowerDark = 0
  let totalPixels = 0
  let brightnessSum = 0
  let saturationSum = 0
  let edgeSum = 0

  const stride = 4
  const sampleStep = 6

  for (let y = 0; y < height; y += sampleStep) {
    for (let x = 0; x < width; x += sampleStep) {
      const index = (y * width + x) * stride
      const r = data[index]
      const g = data[index + 1]
      const b = data[index + 2]
      const brightness = (0.299 * r) + (0.587 * g) + (0.114 * b)
      const hsv = rgbToHsv(r, g, b)
      const nextX = Math.min(width - 1, x + sampleStep)
      const nextIndex = (y * width + nextX) * stride
      const nextBrightness = (
        (0.299 * data[nextIndex])
        + (0.587 * data[nextIndex + 1])
        + (0.114 * data[nextIndex + 2])
      )

      totalPixels += 1
      brightnessSum += brightness
      saturationSum += hsv.s
      edgeSum += Math.abs(brightness - nextBrightness)

      if (brightness < 70) darkPixels += 1
      if (brightness > 200) brightPixels += 1
      if (hsv.s < 0.22) mutedPixels += 1
      if (hsv.s < 0.12) greyPixels += 1
      if (hsv.h >= 15 && hsv.h <= 45 && hsv.s > 0.25 && brightness < 170) brownPixels += 1
      if (hsv.h >= 70 && hsv.h <= 160 && hsv.s > 0.2) greenPixels += 1
      if ((hsv.h <= 15 || hsv.h >= 300 || (hsv.h >= 170 && hsv.h <= 240)) && hsv.s > 0.38 && brightness > 130) {
        plasticPixels += 1
      }
      if (y < height * 0.45 && hsv.s < 0.22) upperMuted += 1
      if (y > height * 0.55 && brightness < 90) lowerDark += 1
    }
  }

  return {
    averageBrightness: brightnessSum / Math.max(totalPixels, 1),
    averageSaturation: saturationSum / Math.max(totalPixels, 1),
    darkRatio: darkPixels / Math.max(totalPixels, 1),
    brightRatio: brightPixels / Math.max(totalPixels, 1),
    mutedRatio: mutedPixels / Math.max(totalPixels, 1),
    greyRatio: greyPixels / Math.max(totalPixels, 1),
    brownRatio: brownPixels / Math.max(totalPixels, 1),
    greenRatio: greenPixels / Math.max(totalPixels, 1),
    plasticRatio: plasticPixels / Math.max(totalPixels, 1),
    upperMutedRatio: upperMuted / Math.max(totalPixels, 1),
    lowerDarkRatio: lowerDark / Math.max(totalPixels, 1),
    edgeRatio: edgeSum / Math.max(totalPixels, 1) / 255,
  }
}

function resolvePriority(score) {
  if (score >= 80) return 'CRITICAL'
  if (score >= 60) return 'HIGH'
  if (score >= 35) return 'MEDIUM'
  return 'LOW'
}

export function estimateVisualCarbonRelease({
  aiScore = 0,
  durationSeconds = 0,
  smokeColor = 'GREY',
  vehicleCount = 1,
} = {}) {
  const safeDurationSeconds = Math.max(0, Number(durationSeconds || 0))
  if (safeDurationSeconds === 0) {
    return {
      estimatedCarbonGrams: 0,
      carbonEstimateLabel: 'Awaiting duration',
      carbonEstimateMethod: 'Visual carbon approximation needs a video duration to estimate total release.',
    }
  }

  const smokeMultiplier = {
    BLACK: 1.45,
    GREY: 1.2,
    WHITE: 0.95,
  }[String(smokeColor || 'GREY').toUpperCase()] || 1
  const vehicleMultiplier = Math.max(1, Number(vehicleCount || 1))
  const gramsPerMinute = (110 + (Number(aiScore || 0) * 5.2)) * smokeMultiplier * vehicleMultiplier
  const estimatedCarbonGrams = round(gramsPerMinute * (safeDurationSeconds / 60))

  const carbonEstimateLabel = estimatedCarbonGrams >= 450
    ? 'Very High Visual Carbon Estimate'
    : estimatedCarbonGrams >= 250
      ? 'High Visual Carbon Estimate'
      : estimatedCarbonGrams >= 120
        ? 'Moderate Visual Carbon Estimate'
        : 'Low Visual Carbon Estimate'

  return {
    estimatedCarbonGrams,
    carbonEstimateLabel,
    carbonEstimateMethod: 'Visual approximation from smoke severity, duration, and vehicle count. Not a sensor-grade carbon measurement.',
  }
}

function resolveVehicleAnalysis(metrics) {
  const vehicleConfidence = clamp(
    (metrics.lowerDarkRatio * 90)
    + (metrics.edgeRatio * 55)
    + ((1 - metrics.averageSaturation) * 18),
  )
  const smokeIndex = clamp(
    (metrics.upperMutedRatio * 120)
    + (metrics.greyRatio * 50)
    + (metrics.darkRatio * 30)
    + (metrics.edgeRatio * 25),
  )
  const emissionScore = clamp((vehicleConfidence * 0.35) + (smokeIndex * 0.65))
  const smokeColor = metrics.averageBrightness < 90
    ? 'BLACK'
    : metrics.averageBrightness < 155
      ? 'GREY'
      : 'WHITE'
  const severityLabel = emissionScore >= 70 ? 'High Pollution' : emissionScore >= 40 ? 'Medium Pollution' : 'Low Pollution'
  const intensity = emissionScore >= 70 ? 'HIGH' : emissionScore >= 40 ? 'MEDIUM' : 'LOW'

  return {
    mode: 'VEHICLE_EMISSION',
    aiScore: round(emissionScore),
    aiConfidenceScore: round(calculateConfidenceScore({
      aiScore: emissionScore,
      frameSampleCount: 1,
      vehicleCount: vehicleConfidence >= 35 ? 1 : 0,
      metrics,
    })),
    rollingAverageScore: round(emissionScore),
    aiSeverityLabel: intensity,
    severityLabel,
    aiPriority: resolvePriority(emissionScore),
    smokeColor,
    vehicleCount: vehicleConfidence >= 35 ? 1 : 0,
    frameSampleCount: 1,
    detectionModel: MODEL_LABELS.VEHICLE_EMISSION,
    onDeviceInference: true,
    title: 'Real-time vehicle emission detected',
    summary: `${severityLabel} with visible ${smokeColor.toLowerCase()} smoke signature during live frame analysis.`,
  }
}

function resolveGarbageAnalysis(metrics) {
  const clutterIndex = clamp(
    (metrics.edgeRatio * 75)
    + (metrics.brownRatio * 55)
    + (metrics.plasticRatio * 85)
    + (metrics.greenRatio * 18),
  )
  const wasteScore = round(clamp((clutterIndex * 0.9) + (metrics.darkRatio * 20)))
  const cleanlinessLabel = wasteScore >= 70 ? 'Severe / Overflowing' : wasteScore >= 35 ? 'Moderate Waste' : 'Clean'
  const wasteType = metrics.plasticRatio > 0.16
    ? 'PLASTIC'
    : metrics.brownRatio + metrics.greenRatio > 0.24
      ? 'ORGANIC'
      : 'MIXED'

  return {
    mode: 'GARBAGE',
    aiScore: wasteScore,
    aiConfidenceScore: round(calculateConfidenceScore({
      aiScore: wasteScore,
      frameSampleCount: 1,
      metrics,
    })),
    rollingAverageScore: wasteScore,
    aiSeverityLabel: cleanlinessLabel === 'Clean' ? 'LOW' : cleanlinessLabel === 'Moderate Waste' ? 'MEDIUM' : 'HIGH',
    severityLabel: cleanlinessLabel,
    aiPriority: resolvePriority(wasteScore),
    wasteType,
    frameSampleCount: 1,
    detectionModel: MODEL_LABELS.GARBAGE,
    onDeviceInference: true,
    title: 'Garbage hotspot detected',
    summary: `${cleanlinessLabel} detected with likely ${wasteType.toLowerCase()} waste profile.`,
  }
}

export function analyzeImageData(imageData, mode) {
  const metrics = buildMetrics(imageData)
  return mode === 'GARBAGE'
    ? { ...resolveGarbageAnalysis(metrics), metrics }
    : { ...resolveVehicleAnalysis(metrics), metrics }
}

export function analyzeVideoFrame(videoElement, canvasElement, mode) {
  if (!videoElement || !canvasElement || videoElement.readyState < 2) return null

  const width = 224
  const height = 126
  canvasElement.width = width
  canvasElement.height = height

  const context = canvasElement.getContext('2d', { willReadFrequently: true })
  if (!context) return null

  context.drawImage(videoElement, 0, 0, width, height)
  const imageData = context.getImageData(0, 0, width, height)
  return analyzeImageData(imageData, mode)
}

export function combineFrameAnalyses(frameAnalyses = [], mode = 'VEHICLE_EMISSION', options = {}) {
  const durationSeconds = Number(options.durationSeconds || 0)
  if (!frameAnalyses.length) {
    return {
      mode,
      mediaDurationSeconds: durationSeconds,
      aiScore: 0,
      aiConfidenceScore: 0,
      rollingAverageScore: 0,
      aiSeverityLabel: 'LOW',
      aiPriority: 'LOW',
      severityLabel: mode === 'GARBAGE' ? 'Clean' : 'Low Pollution',
      detectionModel: MODEL_LABELS[mode] || MODEL_LABELS.VEHICLE_EMISSION,
      onDeviceInference: true,
      frameSampleCount: 0,
      vehicleCount: 0,
      estimatedCarbonGrams: 0,
      carbonEstimateLabel: mode === 'VEHICLE_EMISSION' ? 'Awaiting duration' : 'Not applicable',
      carbonEstimateMethod: mode === 'VEHICLE_EMISSION'
        ? 'Visual carbon approximation needs analyzed video duration.'
        : 'Carbon estimate is only shown for vehicle smoke analysis.',
      summary: mode === 'GARBAGE'
        ? 'No waste signal analyzed yet.'
        : 'No emission signal analyzed yet.',
    }
  }

  const averageScore = round(frameAnalyses.reduce((sum, item) => sum + Number(item.aiScore || 0), 0) / frameAnalyses.length)
  const averageConfidence = round(frameAnalyses.reduce((sum, item) => sum + Number(item.aiConfidenceScore || 0), 0) / frameAnalyses.length)
  const dominant = [...frameAnalyses].sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0))[0]
  const aiSeverityLabel = averageScore >= 70 ? 'HIGH' : averageScore >= 40 ? 'MEDIUM' : 'LOW'
  const severityLabel = mode === 'GARBAGE'
    ? averageScore >= 70 ? 'Severe / Overflowing' : averageScore >= 35 ? 'Moderate Waste' : 'Clean'
    : averageScore >= 70 ? 'High Pollution' : averageScore >= 40 ? 'Medium Pollution' : 'Low Pollution'
  const carbonEstimate = mode === 'VEHICLE_EMISSION'
    ? estimateVisualCarbonRelease({
      aiScore: averageScore,
      durationSeconds,
      smokeColor: dominant.smokeColor,
      vehicleCount: Math.max(...frameAnalyses.map((item) => item.vehicleCount || 0), 0),
    })
    : {
      estimatedCarbonGrams: 0,
      carbonEstimateLabel: 'Not applicable',
      carbonEstimateMethod: 'Carbon estimate is only shown for vehicle smoke analysis.',
    }

  return {
    ...dominant,
    mediaDurationSeconds: durationSeconds,
    aiScore: averageScore,
    aiConfidenceScore: averageConfidence,
    rollingAverageScore: averageScore,
    aiSeverityLabel,
    severityLabel,
    aiPriority: resolvePriority(averageScore),
    vehicleCount: mode === 'VEHICLE_EMISSION'
      ? Math.max(...frameAnalyses.map((item) => item.vehicleCount || 0), 0)
      : 0,
    frameSampleCount: frameAnalyses.length,
    estimatedCarbonGrams: carbonEstimate.estimatedCarbonGrams,
    carbonEstimateLabel: carbonEstimate.carbonEstimateLabel,
    carbonEstimateMethod: carbonEstimate.carbonEstimateMethod,
    summary: mode === 'GARBAGE'
      ? `${severityLabel} across ${frameAnalyses.length} analyzed frame(s) using ${MODEL_LABELS.GARBAGE}.`
      : `${severityLabel} across ${frameAnalyses.length} analyzed frame(s) using ${MODEL_LABELS.VEHICLE_EMISSION}.`,
  }
}

export function buildComplaintDraft({
  analysis,
  issueType,
  address,
  latitude,
  longitude,
  reporterName,
  vehiclePlateNumber,
  evidenceImageUrl,
}) {
  const zoneName = inferZoneFromCoordinates(latitude, longitude)
  const title = issueType === 'WASTE_DUMPING'
    ? `Garbage issue reported in ${zoneName}`
    : `Vehicle emission complaint in ${zoneName}`
  const description = issueType === 'WASTE_DUMPING'
    ? `${analysis.summary} Location tagged near ${address || zoneName}. Cleanliness score: ${analysis.aiScore}/100.`
    : `${analysis.summary} Location tagged near ${address || zoneName}. Rolling emission score: ${analysis.aiScore}/100. Visual carbon estimate: ${Math.round(analysis.estimatedCarbonGrams || 0)} g.${vehiclePlateNumber ? ` Suspected plate: ${vehiclePlateNumber}.` : ''}`

  return {
    title,
    description,
    mappedZoneName: zoneName,
    captureTimestamp: new Date().toISOString(),
    latitude,
    longitude,
    address,
    severity: Math.max(1, Math.min(5, Math.ceil((analysis.aiScore || 0) / 20))),
    mediaType: issueType === 'WASTE_DUMPING' ? 'PHOTO' : 'VIDEO',
    detectionModel: analysis.detectionModel,
    onDeviceInference: true,
    aiSummary: `${reporterName || 'Citizen'} used on-device analysis to prepare this complaint. ${analysis.summary}`,
    mediaDurationSeconds: analysis.mediaDurationSeconds || 0,
    aiScore: analysis.aiScore,
    aiConfidenceScore: calculateConfidenceScore({
      aiScore: analysis.aiScore,
      frameSampleCount: analysis.frameSampleCount,
      hasEvidenceImage: Boolean(evidenceImageUrl),
      hasCoordinates: latitude != null && longitude != null,
      hasPlateNumber: Boolean(vehiclePlateNumber),
      vehicleCount: analysis.vehicleCount,
      metrics: analysis.metrics,
    }),
    rollingAverageScore: analysis.rollingAverageScore,
    estimatedCarbonGrams: analysis.estimatedCarbonGrams || 0,
    carbonEstimateLabel: analysis.carbonEstimateLabel || 'Not applicable',
    carbonEstimateMethod: analysis.carbonEstimateMethod || 'Carbon estimate is only shown for vehicle smoke analysis.',
    aiSeverityLabel: analysis.aiSeverityLabel,
    aiPriority: analysis.aiPriority,
    smokeColor: analysis.smokeColor || null,
    wasteType: analysis.wasteType || null,
    vehicleCount: analysis.vehicleCount || 0,
    frameSampleCount: analysis.frameSampleCount || 0,
    vehiclePlateNumber: vehiclePlateNumber || null,
  }
}

export function calculateConfidenceScore({
  aiScore = 0,
  frameSampleCount = 0,
  hasEvidenceImage = false,
  hasCoordinates = false,
  hasPlateNumber = false,
  vehicleCount = 0,
  metrics = null,
} = {}) {
  let confidence = 32
  confidence += Math.min(30, Number(aiScore || 0) * 0.24)
  confidence += Math.min(18, Number(frameSampleCount || 0) * 0.9)
  confidence += Math.min(8, Number(vehicleCount || 0) * 5)

  if (hasEvidenceImage) confidence += 8
  if (hasCoordinates) confidence += 6
  if (hasPlateNumber) confidence += 6

  if (metrics) {
    const contrastBonus = (metrics.edgeRatio || 0) * 24
    const stabilityBonus = (metrics.mutedRatio || 0) > 0.15 ? 5 : 0
    confidence += contrastBonus + stabilityBonus
  }

  return round(clamp(confidence))
}

export { round }
