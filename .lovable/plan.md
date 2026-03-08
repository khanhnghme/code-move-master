

## Plan: Thêm chức năng "Rời khỏi dự án"

### Tổng quan
Cho phép thành viên tự rời khỏi project, nhưng **chỉ trong vòng 48 giờ** kể từ khi tham gia. Sau 48h, nút rời sẽ bị vô hiệu hóa với thông báo giải thích.

### Quy tắc
- Trưởng nhóm (group creator) **không được phép** rời
- Thành viên chỉ có thể tự rời trong 48h đầu (dựa trên `joined_at` trong `group_members`)
- Sau 48h, hiển thị thông báo "Đã quá thời hạn 48 giờ, liên hệ trưởng nhóm để được xóa"
- Áp dụng cho mọi cách tham gia (mã code, được thêm thủ công, v.v.)

### Thay đổi

**1. Database Migration** -- Thêm RLS policy cho phép thành viên tự xóa mình trong 48h:
```sql
CREATE POLICY "Members can leave within 48h"
ON public.group_members
FOR DELETE
TO authenticated
USING (
  user_id = auth.uid()
  AND joined_at > (now() - interval '48 hours')
  AND user_id != (SELECT created_by FROM public.groups WHERE id = group_id)
);
```

**2. `MemberManagementCard.tsx`** -- Thêm nút "Rời project" cho thành viên hiện tại:
- Thêm state `isLeaving` và dialog xác nhận rời
- Tính toán `canLeave`: user hiện tại, không phải creator, joined_at < 48h
- Hiển thị nút "Rời khỏi project" (icon `LogOut`) trong danh sách thành viên, chỉ cho row của chính mình
- Nếu quá 48h: hiển thị tooltip/thông báo "Đã quá 48 giờ, không thể tự rời"
- Sau khi rời thành công: toast + navigate về Dashboard

**3. UI Flow:**
- Nút "Rời project" màu destructive, nằm ở row của thành viên hiện tại
- AlertDialog xác nhận: "Bạn có chắc muốn rời khỏi project này?"
- Hiển thị thời gian còn lại có thể rời (VD: "Còn 12 giờ để có thể tự rời")
- Ghi activity log khi rời

