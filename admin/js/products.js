const { api, setMessage, toNumber, ensureSession, bindLogout, bindAdminMenu } = globalThis.adminCommon;

const productForm = document.getElementById("productForm");
const productMessage = document.getElementById("productMessage");
const productsTableBody = document.getElementById("productsTableBody");
const productImagesInput = document.getElementById("productImages");
const productImagesPreview = document.getElementById("productImagesPreview");
const productCategorySelect = document.getElementById("productCategory");
const productOutOfStock = document.getElementById("productOutOfStock");
const productSearchInput = document.getElementById("productSearch");
const previewProductBtn = document.getElementById("previewProductBtn");
const productPreviewModal = document.getElementById("productPreviewModal");
const closePreviewBtn = document.getElementById("closePreviewBtn");
const previewProductImage = document.getElementById("previewProductImage");
const previewProductName = document.getElementById("previewProductName");
const previewProductPrice = document.getElementById("previewProductPrice");
const previewProductDescription = document.getElementById("previewProductDescription");
const previewProductCategory = document.getElementById("previewProductCategory");
const previewProductStock = document.getElementById("previewProductStock");
const previewProductActive = document.getElementById("previewProductActive");
const previewProductThumbs = document.getElementById("previewProductThumbs");

let activePreviewBlobUrls = [];
let allProducts = [];

function cleanupPreviewBlobUrls() {
  activePreviewBlobUrls.forEach((url) => URL.revokeObjectURL(url));
  activePreviewBlobUrls = [];
}

function parseJsonArray(value) {
  try {
    const data = JSON.parse(value);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.warn("Invalid product images JSON", error.message);
    return [];
  }
}

function renderImagePreview(urls) {
  productImagesPreview.innerHTML = urls
    .map((url) => `<img class="preview-tile" src="${url}" alt="Product image preview">`)
    .join("");
}

function renderLocalFilePreview(files) {
  productImagesPreview.innerHTML = "";
  files.forEach((file) => {
    const img = document.createElement("img");
    img.className = "preview-tile";
    img.alt = file.name;
    img.src = URL.createObjectURL(file);
    img.onload = () => URL.revokeObjectURL(img.src);
    productImagesPreview.appendChild(img);
  });
}

async function uploadProductImages(files) {
  const formData = new FormData();
  files.forEach((file) => formData.append("images", file));

  const result = await api("/products/upload", {
    method: "POST",
    body: formData
  });

  return Array.isArray(result.urls) ? result.urls : [];
}

function clearProductForm() {
  productForm.reset();
  document.getElementById("productId").value = "";
  document.getElementById("productCurrentImage").value = "";
  document.getElementById("productCurrentImages").value = "[]";
  document.getElementById("productActive").checked = true;
  productCategorySelect.value = "";
  productOutOfStock.checked = false;
  renderImagePreview([]);
}

function renderCategoryOptions(categories, selectedValue = "") {
  const options = [
    '<option value="">Select category</option>',
    ...categories.map((category) => `<option value="${category.name}">${category.name}</option>`)
  ];

  productCategorySelect.innerHTML = options.join("");
  if (selectedValue) {
    const hasOption = categories.some((category) => category.name === selectedValue);
    if (hasOption) {
      productCategorySelect.value = selectedValue;
    }
  }
}

async function loadCategories(selectedValue = "") {
  const categories = await api("/categories?isActive=true", { method: "GET" });
  renderCategoryOptions(categories, selectedValue);
  return categories;
}

function getPreviewImageSource() {
  const selectedFiles = Array.from(productImagesInput.files || []);
  if (selectedFiles.length) {
    return URL.createObjectURL(selectedFiles[0]);
  }

  const existingImage = document.getElementById("productCurrentImage").value;
  if (existingImage) {
    return existingImage;
  }

  const existingImages = parseJsonArray(document.getElementById("productCurrentImages").value);
  return existingImages[0] || "";
}

function getAllPreviewImageSources() {
  const selectedFiles = Array.from(productImagesInput.files || []);
  if (selectedFiles.length) {
    return selectedFiles.map((file) => URL.createObjectURL(file));
  }

  const existingImages = parseJsonArray(document.getElementById("productCurrentImages").value);
  if (existingImages.length) {
    return existingImages;
  }

  const existingImage = document.getElementById("productCurrentImage").value;
  return existingImage ? [existingImage] : [];
}

