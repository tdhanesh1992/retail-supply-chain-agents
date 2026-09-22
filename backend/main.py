from __future__ import annotations
import os
import datetime
import uuid
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware

# Ensure config is loaded first so environment variables are populated
import config
import models
import schemas
from database import engine, get_db, SessionLocal
from agents.orchestrator import orchestrator
from agents.inventory_agent import inventory_agent
from agents.logistics_agent import logistics_agent
from agents.seasonal_agent import seasonal_agent
from agents.sustainability_agent import sustainability_agent
from agents.warehouse_agent import warehouse_agent

# Create DB tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Sustainable Retail Supply Chain AI", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def init_dummy_data():
    db = SessionLocal()
    try:
        # 1. Ensure all users exist (Leadership + Floor Staff)
        all_users = [
            models.DBUser(id='u1', name='Alice Chen', role='Store Manager', avatar='https://api.dicebear.com/7.x/avataaars/svg?seed=Alice'),
            models.DBUser(id='u2', name='Bob Smith', role='Warehouse Operator', avatar='https://api.dicebear.com/7.x/avataaars/svg?seed=Bob'),
            models.DBUser(id='u3', name='Charlie Davis', role='Logistics Coordinator', avatar='https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie'),
            models.DBUser(id='u4', name='Elena Rostova', role='Sustainability Director', avatar='https://api.dicebear.com/7.x/avataaars/svg?seed=Elena'),
            models.DBUser(id='u5', name='David Vance', role='Warehouse Manager', avatar='https://api.dicebear.com/7.x/avataaars/svg?seed=David'),
            # Floor Staff Roles (Restricted access: To-Do Activities table only)
            models.DBUser(id='u6', name='Pete Picker', role='Picker Staff', avatar='https://api.dicebear.com/7.x/avataaars/svg?seed=Pete'),
            models.DBUser(id='u7', name='Paula Packer', role='Packer Staff', avatar='https://api.dicebear.com/7.x/avataaars/svg?seed=Paula'),
            models.DBUser(id='u8', name='Quinn QC', role='Quality Control Inspector', avatar='https://api.dicebear.com/7.x/avataaars/svg?seed=Quinn'),
            models.DBUser(id='u9', name='Leo Loader', role='Loading & Dispatch Crew', avatar='https://api.dicebear.com/7.x/avataaars/svg?seed=Leo'),
            models.DBUser(id='u10', name='Sammy Storage', role='Put-away & Storage Clerk', avatar='https://api.dicebear.com/7.x/avataaars/svg?seed=Sammy'),
        ]
        for u in all_users:
            if not db.query(models.DBUser).filter(models.DBUser.id == u.id).first():
                db.add(u)
        db.commit()

        # 2. Sustainable Retail Products
        if db.query(models.DBProduct).first() is None:
            products = [
                models.DBProduct(id='p1', name='Zero-Plastic Plant Detergent', category='Household', price=14.99, sustainabilityScore=98),
                models.DBProduct(id='p2', name='Organic Fair-Trade Cotton T-Shirt', category='Apparel', price=28.50, sustainabilityScore=92),
                models.DBProduct(id='p3', name='Biodegradable Bamboo Toothbrush 4-Pack', category='Personal Care', price=11.99, sustainabilityScore=99),
                models.DBProduct(id='p4', name='100% Recycled Kraft Paper Towels', category='Household', price=16.50, sustainabilityScore=89),
                models.DBProduct(id='p5', name='Solar-Powered LED Camping Lantern', category='Outdoors', price=39.99, sustainabilityScore=95),
            ]
            db.add_all(products)
            db.commit()

        # 3. Facilities & Inventory
        if db.query(models.DBFacility).first() is None:
            f1 = models.DBFacility(id='f1', name='Midwest Central Hub Warehouse', type='Warehouse', location='Chicago, IL', leadTimeDays=1)
            f2 = models.DBFacility(id='f2', name='Downtown Eco Flagship Store', type='Store', location='New York, NY', leadTimeDays=2)
            f3 = models.DBFacility(id='f3', name='GreenRoots Ethical Vendor Hub', type='Vendor', location='Portland, OR', leadTimeDays=4)
            db.add_all([f1, f2, f3])
            db.commit()

            inventory_items = [
                models.DBInventoryItem(facility_id='f1', product_id='p1', quantity=6200, predictedDemand=4800),
                models.DBInventoryItem(facility_id='f1', product_id='p2', quantity=3100, predictedDemand=2600),
                models.DBInventoryItem(facility_id='f1', product_id='p3', quantity=12400, predictedDemand=9500),
                models.DBInventoryItem(facility_id='f1', product_id='p4', quantity=4500, predictedDemand=3800),
                models.DBInventoryItem(facility_id='f1', product_id='p5', quantity=2200, predictedDemand=1800),
                # Downtown Store (low on p1 and p5!)
                models.DBInventoryItem(facility_id='f2', product_id='p1', quantity=45, predictedDemand=450),
                models.DBInventoryItem(facility_id='f2', product_id='p2', quantity=320, predictedDemand=310),
                models.DBInventoryItem(facility_id='f2', product_id='p3', quantity=580, predictedDemand=500),
                models.DBInventoryItem(facility_id='f2', product_id='p4', quantity=190, predictedDemand=210),
                models.DBInventoryItem(facility_id='f2', product_id='p5', quantity=20, predictedDemand=120),
            ]
            db.add_all(inventory_items)
            db.commit()

        # 4. Delivery Trucks with Sustainable Autofill
        if db.query(models.DBTruck).first() is None:
            trucks = [
                models.DBTruck(
                    id='t1', status='In Transit', capacity=40, currentLoad=36,
                    originId='f1', destinationId='f2', eta='Today, 17:45',
                    sustainableFillMode=True, fuelType='Electric (EV)', co2SavedKg=54.2,
                    lat=41.25, lng=-80.50
                ),
                models.DBTruck(
                    id='t2', status='Idle', capacity=30, currentLoad=0,
                    originId='f1', destinationId=None, eta=None,
                    sustainableFillMode=True, fuelType='Electric (EV)', co2SavedKg=0.0,
                    lat=41.8781, lng=-87.6298
                ),
                models.DBTruck(
                    id='t3', status='Loading', capacity=50, currentLoad=42,
                    originId='f3', destinationId='f1', eta='Tomorrow, 09:00',
                    sustainableFillMode=True, fuelType='Hybrid Bio-Diesel', co2SavedKg=38.6,
                    lat=45.5152, lng=-122.6784
                )
            ]
            db.add_all(trucks)
            db.commit()

        # 5. Workflows with Human-In-The-Loop Steps
        # w1: Festive Pre-Stocking
        if not db.query(models.DBWorkflow).filter(models.DBWorkflow.id == 'w1').first():
            w1 = models.DBWorkflow(id='w1', title='Festive Season Pre-Stocking & Eco-Promo', status='Active')
            db.add(w1)
            steps1 = [
                models.DBWorkflowStep(id='s1-w1', workflow_id='w1', order=1, agent='Seasonal Agent', action='Detected upcoming festive demand (+45% projection). Applied 15% Green Festive Discount.', status='Completed', requiresHumanAction=False),
                models.DBWorkflowStep(id='s2-w1', workflow_id='w1', order=2, agent='Inventory Agent', action='Calculated pre-stock transfer of 1,200 units from Central Hub to Downtown Flagship Store.', status='Completed', requiresHumanAction=False),
                models.DBWorkflowStep(id='s3-w1', workflow_id='w1', order=3, agent='Human Approval (Store Manager)', action='Authorize Festive Restock Order #992 & Confirm 15% discount rollout.', status='Awaiting Human', requiresHumanAction=True, details='Review order: 800x Zero-Plastic Detergent, 400x Bamboo Toothbrush. Projected Margin: +18%. CO2 Neutral delivery via EV T-101.'),
                models.DBWorkflowStep(id='s4-w1', workflow_id='w1', order=4, agent='Logistics Agent', action='Dispatch Electric Truck T-101 with Sustainable Autofill (90% capacity load).', status='Pending', requiresHumanAction=False),
                models.DBWorkflowStep(id='s5-w1', workflow_id='w1', order=5, agent='Sustainability Agent', action='Record Net-Zero carbon audit certificate and update ESG dashboard ledger.', status='Pending', requiresHumanAction=False),
            ]
            db.add_all(steps1)
            db.commit()

        # w2: Customs Pricing & Description Verification (Logistics Coordinator)
        if not db.query(models.DBWorkflow).filter(models.DBWorkflow.id == 'w2').first():
            w2 = models.DBWorkflow(id='w2', title='Cross-Border Logistics: Customs Pricing & Material Audit', status='Active')
            db.add(w2)
            steps2 = [
                models.DBWorkflowStep(id='s1-w2', workflow_id='w2', order=1, agent='Logistics Agent', action='Import manifest #IM-802 flagged for cross-border duty calculation and eco-tariff rebate.', status='Completed', requiresHumanAction=False),
                models.DBWorkflowStep(id='s2-w2', workflow_id='w2', order=2, agent='Human in Loop (Logistics Coordinator)', action='Verify product pricing ($39.99) & certified sustainable material description for Solar Lantern batch #SL-990.', status='Awaiting Human', requiresHumanAction=True, details='Tariff exemption code: #ECO-994. Verify Harmonized System code HS-8513.10 and declared unit price of $39.99 for customs declaration.'),
                models.DBWorkflowStep(id='s3-w2', workflow_id='w2', order=3, agent='Sustainability Agent', action='Generate Clean Supply Chain Tariff Exemption Certificate & submit digital clearance filing.', status='Pending', requiresHumanAction=False),
            ]
            db.add_all(steps2)
            db.commit()

        # w3: EV Truck Breakdown & Delay Resolution (Logistics Coordinator)
        if not db.query(models.DBWorkflow).filter(models.DBWorkflow.id == 'w3').first():
            w3 = models.DBWorkflow(id='w3', title='Logistics Incident: EV Truck T-101 Breakdown & Route Delay Resolution', status='Active')
            db.add(w3)
            steps3 = [
                models.DBWorkflowStep(id='s1-w3', workflow_id='w3', order=1, agent='Logistics Agent', action='Telemetry Alert: EV Delivery Truck T-101 battery thermal warning near mile marker 42. Rerouting required.', status='Completed', requiresHumanAction=False),
                models.DBWorkflowStep(id='s2-w3', workflow_id='w3', order=2, agent='Human in Loop (Logistics Coordinator)', action='Authorize Truck T-101 route diversion or dispatch backup EV Truck T-102.', status='Awaiting Human', requiresHumanAction=True, details='Option A: Divert to Rapid Megawatt Charger at Station E-4 (delay: 35 min). Option B: Transship urgent store restock to idle EV T-102. Action required to prevent retail delivery SLA breach.'),
                models.DBWorkflowStep(id='s3-w3', workflow_id='w3', order=3, agent='Inventory Agent', action='Recalculate Downtown Eco Flagship store arrival window & notify store receiver.', status='Pending', requiresHumanAction=False),
            ]
            db.add_all(steps3)
            db.commit()

        # 6. Warehouse Floor Staff Tasks (Picking -> Packing -> QC -> Loading/Dispatch -> Put-away)
        if db.query(models.DBWarehouseTask).first() is None:
            tasks = [
                models.DBWarehouseTask(
                    id='TASK-PICK-101', assignedRole='Picker Staff', assignedTo='Pete Picker',
                    taskType='PICKING', itemDescription='Organic Fair-Trade Cotton T-Shirt (50 units)',
                    productId='p2', quantity=50, location='Aisle 2-B, Bin 14', status='Pending',
                    orderId='ORD-992', priority='Normal'
                ),
                models.DBWarehouseTask(
                    id='TASK-PACK-102', assignedRole='Packer Staff', assignedTo='Paula Packer',
                    taskType='PACKING', itemDescription='Biodegradable Bamboo Toothbrush 4-Pack (120 units)',
                    productId='p3', quantity=120, location='Packing Station 1', status='In Progress',
                    orderId='ORD-990', priority='Normal'
                ),
                models.DBWarehouseTask(
                    id='TASK-QC-103', assignedRole='Quality Control Inspector', assignedTo='Quinn QC',
                    taskType='QUALITY_CONTROL', itemDescription='Solar-Powered LED Camping Lantern (30 units)',
                    productId='p5', quantity=30, location='QC Gate Alpha', status='Pending',
                    orderId='ORD-988', priority='Urgent'
                ),
                models.DBWarehouseTask(
                    id='TASK-LOAD-104', assignedRole='Loading & Dispatch Crew', assignedTo='Leo Loader',
                    taskType='LOADING_DISPATCH', itemDescription='Zero-Plastic Plant Detergent Pallet (80 cases)',
                    productId='p1', quantity=80, location='Outbound Bay 3', status='Pending',
                    orderId='ORD-985', priority='Normal'
                ),
                models.DBWarehouseTask(
                    id='TASK-PUT-105', assignedRole='Put-away & Storage Clerk', assignedTo='Sammy Storage',
                    taskType='PUT_AWAY', itemDescription='Recycled Kraft Paper Towels (200 cases inbound pallet)',
                    productId='p4', quantity=200, location='Inbound Staging Dock B', status='In Progress',
                    orderId='INBOUND-441', priority='Normal'
                ),
            ]
            db.add_all(tasks)
            db.commit()

        # 7. Initial Alerts
        if db.query(models.DBAlert).first() is None:
            alerts = [
                models.DBAlert(id='a1', type='Critical', message='Low stock alert: Zero-Plastic Detergent at Downtown Flagship (45 units remaining).', timestamp='Just now', workflowId='w1'),
                models.DBAlert(id='a2', type='Info', message='Upcoming Festive Season detected: Automated demand models activated.', timestamp='10m ago', workflowId='w1'),
                models.DBAlert(id='a3', type='Warning', message='Logistics Notice: Truck T-101 thermal warning near mile marker 42. Reroute required.', timestamp='15m ago', workflowId='w3'),
                models.DBAlert(id='a4', type='Info', message='Customs clearance awaiting tariff verification for Solar Lantern batch #SL-990.', timestamp='20m ago', workflowId='w2')
            ]
            db.add_all(alerts)
            db.commit()

        # 8. Agent Logs
        if db.query(models.DBAgentLog).first() is None:
            logs = [
                models.DBAgentLog(fromAgent='Seasonal Agent', toAgent='Inventory Agent', actionType='SURGE_ALERT', message='Festive season analytics show +45% demand spike for Detergent & Toothbrushes. Please audit regional warehouse stock.', workflowId='w1'),
                models.DBAgentLog(fromAgent='Inventory Agent', toAgent='Logistics Agent', actionType='CONSULTATION', message='Central Hub has 6,200 units available. Recommending immediate 1,200 unit transfer to Downtown Flagship Store.', workflowId='w1'),
                models.DBAgentLog(fromAgent='Logistics Agent', toAgent='Sustainability Agent', actionType='OPTIMIZATION', message='Allocating Zero-Emission Electric Truck T-101. Enabling Sustainable Autofill with 400 paper towels to reach 90% pallet density.', workflowId='w1'),
                models.DBAgentLog(fromAgent='Sustainability Agent', toAgent='AI Orchestrator', actionType='CO2_AUDIT', message='Validated: Route eliminates empty-mile penalty, saving 54.2kg CO2. Flagged for Human-in-the-loop authorization.', workflowId='w1'),
                models.DBAgentLog(fromAgent='AI Orchestrator', toAgent='Human User', actionType='HUMAN_APPROVAL_REQUEST', message='Workflow Order #992 compiled with high confidence (96%). Awaiting Store Manager sign-off.', workflowId='w1'),
                models.DBAgentLog(fromAgent='Logistics Agent', toAgent='Logistics Coordinator', actionType='HUMAN_APPROVAL_REQUEST', message='Customs documentation for Solar Lantern batch #SL-990 ready for tariff and pricing verification.', workflowId='w2'),
                models.DBAgentLog(fromAgent='Warehouse Agent', toAgent='Pete Picker', actionType='TASK_ASSIGNMENT', message='Picking assignment TASK-PICK-101 assigned to Pete Picker at Aisle 2-B, Bin 14.', workflowId=None),
            ]
            db.add_all(logs)
            db.commit()
            print("[DB] Rich dummy data successfully initialized!")
    finally:
        db.close()

