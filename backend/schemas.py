from pydantic import BaseModel
from typing import List, Optional

class User(BaseModel):
    id: str
    name: str
    role: str
    avatar: str

    class Config:
        from_attributes = True

class Product(BaseModel):
    id: str
    name: str
    category: str
    price: float
    sustainabilityScore: int

    class Config:
        from_attributes = True

class InventoryItem(BaseModel):
    productId: str
    quantity: int
    predictedDemand: int

    class Config:
        from_attributes = True

class Facility(BaseModel):
    id: str
    name: str
    type: str # 'Warehouse', 'Store', 'Vendor'
    location: str
    leadTimeDays: Optional[int] = 2
    inventory: List[InventoryItem] = []

    class Config:
        from_attributes = True

class Truck(BaseModel):
    id: str
    status: str
    capacity: int
    currentLoad: int
    originId: Optional[str] = None
    destinationId: Optional[str] = None
    eta: Optional[str] = None
    sustainableFillMode: bool
    fuelType: Optional[str] = "Electric (EV)"
    co2SavedKg: Optional[float] = 0.0
    lat: Optional[float] = 41.8781
    lng: Optional[float] = -87.6298

    class Config:
        from_attributes = True

class WorkflowStep(BaseModel):
    id: str
    agent: str
    action: str
    status: str
    requiresHumanAction: Optional[bool] = False
    details: Optional[str] = None
    order: Optional[int] = 0

    class Config:
        from_attributes = True

class Workflow(BaseModel):
    id: str
    title: str
    status: str
    createdAt: Optional[str] = None
    steps: List[WorkflowStep] = []

    class Config:
        from_attributes = True

class Alert(BaseModel):
    id: str
    type: str
    message: str
    timestamp: str
    workflowId: Optional[str] = None

    class Config:
        from_attributes = True

class AgentLog(BaseModel):
    id: Optional[int] = None
    timestamp: str
    fromAgent: str
    toAgent: str
    message: str
    actionType: str
    workflowId: Optional[str] = None

    class Config:
        from_attributes = True

class AgentDeliberationStep(BaseModel):
    agent: str
    role: str
    thought: str
    decision: str
    confidence: float

class ChatRequest(BaseModel):
    message: str
    targetAgent: Optional[str] = "Orchestrator" # "Orchestrator", "Inventory", "Logistics", "Seasonal", "Sustainability"
    userId: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    agent: str
    deliberations: List[AgentDeliberationStep] = []

class ScenarioTriggerRequest(BaseModel):
    scenario: str # 'festive_surge', 'emergency_restock', 'carbon_audit'
    facilityId: Optional[str] = None
    productId: Optional[str] = None
    discountPct: Optional[int] = 15

class WorkflowCommandInjection(BaseModel):
    command: str
    targetAgent: Optional[str] = "Orchestrator"

class ApprovalRequest(BaseModel):
    comment: Optional[str] = None
    modifiedAction: Optional[str] = None
    checklistVerified: Optional[bool] = True

class WarehouseTask(BaseModel):
    id: str
    assignedRole: str
    assignedTo: Optional[str] = None
    taskType: str
    itemDescription: str
    productId: Optional[str] = None
    quantity: Optional[int] = 1
    location: str
    status: str
    damageReason: Optional[str] = None
    orderId: Optional[str] = None
    priority: Optional[str] = "Normal"
    createdAt: Optional[str] = None

    class Config:
        from_attributes = True

class WarehouseTaskUpdate(BaseModel):
    status: str
    damageReason: Optional[str] = None
    userId: Optional[str] = None

class DamageReportRequest(BaseModel):
    taskId: str
    productId: str
    quantity: int
    damageReason: str
    reportedBy: Optional[str] = None

class SeasonalHistoricalItem(BaseModel):
    period: str
    year: int
    unitsSold: int
    peakSurgePct: int
    stockoutRatePct: float
    discountAppliedPct: int
    category: str
    isProjected: bool

