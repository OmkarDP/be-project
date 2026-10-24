# Booking Workflows (Phase 1 Foundation)

## Mock IRCTC (RailSwift Mock)
1. Open http://localhost:3001
2. Verify mock environment banner.
3. Fill From station, To station, Journey date, Class.
4. Submit search.
5. Review train results.
6. (Phase 2) Select train, passenger details, booking confirmation.

## Mock RedBus (RoadRunner Mock)
1. Open http://localhost:3002
2. Verify mock environment banner.
3. Fill From city, To city, Travel date.
4. Submit search.
5. Review bus results.

## Mock BookMyShow (StagePass Mock)
1. Open http://localhost:3003
2. Verify mock environment banner.
3. Fill City, Movie, Date.
4. Submit search.
5. Review show results.

## Shared conventions
- Currency formatted as INR.
- Booking IDs prefixed with platform mock marker.
- Status values: pending, confirmed, failed, cancelled.
- Reset via Test Scenario Panel or POST /api/reset.