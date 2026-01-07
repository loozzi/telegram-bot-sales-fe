import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LogIn, Eye, EyeOff, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { authApi } from "../../api";
import { useAuthStore } from "../../store";
import "./Auth.css";

const loginSchema = z.object({
  username: z.string().min(1, "Tên đăng nhập là bắt buộc"),
  password: z.string().min(1, "Mật khẩu là bắt buộc"),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login, setUser } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const response = await authApi.signIn(data);
      if (response.success && response.data) {
        login(response.data);

        // Fetch user profile
        try {
          const profileResponse = await authApi.getMe();
          if (profileResponse.success && profileResponse.data) {
            setUser(profileResponse.data);
          }
        } catch {
          // Continue even if profile fetch fails
        }

        toast.success(t("auth.loginSuccess"));
        navigate("/dashboard");
      } else {
        toast.error(response.error || "Đăng nhập thất bại");
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(
        err.response?.data?.error || "Login failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container animate-slideUp">
        <div className="auth-header">
          <div className="auth-logo">
            <Sparkles size={32} />
          </div>
          <h1 className="auth-title">{t("auth.welcome")}</h1>
          <p className="auth-subtitle">
            Đăng nhập vào tài khoản của bạn để tiếp tục
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label className="form-label">{t("auth.username")}</label>
            <input
              type="text"
              className={`form-input ${errors.username ? "error" : ""}`}
              placeholder={t("auth.username")}
              {...register("username")}
            />
            {errors.username && (
              <span className="form-error">{errors.username.message}</span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                className={`form-input ${errors.password ? "error" : ""}`}
                placeholder="Enter your password"
                {...register("password")}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <span className="form-error">{errors.password.message}</span>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="spinner" />
            ) : (
              <>
                <LogIn size={18} />
                Sign In
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Don't have an account? <Link to="/register">Create one</Link>
          </p>
        </div>
      </div>

      <div className="auth-decoration">
        <div className="decoration-circle circle-1" />
        <div className="decoration-circle circle-2" />
        <div className="decoration-circle circle-3" />
      </div>
    </div>
  );
}
