const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const SuperAdmin = require("../../models/superAdminModel");
const LaboratoryOwner = require("../../models/laboratoryOwner");
const OtpVerification = require("../../models/otpVerification");
const { sendResponse } = require("../../utils/sendResponse");
const { getDateRangeFromFilter } = require("../../utils/dateFilter");
const { sendOtpSms, verifyOtpDB } = require("../../services/smsService");
const {
  getLabsDb,
  getLabByIdDb,
  getLabCountsDb,
  getOverallCountsDb,
  getLabWiseBookingsDb,
  createLabDb,
  updateLabStatusDb
} = require("../../services/superAdminService");

const MIN_PASSWORD_LENGTH = 8;

function serverError(req, res, label, error) {
  console.error(`${label}:`, error);
  return sendResponse(req, res, 500, {
    success: false,
    message: "Internal server error",
    error: error.message
  });
}

function invalidLabId(req, res) {
  return sendResponse(req, res, 400, {
    success: false,
    message: "Invalid lab id"
  });
}

// ===================== Auth =====================

const loginSuperAdmin = async (req, res) => {
  try {

    const { email, password } = req.body;

    if (!email || !password) {
      return sendResponse(req, res, 400, {
        success: false,
        message: "Email and password are required"
      });
    }

    const admin = await SuperAdmin.findOne({
      email: email.toLowerCase()
    }).select("+password");

    if (!admin || !(await admin.comparePassword(password))) {
      return sendResponse(req, res, 401, {
        success: false,
        message: "Invalid email or password"
      });
    }

    if (!admin.isActive) {
      return sendResponse(req, res, 403, {
        success: false,
        message: "Super Admin account is inactive"
      });
    }

    const token = jwt.sign(
      {
        superAdminId: admin._id,
        role: "SUPER_ADMIN"
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d"
      }
    );

    return sendResponse(req, res, 200, {
      success: true,
      message: "Login successful",
      data: {
        token,
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: "SUPER_ADMIN"
        }
      }
    });

  } catch (error) {
    console.log("Super Admin Login Error:", error)
    return serverError(req, res, "Super Admin Login Error", error);
  }
};

async function createSuperAdmin(req, res) {
  try {
    const { name, email, mobileNumber, password } = req.body;

    if (!name || !email || !mobileNumber || !password) {
      return sendResponse(req, res, 400, {
        success: false,
        message: "Name, email, mobileNumber and password are required"
      });
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      return sendResponse(req, res, 400, {
        success: false,
        message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
      });
    }

    const existing = await SuperAdmin.findOne({
      $or: [{ email: email.toLowerCase() }, { mobileNumber }]
    });

    if (existing) {
      return sendResponse(req, res, 400, {
        success: false,
        message: "Super admin with this email or mobile number already exists"
      });
    }

    // Password is hashed by the pre-save hook
    const admin = await SuperAdmin.create({ name, email, mobileNumber, password });

    return sendResponse(req, res, 201, {
      success: true,
      message: "Super admin created successfully",
      data: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        mobileNumber: admin.mobileNumber,
        role: "SUPER_ADMIN"
      }
    });

  } catch (error) {
    if (error.name === "ValidationError") {
      return sendResponse(req, res, 400, {
        success: false,
        message: Object.values(error.errors).map(e => e.message).join(", ")
      });
    }
    if (error.code === 11000) {
      return sendResponse(req, res, 400, {
        success: false,
        message: "Super admin with this email or mobile number already exists"
      });
    }
    return serverError(req, res, "Super Admin Create Error", error);
  }
}

// Public bootstrap: only allowed while no super admin exists yet
const registerFirstSuperAdmin = async (req, res) => {
  try {
    const count = await SuperAdmin.countDocuments({});
    if (count > 0) {
      return sendResponse(req, res, 403, {
        success: false,
        message: "Super admin already exists. Login and use /admins to add more."
      });
    }
    return createSuperAdmin(req, res);
  } catch (error) {
    return serverError(req, res, "Super Admin Register Error", error);
  }
};

const getProfile = async (req, res) => {
  const admin = req.superAdmin;
  return sendResponse(req, res, 200, {
    success: true,
    data: {
      id: admin._id,
      name: admin.name,
      email: admin.email,
      mobileNumber: admin.mobileNumber,
      role: "SUPER_ADMIN"
    }
  });
};

