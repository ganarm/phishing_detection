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
    
    # Detect URL column and label column more robustly.
    url_col = None
    label_col = None
    url_candidates = []
    label_candidates = []
    for col in df.columns:
        lname = col.lower()
        if 'url' in lname or 'link' in lname or 'website' in lname:
            url_candidates.append(col)
        if 'label' in lname or 'phish' in lname or 'type' in lname or 'target' in lname:
            label_candidates.append(col)

    # Prefer exact 'url' column if present (case-insensitive)
    for c in df.columns:
        if c.lower() == 'url':
            url_col = c
            break
    # Otherwise pick the best candidate by inspecting sample values
    if url_col is None and url_candidates:
        for c in url_candidates:
            sample = df[c].dropna().astype(str).head(20).tolist()
            score = sum(1 for s in sample if ('http' in s.lower() or '/' in s or '.' in s))
            if score >= 1:
                url_col = c
                break
        # fallback to first candidate
        if url_col is None:
            url_col = url_candidates[0]

    # Label column: prefer exact 'label', else first candidate
    for c in df.columns:
        if c.lower() == 'label':
            label_col = c
            break
    if label_col is None and label_candidates:
        label_col = label_candidates[0]
    
    if url_col is None:
        raise ValueError("Dataset must contain a column with URL-like values (name containing 'url'/'link' etc.).")
    if label_col is None:
        raise ValueError("Dataset must contain a column with labels (name containing 'label'/'phish' etc.).")
    
    # Rename for consistency
    df = df.rename(columns={url_col: 'URL', label_col: 'label'})
    # Log detected column choices and a small sample to aid debugging
    try:
        sample_vals = df[url_col].dropna().astype(str).head(5).tolist()
    except Exception:
        sample_vals = []
    log_file.write(f"URL column: {url_col}, Label column: {label_col}. Sample URL values: {sample_vals}\n")
    log_file.flush()
    
    # Convert label to binary (0/1)
    # Accept common label formats: 'phishing', 'legitimate', 0/1, True/False
    def _to_binary_label(v):
        if pd.isna(v):
            return 0
        s = str(v).strip().lower()
        if s in ('1', 'true', 'phishing', 'phish'):
            return 1
        if s in ('0', 'false', 'legitimate', 'legit', 'benign', 'ham'):
            return 0
        # try numeric
        try:
            n = float(s)
            return 1 if n == 1 else 0
        except Exception:
            return 0

    df['label'] = df['label'].apply(_to_binary_label)

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

    # Ensure a clean, unique integer index before feature extraction so
    # subsequent concat/align operations don't attempt to reindex with
    # non-unique indexes (which raises the error seen during training).
    df = df.reset_index(drop=True)
    
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
    # Align labels by position rather than by index values to avoid
    # reindexing errors when the original DataFrame had duplicate indices.
    labels = df['label'].reset_index(drop=True)
    result_df = pd.concat([features_df, labels], axis=1)
    log_file.write(f"Feature extraction complete. Final shape: {result_df.shape}\n")
    log_file.flush()
    return result_df
