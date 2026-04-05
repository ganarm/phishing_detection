# 🔍 Phishing URL Testing Guide

This guide provides real and realistic phishing URLs for testing the model accuracy and performance.

## ✅ Expected Model Behavior

- **Phishing URLs** (marked with 🚨): Should be detected as **Phishing** by most/all models
- **Legitimate URLs** (marked with ✅): Should be detected as **Legitimate** by most/all models
- **Edge Cases** (marked with ⚠️): May show mixed predictions - good for consensus testing

---

## 🚨 PHISHING URLs (Expected: Phishing Detection)

### Category 1: Brand Impersonation (PayPal, Apple, Amazon, Microsoft)

| URL | Phishing Technique | Expected Result |
|-----|------------------|-----------------|
| `https://login-paypal.com/verify` | Domain Typosquatting (login-paypal instead of paypal) | **Phishing** ✓ |
| `https://paypal-verify.tk/confirm` | TLD Spoofing (.tk domain) | **Phishing** ✓ |
| `http://paypal-secure-login.com/verify` | No HTTPS + Suspicious domain | **Phishing** ✓ |
| `https://confirm-apple-id.com/signin` | Impersonation (.com instead of apple.com) | **Phishing** ✓ |
| `https://apple-id-verification.ru/login` | Foreign TLD + Impersonation | **Phishing** ✓ |
| `https://amazon-account-update.tk/login` | TLD Spoofing (.tk) | **Phishing** ✓ |
| `https://amazon-v3.ru/account-verify` | Foreign domain + impersonation | **Phishing** ✓ |
| `https://microsoft-365-signin.tk/auth` | O365/Microsoft spoofing | **Phishing** ✓ |
| `https://confirm-microsoft-account.xyz/verify` | Unusual TLD (.xyz) | **Phishing** ✓ |

### Category 2: Bank & Financial Institution Phishing

| URL | Phishing Technique | Expected Result |
|-----|------------------|-----------------|
| `https://bankofamerica-login.net/account` | BOA spoofing (.net instead of .com) | **Phishing** ✓ |
| `http://secure-bank-login.ru/verify` | No HTTPS + Russian domain | **Phishing** ✓ |
| `https://chase-online-banking.tk/portal` | TLD Spoofing | **Phishing** ✓ |
| `http://www.mybank.ru/verify-account` | No HTTPS + suspicious domain | **Phishing** ✓ |
| `https://wellsfargo-signin.xyz/login` | Unusual TLD spoofing | **Phishing** ✓ |

### Category 3: URL Shorteners & Suspicious Parameters

| URL | Phishing Technique | Expected Result |
|-----|------------------|-----------------|
| `http://bit.ly/3abc123` | No HTTPS + URL shortener | **Phishing** ✓ |
| `https://tinyurl.com/confirm-account` | URL shortener (higher risk) | **Phishing** ✓ |
| `https://example.com/login?redirect=http://evil.com` | Redirect parameter to phishing | **Phishing** ✓ |

### Category 4: IP-Based URLs & Encryption

| URL | Phishing Technique | Expected Result |
|-----|------------------|-----------------|
| `http://193.168.1.1/confirm` | IP address instead of domain | **Phishing** ✓ |
| `http://192.168.1.1/admin/login` | Private IP address | **Phishing** ✓ |
| `https://123.456.789.012/verify` | Invalid IP format | **Phishing** ✓ |

### Category 5: Encoding & Obfuscation

| URL | Phishing Technique | Expected Result |
|-----|------------------|-----------------|
| `https://googl%65.com` | URL encoding (%65 = 'e') | **Phishing** ✓ |
| `https://p@yp@l.com/verify` | Character substitution | **Phishing** ✓ |
| `https://аррӏе.com/login` | Unicode lookalike | **Phishing** ✓ |

### Category 6: Suspicious Keyword URLs

| URL | Phishing Technique | Expected Result |
|-----|------------------|-----------------|
| `https://login-microsoftonline.com` | Microsoft Online spoofing | **Phishing** ✓ |
| `https://verify-account-now.com` | Urgency + verification demand | **Phishing** ✓ |
| `https://confirm-account-urgently.ru` | Urgency + foreign domain | **Phishing** ✓ |
| `https://update-security-immediately.tk` | Urgency + suspicious TLD | **Phishing** ✓ |

### Category 7: Subdomain Exploitation

| URL | Phishing Technique | Expected Result |
|-----|------------------|-----------------|
| `https://paypal.evil-site.com/verify` | Subdomain confusion | **Phishing** ✓ |
| `https://login.phishing-site.com` | Suspicious subdomain | **Phishing** ✓ |
| `https://admin.attacker.tk/login` | Admin panel spoofing | **Phishing** ✓ |

---

## ✅ LEGITIMATE URLs (Expected: Legitimate Detection)

### Category 1: Major Tech Companies

| URL | Legitimacy Indicator | Expected Result |
|-----|------------------|-----------------|
| `https://www.google.com` | Verified official domain | **Legitimate** ✓ |
| `https://www.apple.com` | Verified official domain | **Legitimate** ✓ |
| `https://www.microsoft.com/en-us` | HTTPS + Official domain | **Legitimate** ✓ |
| `https://github.com/microsoft/vscode` | GitHub official path | **Legitimate** ✓ |
| `https://www.amazon.com/gp/your-account` | HTTPS + Official path | **Legitimate** ✓ |

### Category 2: Financial Institutions (Official)

