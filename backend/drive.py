import os
import json
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaInMemoryUpload

SCOPES = ["https://www.googleapis.com/auth/drive.file"]
FOLDER_ID = os.environ.get("GOOGLE_DRIVE_FOLDER_ID", "")


def _service():
    sa_json = os.environ.get("GOOGLE_SERVICE_ACCOUNT_JSON")
    if sa_json:
        info = json.loads(sa_json)
        creds = service_account.Credentials.from_service_account_info(info, scopes=SCOPES)
    else:
        sa_file = os.environ.get("GOOGLE_SERVICE_ACCOUNT_FILE", "service_account.json")
        creds = service_account.Credentials.from_service_account_file(sa_file, scopes=SCOPES)
    return build("drive", "v3", credentials=creds)


def upload_screenshot(content: bytes, filename: str, mime_type: str = "image/jpeg") -> str:
    if not FOLDER_ID:
        raise RuntimeError("GOOGLE_DRIVE_FOLDER_ID is not set")

    svc = _service()
    media = MediaInMemoryUpload(content, mimetype=mime_type, resumable=False)
    file = svc.files().create(
        body={"name": filename, "parents": [FOLDER_ID]},
        media_body=media,
        fields="id",
    ).execute()

    svc.permissions().create(
        fileId=file["id"],
        body={"type": "anyone", "role": "reader"},
    ).execute()

    return f"https://drive.google.com/uc?export=view&id={file['id']}"