@app.on_event("startup")
def startup_event():
    init_dummy_data()

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "Sustainable Supply Chain Multi-Agent Platform",
        "gemini_live": config.IS_VALID_KEY
    }

# ----------------- USERS -----------------
@app.get("/api/users", response_model=List[schemas.User])
def get_users(db: Session = Depends(get_db)):
    return db.query(models.DBUser).all()

# ----------------- PRODUCTS -----------------
@app.get("/api/products", response_model=List[schemas.Product])
def get_products(db: Session = Depends(get_db)):
    return db.query(models.DBProduct).all()

# ----------------- FACILITIES & INVENTORY -----------------
@app.get("/api/facilities")
def get_facilities(db: Session = Depends(get_db)):
    facilities = db.query(models.DBFacility).all()
    results = []
    for f in facilities:
        items = []
        for inv in f.inventory:
            items.append({
                "productId": inv.product_id,
                "quantity": inv.quantity,
                "predictedDemand": inv.predictedDemand
            })
        results.append({
            "id": f.id,
            "name": f.name,
            "type": f.type,
            "location": f.location,
            "leadTimeDays": f.leadTimeDays,
            "inventory": items
        })
    return results

# ----------------- TRUCKS & FLEET -----------------
@app.get("/api/trucks", response_model=List[schemas.Truck])
def get_trucks(db: Session = Depends(get_db)):
    return db.query(models.DBTruck).all()

