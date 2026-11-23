import re
from datetime import datetime
from typing import Tuple, Optional, Set

def clean_text(val: Optional[str]) -> str:
    """Trim whitespace and normalize string."""
    if val is None:
        return ""
    return str(val).strip()

def standardize_identifier(raw_id: str) -> Tuple[str, bool, Optional[str]]:
    """
    Standardize record identifiers carefully.
    Handles:
    - REC-1001 -> REC-1001 (standard)
    - rec1034 -> REC-1034 (case/hyphen mismatch)
    - ' REC - 1070 ' -> REC-1070 (whitespace around hyphen)
    - 1112 -> REC-1112 (missing prefix)
    
    Returns:
    (standardized_id, is_malformed, message)
    """
    if not raw_id:
        return "", True, "Empty identifier"
    
    s = str(raw_id).strip()
    original = s
    
    # Check if purely digits (e.g. '1112')
    if re.match(r'^\d+$', s):
        standardized = f"REC-{s}"
        return standardized, True, f"Missing 'REC-' prefix (raw: '{original}')"
    
    # Remove interior spaces
    s_clean = re.sub(r'\s+', '', s).upper()
    
    # Handle 'REC-1234' or 'REC1234'
    match = re.match(r'^REC-?(\d+)$', s_clean)
    if match:
        standardized = f"REC-{match.group(1)}"
        is_malformed = (original != standardized)
        msg = f"Normalized from '{original}'" if is_malformed else None
        return standardized, is_malformed, msg
    
    # If doesn't match standard pattern, return uppercase cleaned
    return s_clean, True, f"Non-standard identifier format: '{original}'"

def parse_numeric(val: any) -> Tuple[Optional[float], bool, Optional[str]]:
    """
    Parses numeric values, handling strings with commas (e.g. '1,25,400.00' or '1,000.50').
    Returns:
    (float_value, has_issue, message)
    """
    if val is None:
        return None, True, "Value is missing/null"
    
    # If already a number
    if isinstance(val, (int, float)):
        import math
        if math.isnan(val):
            return None, True, "Value is NaN"
        return float(val), False, None
    
    s = str(val).strip()
    if not s or s.lower() in ("nan", "null", "none", ""):
        return None, True, "Value is missing/empty"
    
    # Remove commas and spaces
    cleaned = s.replace(",", "").replace(" ", "").replace("$", "")
    try:
        f_val = float(cleaned)
        had_format_issue = ("," in s or " " in s)
        msg = f"Standardized formatted number '{s}'" if had_format_issue else None
        return f_val, had_format_issue, msg
    except ValueError:
        return None, True, f"Invalid numeric format: '{s}'"

def parse_date(date_str: any) -> Tuple[Optional[str], bool, Optional[str]]:
    """
    Standardizes date into YYYY-MM-DD.
    Returns:
    (iso_date, has_issue, message)
    """
    if not date_str:
        return None, True, "Date is empty"
    
    s = str(date_str).strip()
    formats = [
        "%Y-%m-%d",
        "%d-%m-%Y",
        "%m/%d/%Y",
        "%d/%m/%Y",
        "%Y/%m/%d",
        "%Y-%m-%d %H:%M:%S"
    ]
    for fmt in formats:
        try:
            dt = datetime.strptime(s, fmt)
            iso = dt.strftime("%Y-%m-%d")
            had_format_issue = (s != iso)
            msg = f"Normalized date from '{s}'" if had_format_issue else None
            return iso, had_format_issue, msg
        except ValueError:
            continue
    
    return s, True, f"Unrecognized date format: '{s}'"

def validate_location(location_id: str, valid_locations: Set[str]) -> Tuple[bool, Optional[str]]:
    """Check if location_id exists in the master locations dataset."""
    if not location_id:
        return False, "Missing location ID"
    loc = location_id.strip().upper()
    if loc not in valid_locations:
        return False, f"Location '{location_id}' not found in master locations"
    return True, None

