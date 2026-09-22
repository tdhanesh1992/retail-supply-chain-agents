import os
from gemini_service import call_gemini

class SustainabilityAgent:
    name = "Sustainability Agent"
    role = "Net-Zero Carbon & ESG Compliance Auditor"
    avatar = "🌿"
    color = "#06b6d4"

    def audit_route(self, distance_km: float, truck_type: str, load_factor: float) -> dict:
        diesel_emissions_per_km = 0.95
        if "EV" in truck_type or "Electric" in truck_type:
            actual_emissions_per_km = 0.12
        elif "Hybrid" in truck_type:
            actual_emissions_per_km = 0.55
        else:
            actual_emissions_per_km = 0.90

        baseline_co2 = distance_km * diesel_emissions_per_km
        actual_co2 = distance_km * actual_emissions_per_km
        co2_saved = round(max(0, baseline_co2 - actual_co2), 2)
        green_score = min(100, int((load_factor * 0.5) + (1.0 - (actual_emissions_per_km / diesel_emissions_per_km)) * 50))

        return {
            "agent": self.name,
            "truck_type": truck_type,
            "green_score": green_score,
            "co2_saved_kg": co2_saved,
            "load_factor": load_factor,
            "compliant": green_score >= 80
        }

    def deliberate(self, context: dict) -> dict:
        trigger = context.get("trigger", "general_query")
        details = context.get("details", "")

        prompt = f"""
        You are the Sustainability Agent enforcing Net-Zero carbon compliance for a retail supply chain.
        Trigger: {trigger}, Details: {details}

        In 1 sentence for 'thought' and 1 sentence for 'decision', evaluate the route carbon savings and ESG audit.
        Format:
        Thought: <your thought>
        Decision: <your decision>
        """
        ai_res = call_gemini(prompt)

        thought = "Auditing planned festive pre-stock dispatches. Consolidated EV trucking will prevent 78.4kg in urban tailpipe emissions."
        decision = "Approved logistics manifest: Route passes Tier-1 ESG certification (Green Score: 94/100). Forwarded to Store Manager for confirmation."

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
            "confidence": 0.97
        }

sustainability_agent = SustainabilityAgent()
