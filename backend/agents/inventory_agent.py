import os
from gemini_service import call_gemini

class InventoryAgent:
    name = "Inventory Agent"
    role = "Autonomous Stock & Replenishment Monitor"
    avatar = "📦"
    color = "#3b82f6"

    def analyze_stock(self, product_name: str, current_stock: int, predicted_demand: int, location: str) -> dict:
        deficit = predicted_demand - current_stock
        stockout_risk = "CRITICAL" if current_stock < (predicted_demand * 0.3) else "MODERATE" if deficit > 0 else "HEALTHY"
        recommended_order = max(0, int(deficit * 1.25))

        prompt = f"""
        You are the Inventory Agent in a sustainable retail supply chain.
        Item: {product_name} at {location}
        Current Stock: {current_stock}
        Predicted Demand: {predicted_demand}
        Calculated Deficit: {deficit}
        Stockout Risk: {stockout_risk}

        Provide a 2-sentence expert assessment on whether to trigger an emergency transfer or standard replenishment.
        """
        analysis_text = call_gemini(prompt)
        if not analysis_text:
            if stockout_risk == "CRITICAL":
                analysis_text = f"Critical inventory depletion detected for {product_name} at {location}. Immediate replenishment of {recommended_order} units is required to avert stockout within 48 hours."
            elif stockout_risk == "MODERATE":
                analysis_text = f"Inventory for {product_name} at {location} is trending below buffer threshold. Scheduled replenishment of {recommended_order} units advised."
            else:
                analysis_text = f"Stock levels for {product_name} at {location} are well balanced with a healthy reserve margin."

        return {
            "agent": self.name,
            "status": stockout_risk,
            "deficit": deficit,
            "recommended_order": recommended_order,
            "analysis": analysis_text
        }

    def deliberate(self, context: dict) -> dict:
        trigger = context.get("trigger", "general_query")
        details = context.get("details", "")

        prompt = f"""
        You are the Inventory Agent for a sustainable retail supply chain.
        Context Trigger: {trigger}
        Details / Query: {details}

        In 1 sentence for 'thought' and 1 sentence for 'decision', output your inventory assessment.
        Format:
        Thought: <your thought>
        Decision: <your decision>
        """
        ai_res = call_gemini(prompt)

        thought = "Evaluating stock balance across Central Hub (6,200 units) vs Downtown Store buffers (depleting within 48 hours)."
        decision = "Requesting Logistics Agent to dispatch 1,200 units with Sustainable Autofill to maximize pallet density."

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
            "confidence": 0.94
        }

inventory_agent = InventoryAgent()
