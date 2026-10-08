import { db } from "@/lib/db";
import { uid } from "@/lib/utils";
import type { Branch, StoreSettings } from "@/types";

export const PRIMARY_BRANCH_ID = "br-main";
/** View tất cả chi nhánh — không gắn tồn / không ghi branchId này. */
export const BRANCH_ALL_ID = "all";
export const BRANCH_STORAGE_KEY = "dolphin-pos-branch";
/** Chi nhánh ghi dữ liệu khi view đang là Tất cả. */
const BRANCH_WRITE_KEY = "dolphin-pos-branch-write";
export const BRANCH_EVENT = "dolphin-pos-branch";
const STOCK_META = "stockBranch";

export function stockKey(branchId: string, productId: string) {
  return `${branchId}:${productId}`;
}

export function isAllBranches(id: string) {
  return id === BRANCH_ALL_ID;
}

export function readBranchId(): string {
  if (typeof window === "undefined") return PRIMARY_BRANCH_ID;
  return localStorage.getItem(BRANCH_STORAGE_KEY) || PRIMARY_BRANCH_ID;
}

/** Chi nhánh dùng khi tạo đơn / ca / tồn (không bao giờ `all`). */
export function readWriteBranchId(): string {
  if (typeof window === "undefined") return PRIMARY_BRANCH_ID;
  const view = readBranchId();
  if (!isAllBranches(view)) return view;
  return localStorage.getItem(BRANCH_WRITE_KEY) || PRIMARY_BRANCH_ID;
}

export function writeBranchId(id: string) {
  localStorage.setItem(BRANCH_STORAGE_KEY, id);
  if (!isAllBranches(id)) {
    localStorage.setItem(BRANCH_WRITE_KEY, id);
  }
  window.dispatchEvent(new Event(BRANCH_EVENT));
}

