import { toast } from "sonner";

/** Toast helpers — copy VI ngắn, dùng nhất quán trên app. */
export const notify = {
  success: (message: string) => toast.success(message),
  error: (message: string) => toast.error(message),
  warning: (message: string) => toast.warning(message),
  info: (message: string) => toast.message(message),
  saved: (entity = "Đã lưu") => toast.success(entity),
  deleted: (entity = "Đã xóa") => toast.success(entity),
  fromError: (e: unknown, fallback = "Có lỗi xảy ra") =>
    toast.error(e instanceof Error ? e.message : fallback),
};
