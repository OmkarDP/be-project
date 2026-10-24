import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export interface FoodItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface SeatSelection {
  id: string;
  row: string;
  number: number;
  category: string;
  price: number;
}

export interface ContactDetails {
  name: string;
  email: string;
  phone: string;
}

export interface BookingDraft {
  city: string;
  movieId: string | null;
  cinemaId: string | null;
  date: string | null;
  showtimeId: string | null;
  ticketCount: number;
  selectedSeats: SeatSelection[];
  holdId: string | null;
  holdExpiresAt: number | null;
  food: FoodItem[];
  contact: ContactDetails;
  paymentMethod: string;
  paymentOutcome: string;
}

export interface BookingRecord {
  bookingId: string;
  movieTitle: string;
  city: string;
  cinemaName: string;
  date: string;
  time: string;
  format: string;
  seats: Array<{ id: string; row: string; number: number; category: string; price: number }>;
  ticketCount: number;
  food: Array<{ id: string; name: string; price: number; quantity: number }>;
  total: number;
  ticketSubtotal: number;
  convenienceFee: number;
  foodSubtotal: number;
  status: string;
  createdAt: string;
}

const STORAGE_KEY = "movieseatlab:draft";
const SESSION_KEY = "movieseatlab:session";

function defaultDraft(): BookingDraft {
  return {
    city: "Pune",
    movieId: null,
    cinemaId: null,
    date: null,
    showtimeId: null,
    ticketCount: 2,
    selectedSeats: [],
    holdId: null,
    holdExpiresAt: null,
    food: [],
    contact: { name: "Test User", email: "test@example.com", phone: "9876543210" },
    paymentMethod: "UPI",
    paymentOutcome: "success",
  };
}

function loadDraft(): BookingDraft {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaultDraft(), ...JSON.parse(raw) };
  } catch {
    // ignore
  }
  return defaultDraft();
}

function getSessionId(): string {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = `session-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

interface StoreValue {
  draft: BookingDraft;
  setDraft: (updater: (prev: BookingDraft) => BookingDraft) => void;
  resetDraft: () => void;
  sessionId: string;
  movies: any[];
  setMovies: (m: any[]) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [draft, setDraftState] = useState<BookingDraft>(loadDraft);
  const [sessionId] = useState<string>(getSessionId);
  const [movies, setMovies] = useState<any[]>([]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  }, [draft]);

  const setDraft = useCallback((updater: (prev: BookingDraft) => BookingDraft) => {
    setDraftState((prev) => updater(prev));
  }, []);

  const resetDraft = useCallback(() => {
    setDraftState(defaultDraft());
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <StoreContext.Provider value={{ draft, setDraft, resetDraft, sessionId, movies, setMovies }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("StoreProvider missing");
  return ctx;
}
