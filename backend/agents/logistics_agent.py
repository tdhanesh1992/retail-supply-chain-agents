import os
from gemini_service import call_gemini

class LogisticsAgent:
    name = "Logistics Agent"
    role = "Sustainable Fleet & Route Optimizer"
    avatar = "🚚"
    color = "#10b981"

    def optimize_dispatch(self, order_units: int, origin: str, destination: str, sustainable_autofill: bool = True) -> dict:
        pallets_needed = max(1, order_units // 100)
        standard_truck_capacity = 40

        autofill_units = 0
        final_load = pallets_needed
        if sustainable_autofill and pallets_needed < (standard_truck_capacity * 0.85):
            autofill_pallets = int(standard_truck_capacity * 0.90) - pallets_needed
            autofill_units = autofill_pallets * 100
            final_load += autofill_pallets

        capacity_utilization = round((final_load / standard_truck_capacity) * 100, 1)
        co2_saved = round((autofill_units * 0.04) + 18.5, 1)

        prompt = f"""
        You are the Logistics Agent managing an eco-friendly retail delivery fleet.
        Origin: {origin}, Destination: {destination}
        Requested Pallets: {pallets_needed}, Final Load: {final_load}/{standard_truck_capacity} ({capacity_utilization}%)
        Sustainable Autofill: {sustainable_autofill} (Added {autofill_units} units)
        Estimated CO2 Saved: {co2_saved} kg

        Provide a 2-sentence dispatch strategy explaining vehicle selection (prefer Electric Delivery Truck) and route efficiency.
        """
        notes = call_gemini(prompt)
        if not notes:
            notes = (
                f"Assigned Zero-Emission Electric Truck (EV T-101). "
                f"Enabled Sustainable Autofill (+{autofill_units} units), pushing utilization to {capacity_utilization}% "
                f"and eliminating an extra freight trip (saving ~{co2_saved}kg CO2)."
            )

        return {
            "agent": self.name,
            "vehicle": "Electric Truck T-101 (EV)",
            "capacity_utilization": capacity_utilization,
            "autofill_units": autofill_units,
            "co2_saved_kg": co2_saved,
            "notes": notes
        }

    def deliberate(self, context: dict) -> dict:
        trigger = context.get("trigger", "general_query")
        details = context.get("details", "")

        prompt = f"""
        You are the Logistics Agent for an eco-friendly retail delivery fleet.
        Context: {trigger}, Details: {details}
        Fleet options: Electric Truck T-101 (Zero-Emission), Hybrid Freight T-103.
        Sustainable Autofill is active to prevent empty pallet transport.

        In 1 sentence for 'thought' and 1 sentence for 'decision', output your logistics decision.
        Format:
        Thought: <your thought>
        Decision: <your decision>
        """
        ai_res = call_gemini(prompt)

        thought = "Incoming restock requires 1,200 units (~12 pallets). Single partial dispatch produces 38kg wasted emissions."
        decision = "Activating Sustainable Autofill: bundling with 24 pallets of fast-moving recycled paper towels. Truck T-101 (EV) load at 90%."

        if ai_res and "Thought:" in ai_res and "Decision:" in ai_res:
            try:
                parts = ai_res.split("Decision:")
                thought = parts[0].replace("Thought:", "").strip()
                decision = parts[1].strip()
            except Exception:
                pass

        return {
            "agent": self.name,
            "role": self.role,
            "thought": thought,
            "decision": decision,
            "confidence": 0.96
        }

logistics_agent = LogisticsAgent()
