"use client"

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Eye, EyeOff, Mail, Lock, User, UserPlus, LogIn, AlertCircle, CheckCircle, Shield } from "lucide-react"

function Register() {
    const navigate = useNavigate()
    const url = "https://fc79-13-204-45-168.ngrok-free.app/"
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
    })
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    const getPasswordStrength = (password) => {
        if (!password) return { strength: 0, text: "", color: "" }

        let strength = 0
        if (password.length >= 8) strength++
        if (/[A-Z]/.test(password)) strength++
        if (/[a-z]/.test(password)) strength++
        if (/[0-9]/.test(password)) strength++
        if (/[^A-Za-z0-9]/.test(password)) strength++

        const levels = [
            { text: "Very Weak", color: "bg-red-500" },
            { text: "Weak", color: "bg-orange-500" },
            { text: "Fair", color: "bg-yellow-500" },
            { text: "Good", color: "bg-blue-500" },
            { text: "Strong", color: "bg-green-500" },
        ]

        return { strength, ...levels[strength] }
    }

    const passwordStrength = getPasswordStrength(form.password)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError("")
        setSuccess("")

        if (!form.name || !form.email || !form.password || !form.confirmPassword) {
            return setError("All fields are required")
        }

        if (form.password !== form.confirmPassword) {
            return setError("Passwords do not match")
        }

        if (form.password.length < 6) {
            return setError("Password must be at least 6 characters long")
        }

        try {
            setLoading(true)
            const response = await fetch(`${url}users/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: form.name,
                    email: form.email,
                    password: form.password,
                }),
                credentials: 'include',
            })
            const data = await response.json()

            if (data.msg === "user Created successfully") {
                setSuccess("Registration successful!")
                // localStorage.setItem("id", data.id)
                setTimeout(() => navigate("/"), 1500)
            } else {
                setError(data.msg || "Error occurred in creating the user")
            }
        } catch (err) {
            console.log(err)
            setError("Registration failed. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-100 px-4 py-12">
            {/* Background decorations */}
            <div className="absolute inset-0 z-0 overflow-hidden">
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-200 rounded-full opacity-20 blur-3xl"></div>
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-pink-300 rounded-full opacity-20 blur-3xl"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-200 rounded-full opacity-10 blur-3xl"></div>
            </div>

            <div className="w-full max-w-md z-10">
                {/* Logo/Brand */}
                <div className="text-center mb-8 animate-fade-in">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 text-white text-2xl font-bold shadow-lg mb-4 transform hover:scale-105 transition-transform duration-200">
                        <UserPlus size={28} />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Create Account</h1>
                    <p className="text-gray-600">Join us to manage your files securely</p>
                </div>

                {/* Main Card */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden animate-slide-in">
                    {/* Card Header */}
                    <div className="bg-gradient-to-r from-purple-500 to-pink-600 px-6 py-4">
                        <h2 className="text-xl font-bold text-white">Sign Up</h2>
                    </div>

                    {/* Form */}
                    <form className="p-6 space-y-5" onSubmit={handleSubmit}>
                        {/* Name Field */}
                        <div className="space-y-2">
                            <label htmlFor="name" className="text-sm font-medium text-gray-700 block">
                                Full Name
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User size={18} className="text-gray-400" />
                                </div>
                                <input
                                    id="name"
                                    type="text"
                                    name="name"
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-gray-50 text-gray-900 placeholder-gray-500"
                                    placeholder="John Doe"
                                    value={form.name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        {/* Email Field */}
                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-medium text-gray-700 block">
                                Email Address
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail size={18} className="text-gray-400" />
                                </div>
                                <input
                                    id="email"
                                    type="email"
                                    name="email"
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-gray-50 text-gray-900 placeholder-gray-500"
                                    placeholder="you@example.com"
                                    value={form.email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div className="space-y-2">
                            <label htmlFor="password" className="text-sm font-medium text-gray-700 block">
                                Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock size={18} className="text-gray-400" />
                                </div>
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-gray-50 text-gray-900 placeholder-gray-500"
                                    placeholder="••••••••"
                                    value={form.password}
                                    onChange={handleChange}
                                    required
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-gray-100 rounded-r-lg transition-colors duration-200"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <EyeOff size={18} className="text-gray-400 hover:text-gray-600" />
                                    ) : (
                                        <Eye size={18} className="text-gray-400 hover:text-gray-600" />
                                    )}
                                </button>
                            </div>

                            {/* Password Strength Indicator */}
                            {form.password && (
                                <div className="mt-2">
                                    <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                                        <span>Password Strength</span>
                                        <span className="font-medium">{passwordStrength.text}</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                                            style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Confirm Password Field */}
                        <div className="space-y-2">
                            <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 block">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Shield size={18} className="text-gray-400" />
                                </div>
                                <input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    name="confirmPassword"
                                    className={`block w-full pl-10 pr-10 py-3 border rounded-lg focus:ring-2 transition-all duration-200 bg-gray-50 text-gray-900 placeholder-gray-500 ${form.confirmPassword && form.password !== form.confirmPassword
                                        ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                                        : form.confirmPassword && form.password === form.confirmPassword
                                            ? "border-green-300 focus:ring-green-500 focus:border-green-500"
                                            : "border-gray-300 focus:ring-purple-500 focus:border-purple-500"
                                        }`}
                                    placeholder="••••••••"
                                    value={form.confirmPassword}
                                    onChange={handleChange}
                                    required
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-gray-100 rounded-r-lg transition-colors duration-200"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff size={18} className="text-gray-400 hover:text-gray-600" />
                                    ) : (
                                        <Eye size={18} className="text-gray-400 hover:text-gray-600" />
                                    )}
                                </button>
                            </div>
                            {form.confirmPassword && (
                                <div className="flex items-center text-xs mt-1">
                                    {form.password === form.confirmPassword ? (
                                        <div className="flex items-center text-green-600">
                                            <CheckCircle size={14} className="mr-1" />
                                            Passwords match
                                        </div>
                                    ) : (
                                        <div className="flex items-center text-red-600">
                                            <AlertCircle size={14} className="mr-1" />
                                            Passwords don't match
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-start animate-fade-in">
                                <AlertCircle size={20} className="text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                                <p className="text-red-700 text-sm">{error}</p>
                            </div>
                        )}

                        {/* Success Message */}
                        {success && (
                            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-md flex items-start animate-fade-in">
                                <CheckCircle size={20} className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                                <p className="text-green-700 text-sm">{success}</p>
                            </div>
                        )}

                        {/* Terms and Conditions */}
                        <div className="flex items-start">
                            <input
                                id="terms"
                                type="checkbox"
                                className="mt-1 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                                required
                            />
                            <label htmlFor="terms" className="ml-2 text-sm text-gray-600">
                                I agree to the{" "}
                                <Link to="/terms" className="text-purple-600 hover:text-purple-800 hover:underline">
                                    Terms of Service
                                </Link>{" "}
                                and{" "}
                                <Link to="/privacy" className="text-purple-600 hover:text-purple-800 hover:underline">
                                    Privacy Policy
                                </Link>
                            </label>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-white bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200 transform hover:scale-[1.02] ${loading ? "opacity-70 cursor-not-allowed" : ""
                                }`}
                        >
                            {loading ? (
                                <>
                                    <svg
                                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        ></circle>
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        ></path>
                                    </svg>
                                    Creating Account...
                                </>
                            ) : (
                                <>
                                    <UserPlus size={18} className="mr-2" />
                                    Create Account
                                </>
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                        <div className="text-center">
                            <p className="text-sm text-gray-600">
                                Already have an account?{" "}
                                <Link
                                    to="/login"
                                    className="font-medium text-purple-600 hover:text-purple-800 hover:underline transition-all duration-200 inline-flex items-center"
                                >
                                    Sign in
                                    <LogIn size={16} className="ml-1" />
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-8 text-center animate-fade-in">
                    <p className="text-xs text-gray-500">&copy; {new Date().getFullYear()} FileManager. All rights reserved.</p>
                </div>
            </div>
        </div>
    )
}

export default Register
