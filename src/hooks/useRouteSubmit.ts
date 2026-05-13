import { useCallback, useState } from 'react';

import { submitRoute as submitRouteRequest, RouteApiError } from '../api/routeApi';
import type { AddressFormValues, SubmitRouteResponse } from '../types';

export interface UseRouteSubmitResult {
  submitRoute: (values: AddressFormValues) => Promise<SubmitRouteResponse>;
  isSubmitting: boolean;
  error: string | null;
  clearError: () => void;
}

function normalizeSubmitError(error: unknown): string {
  if (error instanceof RouteApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Server error, please try again';
}

export function useRouteSubmit(): UseRouteSubmitResult {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitRoute = useCallback(async ({ origin, destination }: AddressFormValues) => {
    setIsSubmitting(true);
    setError(null);

    try {
      return await submitRouteRequest(origin, destination);
    } catch (submissionError) {
      const message = normalizeSubmitError(submissionError);
      setError(message);
      throw submissionError;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    submitRoute,
    isSubmitting,
    error,
    clearError,
  };
}
