from flask import Blueprint, request, jsonify
from config.db import get_db
from config.auth import token_required
from bson.objectid import ObjectId

cart_routes_bp = Blueprint('cart', __name__)

@cart_routes_bp.route('/', methods=['GET'])
@token_required
def get_cart(current_user_id):
    db = get_db()
    try:
        cart_items = list(db.cart.find({'user_id': current_user_id}))
        
        # Hydrate with product details
        for item in cart_items:
            item['id'] = str(item.pop('_id'))
            product = db.products.find_one({'id': item['product_id']})
            if not product:
                try:
                    product = db.products.find_one({'_id': ObjectId(item['product_id'])})
                except:
                    pass
                    
            if product:
                item['name'] = product.get('name')
                item['price'] = product.get('price')
                item['image'] = product.get('image')
                item['category'] = product.get('category')
                item['brand'] = product.get('brand')
                
        return jsonify({'success': True, 'items': cart_items})
    except Exception as e:
        print(e)
        return jsonify({'message': str(e), 'success': False}), 500

@cart_routes_bp.route('/add', methods=['POST'])
@token_required
def add_to_cart(current_user_id):
    data = request.json
    product_id = data.get('product_id')
    quantity = data.get('quantity', 1)
    size = data.get('size')
    color = data.get('color')
    
    db = get_db()
    try:
        query = {
            'user_id': current_user_id,
            'product_id': product_id,
            'size': size,
            'color': color
        }
        
        existing = db.cart.find_one(query)
        
        if existing:
            db.cart.update_one(
                {'_id': existing['_id']},
                {'$inc': {'quantity': quantity}}
            )
        else:
            query['quantity'] = quantity
            import datetime
            query['created_at'] = datetime.datetime.utcnow()
            db.cart.insert_one(query)
            
        return jsonify({'success': True})
    except Exception as e:
        print(e)
        return jsonify({'message': str(e), 'success': False}), 500
