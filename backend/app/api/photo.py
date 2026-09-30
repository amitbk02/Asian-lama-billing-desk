from datetime import datetime
from io import BytesIO

from bson import ObjectId
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse

from backend.app.database import problems, db


router = APIRouter(
    prefix="/api/problems",
    tags=["Problem Photos"]
)


ALLOWED_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp"
}


@router.post("/{problem_number}/photos/before")
async def upload_before_photo(
    problem_number: str,
    photo: UploadFile = File(...)
):

    problem = problems.find_one({
        "problem_number": problem_number
    })

    if not problem:
        raise HTTPException(
            status_code=404,
            detail="Problem not found"
        )

    if problem.get("status") == "CLOSED":
        raise HTTPException(
            status_code=400,
            detail="Cannot upload photo for a closed problem"
        )

    if problem.get("status") == "EXPIRED":
        raise HTTPException(
            status_code=400,
            detail="Cannot upload photo for an expired problem"
        )

    photo_data = await photo.read()

    if not photo_data:
        raise HTTPException(
            status_code=400,
            detail="Empty photo file"
        )

    if photo.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Only JPEG, PNG and WEBP images are allowed"
        )

    from gridfs import GridFS

    fs = GridFS(db)

    now = datetime.utcnow()

    file_id = fs.put(
        photo_data,
        filename=photo.filename,
        content_type=photo.content_type,
        problem_number=problem_number,
        photo_type="before",
        uploadedAt=now
    )

    problems.update_one(
        {
            "problem_number": problem_number
        },
        {
            "$set": {
                "before_photo": True,
                "before_photo_file_id": str(file_id),
                "before_photo_filename": photo.filename,
                "before_photo_uploadedAt": now,
                "updatedAt": now
            }
        }
    )

    return {
        "success": True,
        "message": "Before photo uploaded successfully",
        "problem_number": problem_number,
        "photo_type": "before",
        "filename": photo.filename,
        "file_id": str(file_id)
    }


@router.post("/{problem_number}/photos/after")
async def upload_after_photo(
    problem_number: str,
    photo: UploadFile = File(...)
):

    problem = problems.find_one({
        "problem_number": problem_number
    })

    if not problem:
        raise HTTPException(
            status_code=404,
            detail="Problem not found"
        )

    if problem.get("status") != "WIP":
        raise HTTPException(
            status_code=400,
            detail="Problem must be in WIP status before uploading after photo"
        )

    photo_data = await photo.read()

    if not photo_data:
        raise HTTPException(
            status_code=400,
            detail="Empty photo file"
        )

    if photo.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Only JPEG, PNG and WEBP images are allowed"
        )

    from gridfs import GridFS

    fs = GridFS(db)

    now = datetime.utcnow()

    file_id = fs.put(
        photo_data,
        filename=photo.filename,
        content_type=photo.content_type,
        problem_number=problem_number,
        photo_type="after",
        uploadedAt=now
    )

    problems.update_one(
        {
            "problem_number": problem_number
        },
        {
            "$set": {
                "after_photo": True,
                "after_photo_file_id": str(file_id),
                "after_photo_filename": photo.filename,
                "after_photo_uploadedAt": now,
                "updatedAt": now
            }
        }
    )

    return {
        "success": True,
        "message": "After photo uploaded successfully",
        "problem_number": problem_number,
        "photo_type": "after",
        "filename": photo.filename,
        "file_id": str(file_id)
    }


@router.get("/{problem_number}/photos/{photo_type}")
def download_photo(problem_number: str, photo_type: str):

    problem = problems.find_one({"problem_number": problem_number})

    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")

    if photo_type not in ["before", "after"]:
        raise HTTPException(status_code=400, detail="Invalid photo type")

    file_id_field = f"{photo_type}_photo_file_id"
    file_id = problem.get(file_id_field)

    if not file_id:
        raise HTTPException(
            status_code=404,
            detail=f"{photo_type.capitalize()} photo not found"
        )

    from gridfs import GridFS

    fs = GridFS(db)

    try:
        grid_file = fs.get(ObjectId(file_id))
    except Exception:
        raise HTTPException(status_code=404, detail="Photo file not found")

    return StreamingResponse(
        BytesIO(grid_file.read()),
        media_type=grid_file.content_type or "image/jpeg",
        headers={
            "Content-Disposition":
                f'inline; filename="{grid_file.filename}"'
        }
    )








@router.get("/{problem_number}/photos/{photo_type}")
def download_photo(problem_number: str, photo_type: str):

    problem = problems.find_one({"problem_number": problem_number})

    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")

    if photo_type not in ["before", "after"]:
        raise HTTPException(status_code=400, detail="Invalid photo type")

    file_id_field = f"{photo_type}_photo_file_id"
    file_id = problem.get(file_id_field)

    if not file_id:
        raise HTTPException(
            status_code=404,
            detail=f"{photo_type.capitalize()} photo not found"
        )

    from gridfs import GridFS

    fs = GridFS(db)

    try:
        grid_file = fs.get(ObjectId(file_id))
    except Exception:
        raise HTTPException(status_code=404, detail="Photo file not found")

    return StreamingResponse(
        BytesIO(grid_file.read()),
        media_type=grid_file.content_type or "image/jpeg",
        headers={
            "Content-Disposition":
                f'inline; filename="{grid_file.filename}"'
        }
    )
