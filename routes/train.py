from flask import Blueprint, render_template, request, flash, redirect, url_for
import threading
import os

bp = Blueprint('train', __name__, url_prefix='/train')

def run_training(model_name, log_path):
    with open(log_path, 'w') as log_file:
        try:
            if model_name == 'all':
                from services.model_trainer import train_all_models
                train_all_models(log_file)
            else:
                from services.model_trainer import train_single_model
                train_single_model(model_name, log_file)
        except Exception as e:
            log_file.write(f"FATAL ERROR: {e}\n")
            log_file.flush()
        finally:
            log_file.write("\n### TRAINING COMPLETED ###\n")
            log_file.flush()

@bp.route('/', methods=['GET', 'POST'])
def train():
    if request.method == 'POST':
        model_name = request.form.get('model_name')
        log_path = os.path.join(os.path.dirname(__file__), '..', 'models', 'training.log')
        if os.path.exists(log_path):
            os.remove(log_path)
        thread = threading.Thread(target=run_training, args=(model_name, log_path))
        thread.daemon = True
        thread.start()
        flash(f'Training for {model_name} started. See progress below.', 'info')
        return redirect(url_for('train.status'))
    return render_template('train.html')

@bp.route('/status')
def status():
    return render_template('training_status.html')

@bp.route('/log')
def get_log():
    log_path = os.path.join(os.path.dirname(__file__), '..', 'models', 'training.log')
    if os.path.exists(log_path):
        with open(log_path, 'r') as f:
            return f.read()
    else:
        return "No log file yet. Training may not have started."