@app.post("/api/trucks/{truck_id}/toggle-autofill")
def toggle_autofill(truck_id: str, db: Session = Depends(get_db)):
    truck = db.query(models.DBTruck).filter(models.DBTruck.id == truck_id).first()
    if not truck:
        raise HTTPException(status_code=404, detail="Truck not found")
    truck.sustainableFillMode = not truck.sustainableFillMode
    db.commit()
    return {"status": "success", "truckId": truck_id, "sustainableFillMode": truck.sustainableFillMode}

# ----------------- WORKFLOWS & HUMAN IN THE LOOP -----------------
@app.get("/api/workflows")
def get_workflows(db: Session = Depends(get_db)):
    workflows = db.query(models.DBWorkflow).order_by(models.DBWorkflow.createdAt.desc()).all()
    results = []
    for w in workflows:
        steps_list = []
        for s in sorted(w.steps, key=lambda x: x.order):
            steps_list.append({
                "id": s.id,
                "agent": s.agent,
                "action": s.action,
                "status": s.status,
                "requiresHumanAction": s.requiresHumanAction,
                "details": s.details,
                "order": s.order
            })
        results.append({
            "id": w.id,
            "title": w.title,
            "status": w.status,
            "createdAt": w.createdAt,
            "steps": steps_list
        })
    return results

