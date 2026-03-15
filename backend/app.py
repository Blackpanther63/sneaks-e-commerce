import os
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from routes.auth_routes import auth_bp
from routes.product_routes import product_routes_bp
from routes.cart_routes import cart_routes_bp
from routes.order_routes import order_routes_bp
from routes.profile_routes import profile_routes_bp

app = Flask(__name__)
@app.route("/")
def home():
    return {"status": "Sneaks backend running"}
# Enable CORS for the frontend origin
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Register blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(product_routes_bp, url_prefix='/api/products')
app.register_blueprint(cart_routes_bp, url_prefix='/api/cart')
app.register_blueprint(order_routes_bp, url_prefix='/api/orders')
app.register_blueprint(profile_routes_bp, url_prefix='/api/profile')

import os

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)