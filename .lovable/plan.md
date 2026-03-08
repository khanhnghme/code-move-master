

# Chức năng Mã tham gia Project (Join Code) - 4 số

## Tổng quan
Mỗi project có mã tham gia 4 chữ số (0000-9999). Thành viên nhập mã tại Dashboard để tự tham gia. Trưởng nhóm bật/tắt tính năng này trong Settings.

## 1. Database Migration

Thêm 2 cột vào bảng `groups`:
- `join_code` (text, nullable, unique) — mã 4 chữ số
- `allow_join_by_code` (boolean, default false)

Thêm RLS policy trên `group_members` cho phép authenticated user tự INSERT khi group có `allow_join_by_code = true`.

Thêm RLS policy trên `groups` cho phép authenticated user SELECT theo `join_code` (để validate mã).

```sql
ALTER TABLE public.groups ADD COLUMN join_code text UNIQUE;
ALTER TABLE public.groups ADD COLUMN allow_join_by_code boolean DEFAULT false;

-- Policy: user can join group by code
CREATE POLICY "Users can join groups by code"
ON public.group_members FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.groups g
    WHERE g.id = group_members.group_id
    AND g.allow_join_by_code = true
    AND g.join_code IS NOT NULL
  )
);

-- Policy: authenticated users can lookup groups by join_code
CREATE POLICY "Users can lookup groups by join code"
ON public.groups FOR SELECT TO authenticated
USING (allow_join_by_code = true AND join_code IS NOT NULL);
```

## 2. Settings — ShareSettingsCard.tsx

Thêm section "Mã tham gia" trong card cài đặt chia sẻ:
- Toggle "Cho phép tham gia bằng mã"
- Khi bật: tạo mã 4 số ngẫu nhiên, hiển thị mã + nút Copy + nút Tạo lại
- Khi tắt: xóa mã, ẩn phần hiển thị mã

## 3. Dashboard — Dashboard.tsx

Thêm nút "Nhập mã tham gia" trong khu vực Stats (cạnh card Projects):
- Click mở Dialog nhập mã 4 số
- Validate: tìm group có `join_code` khớp + `allow_join_by_code = true`
- Kiểm tra đã là thành viên chưa
- Insert vào `group_members` với role `member`
- Ghi activity log + toast thành công + refresh danh sách projects

## 4. Tạo component JoinByCodeDialog

Component dialog riêng với:
- Input 4 ký tự số (maxLength=4, pattern số)
- Nút "Tham gia"
- Xử lý lỗi: mã không tồn tại, đã là thành viên, mã bị tắt

## Các file cần thay đổi
1. **Migration SQL** — thêm cột + RLS policies
2. **`src/components/ShareSettingsCard.tsx`** — thêm toggle + hiển thị mã
3. **`src/pages/Dashboard.tsx`** — thêm nút nhập mã
4. **`src/components/JoinByCodeDialog.tsx`** — component dialog mới

