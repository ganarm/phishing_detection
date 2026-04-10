import os
import joblib
import pandas as pd
import numpy as np
import shap
from urllib.parse import urlparse
from .feature_extractor import extract_features

MODELS_DIR = os.path.join(os.path.dirname(__file__), '..', 'models')


def _model_outputs(url, model_name='RandomForest'):
    model, scaler, feature_names = load_model_and_scaler(model_name)
    features = extract_features(url)
    feature_df = pd.DataFrame([features])
    feature_df = feature_df[feature_names]
    scaled_features = scaler.transform(feature_df)
    pred = model.predict(scaled_features)[0]
    proba = model.predict_proba(scaled_features)[0] if hasattr(model, 'predict_proba') else None
    return model, feature_names, scaled_features, pred, proba


def _label_from_pred(pred):
    # Dataset uses 0=phishing, 1=legitimate.
    return "Phishing" if int(pred) == 0 else "Legitimate"


def _build_probabilities(proba):
    if proba is None or len(proba) < 2:
        return None
    return {
        'phishing': float(proba[0]),
        'legitimate': float(proba[1]),
    }


def _is_obviously_legitimate_homepage(url):
    parsed = urlparse(str(url))
    hostname = (parsed.hostname or '').lower()
    if not hostname:
        return False

    path = parsed.path or ''
    if path not in ('', '/'):
        return False

    if parsed.query or parsed.fragment:
        return False

    if parsed.scheme != 'https':
        return False

    if hostname.startswith('www.'):
        hostname = hostname[4:]

    parts = [part for part in hostname.split('.') if part]
    if len(parts) != 2:
        return False

    root, tld = parts
    allowed_tlds = {'com', 'org', 'net', 'edu', 'gov', 'io', 'co'}
    if tld not in allowed_tlds:
        return False

    if any(ch.isdigit() for ch in root):
        return False

    if '-' in root or '_' in root:
        return False

    suspicious_tokens = {
        'login', 'signin', 'secure', 'verify', 'update', 'account',
        'bank', 'payment', 'confirm', 'support', 'service', 'wallet',
    }
    if any(token in root for token in suspicious_tokens):
        return False

    return True

def load_model_and_scaler(model_name='RandomForest'):
    model_path = os.path.join(MODELS_DIR, f'{model_name}.pkl')
    scaler_path = os.path.join(MODELS_DIR, 'scaler.pkl')
    feature_names_path = os.path.join(MODELS_DIR, 'feature_names.pkl')
    if not (os.path.exists(model_path) and os.path.exists(scaler_path) and os.path.exists(feature_names_path)):
        raise FileNotFoundError("Model, scaler, or feature names not found. Please train models first.")
    model = joblib.load(model_path)
    scaler = joblib.load(scaler_path)
    feature_names = joblib.load(feature_names_path)
    return model, scaler, feature_names

def predict_url(url, model_name='RandomForest'):
    model, feature_names, scaled_features, pred, proba = _model_outputs(url, model_name)
    confidence = max(proba) if proba is not None else None
    prediction = _label_from_pred(pred)
    probabilities = _build_probabilities(proba)

    # Generate SHAP explanations
    shap_explanations = generate_shap_explanation(model, scaled_features, feature_names, model_name)
    explanation = 'Model used lexical URL features to estimate phishing risk.'

    if prediction == "Phishing" and _is_obviously_legitimate_homepage(url):
        prediction = "Legitimate"
        legitimate_confidence = probabilities['legitimate'] if probabilities else 0.51
        confidence = max(legitimate_confidence, 0.51)
        explanation = (
            'Heuristic override applied: simple HTTPS root-domain homepage with no '
            'suspicious path, query, IP, digits, or phishing keywords.'
        )

    return {
        'prediction': prediction,
        'confidence': confidence,
        'probabilities': probabilities,
        'explanation': explanation,
        'shap_explanations': shap_explanations
    }

