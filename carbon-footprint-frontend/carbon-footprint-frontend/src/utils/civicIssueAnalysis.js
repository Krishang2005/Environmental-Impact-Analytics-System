const ZONE_BOUNDARIES = [
  { name: 'Bangalore North', minLatitude: 13.02, maxLatitude: 13.2, minLongitude: 77.4, maxLongitude: 77.8 },
  { name: 'Bangalore South', minLatitude: 12.8, maxLatitude: 12.93, minLongitude: 77.4, maxLongitude: 77.8 },
  { name: 'Bangalore East', minLatitude: 12.8, maxLatitude: 13.2, minLongitude: 77.65, maxLongitude: 77.8 },
  { name: 'Bangalore West', minLatitude: 12.8, maxLatitude: 13.2, minLongitude: 77.4, maxLongitude: 77.55 },
  { name: 'Bangalore Central', minLatitude: 12.93, maxLatitude: 13.02, minLongitude: 77.55, maxLongitude: 77.65 },
  { name: 'Bangalore Outskirts', minLatitude: 12.7, maxLatitude: 13.3, minLongitude: 77.3, maxLongitude: 77.9 },
]

const MODEL_LABELS = {
  VEHICLE_EMISSION: 'YOLO FastAPI vehicle smoke detector',
  GARBAGE: 'YOLO FastAPI garbage detector',
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
      onDeviceInference: false,
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
    onDeviceInference: Boolean(analysis.onDeviceInference),
    aiSummary: `${reporterName || 'Citizen'} used YOLO AI analysis to prepare this complaint. ${analysis.summary}`,
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
