const express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const supabase = require("../supabase");
const config = require("../config");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"));
    }
    return cb(null, true);
  }
});

async function convertImageToTargetSize(inputBuffer, targetBytes = 100 * 1024) {
  let width = 1600;
  let quality = 85;
  let output = null;

  for (let attempt = 0; attempt < 12; attempt += 1) {
    // Convert to WebP for better compression and predictable file sizes.
    output = await sharp(inputBuffer)
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality, effort: 4 })
      .toBuffer();

    if (output.length <= targetBytes) {
      return output;
    }

    if (quality > 45) {
      quality -= 8;
    } else if (width > 700) {
      width -= 180;
    } else {
      width = Math.max(480, width - 80);
      quality = Math.max(30, quality - 5);
    }
  }

  return output;
}

router.use(requireAdmin);

router.post("/upload", upload.array("images", 10), async (req, res) => {
  const files = Array.isArray(req.files) ? req.files : [];

  if (!files.length) {
    return res.status(400).json({ message: "Please select at least one image" });
  }

  try {
    const urls = [];

    for (const file of files) {
      const converted = await convertImageToTargetSize(file.buffer);
      const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}.webp`;
      const objectPath = `products/${filename}`;

      const { error: uploadError } = await supabase
        .storage
        .from(config.supabaseStorageBucket)
        .upload(objectPath, converted, {
          cacheControl: "3600",
          contentType: "image/webp",
          upsert: false
        });

      if (uploadError) {
        return res.status(500).json({ message: `Storage upload failed: ${uploadError.message}` });
      }

      const { data: publicUrlData } = supabase
        .storage
        .from(config.supabaseStorageBucket)
        .getPublicUrl(objectPath);

      const publicUrl = publicUrlData?.publicUrl;
      if (!publicUrl) {
        return res.status(500).json({ message: "Could not generate public image URL" });
      }

      urls.push(publicUrl);
    }

    return res.status(201).json({ urls });
  } catch (error) {
    return res.status(500).json({ message: `Image conversion failed: ${error.message}` });
  }
});

router.get("/", async (req, res) => {
  const { search = "", category, isActive } = req.query;

  let query = supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  if (category) {
    query = query.eq("category", category);
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
  const payload = {
    name: String(req.body.name || "").trim(),
    price: Number(req.body.price || 0),
    image: String(req.body.image || "").trim(),
    images: Array.isArray(req.body.images) ? req.body.images : [],
    category: String(req.body.category || "").trim(),
    description: String(req.body.description || "").trim(),
    stock: Number(req.body.stock || 0),
    is_active: req.body.is_active !== false
  };

  if (!payload.name || payload.price <= 0) {
    return res.status(400).json({ message: "Name and valid price are required" });
  }

  if (!payload.image) {
    return res.status(400).json({ message: "A product image is required" });
  }

  const { data, error } = await supabase
    .from("products")
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
    return res.status(400).json({ message: "Invalid product id" });
  }

  const updates = {
    name: req.body.name,
    price: req.body.price,
    image: req.body.image,
    images: req.body.images,
    category: req.body.category,
    description: req.body.description,
    stock: req.body.stock,
    is_active: req.body.is_active
  };

  Object.keys(updates).forEach((key) => {
    if (updates[key] === undefined) {
      delete updates[key];
    }
  });

  if (updates.price !== undefined) {
    updates.price = Number(updates.price);
  }

  if (updates.stock !== undefined) {
    updates.stock = Number(updates.stock);
  }

  if (updates.images !== undefined && !Array.isArray(updates.images)) {
    updates.images = [];
  }

  const { data, error } = await supabase
    .from("products")
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
    return res.status(400).json({ message: "Invalid product id" });
  }

  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", id);

  if (error) {
    return res.status(500).json({ message: error.message });
  }

  return res.json({ message: "Product deleted" });
});

module.exports = router;
