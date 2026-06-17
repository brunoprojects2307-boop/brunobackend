const express = require("express");
const supabase = require("../supabase");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.use(requireAdmin);

router.get("/", async (req, res) => {
  const { search = "", isActive } = req.query;

  let query = supabase
    .from("categories")
    .select("*")
    .order("name", { ascending: true });

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  if (typeof isActive === "string") {
    query = query.eq("is_active", isActive === "true");
  }

  const { data, error } = await query;

  if (error) {
    return res.status(500).json({ message: error.message });
  }

  return res.json(data);
});

router.post("/", async (req, res) => {
  const name = String(req.body.name || "").trim();
  const payload = {
    name,
    is_active: req.body.is_active !== false
  };

  if (!payload.name) {
    return res.status(400).json({ message: "Category name is required" });
  }

  const { data, error } = await supabase
    .from("categories")
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
    return res.status(400).json({ message: "Invalid category id" });
  }

  const updates = {
    name: req.body.name,
    is_active: req.body.is_active
  };

  Object.keys(updates).forEach((key) => {
    if (updates[key] === undefined) {
      delete updates[key];
    }
  });

  if (typeof updates.name === "string") {
    updates.name = updates.name.trim();
  }

  if (updates.name === "") {
    return res.status(400).json({ message: "Category name cannot be empty" });
  }

  const { data, error } = await supabase
    .from("categories")
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
    return res.status(400).json({ message: "Invalid category id" });
  }

  const { data: category, error: categoryError } = await supabase
    .from("categories")
    .select("name")
    .eq("id", id)
    .single();

  if (categoryError) {
    return res.status(404).json({ message: "Category not found" });
  }

  const { count, error: productsError } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("category", category.name);

  if (productsError) {
    return res.status(500).json({ message: productsError.message });
  }

  if ((count || 0) > 0) {
    return res.status(400).json({ message: "Cannot delete category that is used by products" });
  }

  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id);

  if (error) {
    return res.status(500).json({ message: error.message });
  }

  return res.json({ message: "Category deleted" });
});

module.exports = router;
