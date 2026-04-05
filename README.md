# Phishing URL Detection — Flask API + React Vite UI

This project now follows an API-based architecture:

- **Backend:** Flask JSON APIs for training, prediction, bulk prediction, and model comparison.
- **Frontend:** React + Vite app that consumes those APIs.

## Architecture

- `app.py`: Flask app factory, CORS-enabled, registers API blueprint.
- `routes/api.py`: All HTTP API endpoints under `/api`.
- `services/`: Model training/prediction/evaluation business logic.
- `frontend/`: React Vite UI.
- `models/`: Saved model artifacts and metrics.
- `data/`: Dataset file.

## API Endpoints

- `GET /api/health`
- `POST /api/predict`
	- body: `{ "url": "https://example.com", "model": "RandomForest", "test_mode": "single|all" }`
- `POST /api/bulk-predict`
	- body: `{ "urls": ["https://a.com", "https://b.com"], "model": "RandomForest" }`
- `POST /api/bulk-predict/file`
	- multipart form-data with `file` (CSV containing `url` column)
- `GET /api/compare`
- `POST /api/train`
	- body: `{ "model_name": "RandomForest|DecisionTree|XGBoost|LogisticRegression|all" }`
- `GET /api/train/status`

## Prerequisites

- Python 3.12+ (or compatible)
- Node.js 18+

## Backend Setup (Flask API)

1. Create and activate virtual environment.
2. Install dependencies from `requirements.txt`.
3. Run Flask app.

```bash
cd /media/harish-kushwah/Harish/phishing_detection
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py
```

Flask API runs at `http://127.0.0.1:5000`.

## Frontend Setup (React Vite)

From a second terminal:

```bash
cd /media/harish-kushwah/Harish/phishing_detection/frontend
npm install
npm run dev
```

React app runs at `http://127.0.0.1:5173` and proxies `/api` to Flask.

## Dataset

Place dataset CSV at:

- `data/phiUSIIL_phishing_urls.csv`

## Notes

- Training can take several minutes depending on dataset size and model choice.
- Existing `templates/` and `static/` are legacy server-rendered UI assets; the active UI is now under `frontend/`.