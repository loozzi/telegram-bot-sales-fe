import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UserPlus, Eye, EyeOff, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { authApi } from "../../api";
import { useAuthStore } from "../../store";
import "./Auth.css";

const registerSchema = z
  .object({
    email: z.string().email("Địa chỉ email không hợp lệ"),
    username: z.string().min(3, "Tên đăng nhập phải có ít nhất 3 ký tự"),
    password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu không khớp",
    path: ["confirmPassword"],
  });

type RegisterForm = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login, setUser } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      const response = await authApi.signUp({
        email: data.email,
        username: data.username,
        password: data.password,
      });

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

        toast.success(t("auth.registerSuccess"));
        navigate("/dashboard");
      } else {
        toast.error(response.error || "Đăng ký thất bại");
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(
        err.response?.data?.error || "Registration failed. Please try again."
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
          <h1 className="auth-title">{t("auth.createAccount")}</h1>
          <p className="auth-subtitle">
            Tham gia với chúng tôi và bắt đầu bán hàng ngay hôm nay
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label className="form-label">{t("auth.email")}</label>
            <input
              type="email"
              className={`form-input ${errors.email ? "error" : ""}`}
              placeholder={t("auth.email")}
              {...register("email")}
            />
            {errors.email && (
              <span className="form-error">{errors.email.message}</span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              type="text"
              className={`form-input ${errors.username ? "error" : ""}`}
              placeholder="Choose a username"
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
                placeholder="Create a password"
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

          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input
              type="password"
              className={`form-input ${errors.confirmPassword ? "error" : ""}`}
              placeholder="Confirm your password"
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <span className="form-error">
                {errors.confirmPassword.message}
              </span>
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
                <UserPlus size={18} />
                Create Account
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account? <Link to="/login">Sign in</Link>
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
