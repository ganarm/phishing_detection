import csv
import io
import json
import os
from datetime import datetime, timezone
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen

import pandas as pd


BASE_DIR = os.path.join(os.path.dirname(__file__), '..')
DATA_DIR = os.path.join(BASE_DIR, 'data')
ENV_PATH = os.path.join(BASE_DIR, '.env')
URLHAUS_SYNC_PATH = os.path.join(DATA_DIR, 'urlhaus_recent.csv')
URLHAUS_STATE_PATH = os.path.join(DATA_DIR, 'urlhaus_sync_state.json')


def _utc_now_iso():
    return datetime.now(timezone.utc).isoformat()


def _load_env_file():
    values = {}
    if not os.path.exists(ENV_PATH):
        return values

    with open(ENV_PATH, 'r', encoding='utf-8') as env_file:
        for raw_line in env_file:
            line = raw_line.strip()
            if not line or line.startswith('#') or '=' not in line:
                continue
            key, value = line.split('=', 1)
            values[key.strip()] = value.strip().strip('"').strip("'")
    return values


def _get_env_value(name, default=''):
    env_values = _load_env_file()
    return os.environ.get(name) or env_values.get(name) or default


def _read_state():
    if not os.path.exists(URLHAUS_STATE_PATH):
        return {
            'source': 'URLhaus',
            'configured': bool(_get_env_value('URLHAUS_AUTH_KEY')),
            'last_sync_at': None,
            'last_sync_status': None,
            'last_sync_message': None,
            'total_rows': 0,
            'last_added_count': 0,
            'last_added_preview_count': 0,
            'latest_rows': [],
        }

    try:
        with open(URLHAUS_STATE_PATH, 'r', encoding='utf-8') as state_file:
            state = json.load(state_file)
    except Exception:
        state = {}

    state.setdefault('source', 'URLhaus')
    state.setdefault('configured', bool(_get_env_value('URLHAUS_AUTH_KEY')))
    state.setdefault('last_sync_at', None)
    state.setdefault('last_sync_status', None)
    state.setdefault('last_sync_message', None)
    state.setdefault('total_rows', 0)
    state.setdefault('last_added_count', 0)
    state.setdefault('last_added_preview_count', len(state.get('latest_rows', [])))
    state.setdefault('latest_rows', [])
    return state


def _write_state(state):
    os.makedirs(DATA_DIR, exist_ok=True)
    with open(URLHAUS_STATE_PATH, 'w', encoding='utf-8') as state_file:
        json.dump(state, state_file, indent=2)


def _fetch_recent_csv(auth_key):
    endpoint = f'https://urlhaus-api.abuse.ch/v2/files/exports/{quote(auth_key)}/recent.csv'
    request = Request(endpoint, headers={'User-Agent': 'PhishingShield/1.0'})
    with urlopen(request, timeout=60) as response:
        return response.read().decode('utf-8', errors='replace')


def _parse_recent_csv(csv_text):
    header_line = None
    cleaned_lines = []
    for line in csv_text.splitlines():
        if not line.strip():
            continue
        stripped = line.lstrip()
        if stripped.startswith('# id,') or stripped.startswith('# "id",'):
            header_line = stripped.lstrip('#').strip()
            continue
        if stripped.startswith('#'):
            continue
        cleaned_lines.append(line)

    if header_line:
        cleaned_lines.insert(0, header_line)

    if len(cleaned_lines) < 2:
        return pd.DataFrame(columns=['URL'])

    reader = csv.DictReader(io.StringIO('\n'.join(cleaned_lines)))
    rows = []
    for row in reader:
        normalized = {str(k).strip(): (v or '').strip() for k, v in row.items() if k is not None}
        url = normalized.get('url') or normalized.get('URL')
        if not url:
            continue
        rows.append({
            'URL': url,
            'label': 0,
            'source': 'URLhaus',
            'threat_type': normalized.get('threat', 'malware'),
            'url_status': normalized.get('url_status', ''),
            'date_added': normalized.get('dateadded', '') or normalized.get('date_added', ''),
            'last_online': normalized.get('lastonline', '') or normalized.get('last_online', ''),
            'host': normalized.get('host', ''),
            'tags': normalized.get('tags', ''),
        })
    return pd.DataFrame(rows)


def _load_existing_synced_urls():
    if not os.path.exists(URLHAUS_SYNC_PATH):
        return pd.DataFrame(columns=['URL', 'label'])
    return pd.read_csv(URLHAUS_SYNC_PATH)


def get_sync_status(limit=100):
    state = _read_state()
    latest_rows = state.get('latest_rows', [])[:limit]
    state['configured'] = bool(_get_env_value('URLHAUS_AUTH_KEY'))
    state['latest_rows'] = latest_rows
    return state


def sync_urlhaus_feed():
    auth_key = _get_env_value('URLHAUS_AUTH_KEY')
    if not auth_key:
        raise ValueError('URLHAUS_AUTH_KEY is missing. Add it to .env before syncing.')

    os.makedirs(DATA_DIR, exist_ok=True)
    existing_df = _load_existing_synced_urls()
    existing_urls = set(existing_df['URL'].astype(str)) if not existing_df.empty and 'URL' in existing_df.columns else set()

    try:
        csv_text = _fetch_recent_csv(auth_key)
    except HTTPError as exc:
        raise RuntimeError(f'URLhaus request failed with HTTP {exc.code}') from exc
    except URLError as exc:
        raise RuntimeError(f'Could not reach URLhaus: {exc.reason}') from exc

    incoming_df = _parse_recent_csv(csv_text)
    if incoming_df.empty:
        state = _read_state()
        state.update({
            'configured': True,
            'last_sync_at': _utc_now_iso(),
            'last_sync_status': 'ok',
            'last_sync_message': 'URLhaus sync completed, but the feed returned no rows.',
            'last_added_count': 0,
            'total_rows': int(len(existing_df)),
            'last_added_preview_count': len(state.get('latest_rows', [])),
        })
        _write_state(state)
        return state

    incoming_df['synced_at'] = _utc_now_iso()
    incoming_df = incoming_df.drop_duplicates(subset=['URL'], keep='first')
    new_rows_df = incoming_df[~incoming_df['URL'].astype(str).isin(existing_urls)].copy()

    merged_df = pd.concat([existing_df, new_rows_df], ignore_index=True)
    if not merged_df.empty:
        merged_df = merged_df.drop_duplicates(subset=['URL'], keep='last')
        merged_df.to_csv(URLHAUS_SYNC_PATH, index=False)

    latest_rows = new_rows_df.head(100).to_dict(orient='records')
    state = _read_state()
    if len(new_rows_df) == 0:
        latest_rows = state.get('latest_rows', [])

    state.update({
        'configured': True,
        'last_sync_at': _utc_now_iso(),
        'last_sync_status': 'ok',
        'last_sync_message': (
            f'Sync completed. Added {len(new_rows_df)} new URLhaus rows.'
            if len(new_rows_df) > 0
            else 'Already up to date. No new URLhaus rows were found since the last sync.'
        ),
        'last_added_count': int(len(new_rows_df)),
        'latest_rows': latest_rows,
        'total_rows': int(len(merged_df)),
        'last_added_preview_count': len(latest_rows),
    })
    _write_state(state)
    return state
