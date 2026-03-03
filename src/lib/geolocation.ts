import { LOCATIONS, POINTS_OF_INTEREST } from '@/lib/constants';
import type { GeoCoordinates, NearestLocation, ItineraryStop } from '@/lib/types';

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Haversine distance between two lat/lng points in kilometers.
 */
export function haversineDistanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const aCalc = sinDLat * sinDLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinDLng * sinDLng;
  const c = 2 * Math.atan2(Math.sqrt(aCalc), Math.sqrt(1 - aCalc));
  return R * c;
}

/**
 * Find nearest predefined location and optional POI from coordinates.
 * Returns null if no location within maxDistanceKm (default 50km).
 */
export function findNearestLocation(
  coords: GeoCoordinates,
  maxDistanceKm: number = 50
): NearestLocation | null {
  let nearestMain: { location: typeof LOCATIONS[number]; distanceKm: number } | null = null;

  for (const loc of LOCATIONS) {
    const dist = haversineDistanceKm(coords, loc);
    if (dist <= maxDistanceKm && (!nearestMain || dist < nearestMain.distanceKm)) {
      nearestMain = { location: loc, distanceKm: dist };
    }
  }

  if (!nearestMain) return null;

  // Check for nearby POI (within 2km)
  let nearestPoi: typeof POINTS_OF_INTEREST[number] | undefined;
  let nearestPoiDist = 2; // max 2km for POI match

  for (const poi of POINTS_OF_INTEREST) {
    if (poi.parentId === nearestMain.location.id) {
      const dist = haversineDistanceKm(coords, poi);
      if (dist < nearestPoiDist) {
        nearestPoiDist = dist;
        nearestPoi = poi;
      }
    }
  }

  return {
    location: nearestMain.location,
    distanceKm: nearestMain.distanceKm,
    poi: nearestPoi ? { ...nearestPoi } : undefined,
  };
}

/**
 * Find the next upcoming stop on the guide's itinerary.
 */
export function findNextItineraryStop(
  coords: GeoCoordinates,
  stops: ItineraryStop[]
): ItineraryStop | null {
  if (stops.length === 0) return null;

  const sorted = [...stops].sort((a, b) =>
    a.day !== b.day ? a.day - b.day : a.order_in_day - b.order_in_day
  );

  const currentNearest = findNearestLocation(coords);
  if (!currentNearest) return sorted[0];

  const currentIndex = sorted.findIndex(
    s => s.location_id === currentNearest.location.id
  );

  if (currentIndex === -1) return sorted[0];
  if (currentIndex >= sorted.length - 1) return null;

  return sorted[currentIndex + 1];
}

/**
 * Build a location context string for Mary's chat prompt.
 */
export function buildLocationContext(
  coords: GeoCoordinates | null,
  nearestLocation: NearestLocation | null,
  nextStop: ItineraryStop | null
): string {
  const parts: string[] = [];

  if (nearestLocation) {
    const distStr = nearestLocation.distanceKm < 1
      ? `${Math.round(nearestLocation.distanceKm * 1000)}m`
      : `${nearestLocation.distanceKm.toFixed(1)}km`;

    if (nearestLocation.poi) {
      parts.push(`Near ${nearestLocation.poi.name} in ${nearestLocation.location.name} (${distStr} away)`);
    } else {
      parts.push(`Near ${nearestLocation.location.name} (${distStr} away)`);
    }
  } else if (coords) {
    parts.push(`GPS: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)} (not near a known location)`);
  }

  if (nextStop) {
    parts.push(`Next on itinerary: ${nextStop.location_name} (Day ${nextStop.day})${nextStop.notes ? ` - ${nextStop.notes}` : ''}`);
  }

  return parts.join('. ');
}

/**
 * Extract GPS coordinates from image EXIF data.
 * Works with JPEG files that contain EXIF GPS tags.
 * Returns null if no GPS data found.
 */
