"""Publish pipeline helper: create the GitHub repo and store the Netlify
deploy secrets so every push to main ships the site via GitHub Actions.

Secrets are read from local config and written with the GitHub API using
libsodium sealed boxes — no secret value is ever printed or committed.

Usage:  python tools/publish_github.py
"""
import base64
import json
import os
import sys
import urllib.error
import urllib.request

OWNER = "MdSadman20040812"
REPO = "portfolio-3d"
SITE_ID = "dadfe760-a608-4ae7-bfd5-01040accc4f0"  # mdsadman-portfolio-3d
DESC = (
    "Generative 3D portfolio — WebGL flow-field background, three.js particle "
    "field, force-simulated skill constellation and an interactive Collatz oracle."
)
TOKEN_FILE = r"C:/Users/binma/.github/token"
NETLIFY_CFGS = [
    r"C:/Users/binma/AppData/Roaming/netlify/Config/config.json",
    r"C:/Users/binma/.netlify/config.json",
]


def api(path, data=None, method=None):
    body = json.dumps(data).encode() if data is not None else None
    req = urllib.request.Request(
        "https://api.github.com" + path,
        data=body,
        method=method or ("POST" if body else "GET"),
        headers={
            "Authorization": "Bearer " + open(TOKEN_FILE).read().strip(),
            "User-Agent": "hermes",
            "Accept": "application/vnd.github+json",
            "Content-Type": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req) as r:
            return r.status, json.load(r)
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()[:400]


def find_token(node):
    if isinstance(node, dict):
        for k, v in node.items():
            if k == "token" and isinstance(v, str) and len(v) > 20:
                return v
            t = find_token(v)
            if t:
                return t
    return None


def main():
    # 1 — repository
    st, res = api(
        "/user/repos",
        {"name": REPO, "description": DESC, "private": False, "has_issues": True, "has_wiki": False},
    )
    if st == 201:
        print("repo created:", res["full_name"], res["html_url"])
    elif st == 422:
        print("repo already exists (continuing)")
    else:
        print("repo create failed:", st, res)
        return 1

    # 2 — netlify access token from the CLI config
    ntok = None
    for p in NETLIFY_CFGS:
        if os.path.exists(p):
            ntok = find_token(json.load(open(p)))
            if ntok:
                print("netlify credential read from", os.path.basename(os.path.dirname(p)))
                break
    if not ntok:
        print("no netlify token found — push the repo, then set the secrets manually")
        return 2

    # 3 — repo secrets (encrypted client-side)
    from nacl import encoding, public

    st, key = api(f"/repos/{OWNER}/{REPO}/actions/secrets/public-key")
    if st != 200:
        print("public key fetch failed:", st, key)
        return 3
    pk = public.PublicKey(key["key"].encode(), encoding.Base64Encoder())

    def put_secret(name, value):
        sealed = public.SealedBox(pk).encrypt(value.encode())
        s, _ = api(
            f"/repos/{OWNER}/{REPO}/actions/secrets/{name}",
            {"encrypted_value": base64.b64encode(sealed).decode(), "key_id": key["key_id"]},
            method="PUT",
        )
        print(f"secret {name}: {'set' if s in (201, 204) else 'FAILED ' + str(s)}")

    put_secret("NETLIFY_AUTH_TOKEN", ntok)
    put_secret("NETLIFY_SITE_ID", SITE_ID)
    return 0


if __name__ == "__main__":
    sys.exit(main())
