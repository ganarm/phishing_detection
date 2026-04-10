from flask import Blueprint, jsonify, request
import os
import threading
import pandas as pd
import numpy as np

from services.predictor import predict_url, bulk_predict
from services.model_evaluator import compare_models

bp = Blueprint('api', __name__, url_prefix='/api')

MODEL_NAMES = ['RandomForest', 'DecisionTree', 'XGBoost', 'LogisticRegression']
LOG_PATH = os.path.join(os.path.dirname(__file__), '..', 'models', 'training.log')
HISTORY_PATH = os.path.join(os.path.dirname(__file__), '..', 'models', 'scan_history.json')
TRAINING_STATE = {
    'running': False,
    'model_name': None,
}


def _to_json_safe(value):
    if isinstance(value, dict):
        return {str(k): _to_json_safe(v) for k, v in value.items()}
    if isinstance(value, list):
        return [_to_json_safe(v) for v in value]
    if isinstance(value, tuple):
        return [_to_json_safe(v) for v in value]
    if isinstance(value, np.generic):
        return value.item()
    if isinstance(value, pd.Timestamp):
        return value.isoformat()
    return value


def _run_training(model_name, log_path):
    TRAINING_STATE['running'] = True
    TRAINING_STATE['model_name'] = model_name

    with open(log_path, 'w') as log_file:
        try:
            if model_name == 'all':
                from services.model_trainer import train_all_models
                train_all_models(log_file)
            else:
                from services.model_trainer import train_single_model
                train_single_model(model_name, log_file)
        except Exception as exc:
            log_file.write(f"FATAL ERROR: {exc}\n")
            log_file.flush()
        finally:
            log_file.write("\n### TRAINING COMPLETED ###\n")
            log_file.flush()
            TRAINING_STATE['running'] = False


def _read_history():
    try:
        if not os.path.exists(HISTORY_PATH):
            return []
        import json
        with open(HISTORY_PATH, 'r') as f:
            return json.load(f)
    except Exception:
        return []


def _append_history(entry):
    try:
        history = _read_history()
        history.append(entry)
        import json
        with open(HISTORY_PATH, 'w') as f:
            json.dump(history[-500:], f, indent=2)
    except Exception:
        pass


@bp.get('/history')
def history():
    try:
        limit = int(request.args.get('limit', 50))
    except Exception:
        limit = 50

    entries = _read_history() or []
    # return most recent first
    sliced = entries[-limit:]
    sliced.reverse()

    return jsonify({'count': len(sliced), 'results': sliced})


@bp.get('/health')
def health():
    return jsonify({'status': 'ok'})


@bp.post('/predict')
def predict():
    payload = request.get_json(silent=True) or {}
    url = (payload.get('url') or '').strip()
    model_name = payload.get('model', 'RandomForest')
    test_mode = payload.get('test_mode', 'single')

    if not url:
        return jsonify({'error': 'url is required'}), 400

    if test_mode not in ['single', 'all']:
        return jsonify({'error': 'test_mode must be single or all'}), 400

    try:
        if test_mode == 'all':
            all_models_results = {}
            primary_result = None

            for model in MODEL_NAMES:
                try:
                    result = predict_url(url, model)
                    all_models_results[model] = result
                    if primary_result is None:
                        primary_result = {'model': model, **result}
                except Exception as exc:
                    all_models_results[model] = {'error': str(exc)}

            if primary_result is None:
                return jsonify({
                    'error': 'prediction failed for all models',
                    'all_models_results': all_models_results,
                }), 500

            return jsonify(_to_json_safe({
                'url': url,
                'test_mode': test_mode,
                'prediction': primary_result['prediction'],
                'confidence': primary_result.get('confidence'),
                'probabilities': primary_result.get('probabilities'),
                'explanation': primary_result.get('explanation'),
                'shap_explanations': primary_result.get('shap_explanations'),
                'model_name': 'All models',
                'all_models_results': all_models_results,
            }))

        result = predict_url(url, model_name)
        resp = {
            'url': url,
            'test_mode': test_mode,
            'prediction': result['prediction'],
            'confidence': result.get('confidence'),
            'probabilities': result.get('probabilities'),
            'explanation': result.get('explanation'),
            'shap_explanations': result.get('shap_explanations'),
            'model_name': model_name,
            'all_models_results': None,
        }
        # append to scan history
        try:
            _append_history({
                'ts': pd.Timestamp.now().isoformat(),
                'url': url,
                'model': model_name,
                'prediction': resp['prediction'],
                'confidence': resp.get('confidence'),
            })
        except Exception:
            pass

        return jsonify(_to_json_safe(resp))
    except Exception as exc:
        return jsonify({'error': f'Error making prediction: {exc}'}), 500


