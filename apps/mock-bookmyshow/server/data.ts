export interface City {
  id: string;
  name: string;
}

export interface Movie {
  id: string;
  title: string;
  genre: string;
  language: string;
  runtime: number;
  classification: string;
  synopsis: string;
  rating: number;
  formats: Array<"2D" | "3D" | "IMAX">;
  posterGradient: string;
  initials: string;
}

export interface Cinema {
  id: string;
  name: string;
  city: string;
  area: string;
  formats: string[];
}

export interface ShowtimeSeed {
  id: string;
  movieId: string;
  city: string;
  cinemaId: string;
  date: string;
  time: string;
  format: "2D" | "3D" | "IMAX";
  language: string;
  price: number;
  status: "available" | "sold-out";
}

export const CITIES: City[] = [
  { id: "pune", name: "Pune" },
  { id: "mumbai", name: "Mumbai" },
  { id: "bengaluru", name: "Bengaluru" },
  { id: "hyderabad", name: "Hyderabad" },
  { id: "delhi", name: "Delhi" },
];

export const MOVIES: Movie[] = [
  {
    id: "movie-neon-heist",
    title: "Neon Heist",
    genre: "Action",
    language: "English",
    runtime: 128,
    classification: "A",
    synopsis: "A crew of specialists plans a daring museum break-in under a city of neon lights.",
    rating: 8.1,
    formats: ["2D", "3D", "IMAX"],
    posterGradient: "linear-gradient(135deg,#1e3a8a,#7c3aed)",
    initials: "NH",
  },
  {
    id: "movie-monsoon-melody",
    title: "Monsoon Melody",
    genre: "Musical",
    language: "Hindi",
    runtime: 142,
    classification: "U/A",
    synopsis: "Two rival musicians find harmony during a rain-soaked coastal festival.",
    rating: 7.6,
    formats: ["2D"],
    posterGradient: "linear-gradient(135deg,#0f766e,#34d399)",
    initials: "MM",
  },
  {
    id: "movie-code-desert",
    title: "Code of the Desert",
    genre: "Thriller",
    language: "Hindi",
    runtime: 115,
    classification: "A",
    synopsis: "A cryptographer chases a vanished caravan of secrets across the dunes.",
    rating: 8.4,
    formats: ["2D", "IMAX"],
    posterGradient: "linear-gradient(135deg,#7c2d12,#f59e0b)",
    initials: "CD",
  },
  {
    id: "movie-laugh-riot",
    title: "Laugh Riot",
    genre: "Comedy",
    language: "English",
    runtime: 105,
    classification: "U",
    synopsis: "A wedding planner's worst week becomes the town's funniest festival.",
    rating: 7.2,
    formats: ["2D"],
    posterGradient: "linear-gradient(135deg,#be185d,#f472b6)",
    initials: "LR",
  },
  {
    id: "movie-starbound",
    title: "Starbound",
    genre: "Sci-Fi",
    language: "English",
    runtime: 156,
    classification: "U/A",
    synopsis: "Cadets on a generation ship discover their destination is not empty.",
    rating: 8.7,
    formats: ["3D", "IMAX"],
    posterGradient: "linear-gradient(135deg,#111827,#6366f1)",
    initials: "SB",
  },
  {
    id: "movie-echoes-empire",
    title: "Echoes of Empire",
    genre: "Historical",
    language: "Hindi",
    runtime: 170,
    classification: "U/A",
    synopsis: "A forgotten queen's letters rewrite the story of a fallen dynasty.",
    rating: 8.0,
    formats: ["2D"],
    posterGradient: "linear-gradient(135deg,#3f2d1f,#a16207)",
    initials: "EE",
  },
  {
    id: "movie-midnight-masala",
    title: "Midnight Masala",
    genre: "Comedy",
    language: "Telugu",
    runtime: 132,
    classification: "U/A",
    synopsis: "A late-night radio host accidentally solves a city's strangest mystery.",
    rating: 7.4,
    formats: ["2D", "3D"],
    posterGradient: "linear-gradient(135deg,#4c1d95,#c026d3)",
    initials: "MM2",
  },
  {
    id: "movie-last-goal",
    title: "The Last Goal",
    genre: "Sports",
    language: "Kannada",
    runtime: 124,
    classification: "U",
    synopsis: "An underdog football club fights for one final season of glory.",
    rating: 7.9,
    formats: ["2D"],
    posterGradient: "linear-gradient(135deg,#14532d,#22c55e)",
    initials: "LG",
  },
  {
    id: "movie-whispering-pines",
    title: "Whispering Pines",
    genre: "Horror",
    language: "English",
    runtime: 98,
    classification: "A",
    synopsis: "A family cabin retreat turns into a week of impossible echoes.",
    rating: 7.1,
    formats: ["2D"],
    posterGradient: "linear-gradient(135deg,#020617,#334155)",
    initials: "WP",
  },
  {
    id: "movie-rang-bazaar",
    title: "Rang Bazaar",
    genre: "Romance",
    language: "Marathi",
    runtime: 138,
    classification: "U",
    synopsis: "A painter and a spice merchant trade colors across a bustling market.",
    rating: 7.7,
    formats: ["2D"],
    posterGradient: "linear-gradient(135deg,#9f1239,#fb7185)",
    initials: "RB",
  },
];