export function extractExifGps(arrayBuffer: ArrayBuffer): GeoCoordinates | null {
  try {
    const view = new DataView(arrayBuffer);

    // Check for JPEG SOI marker
    if (view.getUint16(0) !== 0xFFD8) return null;

    let offset = 2;
    while (offset < view.byteLength - 2) {
      const marker = view.getUint16(offset);

      // APP1 marker (EXIF)
      if (marker === 0xFFE1) {
        const length = view.getUint16(offset + 2);
        const exifData = new DataView(arrayBuffer, offset + 4, length - 2);

        // Check "Exif\0\0" header
        if (
          exifData.getUint8(0) === 0x45 && // E
          exifData.getUint8(1) === 0x78 && // x
          exifData.getUint8(2) === 0x69 && // i
          exifData.getUint8(3) === 0x66 && // f
          exifData.getUint8(4) === 0x00 &&
          exifData.getUint8(5) === 0x00
        ) {
          return parseExifGps(exifData, 6);
        }
        break;
      }

      // Skip non-APP1 markers
      if ((marker & 0xFF00) === 0xFF00) {
        offset += 2 + view.getUint16(offset + 2);
      } else {
        break;
      }
    }
  } catch {
    // EXIF parsing failed
  }
  return null;
}

function parseExifGps(view: DataView, tiffStart: number): GeoCoordinates | null {
  try {
    const byteOrder = view.getUint16(tiffStart);
    const littleEndian = byteOrder === 0x4949;

    const getU16 = (o: number) => view.getUint16(tiffStart + o, littleEndian);
    const getU32 = (o: number) => view.getUint32(tiffStart + o, littleEndian);

    // Read IFD0 to find GPS IFD pointer
    const ifdOffset = getU32(4);
    const ifdCount = getU16(ifdOffset);

    let gpsIfdOffset = 0;
    for (let i = 0; i < ifdCount; i++) {
      const entryOffset = ifdOffset + 2 + i * 12;
      const tag = getU16(entryOffset);
      if (tag === 0x8825) { // GPSInfo tag
        gpsIfdOffset = getU32(entryOffset + 8);
        break;
      }
    }

    if (!gpsIfdOffset) return null;

    // Parse GPS IFD
    const gpsCount = getU16(gpsIfdOffset);
    let latRef = '', lngRef = '';
    let latValues: number[] = [];
    let lngValues: number[] = [];

    for (let i = 0; i < gpsCount; i++) {
      const entryOffset = gpsIfdOffset + 2 + i * 12;
      const tag = getU16(entryOffset);
      const valueOffset = getU32(entryOffset + 8);

      switch (tag) {
        case 1: // GPSLatitudeRef
          latRef = String.fromCharCode(view.getUint8(tiffStart + entryOffset + 8));
          break;
        case 2: // GPSLatitude (3 rationals)
          latValues = readRationals(view, tiffStart + valueOffset, 3, littleEndian);
          break;
        case 3: // GPSLongitudeRef
          lngRef = String.fromCharCode(view.getUint8(tiffStart + entryOffset + 8));
          break;
        case 4: // GPSLongitude (3 rationals)
          lngValues = readRationals(view, tiffStart + valueOffset, 3, littleEndian);
          break;
      }
    }

    if (latValues.length !== 3 || lngValues.length !== 3) return null;

    let lat = latValues[0] + latValues[1] / 60 + latValues[2] / 3600;
    let lng = lngValues[0] + lngValues[1] / 60 + lngValues[2] / 3600;

    if (latRef === 'S') lat = -lat;
    if (lngRef === 'W') lng = -lng;

    if (lat === 0 && lng === 0) return null;

    return { lat, lng };
  } catch {
    return null;
  }
}

function readRationals(view: DataView, offset: number, count: number, littleEndian: boolean): number[] {
  const values: number[] = [];
  for (let i = 0; i < count; i++) {
    const num = view.getUint32(offset + i * 8, littleEndian);
    const den = view.getUint32(offset + i * 8 + 4, littleEndian);
    values.push(den === 0 ? 0 : num / den);
  }
  return values;
}
