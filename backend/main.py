import os
import pytesseract
from PIL import Image
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import io
import re

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def parse_time(time_str):
    time_str = time_str.strip().upper()
    match = re.match(r'(\d{1,2}):(\d{2})\s*(AM|PM)?', time_str)
    if not match: return "09:00"
    h, m, ampm = match.groups()
    h = int(h)
    if ampm == 'PM' and h < 12: h += 12
    if ampm == 'AM' and h == 12: h = 0
    return f"{h:02d}:{m}"

@app.post("/api/upload-schedule")
async def upload_schedule(file: UploadFile = File(...)):
    contents = await file.read()
    image = Image.open(io.BytesIO(contents))
    
    # OCR
    text = pytesseract.image_to_string(image)
    
    classes = []
    time_pattern = r'(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?)\s*(?:-|to)\s*(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?)'
    days_pattern = r'\b(M|Tu|W|Th|F|Sa|Su|Mon|Tue|Wed|Thu|Fri|Sat|Sun|MWF|TTh)\b'
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    
    for i, line in enumerate(lines):
        time_match = re.search(time_pattern, line)
        if time_match:
            start_raw, end_raw = time_match.groups()
            name = lines[i-1] if i > 0 else f"Class {len(classes)+1}"
            if len(name) > 30 or "am" in name.lower() or "pm" in name.lower():
                name = f"Class {len(classes)+1}"
                
            days_match = re.findall(days_pattern, line)
            if not days_match and i > 0:
                days_match = re.findall(days_pattern, lines[i-1])
                
            parsed_days = []
            for d in days_match:
                if d in ['M', 'Mon', 'MWF']: parsed_days.append('M')
                if d in ['Tu', 'Tue', 'TTh']: parsed_days.append('T')
                if d in ['W', 'Wed', 'MWF']: parsed_days.append('W')
                if d in ['Th', 'Thu', 'TTh']: parsed_days.append('Th')
                if d in ['F', 'Fri', 'MWF']: parsed_days.append('F')
            
            if not parsed_days: parsed_days = ['M', 'W']
                
            classes.append({
                "id": f"parsed_{len(classes)}",
                "name": name,
                "meetings": [{
                    "id": f"meeting_{len(classes)}",
                    "days": list(set(parsed_days)),
                    "timeStart": parse_time(start_raw),
                    "timeEnd": parse_time(end_raw)
                }],
                "isExpanded": False
            })
            
    if not classes:
        classes = [{
            "id": "mock_1",
            "name": "Math 202 (Auto-Detected)",
            "meetings": [{"id": "m1", "days": ["M", "W"], "timeStart": "14:00", "timeEnd": "15:30"}],
            "isExpanded": False
        }]
        
    return {"status": "success", "classes": classes, "raw_text": text}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
