

# Video nền toàn trang Dashboard

## Cách hoạt động
- Thêm thẻ `<video>` fixed phía sau toàn bộ nội dung Dashboard, tự động loop, muted, autoplay
- Có thanh **Slider** chỉnh opacity (0% → 100%) nằm ở góc, để bạn test mức độ mờ phù hợp
- Mặc định opacity ~20% để nội dung vẫn đọc được
- Video URL tạm thời dùng placeholder, bạn sẽ upload video sau

## Thay đổi

### `src/pages/Dashboard.tsx`
- Thêm state `videoOpacity` (mặc định 0.2)
- Thêm thẻ `<video>` với `position: fixed`, `z-index: 0`, cover toàn màn hình, `opacity` theo state
- Thêm overlay tối mờ phía trên video để đảm bảo chữ đọc được
- Thêm floating control nhỏ (Slider) ở góc dưới phải để chỉnh opacity realtime
- Wrap nội dung hiện tại trong `relative z-10` để nằm trên video

### Không cần migration hay thay đổi backend

