export interface BookingStatus {
  bookingId: string;
  safeToShare: boolean;
  status: 'RESERVED' | 'REBOOKED' | 'SHARED' | 'NOT_FOUND' | 'UNKNOWN';
}

export interface BookingStatusResponse {
  bookings: BookingStatus[];
}
