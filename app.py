from flask import Flask
from routes import main, train, compare, predict, bulk_predict

def create_app():
    app = Flask(__name__)
    app.config['SECRET_KEY'] = 'ABC456'  # change for production
    app.register_blueprint(main.bp)
    app.register_blueprint(train.bp)
    app.register_blueprint(compare.bp)
    app.register_blueprint(predict.bp)
    app.register_blueprint(bulk_predict.bp)
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)