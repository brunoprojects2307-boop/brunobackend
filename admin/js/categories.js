const { api, setMessage, ensureSession, bindLogout, bindAdminMenu } = globalThis.adminCommon;

const categoryForm = document.getElementById("categoryForm");
const categoryMessage = document.getElementById("categoryMessage");
const categoriesTableBody = document.getElementById("categoriesTableBody");

function clearCategoryForm() {
  categoryForm.reset();
  document.getElementById("categoryId").value = "";
  document.getElementById("categoryActive").checked = true;
}

async function loadCategories() {
  const categories = await api("/categories", { method: "GET" });

  categoriesTableBody.innerHTML = categories
    .map((category) => {
      return `
      <tr>
        <td data-label="ID">${category.id}</td>
        <td data-label="Name">${category.name}</td>
        <td data-label="Active">${category.is_active ? "Yes" : "No"}</td>
        <td data-label="Actions">
          <div class="row-actions">
            <button type="button" class="btn btn-outline" onclick='editCategory(${JSON.stringify(category).replaceAll("'", "&#39;")})'>Edit</button>
            <button type="button" class="btn btn-danger" onclick="deleteCategory(${category.id})">Delete</button>
          </div>
        </td>
      </tr>
      `;
    })
    .join("");
}

globalThis.editCategory = function editCategory(category) {
  document.getElementById("categoryId").value = category.id;
  document.getElementById("categoryName").value = category.name || "";
  document.getElementById("categoryActive").checked = Boolean(category.is_active);
};

globalThis.deleteCategory = async function deleteCategory(id) {
  if (!confirm("Delete this category?")) {
    return;
  }

  try {
    await api(`/categories/${id}`, { method: "DELETE" });
    setMessage(categoryMessage, "Category deleted", "success");
    await loadCategories();
  } catch (error) {
    setMessage(categoryMessage, error.message, "error");
  }
};

document.getElementById("clearCategoryForm").addEventListener("click", clearCategoryForm);
document.getElementById("refreshCategories").addEventListener("click", () => loadCategories());

categoryForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const id = document.getElementById("categoryId").value;
  const payload = {
    name: document.getElementById("categoryName").value.trim(),
    is_active: document.getElementById("categoryActive").checked
  };

  try {
    if (id) {
      await api(`/categories/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });
      setMessage(categoryMessage, "Category updated", "success");
    } else {
      await api("/categories", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      setMessage(categoryMessage, "Category created", "success");
    }

    clearCategoryForm();
    await loadCategories();
  } catch (error) {
    setMessage(categoryMessage, error.message, "error");
  }
});

await ensureSession();
bindLogout();
bindAdminMenu();
await loadCategories();
