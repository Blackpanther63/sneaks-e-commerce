from flask import Blueprint, request, jsonify
from config.db import get_db
from config.auth import JWT_SECRET
import jwt
import datetime
from bson.objectid import ObjectId

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    name = data.get('name', 'User')

    if not email or not password:
        return jsonify({'message': 'Missing email or password', 'success': False}), 400

    db = get_db()
    try:
        if db.users.find_one({'email': email}):
            return jsonify({'message': 'User already exists', 'success': False}), 400

        user_id = db.users.insert_one({
            'email': email,
            'password': password,
            'name': name,
            'phone': data.get('phone', ''),
            'created_at': datetime.datetime.utcnow()
        }).inserted_id

        token = jwt.encode({
            'user_id': str(user_id),
            'exp': datetime.datetime.utcnow() + datetime.timedelta(days=30)
        }, JWT_SECRET, algorithm="HS256")
        
        return jsonify({
            'success': True,
            'token': token,
            'user': {'id': str(user_id), 'name': name, 'email': email}
        })
    except Exception as e:
        print(e)
        return jsonify({'message': str(e), 'success': False}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'message': 'Missing email or password', 'success': False}), 400

    db = get_db()
    try:
        user = db.users.find_one({'email': email, 'password': password})
        if not user:
            return jsonify({'message': 'Invalid credentials', 'success': False}), 401
            
        token = jwt.encode({
            'user_id': str(user['_id']),
            'exp': datetime.datetime.utcnow() + datetime.timedelta(days=30)
        }, JWT_SECRET, algorithm="HS256")
        
        user_data = {
            'id': str(user['_id']),
            'name': user.get('name', ''),
            'email': user.get('email', ''),
            'phone': user.get('phone', '')
        }
        
        return jsonify({
            'success': True,
            'token': token,
            'user': user_data
        })
    except Exception as e:
        print(e)
        return jsonify({'message': str(e), 'success': False}), 500
