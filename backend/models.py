from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
import datetime
from database import Base

class DBUser(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, index=True)
    name = Column(String)
    role = Column(String)
    avatar = Column(String)

class DBProduct(Base):
    __tablename__ = "products"
    id = Column(String, primary_key=True, index=True)
    name = Column(String)
    category = Column(String)
    price = Column(Float)
    sustainabilityScore = Column(Integer)

class DBFacility(Base):
    __tablename__ = "facilities"
    id = Column(String, primary_key=True, index=True)
    name = Column(String)
    type = Column(String) # 'Warehouse', 'Store', 'Vendor'
    location = Column(String)
    leadTimeDays = Column(Integer, default=2)
    
    inventory = relationship("DBInventoryItem", back_populates="facility", cascade="all, delete-orphan")

class DBInventoryItem(Base):
    __tablename__ = "inventory"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    facility_id = Column(String, ForeignKey("facilities.id"))
    product_id = Column(String, ForeignKey("products.id"))
    quantity = Column(Integer)
    predictedDemand = Column(Integer)
    
    facility = relationship("DBFacility", back_populates="inventory")
    product = relationship("DBProduct")

class DBTruck(Base):
    __tablename__ = "trucks"
    id = Column(String, primary_key=True, index=True)
    status = Column(String) # 'Idle', 'In Transit', 'Loading', 'Maintenance'
    capacity = Column(Integer) # in pallets
    currentLoad = Column(Integer)
    originId = Column(String, nullable=True)
    destinationId = Column(String, nullable=True)
    eta = Column(String, nullable=True)
    sustainableFillMode = Column(Boolean, default=True)
    fuelType = Column(String, default="Electric (EV)") # 'Electric (EV)', 'Hybrid', 'Bio-Diesel'
    co2SavedKg = Column(Float, default=45.0)
    lat = Column(Float, default=41.8781)
    lng = Column(Float, default=-87.6298)

class DBWorkflow(Base):
    __tablename__ = "workflows"
    id = Column(String, primary_key=True, index=True)
    title = Column(String)
    status = Column(String) # 'Active', 'Completed', 'Blocked'
    createdAt = Column(String, default=lambda: datetime.datetime.utcnow().isoformat())
    
    steps = relationship("DBWorkflowStep", back_populates="workflow", cascade="all, delete-orphan", order_by="DBWorkflowStep.order")

class DBWorkflowStep(Base):
    __tablename__ = "workflow_steps"
    id = Column(String, primary_key=True, index=True)
    workflow_id = Column(String, ForeignKey("workflows.id"))
    order = Column(Integer, default=0)
    agent = Column(String)
    action = Column(String)
    status = Column(String) # 'Pending', 'In Progress', 'Awaiting Human', 'Completed'
    requiresHumanAction = Column(Boolean, default=False)
    details = Column(Text, nullable=True)
    
    workflow = relationship("DBWorkflow", back_populates="steps")

class DBAlert(Base):
    __tablename__ = "alerts"
    id = Column(String, primary_key=True, index=True)
    type = Column(String) # 'Warning', 'Info', 'Critical'
    message = Column(String)
    timestamp = Column(String)
    workflowId = Column(String, nullable=True)

class DBAgentLog(Base):
    __tablename__ = "agent_logs"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    timestamp = Column(String, default=lambda: datetime.datetime.utcnow().isoformat())
    fromAgent = Column(String) # e.g. 'Seasonal Agent'
    toAgent = Column(String)   # e.g. 'Inventory Agent' or 'Orchestrator'
    message = Column(Text)
    actionType = Column(String) # 'CONSULTATION', 'SURGE_ALERT', 'OPTIMIZATION', 'CO2_AUDIT'
    workflowId = Column(String, nullable=True)

class DBWarehouseTask(Base):
    __tablename__ = "warehouse_tasks"
    id = Column(String, primary_key=True, index=True)
    assignedRole = Column(String) # 'Picker Staff', 'Packer Staff', 'Quality Control Inspector', 'Loading & Dispatch Crew', 'Put-away & Storage Clerk'
    assignedTo = Column(String, nullable=True)
    taskType = Column(String) # 'PICKING', 'PACKING', 'QUALITY_CONTROL', 'LOADING_DISPATCH', 'PUT_AWAY'
    itemDescription = Column(String)
    productId = Column(String, nullable=True)
    quantity = Column(Integer, default=1)
    location = Column(String) # e.g. 'Aisle 4-B, Bin 12'
    status = Column(String, default="Pending") # 'Pending', 'In Progress', 'Completed', 'Damaged Flagged'
    damageReason = Column(String, nullable=True)
    orderId = Column(String, nullable=True)
    priority = Column(String, default="Normal") # 'Normal', 'Urgent', 'Critical'
    createdAt = Column(String, default=lambda: datetime.datetime.utcnow().isoformat())

