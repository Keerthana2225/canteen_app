"""
routers/export.py — Excel export endpoint.

GET /feedback/export
  Returns a cleanly styled, professional Excel (.xlsx) report with exact management columns:
  1. Feedback ID
  2. Canteen Name
  3. Meal Type
  4. Food Quality
  5. Food Taste
  6. Food Hygiene
  7. Cleanliness
  8. Today's Menu
  9. Comments
  10. Feedback Date
  11. Submission Time (IST)
  12. Overall Rating
  13. Critical Feedback
"""

import io
from datetime import date, datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from openpyxl import Workbook
from openpyxl.styles import (
    Font, PatternFill, Alignment, Border, Side
)
from openpyxl.cell.cell import ILLEGAL_CHARACTERS_RE

import models
from database import get_db

router = APIRouter(tags=["Export"])

# Indian Standard Time (IST) is UTC + 5 hours 30 minutes
IST_OFFSET = timedelta(hours=5, minutes=30)

# ─── Styling helpers ────────────────────────────────────────
HEADER_FILL   = PatternFill("solid", fgColor="1F4E79")   # Corporate dark blue
HEADER_FONT   = Font(name="Calibri", color="FFFFFF", bold=True, size=11)
ALT_FILL      = PatternFill("solid", fgColor="F2F7FC")   # Subtle soft blue zebra stripe
CRITICAL_FILL = PatternFill("solid", fgColor="FFD8D8")   # Soft red highlight for critical records
THIN_BORDER   = Border(
    left   = Side(style="thin", color="D9D9D9"),
    right  = Side(style="thin", color="D9D9D9"),
    top    = Side(style="thin", color="D9D9D9"),
    bottom = Side(style="thin", color="D9D9D9"),
)
CENTER_ALIGN  = Alignment(horizontal="center", vertical="center")
LEFT_ALIGN    = Alignment(horizontal="left",   vertical="center", wrap_text=True)

# Required column names and their display widths
COLUMNS = [
    ("Feedback ID",           14, CENTER_ALIGN),
    ("Canteen Name",          22, CENTER_ALIGN),
    ("Meal Type",             18, CENTER_ALIGN),
    ("Food Quality",          15, CENTER_ALIGN),
    ("Food Taste",            14, CENTER_ALIGN),
    ("Food Hygiene",          15, CENTER_ALIGN),
    ("Cleanliness",           15, CENTER_ALIGN),
    ("Today's Menu",          16, CENTER_ALIGN),
    ("Comments",              45, LEFT_ALIGN),
    ("Feedback Date",         16, CENTER_ALIGN),
    ("Submission Time (IST)", 24, CENTER_ALIGN),
    ("Overall Rating",        16, CENTER_ALIGN),
    ("Critical Feedback",     18, CENTER_ALIGN),
]


def sanitize_cell_value(val) -> str:
    """Strip XML illegal characters and null bytes to prevent OpenPyXL crashes."""
    if val is None:
        return ""
    return ILLEGAL_CHARACTERS_RE.sub("", str(val)).strip()


