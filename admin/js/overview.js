const { api, ensureSession, bindLogout, bindAdminMenu } = globalThis.adminCommon;

const statProducts = document.getElementById("statProducts");
const statActiveProducts = document.getElementById("statActiveProducts");
const statActiveCategories = document.getElementById("statActiveCategories");

await ensureSession();
bindLogout();
bindAdminMenu();

const [products, categories] = await Promise.all([
	api("/products", { method: "GET" }),
	api("/categories?isActive=true", { method: "GET" })
]);

statProducts.textContent = String(products.length);
statActiveProducts.textContent = String(products.filter((item) => item.is_active).length);
statActiveCategories.textContent = String(categories.length);