@app.post("/api/workflows/{workflow_id}/steps/{step_id}/approve")
def approve_step(workflow_id: str, step_id: str, approval: Optional[schemas.ApprovalRequest] = None, db: Session = Depends(get_db)):
    step = db.query(models.DBWorkflowStep).filter(
        models.DBWorkflowStep.id == step_id,
        models.DBWorkflowStep.workflow_id == workflow_id
    ).first()
    if not step:
        raise HTTPException(status_code=404, detail="Step not found")
    
    step.status = 'Completed'
    step.requiresHumanAction = False
    
    comment_text = ""
    if approval and approval.comment:
        comment_text = approval.comment.strip()
        step.details = f"{step.details or ''} | Operator Note: {comment_text}".strip(" |")
    
    if approval and approval.modifiedAction:
        step.action = f"{step.action} (Modified: {approval.modifiedAction})"

    # Progress next pending step
    workflow = db.query(models.DBWorkflow).filter(models.DBWorkflow.id == workflow_id).first()
    if workflow:
        steps_sorted = sorted(workflow.steps, key=lambda x: x.order)
        next_step = next((s for s in steps_sorted if s.status == 'Pending'), None)
        if next_step:
            next_step.status = 'In Progress'
        all_done = all(s.status == 'Completed' for s in steps_sorted)
        if all_done:
            workflow.status = 'Completed'
            
    # Log human approval action with comment
    msg = f'Authorized workflow step: {step.action}.'
    if comment_text:
        msg += f' Operator comment: "{comment_text}".'
    msg += ' Releasing downstream autonomous logistics.'

    log = models.DBAgentLog(
        fromAgent='Human in the Loop',
        toAgent='AI Orchestrator',
        actionType='HUMAN_APPROVAL_GRANTED',
        message=msg,
        workflowId=workflow_id
    )
    db.add(log)
    db.commit()
    return {"status": "success", "message": "Step approved with operator review and downstream agents notified"}

