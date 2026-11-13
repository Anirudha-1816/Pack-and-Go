import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      // lowercase: true,
      // trim: true,
      // maxlength: [50, "Email cannot exceed 50 characters"],
      // match: [
      //   /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      //   "Please enter a valid email address",
      // ],
    },

    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      // minlength: [2, "Full name must be at least 2 characters"],
      // maxlength: [30, "Full name cannot exceed 30 characters"],
      
    },

    gender: {
      type: String,
      required: [true, "Gender is required"],
      // enum: {
      //   values: ["Male", "Female", "Other"],
      //   message: "Please select a valid gender",
      // },
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      // minlength: [8, "Password must be at least 8 characters"],
      // maxlength: [30, "Password cannot exceed 30 characters"],
    },
    role :{
      type : String ,
      default : 'user'

    },
    terms:{
      type : Boolean,
      required: true,
    },
    themePreference: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system'
    }
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

export default User;
