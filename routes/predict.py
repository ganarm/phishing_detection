from flask import Blueprint, render_template, request, flash
from services.predictor import predict_url

bp = Blueprint('predict', __name__, url_prefix='/predict')

@bp.route('/', methods=['GET', 'POST'])
def predict():
    prediction = None
    confidence = None
    shap_explanations = None
    model_name = None
    all_models_results = None
    test_mode = None
    
    if request.method == 'POST':
        url = request.form.get('url')
        model_name = request.form.get('model', 'RandomForest')
        test_mode = request.form.get('test_mode', 'single')  # 'single' or 'all'
        
        if url:
            try:
                if test_mode == 'all':
                    # Test with all models
                    all_models_results = {}
                    model_names = ['RandomForest', 'DecisionTree', 'XGBoost', 'LogisticRegression']
                    
                    for model in model_names:
                        try:
                            result = predict_url(url, model)
                            all_models_results[model] = result
                        except Exception as e:
                            all_models_results[model] = {'error': str(e)}
                    
                    # Use the first successful model as primary result
                    for model, result in all_models_results.items():
                        if 'error' not in result:
                            prediction = result['prediction']
                            confidence = result.get('confidence', None)
                            shap_explanations = result.get('shap_explanations', None)
                            model_name = model
                            break
                else:
                    # Test with single model
                    result = predict_url(url, model_name)
                    prediction = result['prediction']
                    confidence = result.get('confidence', None)
                    shap_explanations = result.get('shap_explanations', None)
            except Exception as e:
                flash(f'Error making prediction: {str(e)}', 'danger')
        else:
            flash('Please enter a URL', 'warning')
    
    return render_template('predict.html',
                         prediction=prediction,
                         confidence=confidence,
                         shap_explanations=shap_explanations,
                         model_name=model_name,
                         all_models_results=all_models_results,
                         test_mode=test_mode)