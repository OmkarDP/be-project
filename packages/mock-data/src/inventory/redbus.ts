import type { Bus, Seat, BoardingPoint, DroppingPoint } from "../types";

function seaterSeats(count: number, basePrice: number): Seat[] {
  const seats: Seat[] = [];
  for (let i = 1; i <= count; i++) {
    const id = `S${String(i).padStart(2, "0")}`;
    seats.push({
      id,
      deck: "main",
      type: "seater",
      position: i % 2 === 0 ? "aisle" : "window",
      price: i % 2 === 0 ? basePrice : basePrice + 40,
      status: "available",
    });
  }
  return seats;
}

function sleeperSeats(lower: number, upper: number, lowerPrice: number, upperPrice: number): Seat[] {
  const seats: Seat[] = [];
  for (let i = 1; i <= lower; i++) {
    seats.push({
      id: `L${i}`,
      deck: "lower",
      type: "sleeper",
      position: i % 2 === 0 ? "aisle" : "window",
      price: lowerPrice,
      status: "available",
    });
  }
  for (let i = 1; i <= upper; i++) {
    seats.push({
      id: `U${i}`,
      deck: "upper",
      type: "sleeper",
      position: i % 2 === 0 ? "aisle" : "window",
      price: upperPrice,
      status: "available",
    });
  }
  return seats;
}

function mixedSeats(seaterCount: number, sleeperLower: number, sleeperUpper: number, seaterPrice: number, lowerPrice: number, upperPrice: number): Seat[] {
  return [
    ...seaterSeats(seaterCount, seaterPrice),
    ...sleeperSeats(sleeperLower, sleeperUpper, lowerPrice, upperPrice).map((s) => ({
      ...s,
      id: s.id.startsWith("L") ? `L${s.id.slice(1)}` : `U${s.id.slice(1)}`,
    })),
  ];
}

const puneBoarding: BoardingPoint[] = [
  { id: "bp-swargate", name: "Swargate Bus Stand", address: "Pune", time: "21:30", instruction: "Report 15 minutes early" },
  { id: "bp-station", name: "Pune Railway Station", address: "Pune", time: "21:45", instruction: "Gate 2" },
  { id: "bp-hinjewadi", name: "Hinjewadi Phase 1", address: "Pune", time: "22:00", instruction: "Opposite IT park" },
];

const mumbaiDropping: DroppingPoint[] = [
  { id: "dp-dadar", name: "Dadar", address: "Mumbai", time: "05:15", instruction: "Near station" },
  { id: "dp-borivali", name: "Borivali", address: "Mumbai", time: "05:45", instruction: "East side" },
  { id: "dp-thane", name: "Thane", address: "Mumbai", time: "06:00", instruction: "Bus stop" },
];

const mumbaiBoarding: BoardingPoint[] = [
  { id: "bp-dadar-b", name: "Dadar", address: "Mumbai", time: "07:00", instruction: "Report 15 minutes early" },
  { id: "bp-borivali-b", name: "Borivali", address: "Mumbai", time: "07:20", instruction: "East side" },
  { id: "bp-thane-b", name: "Thane", address: "Mumbai", time: "07:40", instruction: "Bus stop" },
];

const puneDropping: DroppingPoint[] = [
  { id: "dp-swargate", name: "Swargate", address: "Pune", time: "10:15", instruction: "Near stand" },
  { id: "dp-station", name: "Pune Station", address: "Pune", time: "10:30", instruction: "Gate 1" },
  { id: "dp-hinjewadi", name: "Hinjewadi", address: "Pune", time: "11:00", instruction: "IT park" },
];

