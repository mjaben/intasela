from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship
from database import Base
import datetime

class User(Base):
    __tablename__ = "User"

    id = Column(String, primary_key=True)
    username = Column(String, unique=True)
    interests = Column(JSON)
    # Just defining what we need

class Post(Base):
    __tablename__ = "Post"

    id = Column(Integer, primary_key=True)
    authorId = Column(String, ForeignKey("User.id"))
    content = Column(String)
    status = Column(String)
    createdAt = Column(DateTime)
    mediaType = Column(String)
    mediaUrls = Column(JSON)
    tags = Column(JSON)

class Engagement(Base):
    __tablename__ = "Engagement"

    id = Column(Integer, primary_key=True)
    type = Column(String) # LIKE, RESELA, BOOKMARK
    userId = Column(String, ForeignKey("User.id"))
    postId = Column(Integer, ForeignKey("Post.id"))
    createdAt = Column(DateTime)

class Follows(Base):
    __tablename__ = "Follows"
    
    followerId = Column(String, ForeignKey("User.id"), primary_key=True)
    followingId = Column(String, ForeignKey("User.id"), primary_key=True)
