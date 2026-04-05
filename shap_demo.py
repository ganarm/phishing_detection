#!/usr/bin/env python3
"""
SHAP Demo Script for Phishing Detection
This script demonstrates how SHAP explanations work with the phishing detection models.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.predictor import predict_url

def demo_shap_explanations():
    """Demonstrate SHAP explanations for different types of URLs"""

    # Test URLs - mix of legitimate and phishing
    test_urls = [
        "https://www.google.com/search?q=python",  # Legitimate
        "https://github.com/microsoft/vscode",     # Legitimate
        "http://paypal-secure-login.com/verify",  # Phishing (suspicious)
        "https://bankofamerica-login.net/account", # Phishing (suspicious)
        "https://www.microsoft.com/en-us/security", # Legitimate
        "http://bit.ly/3abc123",                   # Suspicious (URL shortener)
        "https://login-microsoftonline.com",       # Phishing (typosquatting)
        "http://secure-bank-login.ru/verify",      # Phishing (foreign domain, suspicious)
        "https://paypal.com/cgi-bin/webscr",       # Legitimate PayPal
        "https://evil-site.ru/login?redirect=http://bank.com"  # Phishing (redirect)
    ]

    print("🔍 SHAP Explanation Demo for Phishing Detection")
    print("=" * 60)
    print()

    for i, url in enumerate(test_urls, 1):
        print(f"Test URL {i}: {url}")
        print("-" * 40)

        try:
            # Get prediction with SHAP explanation
            result = predict_url(url, model_name='RandomForest')

            prediction = result['prediction']
            confidence = result.get('confidence', 0)
            shap_data = result.get('shap_explanations', {})

            print(f"Prediction: {prediction}")
            print(f"Confidence: {confidence:.2%}")

            if shap_data and not shap_data.get('error'):
                print("\n📊 SHAP Analysis:")
                print(f"Base Value (Model Average): {shap_data['base_value']:.4f}")
                print(f"Final Prediction Value: {shap_data['prediction_value']:.4f}")

                print("\n🔝 Top 5 Feature Contributions:")
                for j, feature in enumerate(shap_data['top_features'][:5], 1):
                    direction = "→ Phishing" if feature['importance'] > 0 else "→ Legitimate"
                    print(f"{j}. {feature['feature'].replace('_', ' ').title()}: {feature['importance']:.4f} {direction}")

                # Show key insights
                positive_features = [f for f in shap_data['top_features'] if f['importance'] > 0]
                negative_features = [f for f in shap_data['top_features'] if f['importance'] < 0]

                if positive_features:
                    print(f"\n🚨 Strongest phishing indicator: {positive_features[0]['feature'].replace('_', ' ').title()}")
                if negative_features:
                    print(f"✅ Strongest legitimate indicator: {negative_features[0]['feature'].replace('_', ' ').title()}")

            elif shap_data and shap_data.get('error'):
                print(f"❌ SHAP Error: {shap_data['error']}")
            else:
                print("❌ SHAP analysis not available")

        except Exception as e:
            print(f"❌ Error: {str(e)}")

        print("\n" + "=" * 60 + "\n")

if __name__ == "__main__":
    demo_shap_explanations()