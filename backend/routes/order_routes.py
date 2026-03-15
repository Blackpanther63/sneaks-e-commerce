from flask import Blueprint, request, jsonify
from config.db import get_db
from config.auth import token_required
from bson.objectid import ObjectId
import datetime
import random

order_routes_bp = Blueprint('orders', __name__)

@order_routes_bp.route('/create', methods=['POST'])
@token_required
def create_order(current_user_id):
    data = request.json
    items = data.get('items', [])
    total = data.get('total')
    address_id = data.get('address_id')
    payment_method = data.get('payment_method')
    tracking_number = f"TRK{random.randint(1000000000, 9999999999)}"

    db = get_db()
    try:
        order_doc = {
            'user_id': current_user_id,
            'total': total,
            'status': 'Ordered',
            'tracking_number': tracking_number,
            'address_id': address_id,
            'payment_method': payment_method,
            'items': items,
            'created_at': datetime.datetime.utcnow()
        }
        
        insert_res = db.orders.insert_one(order_doc)
        order_id = str(insert_res.inserted_id)

        # Clear cart for the items ordered optionally (keeping simple for now)

        return jsonify({
            'success': True,
            'order_id': order_id,
            'tracking_number': tracking_number
        })
    except Exception as e:
        print(e)
        return jsonify({'message': str(e), 'success': False}), 500

@order_routes_bp.route('/create-razorpay-order', methods=['POST'])
def create_razorpay_order():
    # Mocking razorpay response
    data = request.json
    amount = float(data.get('amount', 0)) * 100 # Razorpay takes paise
    return jsonify({
        'success': True,
        'order': {
            'id': f"order_{random.randint(10000000, 99999999)}",
            'amount': amount
        }
    })

@order_routes_bp.route('/history', methods=['GET'])
@token_required
def order_history(current_user_id):
    db = get_db()
    try:
        orders = list(db.orders.find({'user_id': current_user_id}).sort('created_at', -1))
        
        formatted_orders = []
        for order in orders:
            order_id_str = str(order['_id'])
            created_at = order.get('created_at', '')
            
            for item in order.get('items', []):
                # Optionally fetch more product info if not saved natively
                product = db.products.find_one({'id': item['product_id']})
                if not product:
                    try: product = db.products.find_one({'_id': ObjectId(item['product_id'])})
                    except: pass

                formatted_orders.append({
                    'id': order_id_str,
                    'product_id': item['product_id'],
                    'product_name': product['name'] if product else 'Unknown',
                    'product_image': product['image'] if product else '',
                    'status': order.get('status', 'Ordered'),
                    'tracking_number': order.get('tracking_number'),
                    'price': item.get('price'),
                    'order_date': created_at
                })
                
        return jsonify({'success': True, 'orders': formatted_orders})
    except Exception as e:
        print(e)
        return jsonify({'message': str(e), 'success': False}), 500
