#!/usr/bin/env python3
"""
Simple test script for the generator service.

Usage examples:
  python3 test_generate.py --mock --mood calm --genre lofi --output tmp/downloaded.mp3
  python3 test_generate.py --host http://localhost:3000 --mood sad --genre pop

Requirements:
  pip install requests
"""

import argparse
import os
import sys
import shutil

try:
    import requests
except Exception:
    print("Missing 'requests' package. Install with: pip install requests")
    sys.exit(1)


def main():
    p = argparse.ArgumentParser(description="Test generator endpoint and save returned audio file")
    p.add_argument('--host', default='http://localhost:3000', help='Base URL of generator server')
    p.add_argument('--mood', default='calm')
    p.add_argument('--genre', default='lofi')
    p.add_argument('--mock', action='store_true', help='Use mock mode (no external API calls)')
    p.add_argument('--output', default='tmp/final_download.mp3', help='Local path to save audio')
    p.add_argument('--timeout', type=int, default=60)

    args = p.parse_args()

    url = f"{args.host.rstrip('/')}/generate"
    params = {}
    headers = {'Content-Type': 'application/json'}
    if args.mock:
        params['mock'] = 'true'
        headers['x-mock'] = '1'

    payload = {'mood': args.mood, 'genre': args.genre}

    print(f"POST {url} (mock={args.mock}) payload={payload}")

    try:
        resp = requests.post(url, headers=headers, params=params, json=payload, timeout=args.timeout)
    except requests.RequestException as e:
        print('Request failed:', e)
        sys.exit(2)

    # If the server returned binary audio (not JSON)
    content_type = resp.headers.get('Content-Type', '')
    if 'application/json' not in content_type:
        if resp.status_code == 200 and resp.content:
            out_dir = os.path.dirname(args.output) or '.'
            os.makedirs(out_dir, exist_ok=True)
            with open(args.output, 'wb') as f:
                f.write(resp.content)
            print('Saved audio to', args.output)
            sys.exit(0)
        else:
            print('Unexpected non-JSON response:', resp.status_code, resp.text)
            sys.exit(3)

    data = resp.json()
    if not data.get('success'):
        print('Server returned error or unexpected JSON:', data)
        sys.exit(4)

    print('\n--- Lyrics ---')
    print(data.get('lyrics', ''), '\n')

    audio_path = data.get('audioFile')
    if not audio_path:
        print('No audioFile field in response; response JSON:', data)
        sys.exit(5)

    # Try to access the returned path locally if possible
    out_dir = os.path.dirname(args.output) or '.'
    os.makedirs(out_dir, exist_ok=True)

    # If audio path is an absolute path on this machine, copy it
    if os.path.isabs(audio_path) and os.path.exists(audio_path):
        shutil.copyfile(audio_path, args.output)
        print('Copied audio from server path to', args.output)
        sys.exit(0)

    # If audio path is relative and exists
    if os.path.exists(audio_path):
        shutil.copyfile(audio_path, args.output)
        print('Copied audio from server path to', args.output)
        sys.exit(0)

    # If audio path is a URL, try to download it
    if audio_path.startswith('http://') or audio_path.startswith('https://'):
        try:
            r = requests.get(audio_path, stream=True, timeout=args.timeout)
            if r.status_code == 200:
                with open(args.output, 'wb') as f:
                    for chunk in r.iter_content(8192):
                        if chunk:
                            f.write(chunk)
                print('Downloaded audio to', args.output)
                sys.exit(0)
            else:
                print('Failed to download audio URL:', r.status_code)
                sys.exit(6)
        except requests.RequestException as e:
            print('Download failed:', e)
            sys.exit(7)

    print('Audio file path returned but not accessible from this script:', audio_path)
    print('If this script runs on the same machine as the server, check the path or run with --mock to create a local test file.')
    sys.exit(8)


if __name__ == '__main__':
    main()