const RAW_REDBUS_BUSES: Bus[] = [
  {
    id: "bus-101",
    operator: "Deccan Royal Travels",
    from: "Pune",
    to: "Mumbai",
    departure: "22:00",
    arrival: "05:30",
    durationMinutes: 450,
    busType: "AC Sleeper",
    category: "sleeper",
    ac: true,
    price: 750,
    availableSeats: 18,
    status: "available",
    rating: 4.3,
    amenities: ["Charging Port", "Blanket", "Wi-Fi"],
    seats: sleeperSeats(10, 10, 850, 750),
    boardingPoints: puneBoarding,
    droppingPoints: mumbaiDropping,
  },
  {
    id: "bus-102",
    operator: "Western Comfort",
    from: "Mumbai",
    to: "Pune",
    departure: "07:00",
    arrival: "10:30",
    durationMinutes: 210,
    busType: "AC Seater",
    category: "seater",
    ac: true,
    price: 620,
    availableSeats: 31,
    status: "available",
    rating: 4.1,
    amenities: ["Charging Port", "Water Bottle"],
    seats: seaterSeats(36, 620),
    boardingPoints: mumbaiBoarding,
    droppingPoints: puneDropping,
  },
  {
    id: "bus-103",
    operator: "Goa Coastal Lines",
    from: "Pune",
    to: "Goa",
    departure: "20:30",
    arrival: "07:00",
    durationMinutes: 630,
    busType: "AC Sleeper",
    category: "sleeper",
    ac: true,
    price: 980,
    availableSeats: 22,
    status: "available",
    rating: 4.5,
    amenities: ["Blanket", "Pillow", "Charging Port"],
    seats: sleeperSeats(12, 12, 1080, 980),
    boardingPoints: puneBoarding,
    droppingPoints: [
      { id: "dp-panjim", name: "Panjim", address: "Goa", time: "07:00", instruction: "Main stand" },
      { id: "dp-madgaon", name: "Madgaon", address: "Goa", time: "07:30", instruction: "Railway station" },
      { id: "dp-mapusa", name: "Mapusa", address: "Goa", time: "06:45", instruction: "Bus stop" },
    ],
  },
  {
    id: "bus-104",
    operator: "Nashik Express",
    from: "Pune",
    to: "Nashik",
    departure: "06:15",
    arrival: "10:00",
    durationMinutes: 225,
    busType: "Non-AC Seater",
    category: "seater",
    ac: false,
    price: 320,
    availableSeats: 40,
    status: "available",
    rating: 3.8,
    amenities: ["Charging Port"],
    seats: seaterSeats(40, 320),
    boardingPoints: puneBoarding,
    droppingPoints: [
      { id: "dp-nashik-central", name: "Nashik Central", address: "Nashik", time: "10:00", instruction: "Main stand" },
      { id: "dp-nashik-road", name: "Nashik Road", address: "Nashik", time: "09:45", instruction: "Station" },
      { id: "dp-pimpalgaon", name: "Pimpalgaon", address: "Nashik", time: "09:30", instruction: "Highway stop" },
    ],
  },
  {
    id: "bus-105",
    operator: "Deccan Connect",
    from: "Bengaluru",
    to: "Hyderabad",
    departure: "21:00",
    arrival: "06:30",
    durationMinutes: 570,
    busType: "AC Seater/Sleeper",
    category: "seater-sleeper",
    ac: true,
    price: 880,
    availableSeats: 26,
    status: "available",
    rating: 4.2,
    amenities: ["Wi-Fi", "Charging Port", "Blanket"],
    seats: mixedSeats(18, 6, 6, 880, 1000, 900),
    boardingPoints: [
      { id: "bp-majestic", name: "Majestic", address: "Bengaluru", time: "20:45", instruction: "Platform 4" },
      { id: "bp-electronic", name: "Electronic City", address: "Bengaluru", time: "21:15", instruction: "Toll gate" },
      { id: "bp-hebbal", name: "Hebbal", address: "Bengaluru", time: "21:30", instruction: "Flyover" },
    ],
    droppingPoints: [
      { id: "dp-hyd-miyapur", name: "Miyapur", address: "Hyderabad", time: "06:15", instruction: "Metro" },
      { id: "dp-hyd-ameerpet", name: "Ameerpet", address: "Hyderabad", time: "06:30", instruction: "Main road" },
      { id: "dp-hyd-lb", name: "LB Nagar", address: "Hyderabad", time: "07:00", instruction: "Circle" },
    ],
  },
  {
    id: "bus-106",
    operator: "Gujarat Star Lines",
    from: "Mumbai",
    to: "Ahmedabad",
    departure: "22:15",
    arrival: "06:00",
    durationMinutes: 465,
    busType: "AC Sleeper",
    category: "sleeper",
    ac: true,
    price: 900,
    availableSeats: 16,
    status: "available",
    rating: 4.0,
    amenities: ["Blanket", "Charging Port"],
    seats: sleeperSeats(8, 8, 1000, 900),
    boardingPoints: mumbaiBoarding,
    droppingPoints: [
      { id: "dp-ahm-geeta", name: "Geeta Mandir", address: "Ahmedabad", time: "05:45", instruction: "Main stand" },
      { id: "dp-ahm-paldi", name: "Paldi", address: "Ahmedabad", time: "06:00", instruction: "Circle" },
      { id: "dp-ahm-sg", name: "SG Highway", address: "Ahmedabad", time: "06:15", instruction: "Toll" },
    ],
  },
  {
    id: "bus-107",
    operator: "Sunrise Express",
    from: "Pune",
    to: "Mumbai",
    departure: "06:00",
    arrival: "09:30",
    durationMinutes: 210,
    busType: "Non-AC Seater",
    category: "seater",
    ac: false,
    price: 420,
    availableSeats: 35,
    status: "available",
    rating: 3.9,
    amenities: ["Water Bottle"],
    seats: seaterSeats(40, 420),
    boardingPoints: puneBoarding,
    droppingPoints: mumbaiDropping,
  },
  {
    id: "bus-108",
    operator: "Royal Deccan",
    from: "Pune",
    to: "Goa",
    departure: "18:00",
    arrival: "05:30",
    durationMinutes: 690,
    busType: "Non-AC Sleeper",
    category: "sleeper",
    ac: false,
    price: 720,
    availableSeats: 14,
    status: "available",
    rating: 3.7,
    amenities: ["Blanket"],
    seats: sleeperSeats(10, 10, 820, 720),
    boardingPoints: puneBoarding,
    droppingPoints: [
      { id: "dp-panjim2", name: "Panjim", address: "Goa", time: "05:30", instruction: "Main stand" },
      { id: "dp-madgaon2", name: "Madgaon", address: "Goa", time: "06:00", instruction: "Railway station" },
      { id: "dp-mapusa2", name: "Mapusa", address: "Goa", time: "05:15", instruction: "Bus stop" },
    ],
  },
  {
    id: "bus-109",
    operator: "Hyderabad Link",
    from: "Bengaluru",
    to: "Hyderabad",
    departure: "07:30",
    arrival: "15:00",
    durationMinutes: 450,
    busType: "AC Seater",
    category: "seater",
    ac: true,
    price: 700,
    availableSeats: 28,
    status: "available",
    rating: 4.1,
    amenities: ["Charging Port", "Wi-Fi"],
    seats: seaterSeats(32, 700),
    boardingPoints: [
      { id: "bp-majestic2", name: "Majestic", address: "Bengaluru", time: "07:15", instruction: "Platform 2" },
      { id: "bp-electronic2", name: "Electronic City", address: "Bengaluru", time: "07:45", instruction: "Toll gate" },
      { id: "bp-hebbal2", name: "Hebbal", address: "Bengaluru", time: "08:00", instruction: "Flyover" },
    ],
    droppingPoints: [
      { id: "dp-hyd-miyapur2", name: "Miyapur", address: "Hyderabad", time: "14:45", instruction: "Metro" },
      { id: "dp-hyd-ameerpet2", name: "Ameerpet", address: "Hyderabad", time: "15:00", instruction: "Main road" },
      { id: "dp-hyd-lb2", name: "LB Nagar", address: "Hyderabad", time: "15:30", instruction: "Circle" },
    ],
  },
  {
    id: "bus-110",
    operator: "Ahmedabad Express",
    from: "Mumbai",
    to: "Ahmedabad",
    departure: "16:00",
    arrival: "23:30",
    durationMinutes: 450,
    busType: "Non-AC Seater",
    category: "seater",
    ac: false,
    price: 550,
    availableSeats: 33,
    status: "available",
    rating: 3.6,
    amenities: ["Water Bottle"],
    seats: seaterSeats(40, 550),
    boardingPoints: mumbaiBoarding,
    droppingPoints: [
      { id: "dp-ahm-geeta2", name: "Geeta Mandir", address: "Ahmedabad", time: "23:15", instruction: "Main stand" },
      { id: "dp-ahm-paldi2", name: "Paldi", address: "Ahmedabad", time: "23:30", instruction: "Circle" },
      { id: "dp-ahm-sg2", name: "SG Highway", address: "Ahmedabad", time: "23:45", instruction: "Toll" },
    ],
  },
];

export const REDBUS_BUSES: Bus[] = RAW_REDBUS_BUSES.map((bus) => {
  const seats = bus.seats.map((seat) =>
    seat.id === "S05" || seat.id === "L3" || seat.id === "U3"
      ? { ...seat, status: "booked" as const }
      : seat,
  );
  return {
    ...bus,
    seats,
    availableSeats: seats.filter((s) => s.status === "available").length,
  };
});