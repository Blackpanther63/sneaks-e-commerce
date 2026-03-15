from flask import Blueprint, request, jsonify
from config.db import get_db
from config.auth import token_required
from bson.objectid import ObjectId
import datetime

profile_routes_bp = Blueprint('profile', __name__)

@profile_routes_bp.route('/', methods=['GET'])
@token_required
def get_user_profile(current_user_id):
    db = get_db()
    try:
        user = db.users.find_one({'_id': ObjectId(current_user_id)})
        if not user:
            return jsonify({'message': 'User not found', 'success': False}), 404
        
        user_data = {
            'id': str(user['_id']),
            'name': user.get('name', ''),
            'email': user.get('email', ''),
            'phone': user.get('phone', '')
        }
        return jsonify({'success': True, 'data': user_data, 'id': str(user['_id']), 'name': user.get('name', ''), 'email': user.get('email', ''), 'phone': user.get('phone', '')})
    except Exception as e:
        print(e)
        return jsonify({'message': str(e), 'success': False}), 500

@profile_routes_bp.route('/get-addresses', methods=['GET'])
@token_required
def get_addresses(current_user_id):
    db = get_db()
    try:
        addresses = list(db.addresses.find({'user_id': current_user_id}))
        for addr in addresses:
            addr['id'] = str(addr.pop('_id'))
        return jsonify({'success': True, 'addresses': addresses})
    except Exception as e:
        print(e)
        return jsonify({'message': str(e), 'success': False}), 500

@profile_routes_bp.route('/add-address', methods=['POST'])
@token_required
def add_address(current_user_id):
    data = request.json
    db = get_db()
    try:
        address_doc = {
            'user_id': current_user_id,
            'name': data.get('name'),
            'phone': data.get('phone'),
            'address_line': data.get('address_line'),
            'city': data.get('city'),
            'state': data.get('state'),
            'pincode': data.get('pincode'),
            'created_at': datetime.datetime.utcnow()
        }
        res = db.addresses.insert_one(address_doc)
        return jsonify({'success': True, 'id': str(res.inserted_id)})
    except Exception as e:
        print(e)
        return jsonify({'message': str(e), 'success': False}), 500
