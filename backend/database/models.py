from sqlalchemy import Column, Integer, String, Boolean
from database.db import Base


class Alumni(Base):

    __tablename__ = "alumni"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    company = Column(String)
    role = Column(String)
    skills = Column(String)
    batch = Column(Integer)
    mentor_available = Column(Boolean)