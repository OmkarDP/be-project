import React, { useState } from "react";
import { useStore } from "../store";
import { navigate } from "../App";

const FOOD_CATALOG = [
  { id: "popcorn-small", name: "Popcorn (Small)", price: 120 },
  { id: "popcorn-large", name: "Popcorn (Large)", price: 220 },
  { id: "cola", name: "Cola", price: 90 },
  { id: "nachos", name: "Nachos", price: 150 },
  { id: "combo", name: "Combo (Popcorn + Cola)", price: 280 },
];

export default function FoodPage() {
  const { draft, setDraft } = useStore();
  const [items, setItems] = useState(draft.food);

  function getQty(id: string) {
    return items.find((i) => i.id === id)?.quantity ?? 0;
  }

  function addItem(product: { id: string; name: string; price: number }) {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) => (i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { id: product.id, name: product.name, price: product.price, quantity: 1 }];
    });
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function setQty(id: string, qty: number) {
    if (qty <= 0) {
      removeItem(id);
      return;
    }
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity: qty } : i)));
  }

  function save() {
    setDraft((prev) => ({ ...prev, food: items }));
    navigate("/review");
  }

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <div>
      <div className="card">
        <h1>Food & Beverages (Optional)</h1>
        <p>Skip if you don't want snacks.</p>
      </div>
      <div className="card" data-testid="movie-food-list">
        {FOOD_CATALOG.map((p) => (
          <div key={p.id} className="food-item" data-testid="movie-food-item">
            <div>
              <strong>{p.name}</strong> — ₹{p.price}
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="number"
                min={0}
                data-testid="movie-food-quantity"
                value={getQty(p.id)}
                onChange={(e) => setQty(p.id, Number(e.target.value))}
                style={{ width: 70 }}
              />
              <button className="btn" data-testid="movie-food-add" onClick={() => addItem(p)}>
                Add
              </button>
              <button className="btn danger" data-testid="movie-food-remove" onClick={() => removeItem(p.id)}>
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="card">
        Food subtotal: ₹{subtotal}
      </div>
      <button className="btn" onClick={save}>Continue to Review</button>
      <button className="btn secondary" data-testid="movie-skip-food" onClick={() => { setDraft((prev) => ({ ...prev, food: [] })); navigate("/review"); }} style={{ marginLeft: 8 }}>
        Skip Food
      </button>
    </div>
  );
}
