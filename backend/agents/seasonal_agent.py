import os
import datetime
from gemini_service import call_gemini

class SeasonalAgent:
    name = "Seasonal Agent"
    role = "Festive Season & Demand Surge Predictor"
    avatar = "🍁"
    color = "#f59e0b"

    def detect_seasonal_factors(self) -> dict:
        now = datetime.datetime.now()
        month = now.month

        if month in [9, 10, 11]:
            season_name = "Diwali & Pre-Holiday Festive Season"
            surge_multiplier = 1.45
            recommended_discount = 15
            focus_categories = ["Household", "Personal Care", "Eco-Giftware"]
        elif month == 12:
            season_name = "Year-End Green Holiday Gala"
            surge_multiplier = 1.55
            recommended_discount = 20
            focus_categories = ["Eco-Apparel", "Solar Electronics", "Gifts"]
        elif month in [3, 4, 5]:
            season_name = "Earth Month & Spring Green Week"
            surge_multiplier = 1.35
            recommended_discount = 12
            focus_categories = ["Outdoors", "Compostable Living"]
        else:
            season_name = "Summer Eco-Living Campaign"
            surge_multiplier = 1.20
            recommended_discount = 10
            focus_categories = ["Solar Powered Lanterns", "Apparel"]

        prompt = f"""
        You are the Seasonal Demand Agent for a sustainable retail brand.
        Current Season: {season_name}
        Expected Demand Multiplier: {surge_multiplier}x
        Recommended Green Discount: {recommended_discount}%
        Target Categories: {', '.join(focus_categories)}

        Provide a 2-sentence autonomous seasonal demand prediction directing the Inventory and Logistics agents.
        """
        directive = call_gemini(prompt)
        if not directive:
            directive = (
                f"Seasonal Indicator: Upcoming '{season_name}' detected. Historical analytics indicate a "
                f"{int((surge_multiplier - 1)*100)}% spike in {focus_categories[0]} demand. "
                f"Applying a {recommended_discount}% festive discount and proposing advance warehouse pre-stocking."
            )

        return {
            "agent": self.name,
            "season": season_name,
            "multiplier": surge_multiplier,
            "discount_percentage": recommended_discount,
            "focus_categories": focus_categories,
            "directive": directive
        }

    def deliberate(self, context: dict) -> dict:
        trigger = context.get("trigger", "general_query")
        details = context.get("details", "")

        season_info = self.detect_seasonal_factors()

        prompt = f"""
        You are the Seasonal Demand Agent for a sustainable retail supply chain.
        Context Trigger: {trigger}
        User Query / Event: {details}
        Season: {season_info['season']} (multiplier: {season_info['multiplier']}x, discount: {season_info['discount_percentage']}%)

        In 1 sentence for 'thought' and 1 sentence for 'decision', output your analysis.
        Format:
        Thought: <your thought>
        Decision: <your decision>
        """
        ai_res = call_gemini(prompt)

        thought = f"Detected upcoming {season_info['season']}. Projections show retail stores will experience a {int((season_info['multiplier']-1)*100)}% surge in eco-goods."
        decision = f"Activated {season_info['discount_percentage']}% festive discount promotion. Triggered multi-agent restock workflow requiring Human confirmation."

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
            "confidence": 0.98
        }

    def get_historical_festive_data(self) -> list:
        return [
            {
                "period": "2023 Festive Season",
                "year": 2023,
                "unitsSold": 48200,
                "peakSurgePct": 28,
                "stockoutRatePct": 8.4,
                "discountAppliedPct": 10,
                "category": "Diwali & Holiday",
                "isProjected": False
            },
            {
                "period": "2024 Festive Season",
                "year": 2024,
                "unitsSold": 64500,
                "peakSurgePct": 36,
                "stockoutRatePct": 6.1,
                "discountAppliedPct": 12,
                "category": "Diwali & Holiday",
                "isProjected": False
            },
            {
                "period": "2025 Festive Season",
                "year": 2025,
                "unitsSold": 82100,
                "peakSurgePct": 42,
                "stockoutRatePct": 4.5,
                "discountAppliedPct": 15,
                "category": "Diwali & Holiday",
                "isProjected": False
            },
            {
                "period": "2026 AI-Predicted Surge",
                "year": 2026,
                "unitsSold": 118500,
                "peakSurgePct": 45,
                "stockoutRatePct": 1.2,
                "discountAppliedPct": 15,
                "category": "Diwali & Pre-Holiday",
                "isProjected": True
            }
        ]

seasonal_agent = SeasonalAgent()
