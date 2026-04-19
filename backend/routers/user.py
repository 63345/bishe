from fastapi import APIRouter, HTTPException
import json
from pydantic import BaseModel
from database import get_user_by_username, get_all_users, create_user, update_user, delete_user

router = APIRouter(prefix="/api/user", tags=["user"])

class LoginRequest(BaseModel):
    username: str
    password: str

@router.post("/login")
async def login(request: LoginRequest):
    user = get_user_by_username(request.username)
    if not user:
        raise HTTPException(status_code=401, detail="用户名或密码错误")
    
    # 简单的密码比对，不再凭名字登录，必须账号密码匹配
    if user["password"] != request.password:
        raise HTTPException(status_code=401, detail="用户名或密码错误")
    
    return {
        "success": True,
        "user": {
            "id": user["id"],
            "username": user["username"],
            "displayName": user["display_name"],
            "role": user["role"],
            "avatar": user["avatar"]
        }
    }

class UserData(BaseModel):
    empNo: str
    account: str
    name: str
    team: str
    phone: str = ""
    status: str = "正常"
    ponds: list = []
    passwordReset: bool = False

@router.get("/list")
async def fetch_users():
    users = get_all_users()
    formatted = []
    for u in users:
        try:
            ponds = json.loads(u.get('ponds') or '[]')
        except:
            ponds = []
        formatted.append({
            "id": u["id"],
            "empNo": u.get("emp_no") or f"EMP{u['id']:03d}",
            "account": u["username"],
            "name": u["display_name"],
            "team": u["role"],
            "ponds": ponds,
            "phone": u.get("phone") or "--",
            "status": u.get("status") or "正常",
            "createdAt": u["created_at"]
        })
    return {"success": True, "data": formatted}

@router.post("/create")
async def api_create_user(request: UserData):
    data = request.dict()
    
    # 后端防重校验
    all_users = get_all_users()
    if any(u.get("username") == data["account"] for u in all_users):
        raise HTTPException(status_code=400, detail="账号名已被占用，请更换")
    if any(u.get("emp_no") == data["empNo"] for u in all_users):
        raise HTTPException(status_code=400, detail="工号已存在，请确认")

    data["ponds_json"] = json.dumps(data.get("ponds", []), ensure_ascii=False)
    create_user(data)
    return {"success": True}

@router.put("/{user_id}")
async def api_update_user(user_id: int, request: UserData):
    data = request.dict()
    
    # 编辑时排查除了自己以外的重复账号
    all_users = get_all_users()
    if any((u.get("id") != user_id) and (u.get("username") == data["account"]) for u in all_users):
        raise HTTPException(status_code=400, detail="新账号名已被其他员工占用")
    if any((u.get("id") != user_id) and (u.get("emp_no") == data["empNo"]) for u in all_users):
        raise HTTPException(status_code=400, detail="新工号已被其他员工占用")
        
    data["ponds_json"] = json.dumps(data.get("ponds", []), ensure_ascii=False)
    update_user(user_id, data)
    return {"success": True}

@router.delete("/{user_id}")
async def api_delete_user(user_id: int):
    delete_user(user_id)
    return {"success": True}