export function subscribeBranch(onStoreChange: () => void) {
  window.addEventListener(BRANCH_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(BRANCH_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

/** Bản ghi cũ không có branchId thuộc chi nhánh gốc. View `all` → mọi bản ghi. */
export function inBranch(branchId: string | undefined, active: string) {
  if (isAllBranches(active)) return true;
  if (!branchId) return active === PRIMARY_BRANCH_ID;
  return branchId === active;
}

/** Tồn hiển thị: một chi nhánh = product.stock; Tất cả = cộng snapshot các chi nhánh khác. */
export function viewStock(
  productId: string,
  own: number,
  branchStocks: { productId: string; branchId: string; stock: number }[],
  viewId: string,
  writeId: string,
) {
  if (!isAllBranches(viewId)) return own;
  const others = branchStocks
    .filter((s) => s.productId === productId && s.branchId !== writeId)
    .reduce((sum, s) => sum + s.stock, 0);
  return own + others;
}

function secondBranch(settings: StoreSettings): Pick<Branch, "name" | "address" | "phone"> {
  const address = settings.address.includes("Q.1")
    ? settings.address.replace("Q.1", "Q.7")
    : `${settings.address} · 2`;
  const phone = settings.phone.replace(/(\d)(?!.*\d)/, (d) =>
    String((Number(d) + 1) % 10),
  );
  return {
    name: `${settings.name} 2`,
    address,
    phone,
  };
}

async function tagLegacy(branchId: string) {
  const orders = await db.orders.filter((o) => !o.branchId).toArray();
  if (orders.length) {
    await db.orders.bulkPut(orders.map((o) => ({ ...o, branchId })));
  }
  const shifts = await db.shifts.filter((s) => !s.branchId).toArray();
  if (shifts.length) {
    await db.shifts.bulkPut(shifts.map((s) => ({ ...s, branchId })));
  }
  const debts = await db.debts.filter((d) => !d.branchId).toArray();
  if (debts.length) {
    await db.debts.bulkPut(debts.map((d) => ({ ...d, branchId })));
  }
  const movements = await db.movements.filter((m) => !m.branchId).toArray();
  if (movements.length) {
    await db.movements.bulkPut(movements.map((m) => ({ ...m, branchId })));
  }
}

export async function moveStock(from: string, to: string) {
  if (from === to) return;
  const products = await db.products.toArray();
  await db.transaction("rw", [db.products, db.branchStocks, db.meta], async () => {
    for (const p of products) {
      await db.branchStocks.put({
        id: stockKey(from, p.id),
        branchId: from,
        productId: p.id,
        stock: p.stock,
      });
    }
    for (const p of products) {
      const row = await db.branchStocks.get(stockKey(to, p.id));
      await db.products.update(p.id, { stock: row?.stock ?? 0 });
    }
    await db.meta.put({ key: STOCK_META, value: to });
  });
}

export async function ensureBranches() {
  const settings = await db.settings.get("store");
  if (!settings) return;

  if ((await db.branches.count()) === 0) {
    const now = new Date().toISOString();
    const second = secondBranch(settings);
    await db.branches.bulkAdd([
      {
        id: PRIMARY_BRANCH_ID,
        name: settings.name,
        address: settings.address,
        phone: settings.phone,
        createdAt: now,
      },
      {
        id: "br-2",
        name: second.name,
        address: second.address,
        phone: second.phone,
        createdAt: now,
      },
    ]);
    const products = await db.products.toArray();
    const rows = [];
    for (const p of products) {
      const moved = Math.floor(p.stock * 0.25);
      const main = p.stock - moved;
      rows.push({
        id: stockKey(PRIMARY_BRANCH_ID, p.id),
        branchId: PRIMARY_BRANCH_ID,
        productId: p.id,
        stock: main,
      });
      rows.push({
        id: stockKey("br-2", p.id),
        branchId: "br-2",
        productId: p.id,
        stock: moved,
      });
      if (moved > 0) await db.products.update(p.id, { stock: main });
    }
    await db.branchStocks.bulkPut(rows);
    await db.meta.put({ key: STOCK_META, value: PRIMARY_BRANCH_ID });
    await tagLegacy(PRIMARY_BRANCH_ID);
  }

  const want = readBranchId();
  if (isAllBranches(want)) {
    if (!localStorage.getItem(BRANCH_WRITE_KEY)) {
      const owner = (await db.meta.get(STOCK_META))?.value ?? PRIMARY_BRANCH_ID;
      localStorage.setItem(BRANCH_WRITE_KEY, owner);
    }
    return;
  }
  const exists = await db.branches.get(want);
  const active = exists ? want : PRIMARY_BRANCH_ID;
  if (!exists) writeBranchId(PRIMARY_BRANCH_ID);
  const owner = (await db.meta.get(STOCK_META))?.value ?? PRIMARY_BRANCH_ID;
  if (owner !== active) await moveStock(owner, active);
}

export async function switchBranch(nextId: string) {
  if (isAllBranches(nextId)) {
    writeBranchId(BRANCH_ALL_ID);
    return;
  }
  const current =
    (await db.meta.get(STOCK_META))?.value ?? readWriteBranchId();
  if (current === nextId) {
    writeBranchId(nextId);
    return;
  }
  await moveStock(current, nextId);
  writeBranchId(nextId);
}

export async function addBranch(input: {
  name: string;
  address: string;
  phone: string;
}) {
  const id = uid("br");
  const products = await db.products.toArray();
  await db.transaction("rw", [db.branches, db.branchStocks], async () => {
    await db.branches.add({
      id,
      name: input.name.trim(),
      address: input.address.trim(),
      phone: input.phone.trim(),
      createdAt: new Date().toISOString(),
    });
    await db.branchStocks.bulkAdd(
      products.map((p) => ({
        id: stockKey(id, p.id),
        branchId: id,
        productId: p.id,
        stock: 0,
      })),
    );
  });
  return id;
}

export async function syncPrimaryBranch(input: {
  name: string;
  address: string;
  phone: string;
}) {
  const row = await db.branches.get(PRIMARY_BRANCH_ID);
  if (!row) return;
  await db.branches.update(PRIMARY_BRANCH_ID, {
    name: input.name,
    address: input.address,
    phone: input.phone,
  });
}
