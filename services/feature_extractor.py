import re
from urllib.parse import urlparse

def extract_features(url):
    """Extract a set of numeric features from a URL, ensuring string conversion."""
    url = str(url)  # convert to string to avoid Series issues
    features = {}
    features['url_length'] = len(url)
    features['num_dots'] = url.count('.')
    features['num_hyphens'] = url.count('-')
    features['num_digits'] = sum(c.isdigit() for c in url)
    features['has_https'] = 1 if url.startswith('https') else 0
    parsed = urlparse(url)
    hostname = parsed.hostname or ''
    features['num_subdomains'] = hostname.count('.')
    features['contains_ip'] = 1 if re.search(r'\d+\.\d+\.\d+\.\d+', url) else 0
    features['num_slash'] = url.count('/')
    features['num_question'] = url.count('?')
    features['num_at'] = url.count('@')
    features['num_equal'] = url.count('=')
    features['num_and'] = url.count('&')
    features['num_exclamation'] = url.count('!')
    features['num_tilde'] = url.count('~')
    features['num_comma'] = url.count(',')
    features['num_semicolon'] = url.count(';')
    features['num_hashtag'] = url.count('#')
    return features