// Step 1: send OTP to the super admin's registered mobile number
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return sendResponse(req, res, 400, {
        success: false,
        message: "Email is required"
      });
    }

    const admin = await SuperAdmin.findOne({
      email: email.toLowerCase(),
      isActive: true
    });

    // Same response whether or not the account exists, so emails can't be probed
    const genericResponse = {
      success: true,
      message: "If an account exists, an OTP has been sent to the registered mobile number"
    };

    if (!admin || !admin.mobileNumber) {
      return sendResponse(req, res, 200, genericResponse);
    }

    const smsResult = await sendOtpSms(admin.mobileNumber);
    if (!smsResult.success) {
      console.error("Super Admin OTP SMS failed:", smsResult.error);
      return sendResponse(req, res, 500, {
        success: false,
        message: "Failed to send OTP, please try again"
      });
    }

    return sendResponse(req, res, 200, genericResponse);

  } catch (error) {
    return serverError(req, res, "Super Admin Forgot Password Error", error);
  }
};

// Step 2 (optional, for UI): check the OTP before showing the new-password form
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return sendResponse(req, res, 400, {
        success: false,
        message: "Email and OTP are required"
      });
    }

    const admin = await SuperAdmin.findOne({
      email: email.toLowerCase(),
      isActive: true
    });

    if (!admin || !admin.mobileNumber) {
      return sendResponse(req, res, 400, {
        success: false,
        message: "Invalid OTP"
      });
    }

    const otpResult = await verifyOtpDB(admin.mobileNumber, String(otp));
    return sendResponse(req, res, otpResult.status ? 200 : 400, {
      success: otpResult.status,
      message: otpResult.message
    });

  } catch (error) {
    return serverError(req, res, "Super Admin Verify OTP Error", error);
  }
};

// Step 3: verify OTP and set the new password
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return sendResponse(req, res, 400, {
        success: false,
        message: "Email, OTP and new password are required"
      });
    }

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      return sendResponse(req, res, 400, {
        success: false,
        message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
      });
    }

    const admin = await SuperAdmin.findOne({
      email: email.toLowerCase(),
      isActive: true
    });

    if (!admin || !admin.mobileNumber) {
      return sendResponse(req, res, 400, {
        success: false,
        message: "Invalid OTP"
      });
    }

    const otpResult = await verifyOtpDB(admin.mobileNumber, String(otp));
    if (!otpResult.status) {
      return sendResponse(req, res, 400, {
        success: false,
        message: otpResult.message
      });
    }

    admin.password = newPassword;
    await admin.save();

    // OTP is single-use
    await OtpVerification.deleteOne({ mobileNumber: admin.mobileNumber });

    return sendResponse(req, res, 200, {
      success: true,
      message: "Password reset successful"
    });

  } catch (error) {
    return serverError(req, res, "Super Admin Reset Password Error", error);
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return sendResponse(req, res, 400, {
        success: false,
        message: "Current password and new password are required"
      });
    }

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      return sendResponse(req, res, 400, {
        success: false,
        message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
      });
    }

    const admin = await SuperAdmin.findById(req.superAdminId).select("+password");
    if (!admin || !(await admin.comparePassword(currentPassword))) {
      return sendResponse(req, res, 401, {
        success: false,
        message: "Current password is incorrect"
      });
    }

    admin.password = newPassword;
    await admin.save();

    return sendResponse(req, res, 200, {
      success: true,
      message: "Password updated successfully, please login again"
    });

  } catch (error) {
    return serverError(req, res, "Super Admin Change Password Error", error);
  }
};

// ===================== Labs =====================

const getLabs = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
    const { search, status } = req.query;

    const result = await getLabsDb({ page, limit, search, status });

    return sendResponse(req, res, 200, {
      success: true,
      data: result
    });

  } catch (error) {
    return serverError(req, res, "Super Admin Get Labs Error", error);
  }
};

const getLabDetails = async (req, res) => {
  try {
    const { labId } = req.params;
    if (!mongoose.isValidObjectId(labId)) return invalidLabId(req, res);

    const lab = await getLabByIdDb(labId);
    if (!lab) {
      return sendResponse(req, res, 404, {
        success: false,
        message: "Lab not found"
      });
    }

    const dateRange = getDateRangeFromFilter(req.query.filter);
    const counts = await getLabCountsDb(lab._id, dateRange);

    return sendResponse(req, res, 200, {
      success: true,
      data: { lab, counts }
    });

  } catch (error) {
    return serverError(req, res, "Super Admin Get Lab Details Error", error);
  }
};

