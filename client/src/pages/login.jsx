"use client"

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Eye, EyeOff, Mail, Lock, LogIn, UserPlus, AlertCircle } from "lucide-react"

function Login() {
    const url = "https://fc79-13-204-45-168.ngrok-free.app/"
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError("")

        if (!email || !password) {
            return setError("Please fill in all fields")
        }

        try {
            setLoading(true)
            const response = await fetch(`${url}users/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password }),
                credentials: 'include',
            })
            const data = await response.json()

            if (data.msg !== "User loged in Successfully") {
                setError(data.msg)
            } else {
                // localStorage.setItem("id", data.id)
                navigate("/")
            }
        } catch (err) {
            console.log(err)
            setError("Login failed. Try again.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-12">
            <div className="absolute inset-0 z-0 overflow-hidden">
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-200 rounded-full opacity-20 blur-3xl"></div>
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-300 rounded-full opacity-20 blur-3xl"></div>
            </div>

            <div className="w-full max-w-md z-10">
                {/* Logo/Brand */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-2xl font-bold shadow-lg mb-4">
                        <LogIn size={28} />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800">Welcome Back</h1>
                    <p className="text-gray-600 mt-2">Sign in to access your account</p>
                </div>

                {/* Card */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    {/* Form Header */}
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4">
                        <h2 className="text-xl font-bold text-white">Account Login</h2>
                    </div>

                    {/* Form */}
                    <form className="p-6 space-y-6" onSubmit={handleSubmit}>
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
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 text-gray-900"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
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
                                    className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 text-gray-900"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <EyeOff size={18} className="text-gray-400 hover:text-gray-600" />
                                    ) : (
                                        <Eye size={18} className="text-gray-400 hover:text-gray-600" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-start">
                                <AlertCircle size={20} className="text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                                <p className="text-red-700 text-sm">{error}</p>
                            </div>
                        )}

                        {/* Forgot Password */}
                        <div className="flex justify-end">
                            <Link
                                to="/forgot-password"
                                className="text-sm text-blue-600 hover:text-blue-800 hover:underline transition-all duration-200"
                            >
                                Forgot your password?
                            </Link>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
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
                                    Signing in...
                                </>
                            ) : (
                                <>
                                    <LogIn size={18} className="mr-2" />
                                    Sign In
                                </>
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                        <div className="text-center">
                            <p className="text-sm text-gray-600">
                                Don't have an account?{" "}
                                <Link
                                    to="/register"
                                    className="font-medium text-blue-600 hover:text-blue-800 hover:underline transition-all duration-200 inline-flex items-center"
                                >
                                    Create account
                                    <UserPlus size={16} className="ml-1" />
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-8 text-center">
                    <p className="text-xs text-gray-500">&copy; {new Date().getFullYear()} FileManager. All rights reserved.</p>
                </div>
            </div>
        </div>
    )
}

export default Login