@app.post("/api/workflows/{workflow_id}/inject")
def inject_workflow_command(workflow_id: str, injection: schemas.WorkflowCommandInjection, db: Session = Depends(get_db)):
    workflow = db.query(models.DBWorkflow).filter(models.DBWorkflow.id == workflow_id).first()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    # Create new injected step
    new_order = len(workflow.steps) + 1
    new_step = models.DBWorkflowStep(
        id=f"inject-{uuid.uuid4().hex[:6]}",
        workflow_id=workflow_id,
        order=new_order,
        agent=f"User Override ({injection.targetAgent})",
        action=f"Special Instruction: {injection.command}",
        status='Completed',
        requiresHumanAction=False,
        details=f"Injected by operator into active workflow."
    )
    db.add(new_step)

    # Log multi-agent adaptation
    log = models.DBAgentLog(
        fromAgent='Human Operator',
        toAgent=injection.targetAgent or 'AI Orchestrator',
        actionType='COMMAND_INJECTION',
        message=f'Workflow updated with custom instruction: "{injection.command}"',
        workflowId=workflow_id
    )
    db.add(log)
    db.commit()
    return {"status": "success", "message": "Command injected into live agent workflow"}

# ----------------- ALERTS -----------------
@app.get("/api/alerts", response_model=List[schemas.Alert])
def get_alerts(db: Session = Depends(get_db)):
    return db.query(models.DBAlert).order_by(models.DBAlert.id.desc()).all()

