from flask import Blueprint, jsonify
from config.db import get_db

product_routes_bp = Blueprint('products', __name__)

@product_routes_bp.route('/', methods=['GET'])
def get_products():
    db = get_db()
    try:
        products = list(db.products.find())
        # Convert ObjectId to string
        for p in products:
            p['id'] = str(p.pop('_id'))
        
        return jsonify(products)
    except Exception as e:
        print(e)
        return jsonify({'message': str(e), 'success': False}), 500

@product_routes_bp.route('/<id>', methods=['GET'])
def get_product(id):
    db = get_db()
    try:
        # Product ID might be a custom string from the seed script (e.g. 'mens-1') 
        # or an ObjectId depending on how it was seeded.
        from bson.objectid import ObjectId
        import bson.errors
        
        query_val = id
        try:
            query_val = ObjectId(id)
        except bson.errors.InvalidId:
            pass

        product = db.products.find_one({'$or': [{'_id': query_val}, {'id': id}]})
        
        if not product:
            return jsonify({'message': 'Product not found', 'success': False}), 404
            
        product['id'] = str(product.pop('_id'))
        return jsonify(product)
    except Exception as e:
        print(e)
        return jsonify({'message': str(e), 'success': False}), 500
