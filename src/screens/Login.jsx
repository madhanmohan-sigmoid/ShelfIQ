import React from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { loginSuccess } from "../redux/reducers/authSlice";
import LogoImg from "../assets/Logo and Title-1.svg";

function Login() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleSSOLogin = (e) => {
    e.preventDefault();
    // Simulate user login with email
    const userData = {
      email: "user@kenvue.com",
      name: "User"
    };
    
    // Dispatch login success with user data
    dispatch(loginSuccess({
      user: userData,
      token: "eererere"
    }));
    
    navigate("/region");
  };

  return (
    <div className="flex h-screen font-sans">
      {/* Left Section - Branding */}
      <div className="w-1/2 bg-[#00A88E] bg-gradient-to-br from-[#00A88E] to-[#018A76] flex items-center justify-center">
        <div className="flex items-center space-x-4">
          <div className="text-white text-4xl font-light tracking-wide">
            <img src={LogoImg} alt="Img" className="h-14"/>
          </div>
        </div>
      </div>

      {/* Right Section - Login Card */}
      <div className="w-1/2 bg-white flex items-center justify-center">
        <div className="w-full max-w-sm p-8 bg-white rounded-lg shadow-xl">
          <h2 className="text-xl font-semibold text-center mb-1">
            Planogram Tool By Kenvue
          </h2>

          {/* Divider */}
          <div className="flex items-center my-5">
            <hr className="flex-grow border-gray-300" />
            <span className="mx-3 text-gray-400 text-sm">OR</span>
            <hr className="flex-grow border-gray-300" />
          </div>

          <button
            onClick={handleSSOLogin}
            className="w-full py-2 border border-gray-300 rounded-md text-[#767676] hover:bg-gray-100 transition text-sm"
          >
            Login with PingID
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;
