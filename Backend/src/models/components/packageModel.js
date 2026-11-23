import mongoose from "mongoose";

const packageCategorySchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: [true, "Category slug is required"],
      unique: true,
      trim: true,
      lowercase: true,
    },

    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
    },

    description: {
      type: String,
      required: [true, "Category description is required"],
      trim: true,
    },

    icon: {
      type: String,
      required: [true, "Category icon is required"],
      trim: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const PackageCategory = mongoose.model(
  "PackageCategory",
  packageCategorySchema
);

export default PackageCategory;