# Test Scenarios

Deterministic scenarios supported by all mock apps:

- normal: standard successful search.
- empty-results: search returns no inventory.
- sold-out: results have zero available seats.
- delayed-response: configurable simulated delay (delayMs).
- temporary-error: first operation fails, retry succeeds.
- stale-inventory: selected item becomes unavailable.
- validation-error: invalid input rejected.
- booking-failure: final booking fails.
- booking-success: final booking succeeds.

Reset: use Scenario Panel "Reset scenario" button or POST /api/reset.