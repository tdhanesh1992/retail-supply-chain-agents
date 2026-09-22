import os
import uuid
import datetime
from gemini_service import call_gemini

class WarehouseAgent:
    name = "Warehouse Agent"
    role = "Floor Staff Orchestrator & Quality Dispatcher"
    avatar = "📦"
    color = "#3b82f6"

    def deliberate(self, context: dict) -> dict:
        trigger = context.get("trigger", "warehouse_coordination")
        details = context.get("details", "")

        prompt = f"""
        You are the Warehouse Agent orchestrating warehouse floor activities (picking, packing, quality control, dispatch, put-away).
        Context: {trigger}
        Details: {details}

        Provide 1 sentence for 'Thought' and 1 sentence for 'Decision' guiding the warehouse floor crew.
        Format:
        Thought: <thought>
        Decision: <decision>
        """
        ai_res = call_gemini(prompt)

        thought = "Monitoring floor pipeline: picking, packing, QC inspections, and dock dispatch stages."
        decision = "Automated cross-role notifications dispatched to floor crew tablets for seamless hand-off."

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
            "confidence": 0.99
        }

    def process_task_transition(self, current_task: dict, db_session) -> list:
        """
        Orchestrates hand-offs between roles based on task completion.
        Returns a list of created subsequent DB tasks or actions.
        """
        from models import DBWarehouseTask, DBAgentLog, DBAlert

        task_type = current_task.get("taskType")
        new_status = current_task.get("status")
        item_desc = current_task.get("itemDescription", "Inventory Item")
        prod_id = current_task.get("productId", "PROD-001")
        qty = current_task.get("quantity", 1)
        order_id = current_task.get("orderId", "ORD-DEFAULT")
        loc = current_task.get("location", "Bay A")

        created_tasks = []

        if new_status == "Completed":
            if task_type == "PICKING":
                # Next step: PACKING for Packer Staff
                next_task = DBWarehouseTask(
                    id=f"TASK-PACK-{uuid.uuid4().hex[:6].upper()}",
                    assignedRole="Packer Staff",
                    assignedTo="Paula Packer",
                    taskType="PACKING",
                    itemDescription=f"Eco-box Pack & Seal: {item_desc}",
                    productId=prod_id,
                    quantity=qty,
                    location=f"Packing Station 2 (from {loc})",
                    status="Pending",
                    orderId=order_id,
                    priority="Normal",
                    createdAt=datetime.datetime.utcnow().isoformat()
                )
                db_session.add(next_task)
                created_tasks.append(next_task)

                # Log hand-off
                log = DBAgentLog(
                    fromAgent=self.name,
                    toAgent="Packer Staff",
                    message=f"Picking completed for {item_desc} ({qty} units). Dispatched packing assignment to Paula Packer at Packing Station 2.",
                    actionType="COORDINATION"
                )
                db_session.add(log)

            elif task_type == "PACKING":
                # Next step: QUALITY_CONTROL for Quality Control Inspector
                next_task = DBWarehouseTask(
                    id=f"TASK-QC-{uuid.uuid4().hex[:6].upper()}",
                    assignedRole="Quality Control Inspector",
                    assignedTo="Quinn QC",
                    taskType="QUALITY_CONTROL",
                    itemDescription=f"Pre-dispatch Integrity & Barcode Audit: {item_desc}",
                    productId=prod_id,
                    quantity=qty,
                    location="QC Gate Alpha",
                    status="Pending",
                    orderId=order_id,
                    priority="Normal",
                    createdAt=datetime.datetime.utcnow().isoformat()
                )
                db_session.add(next_task)
                created_tasks.append(next_task)

                log = DBAgentLog(
                    fromAgent=self.name,
                    toAgent="Quality Control Inspector",
                    message=f"Packing finalized for {item_desc}. Routed to Quinn QC at QC Gate Alpha for seal verification.",
                    actionType="COORDINATION"
                )
                db_session.add(log)

            elif task_type == "QUALITY_CONTROL":
                # Next step: LOADING_DISPATCH for Loading & Dispatch Crew
                next_task = DBWarehouseTask(
                    id=f"TASK-LOAD-{uuid.uuid4().hex[:6].upper()}",
                    assignedRole="Loading & Dispatch Crew",
                    assignedTo="Leo Loader",
                    taskType="LOADING_DISPATCH",
                    itemDescription=f"Stage & Pallet Load onto EV Truck T-101: {item_desc}",
                    productId=prod_id,
                    quantity=qty,
                    location="Outbound Loading Dock 4",
                    status="Pending",
                    orderId=order_id,
                    priority="Urgent",
                    createdAt=datetime.datetime.utcnow().isoformat()
                )
                db_session.add(next_task)
                created_tasks.append(next_task)

                log = DBAgentLog(
                    fromAgent=self.name,
                    toAgent="Loading & Dispatch Crew",
                    message=f"QC passed 100% for {item_desc}. Dispatched staging task to Leo Loader at Dock 4 for EV loading.",
                    actionType="COORDINATION"
                )
                db_session.add(log)

            elif task_type == "LOADING_DISPATCH":
                log = DBAgentLog(
                    fromAgent=self.name,
                    toAgent="Logistics Coordinator",
                    message=f"Pallet dispatch verified for {item_desc}. Loaded into Electric Truck. Ready for transit.",
                    actionType="DISPATCH_COMPLETE"
                )
                db_session.add(log)

            elif task_type == "PUT_AWAY":
                log = DBAgentLog(
                    fromAgent=self.name,
                    toAgent="Warehouse Manager",
                    message=f"Inbound replenishment {item_desc} successfully binned at {loc}. Inventory ledger updated.",
                    actionType="PUTAWAY_COMPLETE"
                )
                db_session.add(log)

        return created_tasks

    def handle_damaged_item(self, task_id: str, prod_id: str, qty: int, reason: str, reporter: str, db_session) -> dict:
        """
        Handles damaged item logged by Quality Control Inspector:
        1. Flags existing task as Damaged Flagged
        2. Notifies Packer Staff to quarantine
        3. Creates an urgent replacement PICKING task for Picker Staff
        4. Issues alert in system
        """
        from models import DBWarehouseTask, DBAgentLog, DBAlert

        current_task = db_session.query(DBWarehouseTask).filter(DBWarehouseTask.id == task_id).first()
        if current_task:
            current_task.status = "Damaged Flagged"
            current_task.damageReason = reason

        # Create urgent replacement picking task
        rep_task_id = f"TASK-PICK-REP-{uuid.uuid4().hex[:4].upper()}"
        replacement_task = DBWarehouseTask(
            id=rep_task_id,
            assignedRole="Picker Staff",
            assignedTo="Pete Picker",
            taskType="PICKING",
            itemDescription=f"[REPLACEMENT - QC DEFECT] {prod_id} (Reason: {reason})",
            productId=prod_id,
            quantity=qty,
            location="Aisle 3-Reserve, Bin 08",
            status="Pending",
            orderId=current_task.orderId if current_task else "ORD-REPLACEMENT",
            priority="Critical",
            createdAt=datetime.datetime.utcnow().isoformat()
        )
        db_session.add(replacement_task)

        # Notify packer & picker via logs and alert
        alert = DBAlert(
            id=f"ALT-DMG-{uuid.uuid4().hex[:6]}",
            type="Critical",
            message=f"QC Defect Alert: {qty}x {prod_id} flagged damaged by {reporter or 'QC Inspector'} ('{reason}'). Replacement pick assigned to Pete Picker.",
            timestamp=datetime.datetime.utcnow().strftime("%H:%M:%S")
        )
        db_session.add(alert)

        log = DBAgentLog(
            fromAgent=self.name,
            toAgent="Picker Staff",
            message=f"URGENT: QC Inspector flagged defect in {task_id} ({reason}). Created replacement pick task {rep_task_id} for Pete Picker.",
            actionType="DAMAGE_HANDLING"
        )
        db_session.add(log)

        packer_log = DBAgentLog(
            fromAgent=self.name,
            toAgent="Packer Staff",
            message=f"Quarantine Notification: Batch {task_id} failed QC inspection. Label as 'SCRAP/RETURN' and await replacement pick.",
            actionType="QUARANTINE_DIRECTIVE"
        )
        db_session.add(packer_log)

        db_session.commit()

        return {
            "success": True,
            "replacementTaskId": rep_task_id,
            "message": f"Damaged goods logged. Replacement task {rep_task_id} dispatched to Pete Picker."
        }

warehouse_agent = WarehouseAgent()
