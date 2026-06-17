const express = require("express");
const supabase = require("../supabase");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.use(requireAdmin);

router.get("/", async (_req, res) => {
  const { data, error } = await supabase
    .from("coupons")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return res.status(500).json({ message: error.message });
  }

  return res.json(data);
});

router.post("/", async (req, res) => {
  const code = String(req.body.code || "").trim().toUpperCase();
  const type = req.body.type === "percentage" ? "percentage" : "fixed";
  const value = Number(req.body.value || 0);

  if (!code || value <= 0) {
    return res.status(400).json({ message: "Valid coupon code and value are required" });
  }

  const payload = {
    code,
    type,
    value,
    min_order_amount: Number(req.body.min_order_amount || 0),
    max_discount_amount: Number(req.body.max_discount_amount || 0),
    starts_at: req.body.starts_at || null,
    expires_at: req.body.expires_at || null,
    usage_limit: Number(req.body.usage_limit || 0),
    used_count: Number(req.body.used_count || 0),
    is_active: req.body.is_active !== false
  };

  const { data, error } = await supabase
    .from("coupons")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    return res.status(500).json({ message: error.message });
  }

  return res.status(201).json(data);
});

router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    return res.status(400).json({ message: "Invalid coupon id" });
  }

  const updates = {
    code: typeof req.body.code === "string" ? req.body.code.trim().toUpperCase() : undefined,
    type: req.body.type,
    value: req.body.value,
    min_order_amount: req.body.min_order_amount,
    max_discount_amount: req.body.max_discount_amount,
    starts_at: req.body.starts_at,
    expires_at: req.body.expires_at,
    usage_limit: req.body.usage_limit,
    used_count: req.body.used_count,
    is_active: req.body.is_active
  };

  Object.keys(updates).forEach((key) => {
    if (updates[key] === undefined) {
      delete updates[key];
    }
  });

  ["value", "min_order_amount", "max_discount_amount", "usage_limit", "used_count"].forEach((key) => {
    if (updates[key] !== undefined && updates[key] !== null && updates[key] !== "") {
      updates[key] = Number(updates[key]);
    }
  });

  const { data, error } = await supabase
    .from("coupons")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return res.status(500).json({ message: error.message });
  }

  return res.json(data);
});

router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    return res.status(400).json({ message: "Invalid coupon id" });
  }

  const { error } = await supabase
    .from("coupons")
    .delete()
    .eq("id", id);

  if (error) {
    return res.status(500).json({ message: error.message });
  }

  return res.json({ message: "Coupon deleted" });
});

module.exports = router;
