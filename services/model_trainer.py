import os
import time
import joblib
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
from .preprocessing import get_train_test_data
from .model_evaluator import evaluate_model

MODELS_DIR = os.path.join(os.path.dirname(__file__), '..', 'models')
os.makedirs(MODELS_DIR, exist_ok=True)

def train_single_model(model_name, log_file):
    log_file.write(f"Starting training for {model_name}...\n")
    log_file.flush()
    
    X_train, X_test, y_train, y_test, scaler, feature_names = get_train_test_data(log_file)
    
    scaler_path = os.path.join(MODELS_DIR, 'scaler.pkl')
    joblib.dump(scaler, scaler_path)
    feature_names_path = os.path.join(MODELS_DIR, 'feature_names.pkl')
    joblib.dump(feature_names, feature_names_path)
    log_file.write("Scaler and feature names saved.\n")
    log_file.flush()
    
    # Model selection
    if model_name == 'LogisticRegression':
        model = LogisticRegression(max_iter=1000, random_state=42)
    elif model_name == 'DecisionTree':
        model = DecisionTreeClassifier(random_state=42)
    elif model_name == 'RandomForest':
        model = RandomForestClassifier(random_state=42, n_estimators=100)
    elif model_name == 'XGBoost':
        model = XGBClassifier(random_state=42, use_label_encoder=False, eval_metric='logloss', verbosity=0)
    else:
        raise ValueError(f"Unknown model: {model_name}")
    
    # Train
    start_time = time.time()
    log_file.write(f"Fitting {model_name}...\n")
    log_file.flush()
    model.fit(X_train, y_train)
    training_time = time.time() - start_time
    log_file.write(f"Training completed in {training_time:.2f} seconds.\n")
    log_file.flush()
    
    # Evaluate
    metrics = evaluate_model(model, X_test, y_test, training_time)
    metrics['Model'] = model_name
    
    # Save model
    model_path = os.path.join(MODELS_DIR, f'{model_name}.pkl')
    joblib.dump(model, model_path)
    log_file.write(f"Model saved to {model_path}\n")
    log_file.flush()
    
    # Save metrics
    metrics_df = pd.DataFrame([metrics])
    metrics_path = os.path.join(MODELS_DIR, 'metrics.csv')
    if os.path.exists(metrics_path):
        existing = pd.read_csv(metrics_path)
        existing = existing[existing['Model'] != model_name]
        metrics_df = pd.concat([existing, metrics_df], ignore_index=True)
    metrics_df.to_csv(metrics_path, index=False)
    log_file.write(f"Metrics saved to {metrics_path}\n")
    log_file.flush()
    
    return metrics

def train_all_models(log_file):
    models = ['LogisticRegression', 'DecisionTree', 'RandomForest', 'XGBoost']
    for model_name in models:
        try:
            train_single_model(model_name, log_file)
        except Exception as e:
            log_file.write(f"Error training {model_name}: {e}\n")
            log_file.flush()