@bp.post('/bulk-predict')
def bulk():
    payload = request.get_json(silent=True) or {}
    urls = payload.get('urls')
    model_name = payload.get('model', 'RandomForest')

    if not isinstance(urls, list) or len(urls) == 0:
        return jsonify({'error': 'urls must be a non-empty list'}), 400

    try:
        cleaned_urls = [str(url).strip() for url in urls if str(url).strip()]
        if not cleaned_urls:
            return jsonify({'error': 'no valid urls provided'}), 400

        results_df = bulk_predict(cleaned_urls, model_name)
        # append bulk rows to history
        try:
            for _, row in results_df.iterrows():
                _append_history({
                    'ts': pd.Timestamp.now().isoformat(),
                    'url': row.get('url'),
                    'model': model_name,
                    'prediction': row.get('prediction'),
                    'confidence': row.get('confidence'),
                })
        except Exception:
            pass

        return jsonify(_to_json_safe({
            'count': len(results_df),
            'results': results_df.to_dict(orient='records'),
        }))
    except Exception as exc:
        return jsonify({'error': f'Error processing urls: {exc}'}), 500


@bp.post('/bulk-predict/file')
def bulk_from_file():
    file = request.files.get('file')
    model_name = request.form.get('model', 'RandomForest')

    if not file:
        return jsonify({'error': 'file is required'}), 400

    try:
        df = pd.read_csv(file)
        if 'url' not in df.columns:
            return jsonify({'error': 'CSV must contain a "url" column'}), 400

        results_df = bulk_predict(df['url'].tolist(), model_name)
        try:
            for _, row in results_df.iterrows():
                _append_history({
                    'ts': pd.Timestamp.now().isoformat(),
                    'url': row.get('url'),
                    'model': model_name,
                    'prediction': row.get('prediction'),
                    'confidence': row.get('confidence'),
                })
        except Exception:
            pass

        return jsonify(_to_json_safe({
            'count': len(results_df),
            'results': results_df.to_dict(orient='records'),
        }))
    except Exception as exc:
        return jsonify({'error': f'Error processing file: {exc}'}), 500


@bp.get('/compare')
def compare():
    results = compare_models()
    if results is None:
        return jsonify({'results': [], 'best_model': None})

    best_model = None
    if not results.empty:
        best_model = results.loc[results['Accuracy'].idxmax(), 'Model']

    return jsonify(_to_json_safe({
        'results': results.to_dict(orient='records'),
        'best_model': best_model,
    }))


@bp.post('/train')
def train():
    payload = request.get_json(silent=True) or {}
    model_name = payload.get('model_name', '').strip()

    if not model_name:
        return jsonify({'error': 'model_name is required'}), 400

    if model_name != 'all' and model_name not in MODEL_NAMES:
        return jsonify({'error': 'invalid model_name'}), 400

    if TRAINING_STATE['running']:
        return jsonify({'error': 'training is already running'}), 409

    if os.path.exists(LOG_PATH):
        os.remove(LOG_PATH)

    thread = threading.Thread(target=_run_training, args=(model_name, LOG_PATH))
    thread.daemon = True
    thread.start()

    return jsonify({'message': f'Training for {model_name} started'})


@bp.get('/train/status')
def training_status():
    completed = False
    latest_log = ''

    if os.path.exists(LOG_PATH):
        with open(LOG_PATH, 'r') as log_file:
            latest_log = log_file.read()
            completed = '### TRAINING COMPLETED ###' in latest_log

    return jsonify({
        'running': TRAINING_STATE['running'],
        'model_name': TRAINING_STATE['model_name'],
        'completed': completed,
        'log': latest_log,
    })
