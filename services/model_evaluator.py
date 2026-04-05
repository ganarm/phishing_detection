import pandas as pd
import os
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix

MODELS_DIR = os.path.join(os.path.dirname(__file__), '..', 'models')

def evaluate_model(model, X_test, y_test, training_time=0):
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred, average='binary')
    recall = recall_score(y_test, y_pred, average='binary')
    f1 = f1_score(y_test, y_pred, average='binary')
    cm = confusion_matrix(y_test, y_pred)
    cm_str = f"{cm[0][0]}, {cm[0][1]}; {cm[1][0]}, {cm[1][1]}"
    return {
        'Accuracy': accuracy,
        'Precision': precision,
        'Recall': recall,
        'F1 Score': f1,
        'Confusion Matrix': cm_str,
        'Training Time (s)': training_time
    }

def compare_models():
    metrics_path = os.path.join(MODELS_DIR, 'metrics.csv')
    if not os.path.exists(metrics_path):
        return None
    df = pd.read_csv(metrics_path)
    return df