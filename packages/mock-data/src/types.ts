export type CurrencyCode = "INR";

export type BookingStatus = "pending" | "confirmed" | "failed" | "cancelled";

export interface Money {
  amount: number;
  currency: CurrencyCode;
}

export interface Station {
  code: string;
  name: string;
  city: string;
}

export interface TrainClassAvailability {
  classType: "SL" | "3A" | "2A" | "1A";
  price: number;
  availableSeats: number;
  status: "available" | "limited" | "waitlisted" | "sold-out";
}

export interface Train {
  id: string;
  number: string;
  name: string;
  from: string;
  to: string;
  departure: string;
  arrival: string;
  durationMinutes: number;
  classType: "SL" | "3A" | "2A" | "1A";
  price: number;
  availableSeats: number;
  status: "available" | "sold-out" | "limited" | "waitlisted";
  operatingDays?: string[];
  classes?: TrainClassAvailability[];
}

export type BusCategory = "seater" | "sleeper" | "seater-sleeper";

export interface Seat {
  id: string;
  deck: "lower" | "upper" | "main";
  type: "seater" | "sleeper";
  position: "window" | "aisle" | "middle";
  price: number;
  status: "available" | "booked";
}

export interface BoardingPoint {
  id: string;
  name: string;
  address: string;
  time: string;
  instruction?: string;
}

export interface DroppingPoint {
  id: string;
  name: string;
  address: string;
  time: string;
  instruction?: string;
}

export interface Bus {
  id: string;
  operator: string;
  from: string;
  to: string;
  departure: string;
  arrival: string;
  durationMinutes: number;
  busType: string;
  category: BusCategory;
  ac: boolean;
  price: number;
  availableSeats: number;
  status: "available" | "sold-out";
  rating: number;
  amenities: string[];
  seats: Seat[];
  boardingPoints: BoardingPoint[];
  droppingPoints: DroppingPoint[];
}

export interface Show {
  id: string;
  movie: string;
  theatre: string;
  city: string;
  showTime: string;
  format: "2D" | "3D" | "IMAX";
  language: string;
  price: number;
  availableSeats: number;
  status: "available" | "sold-out";
}

export interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  price: number;
  currency: CurrencyCode;
  availableSeats: number;
  status: "available" | "sold-out";
  meta: Record<string, string>;
}

export interface MockBooking {
  bookingId: string;
  platform: "irctc" | "redbus" | "bookmyshow";
  status: BookingStatus;
  createdAt: string;
  totalAmount: number;
  currency: CurrencyCode;
}