@app.post("/api/alerts/{alert_id}/dismiss")
def dismiss_alert(alert_id: str, db: Session = Depends(get_db)):
    alert = db.query(models.DBAlert).filter(models.DBAlert.id == alert_id).first()
    if alert:
        db.delete(alert)
        db.commit()
    return {"status": "success"}

# ----------------- AGENTS & MULTI-AGENT LOGS -----------------
@app.get("/api/agents")
def get_agents():
    return [
        {
            "id": "orchestrator",
            "name": orchestrator.name,
            "role": orchestrator.role,
            "avatar": orchestrator.avatar,
            "color": orchestrator.color,
            "status": "Active (Conductor)"
        },
        {
            "id": "inventory",
            "name": inventory_agent.name,
            "role": inventory_agent.role,
            "avatar": inventory_agent.avatar,
            "color": inventory_agent.color,
            "status": "Monitoring Stock"
        },
        {
            "id": "logistics",
            "name": logistics_agent.name,
            "role": logistics_agent.role,
            "avatar": logistics_agent.avatar,
            "color": logistics_agent.color,
            "status": "Optimizing EV Fleet"
        },
        {
            "id": "seasonal",
            "name": seasonal_agent.name,
            "role": seasonal_agent.role,
            "avatar": seasonal_agent.avatar,
            "color": seasonal_agent.color,
            "status": "Tracking Demand Multipliers"
        },
        {
            "id": "sustainability",
            "name": sustainability_agent.name,
            "role": sustainability_agent.role,
            "avatar": sustainability_agent.avatar,
            "color": sustainability_agent.color,
            "status": "Net-Zero Auditing"
        },
        {
            "id": "warehouse",
            "name": warehouse_agent.name,
            "role": warehouse_agent.role,
            "avatar": warehouse_agent.avatar,
            "color": warehouse_agent.color,
            "status": "Dispatching Floor Staff"
        }
    ]

@app.get("/api/agent-logs", response_model=List[schemas.AgentLog])
def get_agent_logs(db: Session = Depends(get_db)):
    return db.query(models.DBAgentLog).order_by(models.DBAgentLog.id.desc()).limit(30).all()

# ----------------- CHAT & MULTI-AGENT DELIBERATION -----------------
@app.post("/api/chat", response_model=schemas.ChatResponse)
def chat_endpoint(chat_req: schemas.ChatRequest, db: Session = Depends(get_db)):
    result = orchestrator.process_chat(chat_req.message, chat_req.targetAgent or "Orchestrator")
    
    # Record consultation log in DB
    log = models.DBAgentLog(
        fromAgent='Human User',
        toAgent=result.get("agent", "AI Orchestrator"),
        actionType='USER_INTERACTION',
        message=chat_req.message
    )
    db.add(log)
    db.commit()

    return result

