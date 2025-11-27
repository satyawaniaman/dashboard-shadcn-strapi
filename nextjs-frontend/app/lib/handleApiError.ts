import { AxiosError } from "axios";

interface StrapiError {
  error?: {
    message?: string;
  };
}

interface StrapiErrorResponse {
  data?: {
    error?: {
      message?: string;
    };
  };
}

export function handleApiError(
  error: unknown,
  defaultMessage = "Something went wrong",
): string {
  if (!error) return defaultMessage;

  // Check if it's an Axios error
  if (error instanceof AxiosError) {
    // Strapi formatted error in response
    const strapiResponse = error.response as StrapiErrorResponse | undefined;
    if (strapiResponse?.data?.error?.message) {
      return strapiResponse.data.error.message;
    }

    // Axios error message
    if (error.message) {
      return error.message;
    }
  }

  // Check if it's a generic error with message
  if (error instanceof Error) {
    return error.message;
  }

  // Check if it's a Strapi error object
  const strapiError = error as StrapiError;
  if (strapiError?.error?.message) {
    return strapiError.error.message;
  }

  return defaultMessage;
}