function renderPreviewThumbs(imageSources) {
  previewProductThumbs.innerHTML = "";
  imageSources.forEach((src, index) => {
    const thumb = document.createElement("button");
    thumb.type = "button";
    thumb.className = `thumbnail ${index === 0 ? "active" : ""}`;
    thumb.setAttribute("aria-label", `Preview image ${index + 1}`);

    const img = document.createElement("img");
    img.src = src;
    img.alt = `Preview thumbnail ${index + 1}`;
    thumb.appendChild(img);

    thumb.addEventListener("click", () => {
      previewProductImage.src = src;
      previewProductThumbs.querySelectorAll(".thumbnail").forEach((item) => {
        item.classList.remove("active");
      });
      thumb.classList.add("active");
    });
    previewProductThumbs.appendChild(thumb);
  });
}

function openProductPreview() {
  cleanupPreviewBlobUrls();

  const name = document.getElementById("productName").value.trim() || "Untitled Product";
  const price = toNumber(document.getElementById("productPrice").value, 0);
  const category = document.getElementById("productCategory").value.trim() || "Uncategorized";
  const stock = productOutOfStock.checked ? 0 : 1;
  const description = document.getElementById("productDescription").value.trim() || "No description provided.";
  const isActive = document.getElementById("productActive").checked;
  const imageSources = getAllPreviewImageSources();
  activePreviewBlobUrls = imageSources.filter((src) => src.startsWith("blob:"));
  const imageSource = imageSources[0] || getPreviewImageSource();

  previewProductName.textContent = name;
  previewProductPrice.textContent = `Rs ${Number(price).toLocaleString()}`;
  previewProductDescription.textContent = description;
  previewProductCategory.textContent = category;
  previewProductStock.textContent = stock > 0 ? "In Stock" : "Out of Stock";
  previewProductStock.className = `badge ${stock > 0 ? "active" : "inactive"}`;
  previewProductActive.textContent = isActive ? "Active" : "Inactive";
  previewProductActive.className = `badge ${isActive ? "active" : "inactive"}`;

  if (imageSource) {
    previewProductImage.src = imageSource;
  } else {
    previewProductImage.src = "https://via.placeholder.com/600x600?text=No+Image";
  }

  renderPreviewThumbs(imageSources);

  if (typeof productPreviewModal.showModal === "function") {
    productPreviewModal.showModal();
  } else {
    productPreviewModal.setAttribute("open", "true");
  }
}

function closeProductPreview() {
  cleanupPreviewBlobUrls();
  previewProductThumbs.innerHTML = "";

  if (typeof productPreviewModal.close === "function") {
    productPreviewModal.close();
  } else {
    productPreviewModal.removeAttribute("open");
  }
}

async function loadProducts() {
  allProducts = await api("/products", { method: "GET" });
  renderProducts(allProducts);
}

