'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { GeoCoordinates, GeolocationStatus, NearestLocation } from '@/lib/types';
import { findNearestLocation } from '@/lib/geolocation';

interface UseGeolocationOptions {
  autoRequest?: boolean;
  watch?: boolean;
  maximumAge?: number;
  timeout?: number;
  enableHighAccuracy?: boolean;
}

interface UseGeolocationReturn {
  coords: GeoCoordinates | null;
  nearestLocation: NearestLocation | null;
  status: GeolocationStatus;
  error: string | null;
  requestPermission: () => void;
}

export function useGeolocation(options: UseGeolocationOptions = {}): UseGeolocationReturn {
  const {
    autoRequest = false,
    watch = true,
    maximumAge = 60_000,
    timeout = 10_000,
    enableHighAccuracy = true,
  } = options;

  const [coords, setCoords] = useState<GeoCoordinates | null>(null);
  const [nearestLocation, setNearestLocation] = useState<NearestLocation | null>(null);
  const [status, setStatus] = useState<GeolocationStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const handleSuccess = useCallback((position: GeolocationPosition) => {
    const newCoords: GeoCoordinates = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: position.timestamp,
    };
    setCoords(newCoords);
    setStatus('active');
    setError(null);
    setNearestLocation(findNearestLocation(newCoords));
  }, []);

  const handleError = useCallback((err: GeolocationPositionError) => {
    switch (err.code) {
      case err.PERMISSION_DENIED:
        setStatus('denied');
        setError('Location permission was denied');
        break;
      case err.POSITION_UNAVAILABLE:
        setStatus('unavailable');
        setError('Location unavailable');
        break;
      case err.TIMEOUT:
        setStatus('error');
        setError('Location request timed out');
        break;
      default:
        setStatus('error');
        setError('Unknown location error');
    }
  }, []);

  const requestPermission = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setStatus('unavailable');
      setError('Geolocation is not supported by this browser');
      return;
    }

    setStatus('requesting');
    setError(null);

    const geoOptions: PositionOptions = {
      enableHighAccuracy,
      maximumAge,
      timeout,
    };

    if (watch) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      watchIdRef.current = navigator.geolocation.watchPosition(
        handleSuccess,
        handleError,
        geoOptions
      );
    } else {
      navigator.geolocation.getCurrentPosition(
        handleSuccess,
        handleError,
        geoOptions
      );
    }
  }, [watch, enableHighAccuracy, maximumAge, timeout, handleSuccess, handleError]);

  useEffect(() => {
    if (autoRequest) {
      requestPermission();
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [autoRequest, requestPermission]);

  return { coords, nearestLocation, status, error, requestPermission };
}
