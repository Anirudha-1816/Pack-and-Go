import mongoose from "mongoose";

const VALID_ICONS = ["festival", "trip", "adventure", "networking", "social"];

const packageCategorySchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: [true, "Category slug is required"],
      unique: true,
      trim: true,
      lowercase: true,
      immutable: true, // slug doesn't change after creation
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
      enum: {
        values: VALID_ICONS,
        message: "Icon must be one of: festival, trip, adventure, networking, social",
      },
    },

    order: {
      type: Number,
      default: 0,
      min: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Generate slug from name before validation
packageCategorySchema.pre("validate", async function () {
  if (this.isNew && this.name && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
});

const PackageCategory = mongoose.model(
  "PackageCategory",
  packageCategorySchema
);

export default PackageCategory;