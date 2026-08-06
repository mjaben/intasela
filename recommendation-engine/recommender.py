import pandas as pd
import numpy as np
from sqlalchemy.orm import Session
import implicit
import scipy.sparse as sparse
from database import SessionLocal
from models import Engagement, Post

# Global variables to store the trained model and mappings
model = None
user_mapping = {}
reverse_user_mapping = {}
post_mapping = {}
reverse_post_mapping = {}
user_item_matrix = None

# For Content-based and Diversity
post_metadata_cache = {}  # post_id -> { tags: [], authorId: str, mediaType: str }


def train_model():
    global model, user_mapping, reverse_user_mapping, post_mapping, reverse_post_mapping, user_item_matrix
    
    db: Session = SessionLocal()
    try:
        # Fetch all engagements
        engagements = db.query(Engagement).all()
        if not engagements:
            print("Not enough data to train model.")
            return False
            
        data = []
        for e in engagements:
            weight = 1.0
            if e.type == 'RESELA': weight = 2.0
            elif e.type == 'LIKE': weight = 1.0
            elif e.type == 'BOOKMARK': weight = 0.5
            data.append({"user_id": e.userId, "post_id": e.postId, "weight": weight})
            
        df = pd.DataFrame(data)
        
        # Create mappings
        unique_users = df['user_id'].unique()
        unique_posts = df['post_id'].unique()
        
        user_mapping = {u: i for i, u in enumerate(unique_users)}
        reverse_user_mapping = {i: u for i, u in enumerate(unique_users)}
        
        post_mapping = {p: i for i, p in enumerate(unique_posts)}
        reverse_post_mapping = {i: p for i, p in enumerate(unique_posts)}
        
        # Build Sparse Matrix (Items x Users for implicit)
        # implicit requires item_user matrix for ALS
        rows = df['post_id'].map(post_mapping).values
        cols = df['user_id'].map(user_mapping).values
        weights = df['weight'].values
        
        item_user_matrix = sparse.csr_matrix((weights, (rows, cols)), shape=(len(unique_posts), len(unique_users)))
        user_item_matrix = item_user_matrix.T.tocsr() # Keep for recommendations
        
        # Load post metadata for content filtering and diversity
        posts = db.query(Post).filter(Post.id.in_(unique_posts.tolist())).all()
        post_metadata_cache.clear()
        for p in posts:
            post_metadata_cache[p.id] = {
                'tags': p.tags if p.tags else [],
                'authorId': p.authorId,
                'mediaType': p.mediaType
            }
            
        # Also load recent posts that have 0 engagements (Cold Start Candidates)
        recent_posts = db.query(Post).filter(Post.status == 'PUBLISHED').order_by(Post.createdAt.desc()).limit(200).all()
        for p in recent_posts:
            if p.id not in post_metadata_cache:
                post_metadata_cache[p.id] = {
                    'tags': p.tags if p.tags else [],
                    'authorId': p.authorId,
                    'mediaType': p.mediaType
                }
                
        # Train Model
        print(f"Training ALS Model on {len(unique_users)} users and {len(unique_posts)} posts...")
        als_model = implicit.als.AlternatingLeastSquares(factors=50, regularization=0.1, iterations=15)
        als_model.fit(item_user_matrix)
        
        model = als_model
        print("Model training complete.")
        return True
        
    except Exception as e:
        print(f"Error training model: {e}")
        return False
    finally:
        db.close()

def get_recommendations(user_id: str, limit: int = 20, feed_type: str = 'for-you', user_interests: list = None):
    global model, user_mapping, post_mapping, reverse_post_mapping, user_item_matrix, post_metadata_cache
    
    if user_interests is None:
        user_interests = []
        
    user_interests_set = set([i.lower() for i in user_interests])
    
    scored_candidates = {}
    
    # 1. Collaborative Filtering Scores (ALS)
    if model is not None and user_id in user_mapping:
        user_idx = user_mapping[user_id]
        # Get more than limit because we will filter and penalize
        ids, scores = model.recommend(user_idx, user_item_matrix[user_idx], N=limit*3, filter_already_liked_items=True)
        for i, score in zip(ids, scores):
            real_post_id = reverse_post_mapping[i]
            scored_candidates[real_post_id] = float(score)
            
    # 2. Content-Based Cold Start (Tag Overlap)
    if user_interests_set:
        for p_id, meta in post_metadata_cache.items():
            post_tags = set([t.lower() for t in meta['tags']])
            overlap = len(user_interests_set.intersection(post_tags))
            if overlap > 0:
                cb_score = overlap * 0.5 # basic heuristic weighting
                if p_id in scored_candidates:
                    scored_candidates[p_id] += cb_score
                else:
                    scored_candidates[p_id] = cb_score

    # 3. Filtering (Orbit) and Sorting
    valid_candidates = []
    for p_id, score in scored_candidates.items():
        meta = post_metadata_cache.get(p_id)
        if meta:
            if feed_type == 'orbit' and meta['mediaType'] != 'VIDEO':
                continue # Skip non-videos for orbit
            valid_candidates.append({'id': p_id, 'score': score, 'authorId': meta['authorId']})
            
    # Sort by score
    valid_candidates.sort(key=lambda x: x['score'], reverse=True)
    
    # 4. Author Diversity Penalizer
    final_ids = []
    author_counts = {}
    
    for c in valid_candidates:
        author = c['authorId']
        author_counts[author] = author_counts.get(author, 0) + 1
        
        # Penalize if we already have 3 posts from this author in the feed
        if author_counts[author] > 3:
            continue
            
        final_ids.append(c['id'])
        if len(final_ids) >= limit:
            break

    return final_ids
