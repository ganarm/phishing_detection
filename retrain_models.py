#!/usr/bin/env python3
"""
Retrain models using ONLY the 17 features that can be extracted from URLs
This fixes the feature mismatch issue
"""

import pandas as pd
import os
import joblib
import time
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
from services.feature_extractor import extract_features
from services.model_evaluator import evaluate_model

MODELS_DIR = 'models'

print('='*70)
print('MODEL RETRAINING WITH CORRECT FEATURES')
print('='*70)

# Load the dataset
data_path = os.path.join('data', 'phiUSIIL_phishing_urls.csv')
print(f'\n📂 Loading dataset from: {data_path}')
df = pd.read_csv(data_path)
print(f'   Dataset shape: {df.shape}')
print(f'   Label distribution: {df["label"].value_counts().to_dict()}')

# Extract features using the same feature_extractor used in production
print('\n🔧 Extracting features from URLs...')
print('   (Using only the 17 features that match feature_extractor.py)')

features_list = []
for idx, url in enumerate(df['URL']):
    features = extract_features(url)
    features_list.append(features)
    
    if (idx + 1) % 50000 == 0:
        print(f'   ✓ Processed {idx + 1}/{len(df)} URLs')

features_df = pd.DataFrame(features_list)
print(f'\n✓ Extracted features shape: {features_df.shape}')
print(f'  Features: {features_df.columns.tolist()}')

# Combine with labels
X = features_df
y = df['label']

print(f'\n📊 Data prepared:')
print(f'   Features: {X.shape}')
print(f'   Labels: {y.shape}')
print(f'   Label distribution: {y.value_counts().to_dict()}')

# Split data
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

print(f'\n✂️  Train/test split:')
print(f'   Train: {X_train.shape}')
print(f'   Test: {X_test.shape}')

# Scale data
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

print(f'\n📈 Data scaled with StandardScaler')

# Save scaler and feature names
feature_names = features_df.columns.tolist()
joblib.dump(scaler, os.path.join(MODELS_DIR, 'scaler.pkl'))
joblib.dump(feature_names, os.path.join(MODELS_DIR, 'feature_names.pkl'))
print(f'   Scaler saved')
print(f'   Feature names saved: {feature_names}')

# Train all models
models_config = {
    'LogisticRegression': LogisticRegression(max_iter=1000, random_state=42),
    'DecisionTree': DecisionTreeClassifier(random_state=42),
    'RandomForest': RandomForestClassifier(random_state=42, n_estimators=100, n_jobs=-1),
    'XGBoost': XGBClassifier(random_state=42, use_label_encoder=False, eval_metric='logloss', verbosity=0, n_jobs=-1)
}

metrics_list = []

print(f'\n🚀 Training models...')
print('='*70)

for model_name, model in models_config.items():
    print(f'\n🤖 Training {model_name}...')
    
    start_time = time.time()
    model.fit(X_train_scaled, y_train)
    training_time = time.time() - start_time
    
    print(f'   ✓ Training completed in {training_time:.2f}s')
    
    # Evaluate
    metrics = evaluate_model(model, X_test_scaled, y_test, training_time)
    metrics['Model'] = model_name
    metrics_list.append(metrics)
    
    print(f'   Accuracy: {metrics["Accuracy"]:.4f}')
    print(f'   Precision: {metrics["Precision"]:.4f}')
    print(f'   Recall: {metrics["Recall"]:.4f}')
    print(f'   F1 Score: {metrics["F1 Score"]:.4f}')
    
    # Save model
    model_path = os.path.join(MODELS_DIR, f'{model_name}.pkl')
    joblib.dump(model, model_path)
    print(f'   ✓ Saved to {model_path}')

# Save metrics
metrics_df = pd.DataFrame(metrics_list)
metrics_path = os.path.join(MODELS_DIR, 'metrics.csv')
metrics_df.to_csv(metrics_path, index=False)
print(f'\n📊 Metrics saved to {metrics_path}')

print('\n✅ All models retrained with correct features!')
print('='*70)
