#!/usr/bin/env python3
"""
Verify if models are real and properly trained
"""

import joblib
import os
from services.feature_extractor import extract_features

models_dir = 'models'
models = ['RandomForest', 'DecisionTree', 'XGBoost', 'LogisticRegression']

print('=' * 70)
print('MODEL VERIFICATION - CHECKING IF MODELS ARE REAL AND TRAINED')
print('=' * 70)

for model_name in models:
    model_path = os.path.join(models_dir, f'{model_name}.pkl')
    
    if os.path.exists(model_path):
        file_size = os.path.getsize(model_path)
        model = joblib.load(model_path)
        
        print(f'\n✓ {model_name} Model:')
        print(f'  File Size: {file_size:,} bytes')
        print(f'  Model Type: {type(model).__name__}')
        print(f'  Has Classes: {hasattr(model, "classes_")}')
        
        if hasattr(model, 'n_estimators'):
            print(f'  Number of Estimators: {model.n_estimators}')
        if hasattr(model, 'max_depth'):
            print(f'  Max Depth: {model.max_depth}')
        if hasattr(model, 'coef_'):
            print(f'  Coefficients Shape: {model.coef_.shape}')
    else:
        print(f'\n✗ {model_name}: NOT FOUND')

# Check scaler
scaler_path = os.path.join(models_dir, 'scaler.pkl')
if os.path.exists(scaler_path):
    scaler = joblib.load(scaler_path)
    print(f'\n✓ Scaler:')
    print(f'  Type: {type(scaler).__name__}')
    print(f'  Mean Shape: {scaler.mean_.shape}')
    print(f'  Scale Shape: {scaler.scale_.shape}')
else:
    print('\n✗ Scaler: NOT FOUND')

# Check feature names
feature_names_path = os.path.join(models_dir, 'feature_names.pkl')
if os.path.exists(feature_names_path):
    feature_names = joblib.load(feature_names_path)
    print(f'\n✓ Feature Names:')
    print(f'  Count: {len(feature_names)}')
    print(f'  Features: {feature_names}')
else:
    print('\n✗ Feature Names: NOT FOUND')

print('\n' + '=' * 70)
print('MODEL TESTING WITH KNOWN PHISHING URLs')
print('=' * 70)

# Test with known phishing URLs
phishing_urls = [
    'https://login-paypal.com/verify',
    'https://confirm-apple-id.com/signin',
    'http://paypal-secure-login.com/verify',
    'https://bankofamerica-login.net/account',
    'http://193.168.1.1/confirm',
]

legitimate_urls = [
    'https://www.google.com',
    'https://www.paypal.com/myaccount',
    'https://www.apple.com',
    'https://github.com/microsoft/vscode',
]

print('\nPhishing URLs (should predict: PHISHING):')
print('-' * 70)
for url in phishing_urls:
    model = joblib.load(os.path.join(models_dir, 'RandomForest.pkl'))
    scaler = joblib.load(os.path.join(models_dir, 'scaler.pkl'))
    feature_names = joblib.load(os.path.join(models_dir, 'feature_names.pkl'))
    
    features = extract_features(url)
    import pandas as pd
    feature_df = pd.DataFrame([features])
    feature_df = feature_df[feature_names]
    scaled_features = scaler.transform(feature_df)
    
    pred = model.predict(scaled_features)[0]
    proba = model.predict_proba(scaled_features)[0]
    
    # Dataset: 0=phishing, 1=legitimate
    result = "PHISHING" if pred == 0 else "LEGITIMATE"
    confidence = max(proba) * 100
    
    status = "✓" if (pred == 0) else "✗"
    print(f"{status} {url}")
    print(f"   Prediction: {result} ({confidence:.1f}%)")

print('\nLegitimate URLs (should predict: LEGITIMATE):')
print('-' * 70)
for url in legitimate_urls:
    model = joblib.load(os.path.join(models_dir, 'RandomForest.pkl'))
    scaler = joblib.load(os.path.join(models_dir, 'scaler.pkl'))
    feature_names = joblib.load(os.path.join(models_dir, 'feature_names.pkl'))
    
    features = extract_features(url)
    import pandas as pd
    feature_df = pd.DataFrame([features])
    feature_df = feature_df[feature_names]
    scaled_features = scaler.transform(feature_df)
    
    pred = model.predict(scaled_features)[0]
    proba = model.predict_proba(scaled_features)[0]
    
    # Dataset: 0=phishing, 1=legitimate
    result = "PHISHING" if pred == 0 else "LEGITIMATE"
    confidence = max(proba) * 100
    
    status = "✓" if (pred == 1) else "✗"
    print(f"{status} {url}")
    print(f"   Prediction: {result} ({confidence:.1f}%)")

print('\n' + '=' * 70)
