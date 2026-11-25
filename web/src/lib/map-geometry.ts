export function circleGeoJson(lat: number, lng: number, radiusMeters: number) {
  const coordinates: number[][] = []
  const earthRadius = 6378137
  for (let i = 0; i <= 64; i += 1) {
    const angle = (i / 64) * 2 * Math.PI
    const dx = (radiusMeters * Math.cos(angle)) / earthRadius
    const dy = (radiusMeters * Math.sin(angle)) / earthRadius
    const latRadians = (lat * Math.PI) / 180
    coordinates.push([
      lng + (dx * 180) / (Math.PI * Math.cos(latRadians)),
      lat + (dy * 180) / Math.PI,
    ])
  }
  return {
    type: "Feature" as const,
    properties: {},
    geometry: { type: "Polygon" as const, coordinates: [coordinates] },
  }
}
