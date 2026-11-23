import hashlib
import secrets
import hmac
from datetime import datetime, timedelta
from typing import Optional

SECRET_KEY = "smart-reconciliation-enterprise-secret-key-2026"
ALGORITHM = "HS256"

def hash_password(password: str) -> str:
    """Generate a secure salted hash for passwords."""
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        100000
    )
    return f"{salt}:{key.hex()}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against salted hash."""
    try:
        salt, key_hex = hashed_password.split(":")
        new_key = hashlib.pbkdf2_hmac(
            'sha256',
            plain_password.encode('utf-8'),
            salt.encode('utf-8'),
            100000
        )
        return hmac.compare_digest(new_key.hex(), key_hex)
    except Exception:
        return False

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a lightweight signed token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(hours=8))
    to_encode["exp"] = expire.timestamp()
    import json
    import base64
    payload_str = json.dumps(to_encode, sort_keys=True)
    payload_b64 = base64.urlsafe_b64encode(payload_str.encode()).decode().rstrip("=")
    sig = hmac.new(SECRET_KEY.encode(), payload_b64.encode(), hashlib.sha256).hexdigest()
    return f"{payload_b64}.{sig}"

def verify_access_token(token: str) -> Optional[dict]:
    """Verify and decode signed token."""
    try:
        parts = token.split(".")
        if len(parts) != 2:
            return None
        payload_b64, sig = parts
        expected_sig = hmac.new(SECRET_KEY.encode(), payload_b64.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(sig, expected_sig):
            return None
        import json
        import base64
        # Add back padding if needed
        padding = 4 - (len(payload_b64) % 4)
        if padding != 4:
            payload_b64 += "=" * padding
        payload_str = base64.urlsafe_b64decode(payload_b64).decode()
        payload = json.loads(payload_str)
        if datetime.utcnow().timestamp() > payload.get("exp", 0):
            return None # Expired
        return payload
    except Exception:
        return None