export const CINEMAS: Cinema[] = [
  { id: "cin-pune-palm", name: "Palm Court Cinemas", city: "Pune", area: "Koregaon Park", formats: ["2D", "3D"] },
  { id: "cin-pune-river", name: "Riverfront Multiplex", city: "Pune", area: "Baner", formats: ["2D", "IMAX"] },
  { id: "cin-mumbai-harbour", name: "Harbour IMAX", city: "Mumbai", area: "Colaba", formats: ["2D", "3D", "IMAX"] },
  { id: "cin-mumbai-citylight", name: "Citylight Screens", city: "Mumbai", area: "Andheri", formats: ["2D"] },
  { id: "cin-bengaluru-techdome", name: "TechDome Cinemas", city: "Bengaluru", area: "Indiranagar", formats: ["2D", "3D", "IMAX"] },
  { id: "cin-bengaluru-garden", name: "Garden Multiplex", city: "Bengaluru", area: "Jayanagar", formats: ["2D"] },
  { id: "cin-hyderabad-deccan", name: "Deccan Cineplex", city: "Hyderabad", area: "Jubilee Hills", formats: ["2D", "3D"] },
  { id: "cin-hyderabad-charminar", name: "Charminar Screens", city: "Hyderabad", area: "Old City", formats: ["2D"] },
  { id: "cin-delhi-capital", name: "Capital IMAX", city: "Delhi", area: "Connaught Place", formats: ["2D", "3D", "IMAX"] },
  { id: "cin-delhi-yamuna", name: "Yamuna Multiplex", city: "Delhi", area: "Dwarka", formats: ["2D"] },
];

const D1 = "2026-10-30";
const D2 = "2026-10-31";
const D3 = "2026-11-01";

