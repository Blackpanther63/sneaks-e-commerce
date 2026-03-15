import jwt
from functools import wraps
from flask import request, jsonify
import os
from dotenv import load_dotenv

# Environment loaded in app.py

JWT_SECRET = os.environ.get('JWT_SECRET', 'super-secret-key-fallback')

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            parts = request.headers['Authorization'].split()
            if len(parts) == 2 and parts[0] == 'Bearer':
                token = parts[1]
        
        if not token:
            return jsonify({'message': 'Token is missing', 'success': False}), 401
            
        try:
            data = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
            current_user_id = data['user_id']
        except Exception as e:
            return jsonify({'message': 'Token is invalid or expired', 'success': False}), 401
            
        return f(current_user_id, *args, **kwargs)
    return decorated
