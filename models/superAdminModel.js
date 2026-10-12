const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const superAdminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    // Used to receive the forgot-password OTP via SMS
    mobileNumber: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
      match: [/^[0-9]{10}$/, "Please enter a valid 10-digit mobile number"]
    },

    password: {
      type: String,
      required: true,
      select: false
    },

    // Tokens issued before this time are rejected (set on password reset/change)
    passwordChangedAt: {
      type: Date,
      default: null
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Hash password before saving, only when it has been modified
superAdminSchema.pre("save", async function () {
  if (!this.isModified("password") || !this.password) {
    return;
  }
  this.password = await bcrypt.hash(this.password, 10);
  if (!this.isNew) {
    // Back-date by 1s because JWT iat is in whole seconds
    this.passwordChangedAt = new Date(Date.now() - 1000);
  }
});

superAdminSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model(
  "SuperAdmin",
  superAdminSchema
);
