import pandas as pd
import os
from .feature_extractor import extract_features

def load_and_preprocess_dataset(log_file):
    data_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'phiUSIIL_phishing_urls.csv')
    supplemental_data_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'urlhaus_recent.csv')
    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Dataset not found at {data_path}. Please download the PhiUSIIL dataset and place it there.")
    
    log_file.write("Loading dataset...\n")
    log_file.flush()
    df = pd.read_csv(data_path)
    log_file.write(f"Dataset loaded. Shape: {df.shape}\n")
    log_file.flush()
    
    # Detect URL column and label column
    url_col = None
    label_col = None
    for col in df.columns:
        if 'url' in col.lower():
            url_col = col
        if 'label' in col.lower() or 'phishing' in col.lower() or 'type' in col.lower():
            label_col = col
    
    if url_col is None:
        raise ValueError("Dataset must contain a column with 'url' in its name.")
    if label_col is None:
        raise ValueError("Dataset must contain a column with 'label' or 'phishing' in its name.")
    
    # Rename for consistency
    df = df.rename(columns={url_col: 'URL', label_col: 'label'})
    log_file.write(f"URL column: {url_col}, Label column: {label_col}\n")
    log_file.flush()
    
    # Convert label to binary (0/1)
    if df['label'].dtype == 'object':
        df['label'] = df['label'].map(lambda x: 1 if str(x).lower() in ['phishing', '1', 'true'] else 0)

    if os.path.exists(supplemental_data_path):
        supplemental_df = pd.read_csv(supplemental_data_path)
        if not supplemental_df.empty and {'URL', 'label'}.issubset(supplemental_df.columns):
            supplemental_df = supplemental_df[['URL', 'label']].copy()
            df = pd.concat([df[['URL', 'label']], supplemental_df], ignore_index=True)
            df = df.drop_duplicates(subset=['URL'], keep='last')
            log_file.write(
                f"Supplemental URLhaus rows merged: {len(supplemental_df)}. "
                f"Combined dataset size: {len(df)}\n"
            )
            log_file.flush()
    
    # Extract features
    log_file.write("Extracting features from URLs...\n")
    log_file.flush()
    features_list = []
    for idx, row in df.iterrows():
        url = row['URL']
        features = extract_features(url)
        features_list.append(features)
        if idx % 5000 == 0:
            log_file.write(f"Processed {idx} rows...\n")
            log_file.flush()
    
    features_df = pd.DataFrame(features_list)
    result_df = pd.concat([features_df, df['label']], axis=1)
    log_file.write(f"Feature extraction complete. Final shape: {result_df.shape}\n")
    log_file.flush()
    return result_df