@router.get("/feedback/export")
def export_feedback_excel(
    meal_type:    Optional[str]  = Query(None),
    canteen_name: Optional[str]  = Query(None),
    from_date:    Optional[date] = Query(None),
    to_date:      Optional[date] = Query(None),
    db: Session = Depends(get_db),
):
    """
    Export all feedback to a formatted Excel workbook with exact columns in order.
    Timestamps are converted from UTC to Indian Standard Time (IST, UTC+5:30)
    with 12-hour AM/PM formatting.
    """
    # ── Query ────────────────────────────────────────────────
    q = db.query(models.Feedback)
    if meal_type and isinstance(meal_type, str):
        q = q.filter(models.Feedback.meal_type == meal_type)
    if canteen_name and isinstance(canteen_name, str):
        q = q.filter(models.Feedback.canteen_name == canteen_name)
    if from_date and isinstance(from_date, (date, str)):
        q = q.filter(models.Feedback.feedback_date >= from_date)
    if to_date and isinstance(to_date, (date, str)):
        q = q.filter(models.Feedback.feedback_date <= to_date)

    records = q.order_by(models.Feedback.id.desc()).all()

    # ── Workbook ─────────────────────────────────────────────
    wb = Workbook()
    ws = wb.active
    ws.title = "Feedback Report"

    # Title row (Row 1)
    ws.merge_cells("A1:M1")
    title_cell = ws["A1"]
    now_ist = datetime.utcnow() + IST_OFFSET
    title_cell.value     = f"Canteen Feedback Report — Generated on {now_ist.strftime('%d-%m-%Y at %I:%M:%S %p')} IST"
    title_cell.font      = Font(name="Calibri", bold=True, size=13, color="1F4E79")
    title_cell.alignment = CENTER_ALIGN
    ws.row_dimensions[1].height = 30

    # Header row (Row 2)
    for col_idx, (header_text, width, _) in enumerate(COLUMNS, start=1):
        cell = ws.cell(row=2, column=col_idx, value=header_text)
        cell.fill      = HEADER_FILL
        cell.font      = HEADER_FONT
        cell.alignment = CENTER_ALIGN
        cell.border    = THIN_BORDER
        ws.column_dimensions[cell.column_letter].width = width
    ws.row_dimensions[2].height = 24

    # Data rows (starting from Row 3)
    for row_idx, record in enumerate(records, start=3):
        is_critical = (getattr(record, "is_critical", 0) == 1)
        is_alt = (row_idx % 2 == 0)

        if is_critical:
            row_fill = CRITICAL_FILL
        elif is_alt:
            row_fill = ALT_FILL
        else:
            row_fill = PatternFill()

        # Cleanliness mapping (fallback to legacy hospitality)
        cleanliness_val = getattr(record, 'cleanliness', None)
        if cleanliness_val is None:
            cleanliness_val = getattr(record, 'hospitality', None)

        # Today's Menu mapping (fallback to legacy staff_behavior)
        today_menu_val = getattr(record, 'today_menu', None)
        if today_menu_val is None:
            today_menu_val = getattr(record, 'staff_behavior', None)

        # IST timestamp conversion (stored as UTC)
        if record.created_at:
            dt_ist = record.created_at + IST_OFFSET
            date_ist_str = dt_ist.strftime("%d-%m-%Y")
            time_ist_str = dt_ist.strftime("%I:%M:%S %p")
        elif record.feedback_date:
            date_ist_str = record.feedback_date.strftime("%d-%m-%Y")
            time_ist_str = ""
        else:
            date_ist_str = ""
            time_ist_str = ""

        # Overall rating calculation fallback if not stored
        overall_val = record.overall_rating
        if overall_val is None:
            ratings = [record.food_quality, record.food_taste, record.food_hygiene, cleanliness_val, today_menu_val]
            valid_ratings = [r for r in ratings if r is not None and 1 <= r <= 5]
            overall_val = round(sum(valid_ratings) / len(valid_ratings), 1) if valid_ratings else 0.0
        else:
            overall_val = round(float(overall_val), 1)

        values = [
            record.id,
            sanitize_cell_value(record.canteen_name) or "Main Canteen",
            sanitize_cell_value(record.meal_type),
            record.food_quality if record.food_quality is not None else "",
            record.food_taste if record.food_taste is not None else "",
            record.food_hygiene if record.food_hygiene is not None else "",
            cleanliness_val if cleanliness_val is not None else "",
            today_menu_val if today_menu_val is not None else "",
            sanitize_cell_value(record.comments),
            date_ist_str,
            time_ist_str,
            overall_val,
            "Yes" if is_critical else "No",
        ]

        for col_idx, value in enumerate(values, start=1):
            cell = ws.cell(row=row_idx, column=col_idx, value=value)
            cell.border = THIN_BORDER
            cell.fill   = row_fill
            cell.font   = Font(name="Calibri", size=10)
            cell.alignment = COLUMNS[col_idx - 1][2]

            # Format numbers properly
            if col_idx in (4, 5, 6, 7, 8):
                cell.number_format = '0'
            elif col_idx == 12:
                cell.number_format = '0.0'

        ws.row_dimensions[row_idx].height = 20

    # Freeze header rows (Rows 1 & 2 frozen so scrolling keeps headers visible)
    ws.freeze_panes = "A3"

    # Auto-filter enabled on Header Row
    last_row = max(2, len(records) + 2)
    ws.auto_filter.ref = f"A2:M{last_row}"

    # Summary sheet
    ws2 = wb.create_sheet("Summary")
    ws2.column_dimensions["A"].width = 24
    ws2.column_dimensions["B"].width = 30

    ws2["A1"] = "Export Summary"
    ws2["A1"].font = Font(name="Calibri", bold=True, size=13, color="1F4E79")
    ws2["A2"] = "Total Records"
    ws2["B2"] = len(records)
    ws2["A3"] = "Exported On (IST)"
    ws2["B3"] = now_ist.strftime("%d-%m-%Y %I:%M:%S %p")
    ws2["A4"] = "Timezone"
    ws2["B4"] = "Indian Standard Time (IST, UTC+5:30)"

    if meal_type and isinstance(meal_type, str):
        ws2["A5"] = "Meal Filter"
        ws2["B5"] = meal_type
    if canteen_name and isinstance(canteen_name, str):
        ws2["A6"] = "Canteen Filter"
        ws2["B6"] = canteen_name

    # ── Stream response ──────────────────────────────────────
    buffer = io.BytesIO()
    wb.save(buffer)
    buffer.seek(0)
    content = buffer.read()

    filename = f"canteen_feedback_report_{now_ist.strftime('%d-%m-%Y_%H%M')}.xlsx"

    return StreamingResponse(
        io.BytesIO(content),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Content-Length":      str(len(content)),
            "Access-Control-Expose-Headers": "Content-Disposition, Content-Length",
        },
    )

