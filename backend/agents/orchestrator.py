import os
import re
import datetime
from gemini_service import call_gemini
from agents.inventory_agent import inventory_agent
from agents.logistics_agent import logistics_agent
from agents.seasonal_agent import seasonal_agent
from agents.sustainability_agent import sustainability_agent
from agents.warehouse_agent import warehouse_agent

class OrchestratorAgent:
    name = "AI Orchestrator"
    role = "Autonomous Multi-Agent Conductor & Workflow Director"
    avatar = "🧠"
    color = "#8b5cf6"

    def detect_intent(self, message: str) -> str:
        clean = message.strip().lower()
        clean_words = re.findall(r'\b\w+\b', clean)

        # 1. Greetings (e.g., 'hi', 'hello', 'hey', 'good morning', etc.)
        greetings = {"hi", "hello", "hey", "hola", "greetings", "morning", "afternoon", "evening", "howdy", "sup", "yo"}
        if len(clean_words) <= 3 and any(w in greetings for w in clean_words):
            return "greeting"

        # 2. Capabilities / What can you do / Help
        capability_keywords = [
            "capability", "capabilities", "what can you do", "what do you do", "help",
            "who are you", "features", "how does this work", "how do you work",
            "what agents", "what can i ask", "role", "roles", "what are your capabilities", "about"
        ]
        if any(kw in clean for kw in capability_keywords):
            return "capabilities"

        # 3. Festive / Seasonal
        if any(w in clean for w in ["festival", "festive", "holiday", "seasonal", "diwali", "christmas", "discount", "demand", "surge", "promo"]):
            return "festive_surge"

        # 4. Inventory / Stock
        if any(w in clean for w in ["stock", "inventory", "shortage", "out of stock", "warehouse stock", "store stock", "restock", "reorder", "quantity", "detergent", "toothbrush", "tshirt", "lantern", "towels"]):
            return "out_of_stock"

        # 5. Logistics / EV Fleet / Delivery
        if any(w in clean for w in ["truck", "fleet", "logistics", "route", "transit", "delivery", "ev", "electric", "delay", "breakdown", "autofill", "pallet", "chicago", "portland", "new york"]):
            return "logistics_fleet"

        # 6. Sustainability / Carbon / ESG
        if any(w in clean for w in ["carbon", "co2", "sustainability", "sustainable", "esg", "emission", "green", "net-zero", "offset", "clean transport", "footprint"]):
            return "carbon_audit"

        # 7. Warehouse Operations
        if any(w in clean for w in ["warehouse", "floor", "staff", "picker", "packing", "packer", "quality control", "qc", "defect", "damaged", "dispatch", "loading", "put away", "storage"]):
            return "warehouse_ops"

        return "general"

    def run_multi_agent_deliberation(self, prompt: str, scenario: str = "general", target_agent: str = "Orchestrator") -> list:
        context = {"trigger": scenario, "details": prompt}
        
        # When user simply greets, agents report operational readiness and active monitoring focus
        if scenario == "greeting":
            return [
                {
                    "agent": "AI Orchestrator",
                    "role": "Multi-Agent Conductor",
                    "thought": "Operator initiated communication. Evaluating multi-agent status.",
                    "decision": "System ready. Multi-agent conductor online and standing by for operator directives.",
                    "confidence": 0.99
                },
                {
                    "agent": "Seasonal Agent",
                    "role": "Demand Surge Predictor",
                    "thought": "Tracking upcoming festive milestones and promotional elasticity.",
                    "decision": "Active forecast: +45% festive volume surge anticipated.",
                    "confidence": 0.95
                },
                {
                    "agent": "Inventory Agent",
                    "role": "Stock Guardian",
                    "thought": "Tracking real-time buffers across Midwest Central Hub and Downtown Flagship Store.",
                    "decision": "Stock telemetry active; buffer reserves healthy at Central Hub.",
                    "confidence": 0.94
                },
                {
                    "agent": "Logistics Agent",
                    "role": "Fleet Coordinator",
                    "thought": "Monitoring EV delivery fleet on Interstate freight corridors.",
                    "decision": "Zero-Emission freight corridors active with Sustainable Autofill enabled.",
                    "confidence": 0.96
                },
                {
                    "agent": "Sustainability Agent",
                    "role": "ESG & Carbon Auditor",
                    "thought": "Auditing avoided emissions ledger and Net-Zero certifications.",
                    "decision": "+182.6 kg CO2 saved this cycle; 100% ESG compliance verified.",
                    "confidence": 0.98
                },
                {
                    "agent": "Warehouse Agent",
                    "role": "Floor Operations Director",
                    "thought": "Supervising 5 active floor staff stations (Picking through Put-away).",
                    "decision": "Floor pipeline running smoothly with zero unhandled defects.",
                    "confidence": 0.95
                }
            ]

        # When user asks about capabilities, each agent provides their role specialization
        if scenario == "capabilities":
            return [
                {
                    "agent": "AI Orchestrator",
                    "role": "Multi-Agent Conductor",
                    "thought": "Summarizing core system governance and cross-agent coordination.",
                    "decision": "Conducts multi-agent deliberations and enforces Human-in-the-Loop review gates.",
                    "confidence": 0.99
                },
                {
                    "agent": "Seasonal Agent",
                    "role": "Demand Surge Predictor",
                    "thought": "Forecasting algorithms and promotional sensitivity models.",
                    "decision": "Predicts festive demand spikes (+45%) and computes optimal green discounts.",
                    "confidence": 0.96
                },
                {
                    "agent": "Inventory Agent",
                    "role": "Stock Guardian",
                    "thought": "Multi-echelon replenishment and stockout prevention.",
                    "decision": "Monitors stock thresholds, lead times, and triggers inter-facility reorders.",
                    "confidence": 0.94
                },
                {
                    "agent": "Logistics Agent",
                    "role": "Fleet Coordinator",
                    "thought": "Electric vehicle routing and freight density optimization.",
                    "decision": "Automates Sustainable Autofill to avoid empty miles and resolves transit delays.",
                    "confidence": 0.97
                },
                {
                    "agent": "Sustainability Agent",
                    "role": "ESG & Carbon Auditor",
                    "thought": "Environmental impact ledger and compliance auditing.",
                    "decision": "Verifies CO2 offsets, certifies eco-tariffs, and audits supplier compliance.",
                    "confidence": 0.98
                },
                {
                    "agent": "Warehouse Agent",
                    "role": "Floor Operations Director",
                    "thought": "Task orchestration and defect management for warehouse staff.",
                    "decision": "Dispatches tasks across 5 floor roles and coordinates defect replacements.",
                    "confidence": 0.95
                }
            ]

        # For specific operational scenarios, deliberate in sequence
        s_step = seasonal_agent.deliberate(context)
        i_step = inventory_agent.deliberate(context)
        l_step = logistics_agent.deliberate(context)
        eco_step = sustainability_agent.deliberate(context)
        wh_step = warehouse_agent.deliberate(context)

        return [s_step, i_step, l_step, eco_step, wh_step]

    def process_chat(self, message: str, target_agent: str = "Orchestrator") -> dict:
        scenario = self.detect_intent(message)

        # Multi-agent deliberation tailored to intent
        deliberations = self.run_multi_agent_deliberation(message, scenario=scenario, target_agent=target_agent)

        # Build prompt for Gemini
        delib_summary = "\n".join([f"- {d['agent']} ({d['role']}): {d['decision']}" for d in deliberations])
        
        ai_prompt = f"""
        You are the AI Orchestrator for the Sustainable Retail Supply Chain platform (EcoChain AI).
        The user query is: "{message}"
        Target Agent Selected: "{target_agent}"
        Detected Intent: {scenario}

        Multi-agent context & current status:
        {delib_summary}

        CRITICAL INSTRUCTIONS:
        1. Answer ONLY what the user actually asked. Address their specific query directly.
        2. If the user sent a GREETING (e.g. 'hi', 'hello', 'hey'):
           - Greet them warmly and introduce yourself as the AI Orchestrator.
           - Provide 4-5 concrete, predefined questions they can ask to explore the system (e.g., festive demand, stock levels, EV truck routes, CO2 savings, warehouse floor tasks, or agent capabilities).
           - DO NOT fabricate fake stockout emergencies or restock dispatches for a simple greeting!
        3. If the user asked about CAPABILITIES or what you can do:
           - Clearly and concisely explain the capabilities of each agent in the network (Seasonal, Inventory, Logistics, Sustainability, Warehouse, Orchestrator).
           - Mention that Human-in-the-Loop review gates keep human operators in total control.
        4. If the user asked about a specific topic (festive demand, inventory, logistics, sustainability, warehouse):
           - Provide a concise, highly factual, and helpful answer (2-4 sentences) with concrete numbers from the agent telemetry.
        5. Keep your tone professional, intelligent, agentic, and concise (under 150 words). Format with clear bullet points.
        """
        
        synthesized_text = call_gemini(ai_prompt)
        if not synthesized_text:
            synthesized_text = self._fallback_synthesis(message, target_agent, scenario, deliberations)

        return {
            "response": synthesized_text,
            "agent": self.name if target_agent == "Orchestrator" else target_agent,
            "deliberations": deliberations
        }

    def _fallback_synthesis(self, message: str, target_agent: str, scenario: str, deliberations: list) -> str:
        if scenario == "greeting":
            return (
                "Hello! 👋 I am your **AI Orchestrator**, coordinating our autonomous Multi-Agent Sustainable Supply Chain network.\n\n"
                "All systems are operating at peak efficiency. Here are some predefined questions you can ask me to explore our platform:\n\n"
                "• 🍁 **Festive Demand**: *\"Check festive surge demand and recommended promo discounts\"*\n"
                "• 📦 **Inventory Balance**: *\"What is the stock level at Central Hub vs Downtown Flagship?\"*\n"
                "• 🚚 **EV Fleet Tracking**: *\"Optimize Electric Truck T-101 routes and Sustainable Autofill\"*\n"
                "• 🌿 **Carbon Audit**: *\"How much CO2 emissions have our electric routes saved?\"*\n"
                "• 🏭 **Warehouse Operations**: *\"Show active tasks for Picker, Packer, and QC Inspector\"*\n"
                "• 🤖 **Capabilities**: *\"What are the capabilities of each agent in this network?\"*"
            )
        elif scenario == "capabilities":
            return (
                "Here is an overview of our autonomous multi-agent network and its capabilities:\n\n"
                "• 🧠 **AI Orchestrator (Conductor)**: Deliberates across all agents, synthesizes decisions, and enforces Human-in-the-Loop review gates.\n"
                "• 🍁 **Seasonal Agent**: Analyzes historical holiday patterns, forecasts demand spikes (+45%), and formulates ethical discount promotions.\n"
                "• 📦 **Inventory Agent**: Tracks real-time multi-facility inventories, calculates replenishment requirements, and prevents retail stockouts.\n"
                "• 🚚 **Logistics Agent**: Coordinates zero-emission EV delivery fleets, resolves vehicle breakdown diversions, and enables **Sustainable Autofill** to eliminate empty miles.\n"
                "• 🌿 **Sustainability Agent**: Audits carbon offsets (+182.6 kg CO2 saved) and verifies Net-Zero ESG supply chain compliance.\n"
                "• 🏭 **Warehouse Agent**: Dispatches and coordinates floor staff roles (Picking, Packing, Quality Control, Loading & Dispatch, Put-away) and handles defect escalations.\n\n"
                "Ask me any question above or test an autonomous workflow scenario from the sidebar!"
            )
        elif scenario == "festive_surge":
            return (
                "🎯 **Festive Demand Surge Analysis**:\n"
                "Seasonal Agent forecasts a **+45% demand spike** for upcoming holidays, with heavy demand for *Zero-Plastic Plant Detergent* and *Biodegradable Toothbrushes*. "
                "A **15% Green Promo discount** has been formulated to promote sustainable purchases, and a restock transfer from Central Hub is awaiting Human-in-the-Loop review."
            )
        elif scenario == "out_of_stock":
            return (
                "📦 **Inventory Telemetry & Restock Alert**:\n"
                "Central Hub maintains strong reserves (6,200x Detergent, 12,400x Toothbrushes), while Downtown Flagship Store is low on *Zero-Plastic Detergent* (45 units left vs 450 predicted demand). "
                "Inventory Agent has flagged restock order #992, paired with EV Truck T-101 via Sustainable Autofill."
            )
        elif scenario == "logistics_fleet":
            return (
                "🚚 **Eco-Fleet & Route Optimization**:\n"
                "Our fleet features **67% zero-emission Electric Trucks (EV)**. Truck T-101 is currently in transit to New York with **Sustainable Autofill (90% capacity)**, "
                "preventing 54.2 kg CO2. Human-in-the-Loop review is active for the recent mile-42 battery thermal telemetry update."
            )
        elif scenario == "carbon_audit":
            return (
                "🌿 **Net-Zero ESG Carbon Ledger**:\n"
                "Our supply chain network has saved **182.6 kg of CO2** this cycle through 100% Electric Vehicle routing and Sustainable Autofill consolidation. "
                "All active product inventory batches maintain a verified sustainability score of 89–99/100."
            )
        elif scenario == "warehouse_ops":
            return (
                "🏭 **Warehouse Floor Operations Status**:\n"
                "Warehouse Agent is coordinating 5 active staff tasks:\n"
                "• **Picker Staff (Pete)**: Picking 50x Organic Cotton T-Shirts at Aisle 2-B.\n"
                "• **Packer Staff (Paula)**: Packaging 120x Bamboo Toothbrushes at Station 1.\n"
                "• **QC Inspector (Quinn)**: Auditing 30x Solar Lanterns at QC Gate Alpha.\n"
                "• **Loading Crew (Leo)**: Outbound staging at Bay 3.\n"
                "• **Put-away Clerk (Sammy)**: Inbound binning at Staging Dock B."
            )
        else:
            return (
                f"Coordinated Multi-Agent response to \"{message}\":\n\n"
                f"Our specialized agents (Seasonal, Inventory, Logistics, Sustainability, and Warehouse) have evaluated your request against current retail network telemetry. "
                f"System operations are active and running within Net-Zero ESG parameters. You can ask about demand forecasts, stock levels, EV routes, or warehouse tasks for specific details."
            )

orchestrator = OrchestratorAgent()

def process_chat(message: str, target_agent: str = "Orchestrator") -> dict:
    return orchestrator.process_chat(message, target_agent)

