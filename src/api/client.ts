const FALLBACK_BASE_URL = 'https://studyeasy-production.up.railway.app';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? FALLBACK_BASE_URL;

type AuthSnapshot = {
  userId?: string;
  idToken?: string;
};

let currentAuth: AuthSnapshot = {};

export const setApiAuthHeaders = (snapshot: AuthSnapshot) => {
  currentAuth = {
    userId: snapshot.userId ?? undefined,
    idToken: snapshot.idToken ?? undefined,
  };
};

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

interface RequestOptions extends RequestInit {
  baseUrl?: string;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { baseUrl = API_BASE_URL, headers, ...rest } = options;
  const url = `${baseUrl}${path}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(currentAuth.userId ? { 'X-User-Id': currentAuth.userId } : {}),
      ...(currentAuth.idToken ? { Authorization: `Bearer ${currentAuth.idToken}` } : {}),
      ...(headers ?? {}),
    },
    ...rest,
  });

  const contentType = response.headers.get('Content-Type');
  const isJson = contentType?.includes('application/json');
  const body = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    throw new ApiError(`API error ${response.status}`, response.status, body);
  }

  return body as T;
}

export async function upload<T>(path: string, formData: FormData, options: RequestOptions = {}): Promise<T> {
  const { baseUrl = API_BASE_URL, headers, ...rest } = options;
  const url = `${baseUrl}${path}`;
  const response = await fetch(url, {
    method: 'POST',
    body: formData,
    headers: {
      ...(currentAuth.userId ? { 'X-User-Id': currentAuth.userId } : {}),
      ...(currentAuth.idToken ? { Authorization: `Bearer ${currentAuth.idToken}` } : {}),
      ...(headers ?? {}),
    },
    ...rest,
  });

  const contentType = response.headers.get('Content-Type');
  const isJson = contentType?.includes('application/json');
  const body = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    throw new ApiError(`API error ${response.status}`, response.status, body);
  }

  return body as T;
}