function renderProducts(products) {
  productsTableBody.innerHTML = products
    .map((product) => {
      const safeImage = product.image || (Array.isArray(product.images) ? product.images[0] : "");
      const isOutOfStock = Number(product.stock || 0) <= 0;
      return `
        <article class="product-card-admin">
          <div class="product-image-wrap-admin">
            <img class="product-image-admin" src="${safeImage}" alt="${product.name}">
          </div>
          <div class="product-info-admin">
            <h3 class="product-name-admin">${product.name}</h3>
            <p class="product-price-admin">Rs ${Number(product.price).toLocaleString()}</p>
            <p class="product-meta-admin">${product.category} | ${isOutOfStock ? "Out of Stock" : "In Stock"}</p>
            <div class="product-tags-admin">
              <span class="product-tag">#${product.id}</span>
              <span class="product-tag ${isOutOfStock ? "inactive" : "active"}">${isOutOfStock ? "Out of Stock" : "In Stock"}</span>
              <span class="product-tag ${product.is_active ? "active" : "inactive"}">${product.is_active ? "Active" : "Inactive"}</span>
            </div>
            <div class="product-actions-admin">
              <button type="button" class="btn btn-outline" onclick='editProduct(${JSON.stringify(product).replaceAll("'", "&#39;")})'>Edit</button>
              <button type="button" class="btn btn-outline" onclick="toggleProductStock(${product.id}, ${isOutOfStock ? "false" : "true"})">${isOutOfStock ? "Mark In Stock" : "Mark Out"}</button>
              <button type="button" class="btn btn-danger" onclick="deleteProduct(${product.id})">Delete</button>
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

globalThis.editProduct = function editProduct(product) {
  let previewImages = [];
  if (Array.isArray(product.images) && product.images.length) {
    previewImages = product.images;
  } else if (product.image) {
    previewImages = [product.image];
  }

  document.getElementById("productId").value = product.id;
  document.getElementById("productCurrentImage").value = product.image || "";
  document.getElementById("productCurrentImages").value = JSON.stringify(Array.isArray(product.images) ? product.images : []);
  document.getElementById("productName").value = product.name || "";
  document.getElementById("productPrice").value = product.price || 0;
  if (product.category) {
    const hasCategory = Array.from(productCategorySelect.options).some((option) => option.value === product.category);
    if (!hasCategory) {
      const customOption = document.createElement("option");
      customOption.value = product.category;
      customOption.textContent = `${product.category} (inactive/unlisted)`;
      productCategorySelect.appendChild(customOption);
    }
    productCategorySelect.value = product.category;
  } else {
    productCategorySelect.value = "";
  }
  productImagesInput.value = "";
  renderImagePreview(previewImages);
  document.getElementById("productDescription").value = product.description || "";
  productOutOfStock.checked = Number(product.stock || 0) <= 0;
  document.getElementById("productActive").checked = Boolean(product.is_active);
};

globalThis.toggleProductStock = async function toggleProductStock(id, shouldMarkOut) {
  try {
    await api(`/products/${id}`, {
      method: "PUT",
      body: JSON.stringify({ stock: shouldMarkOut ? 0 : 1 })
    });
    setMessage(productMessage, shouldMarkOut ? "Marked as out of stock" : "Marked as in stock", "success");
    await loadProducts();
  } catch (error) {
    setMessage(productMessage, error.message, "error");
  }
};

globalThis.deleteProduct = async function deleteProduct(id) {
  if (!confirm("Delete this product?")) {
    return;
  }

  try {
    await api(`/products/${id}`, { method: "DELETE" });
    setMessage(productMessage, "Product deleted", "success");
    await loadProducts();
  } catch (error) {
    setMessage(productMessage, error.message, "error");
  }
};

productImagesInput.addEventListener("change", () => {
  const files = Array.from(productImagesInput.files || []);
  if (!files.length) {
    const existing = parseJsonArray(document.getElementById("productCurrentImages").value);
    renderImagePreview(existing);
    return;
  }

  renderLocalFilePreview(files);
});

previewProductBtn.addEventListener("click", openProductPreview);
closePreviewBtn.addEventListener("click", closeProductPreview);
productPreviewModal.addEventListener("click", (event) => {
  if (event.target === productPreviewModal) {
    closeProductPreview();
  }
});

document.getElementById("clearProductForm").addEventListener("click", clearProductForm);
document.getElementById("refreshProducts").addEventListener("click", () => loadProducts());

productForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const id = document.getElementById("productId").value;
  const selectedFiles = Array.from(productImagesInput.files || []);
  const existingImage = document.getElementById("productCurrentImage").value;
  const existingImages = parseJsonArray(document.getElementById("productCurrentImages").value);

  let uploadedUrls = [];
  if (selectedFiles.length) {
    try {
      uploadedUrls = await uploadProductImages(selectedFiles);
    } catch (error) {
      setMessage(productMessage, error.message || "Image upload failed", "error");
      return;
    }
  }

  const finalImages = uploadedUrls.length
    ? Array.from(new Set([...(existingImages || []), ...uploadedUrls]))
    : existingImages;
  const finalImage = finalImages[0] || existingImage;

  if (!finalImage) {
    setMessage(productMessage, "Please upload at least one image", "error");
    return;
  }

  const payload = {
    name: document.getElementById("productName").value.trim(),
    price: toNumber(document.getElementById("productPrice").value, 0),
    category: productCategorySelect.value,
    image: finalImage,
    images: finalImages,
    description: document.getElementById("productDescription").value.trim(),
    stock: productOutOfStock.checked ? 0 : 1,
    is_active: document.getElementById("productActive").checked
  };

  try {
    if (id) {
      await api(`/products/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });
      setMessage(productMessage, "Product updated", "success");
    } else {
      await api("/products", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      setMessage(productMessage, "Product created", "success");
    }

    clearProductForm();
    await loadProducts();
  } catch (error) {
    setMessage(productMessage, error.message, "error");
  }
});

await ensureSession();
bindLogout();
bindAdminMenu();
await loadCategories();
await loadProducts();

productSearchInput.addEventListener("input", () => {
  const q = productSearchInput.value.trim().toLowerCase();
  if (!q) {
    renderProducts(allProducts);
    return;
  }

  const filtered = allProducts.filter((product) => {
    return (
      String(product.name || "").toLowerCase().includes(q)
      || String(product.category || "").toLowerCase().includes(q)
    );
  });

  renderProducts(filtered);
});
