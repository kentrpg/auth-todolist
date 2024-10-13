# To Do List

API串接 | 註冊登入 | 新增刪除代辦

![](https://i.imgur.com/bNoDJYO.png)

## 使用技術

> 套件
  * 串接 API axios 
  * 彈跳視窗 Sweet Alert2 

> JS 優化
  * change event → 替代 click event

> API
  * GET: /check → 權限測試 
  * POST: /users/sign_in → 使用者登入
  * DELETE: /users/sign_out → 使用者登出
  * POST: /users → 使用者註冊
  * GET: /todos → 取得 TODO 列表 
  * POST: /todos → 新增 TODO
  * PUT: /todos/{id} → TODO 修改
  * DELETE: /todos/{id} → TODO 刪除
  * PATCH: /todos/{id}/toggle → TODO check 狀態切換

資料庫為練習使用，所有資料將於每日23:59清空
API 來源：五倍紅寶石
設計稿來源：六角學院