export const SHOWTIMES: ShowtimeSeed[] = [
  // Neon Heist
  { id: "st-neon-pune-palm-1", movieId: "movie-neon-heist", city: "Pune", cinemaId: "cin-pune-palm", date: D1, time: "10:30", format: "2D", language: "English", price: 220, status: "available" },
  { id: "st-neon-pune-palm-2", movieId: "movie-neon-heist", city: "Pune", cinemaId: "cin-pune-palm", date: D1, time: "14:00", format: "3D", language: "English", price: 320, status: "available" },
  { id: "st-neon-pune-river-1", movieId: "movie-neon-heist", city: "Pune", cinemaId: "cin-pune-river", date: D2, time: "19:00", format: "IMAX", language: "English", price: 450, status: "available" },
  { id: "st-neon-mumbai-harbour-1", movieId: "movie-neon-heist", city: "Mumbai", cinemaId: "cin-mumbai-harbour", date: D1, time: "11:00", format: "IMAX", language: "English", price: 480, status: "available" },
  { id: "st-neon-bengaluru-tech-1", movieId: "movie-neon-heist", city: "Bengaluru", cinemaId: "cin-bengaluru-techdome", date: D2, time: "16:00", format: "3D", language: "English", price: 300, status: "available" },
  { id: "st-neon-hyderabad-deccan-1", movieId: "movie-neon-heist", city: "Hyderabad", cinemaId: "cin-hyderabad-deccan", date: D3, time: "20:00", format: "2D", language: "English", price: 240, status: "available" },
  { id: "st-neon-delhi-capital-1", movieId: "movie-neon-heist", city: "Delhi", cinemaId: "cin-delhi-capital", date: D1, time: "13:30", format: "IMAX", language: "English", price: 500, status: "available" },
  // Monsoon Melody (limited)
  { id: "st-monsoon-pune-palm-1", movieId: "movie-monsoon-melody", city: "Pune", cinemaId: "cin-pune-palm", date: D1, time: "18:30", format: "2D", language: "Hindi", price: 200, status: "available" },
  { id: "st-monsoon-mumbai-citylight-1", movieId: "movie-monsoon-melody", city: "Mumbai", cinemaId: "cin-mumbai-citylight", date: D2, time: "15:00", format: "2D", language: "Hindi", price: 210, status: "available" },
  { id: "st-monsoon-mumbai-citylight-2", movieId: "movie-monsoon-melody", city: "Mumbai", cinemaId: "cin-mumbai-citylight", date: D2, time: "20:00", format: "2D", language: "Hindi", price: 210, status: "sold-out" },
  { id: "st-monsoon-delhi-yamuna-1", movieId: "movie-monsoon-melody", city: "Delhi", cinemaId: "cin-delhi-yamuna", date: D3, time: "17:00", format: "2D", language: "Hindi", price: 190, status: "available" },
  // Code of the Desert
  { id: "st-code-bengaluru-tech-1", movieId: "movie-code-desert", city: "Bengaluru", cinemaId: "cin-bengaluru-techdome", date: D1, time: "11:00", format: "IMAX", language: "Hindi", price: 420, status: "available" },
  { id: "st-code-bengaluru-garden-1", movieId: "movie-code-desert", city: "Bengaluru", cinemaId: "cin-bengaluru-garden", date: D2, time: "19:30", format: "2D", language: "Hindi", price: 260, status: "sold-out" },
  { id: "st-code-hyderabad-deccan-1", movieId: "movie-code-desert", city: "Hyderabad", cinemaId: "cin-hyderabad-deccan", date: D3, time: "14:00", format: "2D", language: "Hindi", price: 250, status: "available" },
  // Laugh Riot
  { id: "st-laugh-pune-palm-1", movieId: "movie-laugh-riot", city: "Pune", cinemaId: "cin-pune-palm", date: D1, time: "12:00", format: "2D", language: "English", price: 180, status: "available" },
  { id: "st-laugh-mumbai-harbour-1", movieId: "movie-laugh-riot", city: "Mumbai", cinemaId: "cin-mumbai-harbour", date: D1, time: "16:00", format: "2D", language: "English", price: 200, status: "available" },
  { id: "st-laugh-bengaluru-tech-1", movieId: "movie-laugh-riot", city: "Bengaluru", cinemaId: "cin-bengaluru-techdome", date: D2, time: "18:00", format: "2D", language: "English", price: 190, status: "available" },
  { id: "st-laugh-hyderabad-charminar-1", movieId: "movie-laugh-riot", city: "Hyderabad", cinemaId: "cin-hyderabad-charminar", date: D2, time: "20:00", format: "2D", language: "English", price: 170, status: "available" },
  { id: "st-laugh-delhi-yamuna-1", movieId: "movie-laugh-riot", city: "Delhi", cinemaId: "cin-delhi-yamuna", date: D3, time: "13:00", format: "2D", language: "English", price: 180, status: "available" },
  // Starbound
  { id: "st-star-mumbai-harbour-1", movieId: "movie-starbound", city: "Mumbai", cinemaId: "cin-mumbai-harbour", date: D1, time: "19:30", format: "IMAX", language: "English", price: 520, status: "available" },
  { id: "st-star-bengaluru-tech-1", movieId: "movie-starbound", city: "Bengaluru", cinemaId: "cin-bengaluru-techdome", date: D2, time: "20:00", format: "3D", language: "English", price: 360, status: "available" },
  { id: "st-star-delhi-capital-1", movieId: "movie-starbound", city: "Delhi", cinemaId: "cin-delhi-capital", date: D3, time: "18:00", format: "IMAX", language: "English", price: 540, status: "available" },
  // Echoes of Empire
  { id: "st-echoes-delhi-capital-1", movieId: "movie-echoes-empire", city: "Delhi", cinemaId: "cin-delhi-capital", date: D1, time: "10:00", format: "2D", language: "Hindi", price: 230, status: "available" },
  { id: "st-echoes-hyderabad-deccan-1", movieId: "movie-echoes-empire", city: "Hyderabad", cinemaId: "cin-hyderabad-deccan", date: D2, time: "15:30", format: "2D", language: "Hindi", price: 220, status: "available" },
  // Midnight Masala (no Pune)
  { id: "st-midnight-hyderabad-deccan-1", movieId: "movie-midnight-masala", city: "Hyderabad", cinemaId: "cin-hyderabad-deccan", date: D1, time: "21:00", format: "3D", language: "Telugu", price: 260, status: "available" },
  { id: "st-midnight-bengaluru-garden-1", movieId: "movie-midnight-masala", city: "Bengaluru", cinemaId: "cin-bengaluru-garden", date: D2, time: "17:30", format: "2D", language: "Telugu", price: 210, status: "available" },
  // The Last Goal
  { id: "st-goal-pune-river-1", movieId: "movie-last-goal", city: "Pune", cinemaId: "cin-pune-river", date: D1, time: "16:00", format: "2D", language: "Kannada", price: 200, status: "available" },
  { id: "st-goal-mumbai-citylight-1", movieId: "movie-last-goal", city: "Mumbai", cinemaId: "cin-mumbai-citylight", date: D3, time: "12:30", format: "2D", language: "Kannada", price: 210, status: "available" },
  // Whispering Pines (limited Mumbai only)
  { id: "st-whisper-mumbai-harbour-1", movieId: "movie-whispering-pines", city: "Mumbai", cinemaId: "cin-mumbai-harbour", date: D2, time: "22:00", format: "2D", language: "English", price: 240, status: "available" },
  // Rang Bazaar (Pune only)
  { id: "st-rang-pune-palm-1", movieId: "movie-rang-bazaar", city: "Pune", cinemaId: "cin-pune-palm", date: D3, time: "15:00", format: "2D", language: "Marathi", price: 190, status: "available" },
];
