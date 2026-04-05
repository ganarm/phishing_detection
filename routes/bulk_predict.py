from flask import Blueprint, render_template, request, flash, send_file
from services.predictor import bulk_predict
import pandas as pd
import io

bp = Blueprint('bulk_predict', __name__, url_prefix='/bulk')

@bp.route('/', methods=['GET', 'POST'])
def bulk():
    if request.method == 'POST':
        file = request.files.get('file')
        if not file:
            flash('Please upload a CSV file', 'warning')
            return render_template('bulk_predict.html')
        try:
            df = pd.read_csv(file)
            if 'url' not in df.columns:
                flash('CSV must contain a "url" column', 'danger')
                return render_template('bulk_predict.html')
            results = bulk_predict(df['url'].tolist())
            output = io.BytesIO()
            results.to_csv(output, index=False)
            output.seek(0)
            return send_file(output, mimetype='text/csv', as_attachment=True, download_name='predictions.csv')
        except Exception as e:
            flash(f'Error processing file: {str(e)}', 'danger')
            return render_template('bulk_predict.html')
    return render_template('bulk_predict.html')