# Phishing URL Detection and ML Model Comparison

This project is a Flask web application that trains and compares multiple machine learning models (Logistic Regression, Decision Tree, Random Forest, XGBoost) on the PhiUSIIL Phishing URL Dataset. It allows users to test individual URLs or upload a CSV file for bulk prediction.

## Features

- Train individual models or all models at once.
- Compare model performance (accuracy, precision, recall, F1-score, confusion matrix, training time).
- Test a single URL and get prediction with confidence.
- Bulk prediction via CSV upload.

## Requirements

- Python 3.7+
- Install dependencies: `pip install -r requirements.txt`

## Setup

1. Clone the repository.
2. Download the PhiUSIIL Phishing URL Dataset from [UCI Machine Learning Repository](https://archive.ics.uci.edu/ml/datasets/PhiUSIIL+Phishing+URL+Dataset) and place the CSV file in the `data/` folder. Ensure the file is named `phiUSIIL_phishing_urls.csv`.
3. Run the app: `python app.py`
4. Open http://127.0.0.1:5000 in your browser.

## How It Works

- **Data Loading & Feature Extraction:** The dataset is loaded and 15 features are extracted from each URL (length, number of dots, hyphens, digits, HTTPS usage, etc.).
- **Model Training:** Each model is trained on 80% of the data and evaluated on the remaining 20%.
- **Evaluation:** Metrics are stored and displayed on the Compare page.
- **Prediction:** For a new URL, the same features are extracted, scaled using the saved scaler, and fed into the selected model.

## Project Structure

- `app.py`: Flask application entry point.
- `routes/`: Flask route blueprints.
- `services/`: Core logic (data loading, feature extraction, preprocessing, training, evaluation, prediction).
- `models/`: Saved models, scaler, feature names, and metrics.
- `templates/`: HTML files.
- `static/`: CSS styles.
- `data/`: Dataset file.

## Notes

- The dataset must contain a column with 'url' in its name and a column with 'label' or 'phishing' (binary values).
- Training all models may take a few minutes depending on dataset size.
- The bulk prediction endpoint expects a CSV with a column named `url`.