def generate_shap_explanation(model, scaled_features, feature_names, model_name):
    """
    Generate SHAP explanations for the prediction
    """
    try:
        # Create SHAP explainer based on model type
        if model_name in ['RandomForest', 'DecisionTree', 'XGBoost']:
            # For tree models, use KernelExplainer which works better for single predictions
            # Create a simple background dataset with reasonable values
            background = np.random.rand(10, scaled_features.shape[1])  # 10 background samples
            explainer = shap.KernelExplainer(model.predict_proba, background)
        elif model_name == 'LogisticRegression':
            # For linear models, use LinearExplainer with background data
            background = np.random.rand(10, scaled_features.shape[1])  # 10 background samples
            explainer = shap.LinearExplainer(model, background)
        else:
            # Fallback to generic explainer
            explainer = shap.Explainer(model)

        # Calculate SHAP values
        shap_values = explainer.shap_values(scaled_features)

        # Handle different SHAP output formats
        if model_name in ['RandomForest', 'DecisionTree', 'XGBoost']:
            # KernelExplainer returns 3D array: (n_samples, n_features, n_classes)
            if isinstance(shap_values, np.ndarray) and shap_values.ndim == 3:
                shap_values = shap_values[0, :, 1]  # Take first sample, all features, positive class
                base_value = explainer.expected_value[1]
            elif isinstance(shap_values, list) and len(shap_values) == 2:
                shap_values = shap_values[1]  # Take positive class (phishing)
                base_value = explainer.expected_value[1]
            else:
                shap_values = shap_values
                base_value = explainer.expected_value
        elif model_name == 'LogisticRegression':
            # LinearExplainer
            if isinstance(shap_values, list) and len(shap_values) == 2:
                shap_values = shap_values[1]  # Take positive class (phishing)
                base_value = explainer.expected_value[1] if isinstance(explainer.expected_value, (list, np.ndarray)) else explainer.expected_value
            else:
                shap_values = shap_values
                base_value = explainer.expected_value
        else:
            # Generic explainer
            if isinstance(shap_values, list) and len(shap_values) == 2:
                shap_values = shap_values[1]  # Take positive class (phishing)
                base_value = explainer.expected_value[1] if isinstance(explainer.expected_value, (list, np.ndarray)) else explainer.expected_value
            else:
                shap_values = shap_values
                base_value = explainer.expected_value

        # Ensure base_value is a scalar
        if isinstance(base_value, (list, np.ndarray)):
            base_value = float(base_value[0]) if len(base_value) > 0 else 0.0
        else:
            base_value = float(base_value)

        # Ensure shap_values is a 1D array for single prediction
        if isinstance(shap_values, np.ndarray) and shap_values.ndim > 1:
            shap_values = shap_values[0]  # Take first (and only) prediction

        # Get feature importance
        feature_importance = []
        for i, feature_name in enumerate(feature_names):
            importance = float(shap_values[i])
            feature_importance.append({
                'feature': feature_name,
                'importance': importance,
                'abs_importance': abs(importance)
            })

        # Sort by absolute importance
        feature_importance.sort(key=lambda x: x['abs_importance'], reverse=True)

        # Get top contributing features (both positive and negative)
        top_features = feature_importance[:10]  # Top 10 most important features
        
        # Ensure we have at least one feature with non-zero importance for visualization
        if not top_features or top_features[0]['abs_importance'] == 0:
            # If all features have zero importance, add a dummy feature to prevent division by zero
            top_features = [{
                'feature': 'No significant features',
                'importance': 0.0,
                'abs_importance': 1.0  # Use 1.0 to prevent division by zero in template
            }]

        # Calculate prediction value
        prediction_value = base_value + sum([f['importance'] for f in feature_importance])

        return {
            'base_value': base_value,
            'prediction_value': prediction_value,
            'top_features': top_features,
            'feature_importance': feature_importance
        }

    except Exception as e:
        # If SHAP fails, return basic explanation
        return {
            'error': f'Could not generate SHAP explanation: {str(e)}',
            'base_value': None,
            'prediction_value': None,
            'top_features': [],
            'feature_importance': []
        }

def bulk_predict(urls, model_name='RandomForest'):
    results = []
    for url in urls:
        result = predict_url(url, model_name)
        results.append({
            'url': url,
            'prediction': result['prediction'],
            'confidence': result.get('confidence'),
        })
    return pd.DataFrame(results)
