export type RouteStatus = 'in progress' | 'failure' | 'success';

export type Waypoint = [string, string];

export interface AddressFormValues {
  origin: string;
  destination: string;
}

export interface SubmitRouteResponse {
  token: string;
}

export interface RouteInProgress {
  status: 'in progress';
}

export interface RouteFailure {
  status: 'failure';
  error: string;
}

export interface RouteSuccess {
  status: 'success';
  path: Waypoint[];
  total_distance: number;
  total_time: number;
}

export type RouteResponse = RouteInProgress | RouteFailure | RouteSuccess;