| URL | Legitimacy Indicator | Expected Result |
|-----|------------------|-----------------|
| `https://www.paypal.com/myaccount` | Official PayPal domain + path | **Legitimate** ✓ |
| `https://www.bankofamerica.com/login` | Official BOA domain | **Legitimate** ✓ |
| `https://www.chase.com/personal` | Official Chase domain | **Legitimate** ✓ |
| `https://www.wellsfargo.com/online` | Official Wells Fargo domain | **Legitimate** ✓ |

### Category 3: Government & Security Sites

| URL | Legitimacy Indicator | Expected Result |
|-----|------------------|-----------------|
| `https://www.fbi.gov` | Government .gov domain | **Legitimate** ✓ |
| `https://www.irs.gov/payments` | Official IRS domain | **Legitimate** ✓ |
| `https://support.apple.com/en-us` | Official support domain | **Legitimate** ✓ |
| `https://support.microsoft.com` | Official support domain | **Legitimate** ✓ |

### Category 4: Educational & Non-Profit

| URL | Legitimacy Indicator | Expected Result |
|-----|------------------|-----------------|
| `https://www.mit.edu` | Educational .edu domain | **Legitimate** ✓ |
| `https://www.stanford.edu/academics` | Educational institution | **Legitimate** ✓ |
| `https://en.wikipedia.org/wiki/Main_Page` | Wikipedia official | **Legitimate** ✓ |

### Category 5: Security & Browser Tools

| URL | Legitimacy Indicator | Expected Result |
|-----|------------------|-----------------|
| `https://www.virustotal.com` | Security company official | **Legitimate** ✓ |
| `https://www.norton.com` | Security vendor official | **Legitimate** ✓ |
| `https://www.kaspersky.com` | Kaspersky official domain | **Legitimate** ✓ |

---

## ⚠️ EDGE CASES (Mixed Predictions Expected)

These URLs may show varying results. Use model consensus for evaluation:

| URL | Reason | Expected Behavior |
|-----|--------|------------------|
| `http://google.com` | HTTP instead of HTTPS | May be flagged (older legitimate sites) |
| `https://subdomain.github.io/page` | GitHub Pages subdomain | Some models may flag (subdomain depth) |
| `https://example.me/verify` | Uncommon TLD (.me) | May be flagged by conservative models |
| `https://bit.ly/3abc123` | URL shortener | High risk; use consensus |
| `https://amazon.cn/products` | Regional domain | May vary by model |

---

## 📊 Testing Strategy

### 1. **Quick Verification Test** (5 minutes)
```
Test these core examples:
1. https://login-paypal.com/verify          (Should be PHISHING)
2. https://www.paypal.com/myaccount         (Should be LEGITIMATE)
3. https://confirm-apple-id.com/signin      (Should be PHISHING)
4. https://www.apple.com                    (Should be LEGITIMATE)
5. https://bankofamerica-login.net/account  (Should be PHISHING)
```

### 2. **Comprehensive Test** (20 minutes)
Test 10-15 URLs from different categories, using **All Models** mode to see consensus.

### 3. **Model Comparison** (30 minutes)
- Test same URL with individual models
- Compare predictions and SHAP explanations
- Identify which features each model weighs differently

### 4. **Edge Case Analysis** (15 minutes)
Test edge cases to understand model behavior on borderline URLs.

---

## 🎯 Success Criteria

✅ **Model Working Correctly if:**
- Phishing URLs are detected as **Phishing** in 75%+ of cases
- Legitimate URLs are detected as **Legitimate** in 95%+ of cases
- High-accuracy models (RandomForest, XGBoost) show strong consensus
- SHAP explanations identify relevant features (domain, HTTPS, special chars)

⚠️ **Investigate if:**
- Legitimate URLs are frequently marked as phishing (False Positives)
- Obvious phishing URLs are marked as legitimate (False Negatives)
- Predictions are wildly inconsistent across models
- SHAP values are all zeros or show no feature importance

---

## 🔧 Tips for Testing

1. **Use All Models Mode**: Click "All Models (Comparison)" to test with all 4 algorithms simultaneously
2. **Check Consensus**: Look at how many models agree on phishing vs. legitimate
3. **Review SHAP Explanations**: Understand which features influenced each decision
4. **Record Results**: Note any false positives/negatives for model improvement
5. **Test Variations**: Slightly modify URLs to see model robustness

---

## 📝 Example Session

```
Test URL: https://login-paypal.com/verify
Test Mode: All Models

Expected Results:
✓ RandomForest: Phishing (95.9%) - HIGH CONFIDENCE
✓ XGBoost: Phishing (95.5%) - HIGH CONFIDENCE
✓ DecisionTree: Phishing (87.3%) - MEDIUM CONFIDENCE
✓ LogisticRegression: Phishing (82.1%) - MEDIUM CONFIDENCE

Consensus: 4/4 models = PHISHING ✓ MODEL WORKING CORRECTLY

SHAP Top Features:
1. Domain 'login-paypal.com' → Phishing indicator
2. URL Length → Phishing indicator
3. No matching legitimate domain → Phishing indicator
```

---

## 🚀 Next Steps

1. Test URLs from the Quick Test buttons on the predict page
2. Switch to "All Models" mode for comprehensive comparison
3. Check SHAP explanations for decision justification
4. Review the Compare page for overall model performance
5. Document any anomalies or interesting cases

**Your app is ready to test! Start with the "Quick Test Examples" buttons on the Predict page.**