# ----------------- MULTI-AGENT SCENARIO TRIGGERS -----------------
@app.post("/api/scenarios/trigger")
def trigger_scenario(request: schemas.ScenarioTriggerRequest, db: Session = Depends(get_db)):
    scenario = request.scenario
    now_str = datetime.datetime.utcnow().strftime("%H:%M:%S")

    if scenario == "festive_surge":
        wf_id = f"wf-festive-{uuid.uuid4().hex[:6]}"
        new_wf = models.DBWorkflow(
            id=wf_id,
            title='Autonomous Festive Demand Multiplier & Promotion Rollout',
            status='Active'
        )
        db.add(new_wf)
        db.commit()

        steps = [
            models.DBWorkflowStep(
                id=f"s1-{wf_id}", workflow_id=wf_id, order=1, agent='Seasonal Agent',
                action=f'Detected upcoming festive season. Formulated {request.discountPct}% promotional discount for eco-products.',
                status='Completed', requiresHumanAction=False
            ),
            models.DBWorkflowStep(
                id=f"s2-{wf_id}", workflow_id=wf_id, order=2, agent='Inventory Agent',
                action='Calculated warehouse replenishment need (+42% demand curve). Generated Pre-Stock Order #1042.',
                status='Completed', requiresHumanAction=False
            ),
            models.DBWorkflowStep(
                id=f"s3-{wf_id}", workflow_id=wf_id, order=3, agent='Human in Loop (Store Manager)',
                action=f'Review and confirm {request.discountPct}% festive discount and auto-generated stock transfer.',
                status='Awaiting Human', requiresHumanAction=True,
                details='Requires approval: Confirms seasonal promotion across digital shelf and schedules warehouse pallet release.'
            ),
            models.DBWorkflowStep(
                id=f"s4-{wf_id}", workflow_id=wf_id, order=4, agent='Logistics Agent',
                action='Assign Zero-Emission Electric Delivery Truck T-101 with Sustainable Autofill (92% load density).',
                status='Pending', requiresHumanAction=False
            ),
        ]
        db.add_all(steps)

        # Multi-agent inter-communication logs
        logs = [
            models.DBAgentLog(fromAgent='Seasonal Agent', toAgent='Inventory Agent', actionType='SURGE_ALERT',
                             message=f'Festive surge forecast active. Eco-detergent velocity projected to increase by 45%. Proposing {request.discountPct}% green discount.', workflowId=wf_id),
            models.DBAgentLog(fromAgent='Inventory Agent', toAgent='Logistics Agent', actionType='CONSULTATION',
                             message='Warehouse Central Hub reserves confirmed. Dispatching 1,400 units to avoid NYC retail stockout.', workflowId=wf_id),
            models.DBAgentLog(fromAgent='Logistics Agent', toAgent='AI Orchestrator', actionType='OPTIMIZATION',
                             message='Truck T-101 (EV) selected. Bundling 15 extra pallets of paper towels to avoid deadhead freight emissions.', workflowId=wf_id),
        ]
        db.add_all(logs)

        alert = models.DBAlert(
            id=f"alt-{uuid.uuid4().hex[:6]}",
            type='Warning',
            message=f'Festive demand surge detected! Awaiting Store Manager approval for {request.discountPct}% promo.',
            timestamp='Just now',
            workflowId=wf_id
        )
        db.add(alert)
        db.commit()

        return {"status": "success", "scenario": scenario, "workflowId": wf_id}

    elif scenario == "emergency_restock":
        wf_id = f"wf-restock-{uuid.uuid4().hex[:6]}"
        new_wf = models.DBWorkflow(
            id=wf_id,
            title='Emergency Stockout Response & Sustainable Autofill',
            status='Active'
        )
        db.add(new_wf)
        db.commit()

        steps = [
            models.DBWorkflowStep(
                id=f"s1-{wf_id}", workflow_id=wf_id, order=1, agent='Inventory Agent',
                action='Critical stock depletion identified at Downtown Store (15 units remaining).',
                status='Completed', requiresHumanAction=False
            ),
            models.DBWorkflowStep(
                id=f"s2-{wf_id}", workflow_id=wf_id, order=2, agent='Logistics Agent',
                action='Engaged Sustainable Autofill: Packaged emergency detergent with 20 pallets of scheduled household essentials to achieve 88% capacity.',
                status='Completed', requiresHumanAction=False
            ),
            models.DBWorkflowStep(
                id=f"s3-{wf_id}", workflow_id=wf_id, order=3, agent='Human in Loop (Warehouse Operator)',
                action='Confirm Emergency Sustainable Restock Manifest #883.',
                status='Awaiting Human', requiresHumanAction=True,
                details='Autofill consolidated shipment prevents dispatching an empty vehicle, saving 44kg CO2 emissions.'
            ),
            models.DBWorkflowStep(
                id=f"s4-{wf_id}", workflow_id=wf_id, order=4, agent='Sustainability Agent',
                action='Logistics emission verification complete (Green Score: 96/100).',
                status='Pending', requiresHumanAction=False
            ),
        ]
        db.add_all(steps)

        logs = [
            models.DBAgentLog(fromAgent='Inventory Agent', toAgent='Logistics Agent', actionType='EMERGENCY_DEPLETION',
                             message='Sudden stockout imminent for Zero-Plastic Detergent. Need expedited replenishment without incurring single-item empty miles.', workflowId=wf_id),
            models.DBAgentLog(fromAgent='Logistics Agent', toAgent='Sustainability Agent', actionType='OPTIMIZATION',
                             message='Sustainable Autofill algorithm applied. Adding high-turnover bamboo items to fill EV Truck T-102 to 88% capacity.', workflowId=wf_id),
            models.DBAgentLog(fromAgent='Sustainability Agent', toAgent='AI Orchestrator', actionType='CO2_AUDIT',
                             message='Audit verified: Zero-waste shipment compliant. Human-in-the-loop authorization required.', workflowId=wf_id),
        ]
        db.add_all(logs)

        alert = models.DBAlert(
            id=f"alt-{uuid.uuid4().hex[:6]}",
            type='Critical',
            message='Sudden out of stock handled: Sustainable autofill order compiled, awaiting warehouse authorization.',
            timestamp='Just now',
            workflowId=wf_id
        )
        db.add(alert)
        db.commit()

        return {"status": "success", "scenario": scenario, "workflowId": wf_id}

    elif scenario == "carbon_audit":
        logs = [
            models.DBAgentLog(fromAgent='Sustainability Agent', toAgent='Logistics Agent', actionType='CO2_AUDIT',
                             message='Net-Zero compliance review: Route NYC-04 exceeds target fuel burn by 8%. Recommend switching to Electric Truck T-101.'),
            models.DBAgentLog(fromAgent='Logistics Agent', toAgent='AI Orchestrator', actionType='OPTIMIZATION',
                             message='Fleet schedule reconfigured: All inner-city deliveries mapped to Zero-Emission EV trucks. Estimated 72kg CO2 saved daily.'),
        ]
        db.add_all(logs)
        db.commit()
        return {"status": "success", "scenario": scenario}

    else:
        raise HTTPException(status_code=400, detail="Unknown scenario type")

