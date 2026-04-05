from flask import Flask
from flask_cors import CORS
from routes import api

def create_app():
    app = Flask(__name__)
    app.config['SECRET_KEY'] = 'ABC456'  # change for production
    CORS(app)
    app.register_blueprint(api.bp)
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)