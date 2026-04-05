import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from .data_loader import load_and_preprocess_dataset

def get_train_test_data(log_file, test_size=0.2, random_state=42):
    log_file.write("Loading and preprocessing data...\n")
    log_file.flush()
    df = load_and_preprocess_dataset(log_file)
    if df.empty:
        raise ValueError("Preprocessed dataset is empty.")
    
    X = df.drop(columns=['label'])
    y = df['label']
    feature_names = X.columns.tolist()
    
    log_file.write(f"Data shape: X={X.shape}, y={y.shape}\n")
    log_file.flush()
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=random_state, stratify=y
    )
    log_file.write(f"Train/test split: {X_train.shape[0]} train, {X_test.shape[0]} test\n")
    log_file.flush()
    
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    return X_train_scaled, X_test_scaled, y_train, y_test, scaler, feature_names