const express = require("express");
const supabase = require("../supabase");

const router = express.Router();

router.get("/products", async (_req, res) => {
  const { data, error } = await supabase
    .from("products")
    .select("id,name,price,image,images,category,description,stock,is_active,created_at")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    return res.status(500).json({ message: error.message });
  }

  return res.json(data || []);
});

router.get("/categories", async (_req, res) => {
  const [{ data: categories, error: categoriesError }, { data: products, error: productsError }] = await Promise.all([
    supabase
      .from("categories")
      .select("name")
      .eq("is_active", true)
      .order("name", { ascending: true }),
    supabase
      .from("products")
      .select("category,image,images")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
  ]);

  if (categoriesError) {
    return res.status(500).json({ message: categoriesError.message });
  }

  if (productsError) {
    return res.status(500).json({ message: productsError.message });
  }

  const iconByCategory = new Map();
  (products || []).forEach((item) => {
    if (iconByCategory.has(item.category)) {
      return;
    }

    const firstImage = item.image || (Array.isArray(item.images) ? item.images[0] : "");
    iconByCategory.set(item.category, firstImage || "");
  });

  const rows = (categories || []).map((category) => ({
    name: category.name,
    icon: iconByCategory.get(category.name) || ""
  }));

  return res.json(rows);
});

module.exports = router;
