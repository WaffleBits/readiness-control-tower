# Backend

FastAPI service for synthetic readiness analytics.

## Run

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Test

```bash
python -m unittest discover -s tests
```