const getLabCounts = async (req, res) => {
  try {
    const { labId } = req.params;
    if (!mongoose.isValidObjectId(labId)) return invalidLabId(req, res);

    const exists = await LaboratoryOwner.exists({ _id: labId });
    if (!exists) {
      return sendResponse(req, res, 404, {
        success: false,
        message: "Lab not found"
      });
    }

    const dateRange = getDateRangeFromFilter(req.query.filter);
    const counts = await getLabCountsDb(new mongoose.Types.ObjectId(labId), dateRange);

    return sendResponse(req, res, 200, {
      success: true,
      data: counts
    });

  } catch (error) {
    return serverError(req, res, "Super Admin Get Lab Counts Error", error);
  }
};

const addLab = async (req, res) => {
  try {
    const { labName, ownerName, mobileNumber, labMobileNumber, email, password, isActive } = req.body;

    if (!labName || !ownerName || !mobileNumber || !labMobileNumber || !email || !password) {
      return sendResponse(req, res, 400, {
        success: false,
        message: "labName, ownerName, mobileNumber, labMobileNumber, email and password are required"
      });
    }

    const existingLab = await LaboratoryOwner.findOne({
      $or: [{ email: email.toLowerCase() }, { mobileNumber }]
    });

    if (existingLab) {
      return sendResponse(req, res, 400, {
        success: false,
        message: "Lab with this email or mobile number already exists"
      });
    }

    const lab = await createLabDb({
      labName,
      ownerName,
      mobileNumber,
      labMobileNumber,
      email,
      password,
      isActive: typeof isActive === "boolean" ? isActive : true
    });

    return sendResponse(req, res, 201, {
      success: true,
      message: "Lab registered successfully",
      data: {
        id: lab._id,
        labName: lab.labName,
        ownerName: lab.ownerName,
        mobileNumber: lab.mobileNumber,
        labMobileNumber: lab.labMobileNumber,
        email: lab.email,
        isActive: lab.isActive,
        createdAt: lab.createdAt
      }
    });

  } catch (error) {
    if (error.name === "ValidationError") {
      return sendResponse(req, res, 400, {
        success: false,
        message: Object.values(error.errors).map(e => e.message).join(", ")
      });
    }
    if (error.code === 11000) {
      return sendResponse(req, res, 400, {
        success: false,
        message: "Lab with this email or mobile number already exists"
      });
    }
    return serverError(req, res, "Super Admin Add Lab Error", error);
  }
};

const updateLabStatus = async (req, res) => {
  try {
    const { labId } = req.params;
    const { isActive } = req.body;
    console.log("updateLabStatus called with labId:", labId, "isActive:", isActive);

    if (!mongoose.isValidObjectId(labId)) return invalidLabId(req, res);

    if (typeof isActive !== "boolean") {
      return sendResponse(req, res, 400, {
        success: false,
        message: "isActive (true/false) is required"
      });
    }

    const lab = await updateLabStatusDb(labId, isActive);
    if (!lab) {
      return sendResponse(req, res, 404, {
        success: false,
        message: "Lab not found"
      });
    }

    return sendResponse(req, res, 200, {
      success: true,
      message: isActive ? "Lab activated successfully" : "Lab deactivated successfully",
      data: lab
    });

  } catch (error) {
    return serverError(req, res, "Super Admin Update Lab Status Error", error);
  }
};

// ===================== Dashboard =====================

const getDashboardCounts = async (req, res) => {
  try {
    const dateRange = getDateRangeFromFilter(req.query.filter);
    const counts = await getOverallCountsDb(dateRange);

    return sendResponse(req, res, 200, {
      success: true,
      data: counts
    });

  } catch (error) {
    return serverError(req, res, "Super Admin Dashboard Counts Error", error);
  }
};

const getLabWiseBookings = async (req, res) => {
  try {
    const dateRange = getDateRangeFromFilter(req.query.filter);
    const result = await getLabWiseBookingsDb(dateRange);

    return sendResponse(req, res, 200, {
      success: true,
      data: result
    });

  } catch (error) {
    return serverError(req, res, "Super Admin Lab Wise Bookings Error", error);
  }
};

module.exports = {
  loginSuperAdmin,
  registerFirstSuperAdmin,
  createSuperAdmin,
  getProfile,
  forgotPassword,
  verifyOtp,
  resetPassword,
  changePassword,
  getLabs,
  getLabDetails,
  getLabCounts,
  addLab,
  updateLabStatus,
  getDashboardCounts,
  getLabWiseBookings
};
