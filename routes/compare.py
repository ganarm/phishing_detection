from flask import Blueprint, render_template
from services.model_evaluator import compare_models
import pandas as pd

bp = Blueprint('compare', __name__, url_prefix='/compare')

@bp.route('/')
def compare():
    results = compare_models()
    if results is None:
        results = pd.DataFrame()
    best_model = None
    if not results.empty:
        best_model = results.loc[results['Accuracy'].idxmax(), 'Model']
    return render_template('compare.html', results=results.to_dict(orient='records'), best_model=best_model)