# ----------------- WAREHOUSE FLOOR OPERATIONS -----------------
@app.get("/api/warehouse/tasks", response_model=List[schemas.WarehouseTask])
def get_warehouse_tasks(role: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(models.DBWarehouseTask)
    if role:
        query = query.filter(models.DBWarehouseTask.assignedRole == role)
    return query.order_by(models.DBWarehouseTask.createdAt.desc()).all()

@app.post("/api/warehouse/tasks/{task_id}/status")
def update_task_status(task_id: str, update: schemas.WarehouseTaskUpdate, db: Session = Depends(get_db)):
    task = db.query(models.DBWarehouseTask).filter(models.DBWarehouseTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    old_status = task.status
    task.status = update.status
    if update.damageReason:
        task.damageReason = update.damageReason

    # If completed, trigger automated next-step hand-off via Warehouse Agent
    created_tasks = []
    if update.status == "Completed" and old_status != "Completed":
        task_dict = {
            "id": task.id,
            "assignedRole": task.assignedRole,
            "taskType": task.taskType,
            "itemDescription": task.itemDescription,
            "productId": task.productId,
            "quantity": task.quantity,
            "location": task.location,
            "status": task.status,
            "orderId": task.orderId
        }
        new_dbs = warehouse_agent.process_task_transition(task_dict, db)
        for t in new_dbs:
            created_tasks.append(t.id)

    db.commit()
    return {
        "status": "success",
        "taskId": task_id,
        "newStatus": task.status,
        "nextTasksCreated": created_tasks
    }

@app.post("/api/warehouse/tasks/report-damage")
def report_damage(req: schemas.DamageReportRequest, db: Session = Depends(get_db)):
    result = warehouse_agent.handle_damaged_item(
        task_id=req.taskId,
        prod_id=req.productId,
        qty=req.quantity,
        reason=req.damageReason,
        reporter=req.reportedBy or "QC Inspector",
        db_session=db
    )
    return result

# ----------------- SEASONAL HISTORICAL ANALYTICS -----------------
@app.get("/api/seasonal/history", response_model=List[schemas.SeasonalHistoricalItem])
def get_seasonal_history():
    return seasonal_agent.get_historical_festive_data()

# ----------------- UNIFIED DASHBOARD BOOTSTRAP -----------------
@app.get("/api/dashboard/bootstrap")
def get_dashboard_bootstrap(db: Session = Depends(get_db)):
    """Consolidated endpoint delivering entire initial dashboard state in one single payload to avoid network spam."""
    return {
        "users": [schemas.User.model_validate(x).model_dump() for x in get_users(db)],
        "products": [schemas.Product.model_validate(x).model_dump() for x in get_products(db)],
        "facilities": get_facilities(db),
        "trucks": [schemas.Truck.model_validate(x).model_dump() for x in get_trucks(db)],
        "workflows": get_workflows(db),
        "alerts": [schemas.Alert.model_validate(x).model_dump() for x in get_alerts(db)],
        "agents": get_agents(),
        "agentLogs": [schemas.AgentLog.model_validate(x).model_dump() for x in get_agent_logs(db)],
        "warehouseTasks": [schemas.WarehouseTask.model_validate(x).model_dump() for x in get_warehouse_tasks(role=None, db=db)],
        "seasonalHistory": get_seasonal_history()
    }

